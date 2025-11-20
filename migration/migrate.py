#!/usr/bin/env python3
"""
Main migration script for Access to Supabase PostgreSQL migration
This script is re-runnable and supports resume capability
"""
import sys
import argparse
import yaml
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from tqdm import tqdm

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.db_connection import AccessConnection, PostgresConnection
from utils.logger import MigrationLogger
from state_manager import StateManager
from validators import SchemaValidator
from transformers import apply_transformations
from mappers import (
    get_field_mapping, get_transformations, get_table_mapping,
    get_required_source_columns, get_required_dest_columns
)


class MigrationRunner:
    """Main migration runner"""
    
    def __init__(self, config: Dict[str, Any], dry_run: bool = False, force: bool = False):
        self.config = config
        self.dry_run = dry_run
        self.force = force
        self.logger = MigrationLogger(
            log_file=config.get('logging', {}).get('log_file'),
            level=config.get('logging', {}).get('level', 'INFO')
        )
        self.state = StateManager()
        
        # Database connections
        self.access_db = None
        self.postgres_db = None
        
        # Lookup maps for foreign keys (built during migration)
        self.lookup_maps: Dict[str, Dict[str, str]] = {}
    
    def connect_databases(self):
        """Connect to source and destination databases"""
        self.logger.info("Connecting to databases...")
        
        # Connect to Access
        db_path = self.config.get('source_database')
        if not db_path:
            raise ValueError("source_database not specified in config")
        
        self.access_db = AccessConnection(db_path)
        self.logger.success(f"Connected to Access database: {db_path}")
        
        # Connect to PostgreSQL
        db_config = self.config.get('target_database', {})
        if 'connection_string' in db_config:
            self.postgres_db = PostgresConnection.from_connection_string(
                db_config['connection_string']
            )
        else:
            self.postgres_db = PostgresConnection(
                host=db_config.get('host', 'localhost'),
                port=db_config.get('port', 54322),
                database=db_config.get('database', 'postgres'),
                user=db_config.get('user', 'postgres'),
                password=db_config.get('password', 'postgres')
            )
        self.logger.success("Connected to PostgreSQL database")
    
    def validate_schemas(self) -> bool:
        """Validate source and destination schemas"""
        if not self.config.get('validation', {}).get('check_schema', True):
            self.logger.info("Schema validation skipped")
            return True
        
        self.logger.info("Validating schemas...")
        validator = SchemaValidator(self.access_db, self.postgres_db, self.logger)
        
        # Validate connections
        if not validator.validate_connections():
            return False
        
        # Get tables to migrate
        tables_to_migrate = self.config.get('tables', [])
        if not tables_to_migrate:
            self.logger.warning("No tables specified in config, will migrate all mapped tables")
            # Get all mapped tables
            from mappers import TABLE_MAPPINGS
            tables_to_migrate = list(TABLE_MAPPINGS.keys())
        else:
            # Convert config table names (lowercase) to Access table names (from TABLE_MAPPINGS)
            from mappers import TABLE_MAPPINGS
            # Reverse lookup: dest_table -> access_table
            reverse_mapping = {v: k for k, v in TABLE_MAPPINGS.items()}
            access_tables_to_migrate = []
            for table_name in tables_to_migrate:
                # Try to find Access table name
                access_table = reverse_mapping.get(table_name.lower())
                if access_table:
                    access_tables_to_migrate.append(access_table)
                else:
                    # Try direct match (case-insensitive)
                    for acc_tbl, dest_tbl in TABLE_MAPPINGS.items():
                        if dest_tbl.lower() == table_name.lower():
                            access_tables_to_migrate.append(acc_tbl)
                            break
                    else:
                        self.logger.warning(f"Table '{table_name}' not found in mappings, skipping")
            tables_to_migrate = access_tables_to_migrate
        
        # Validate each table
        all_valid = True
        for access_table in tables_to_migrate:
            dest_table = get_table_mapping(access_table)
            
            # Get required columns
            required_source = get_required_source_columns(access_table)
            required_dest = get_required_dest_columns(dest_table)
            
            # Validate source
            if not validator.validate_source_schema(access_table, required_source):
                all_valid = False
                continue
            
            # Validate destination
            if not validator.validate_destination_schema(dest_table, required_dest):
                all_valid = False
                continue
            
            # Validate field mapping
            field_mapping = get_field_mapping(access_table)
            if not validator.validate_field_mapping(access_table, dest_table, field_mapping):
                all_valid = False
                continue
            
            # Validate data compatibility (sample)
            sample_size = self.config.get('validation', {}).get('sample_records', 10)
            validator.validate_data_compatibility(access_table, field_mapping, sample_size)
        
        # Print validation report
        validator.print_report()
        
        return all_valid
    
    def build_lookup_maps(self):
        """Build lookup maps for foreign keys by migrating reference tables first"""
        self.logger.info("Building foreign key lookup maps...")
        
        # Reference tables (no dependencies) - migrate these first to build lookup maps
        reference_tables = ['Customers', 'Yarn_Types', 'Fabric_Quality', 'Users']
        
        # Get tables to migrate from config
        tables_to_migrate = self.config.get('tables', [])
        if not tables_to_migrate:
            from mappers import TABLE_MAPPINGS
            tables_to_migrate = list(TABLE_MAPPINGS.keys())
        
        for access_table in reference_tables:
            if access_table not in tables_to_migrate:
                # Still try to build lookup map if table exists in destination
                dest_table = get_table_mapping(access_table)
                try:
                    # Check if table exists in destination
                    dest_tables = self.postgres_db.get_tables()
                    if dest_table in dest_tables:
                        self.logger.info(f"Building lookup map from existing {dest_table} data...")
                        self._build_lookup_map_from_db(access_table, dest_table)
                except Exception as e:
                    self.logger.warning(f"Could not build lookup map for {access_table}: {e}")
                continue
            
            dest_table = get_table_mapping(access_table)
            
            # Check if already migrated
            if self.state.should_skip_table(dest_table, self.force):
                # Build lookup map from existing data
                self.logger.info(f"Building lookup map from existing {dest_table} data...")
                self._build_lookup_map_from_db(access_table, dest_table)
                continue
            
            # Migrate the table first
            self.logger.info(f"Migrating {access_table} to build lookup map...")
            result = self.migrate_table(access_table, dest_table)
            
            if result.get('status') == 'completed':
                # Build lookup map from migrated data
                self._build_lookup_map_from_db(access_table, dest_table)
    
    def _build_lookup_map_from_db(self, access_table: str, dest_table: str):
        """Build lookup map by querying both source and destination"""
        # Get unique identifier field for lookup based on table mapping
        lookup_config = {
            'Customers': {
                'source_key': 'Customer',  # Access field name
                'dest_key': 'name',  # PostgreSQL field name
            },
            'Yarn_Types': {
                'source_key': 'Yarn_Code',
                'dest_key': 'code',
                'alt_source_key': 'Yarn_Type',  # Alternative lookup by description
                'alt_dest_key': 'description',  # Alternative destination field (but we'll map to code via description)
            },
            'Fabric_Quality': {
                'source_key': 'Fab_Qual_No',  # Actual field name in Access
                'dest_key': 'quality_code',
            },
            'Users': {
                'source_key': 'User_Code',
                'dest_key': 'email',
                'alt_source_key': 'User_Name',  # Alternative lookup by name
                'alt_dest_key': 'name',  # Alternative destination field
            },
        }
        
        config = lookup_config.get(access_table)
        if not config:
            self.logger.warning(f"No lookup config for {access_table}, skipping lookup map")
            return
        
        lookup_key = config['source_key']
        dest_lookup_field = config['dest_key']
        lookup_map = {}
        
        # For Users, also build a name-based lookup map
        name_lookup_map = {}
        
        try:
            # Get all records from source
            source_records = self.access_db.fetch_all(access_table)
            
            # Get all records from destination (include alternative fields for Users and Yarn_Types)
            if access_table in ['Users', 'Yarn_Types'] and 'alt_dest_key' in config:
                dest_records = self.postgres_db.fetch_all(
                    f'SELECT id, "{dest_lookup_field}", "{config["alt_dest_key"]}" FROM "{dest_table}"'
                )
            else:
                dest_records = self.postgres_db.fetch_all(
                    f'SELECT id, "{dest_lookup_field}" FROM "{dest_table}"'
                )
            
            # Build mapping: source lookup key -> destination ID
            dest_map = {}
            alt_dest_map = {}
            for r in dest_records:
                key_value = r.get(dest_lookup_field)
                if key_value:
                    dest_map[str(key_value).strip()] = r['id']
                
                # For Users and Yarn_Types, also build alternative field map
                if access_table in ['Users', 'Yarn_Types'] and 'alt_dest_key' in config:
                    alt_value = r.get(config['alt_dest_key'])
                    if alt_value:
                        alt_dest_map[str(alt_value).strip().upper()] = r['id']  # Uppercase for case-insensitive matching
            
            # Build reverse mapping from source to destination
            for record in source_records:
                source_key = record.get(lookup_key)
                if source_key:
                    source_key_str = str(source_key).strip()
                    if source_key_str in dest_map:
                        lookup_map[source_key_str] = dest_map[source_key_str]
                
                # For Users and Yarn_Types, also build alternative field mapping
                if access_table in ['Users', 'Yarn_Types'] and 'alt_source_key' in config:
                    alt_key = record.get(config['alt_source_key'])
                    if alt_key:
                        alt_key_str = str(alt_key).strip().upper()  # Uppercase for case-insensitive matching
                        if alt_key_str in alt_dest_map:
                            name_lookup_map[alt_key_str] = alt_dest_map[alt_key_str]
            
            # Store lookup map with multiple keys for easier lookup
            # Use destination table name as primary key
            self.lookup_maps[dest_table] = lookup_map
            
            # For Users, also store name-based lookup map
            if access_table == 'Users' and name_lookup_map:
                self.lookup_maps['users_by_name'] = name_lookup_map
            
            # For Yarn_Types, also store description-based lookup map
            if access_table == 'Yarn_Types' and name_lookup_map:
                self.lookup_maps['yarn_types_by_description'] = name_lookup_map
            
            # Also store with singular form for field matching (e.g., "customer" for "customer_id")
            if dest_table.endswith('s'):
                singular_key = dest_table[:-1]  # Remove 's'
                self.lookup_maps[singular_key] = lookup_map
            
            # Store with underscore removed for matching
            no_underscore_key = dest_table.replace('_', '')
            self.lookup_maps[no_underscore_key] = lookup_map
            
            self.logger.success(f"Built lookup map for {access_table} -> {dest_table}: {len(lookup_map)} entries")
            if name_lookup_map:
                self.logger.success(f"Built name-based lookup map for {access_table}: {len(name_lookup_map)} entries")
            
        except Exception as e:
            self.logger.error(f"Error building lookup map for {access_table}: {e}")
            import traceback
            self.logger.debug(traceback.format_exc())
    
    def migrate_table(
        self,
        access_table: str,
        dest_table: str,
        batch_size: int = 1000
    ) -> Dict[str, Any]:
        """Migrate a single table"""
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"Migrating: {access_table} -> {dest_table}")
        self.logger.info(f"{'='*60}")
        
        # Check if should skip
        if self.state.should_skip_table(dest_table, self.force):
            self.logger.info(f"Skipping {dest_table} (already completed)")
            state = self.state.get_table_state(dest_table)
            return {
                'status': 'skipped',
                'records_migrated': state.get('records_migrated', 0),
            }
        
        # Reset if force
        if self.force:
            self.state.reset_table(dest_table)
        
        # Get mappings and transformations
        field_mapping = get_field_mapping(access_table)
        transformations = get_transformations(dest_table)
        
        if not field_mapping:
            self.logger.warning(f"No field mapping found for {access_table}, skipping")
            return {'status': 'skipped', 'reason': 'no_mapping'}
        
        # Get destination table schema to check which columns exist
        dest_schema = self.postgres_db.get_table_schema(dest_table)
        dest_columns = {col['name'] for col in dest_schema['columns']}
        has_created_at = 'created_at' in dest_columns
        has_updated_at = 'updated_at' in dest_columns
        
        # Get record count
        try:
            total_records = self.access_db.get_record_count(access_table)
            self.logger.info(f"Total records: {total_records:,}")
        except Exception as e:
            self.logger.error(f"Could not get record count: {e}")
            return {'status': 'failed', 'error': str(e)}
        
        if total_records == 0:
            self.logger.warning(f"Table {access_table} is empty, skipping")
            self.state.mark_table_complete(dest_table, 0)
            return {'status': 'skipped', 'reason': 'empty'}
        
        # Start migration
        self.state.update_table_state(dest_table, status='in_progress')
        migrated_count = 0
        errors = []
        
        try:
            # Fetch all records (Access doesn't support efficient pagination)
            self.logger.info("Fetching records from source...")
            all_records = self.access_db.fetch_all(access_table)
            
            # Process in batches
            self.logger.info(f"Processing {len(all_records)} records in batches of {batch_size}...")
            
            with tqdm(total=len(all_records), desc=f"Migrating {dest_table}") as pbar:
                for i in range(0, len(all_records), batch_size):
                    batch = all_records[i:i + batch_size]
                    
                    for record in batch:
                        try:
                            # Transform record
                            transformed = apply_transformations(
                                record,
                                field_mapping,
                                transformations,
                                lookup_maps=self.lookup_maps
                            )
                            
                            # Ensure id is always present
                            if 'id' not in transformed:
                                from transformers import generate_cuid
                                transformed['id'] = generate_cuid()
                            
                            # Add default values for required fields that don't exist in source
                            self._add_default_values(dest_table, transformed, record)
                            
                            # Add timestamps only if columns exist in destination schema
                            from datetime import datetime
                            if has_created_at and 'created_at' not in transformed:
                                transformed['created_at'] = datetime.now()
                            if has_updated_at and 'updated_at' not in transformed:
                                transformed['updated_at'] = datetime.now()
                            
                            # Insert into PostgreSQL (if not dry run)
                            if not self.dry_run:
                                self._insert_record(dest_table, transformed)
                            
                            migrated_count += 1
                            pbar.update(1)
                            
                        except Exception as e:
                            error_msg = f"Error migrating record: {e}"
                            errors.append(error_msg)
                            self.logger.warning(error_msg)
                            if self.config.get('validation', {}).get('strict_mode'):
                                raise
                    
                    # Update state periodically
                    if (i + batch_size) % (batch_size * 10) == 0:
                        self.state.update_table_state(
                            dest_table,
                            records_migrated=migrated_count
                        )
            
            # Mark as complete
            if not self.dry_run:
                self.state.mark_table_complete(dest_table, migrated_count)
                self.logger.success(f"Completed: {migrated_count:,} records migrated")
            else:
                self.logger.info(f"Dry run: Would migrate {migrated_count:,} records")
            
            return {
                'status': 'completed',
                'records_migrated': migrated_count,
                'errors': errors,
            }
            
        except Exception as e:
            error_msg = f"Migration failed: {e}"
            self.logger.error(error_msg)
            self.state.mark_table_failed(dest_table, error_msg)
            return {
                'status': 'failed',
                'error': error_msg,
                'records_migrated': migrated_count,
            }
    
    def _add_default_values(self, dest_table: str, transformed: Dict[str, Any], source_record: Dict[str, Any]):
        """Add default values for required fields that don't exist in source"""
        from datetime import datetime
        from mappers import get_required_dest_columns
        
        required_fields = get_required_dest_columns(dest_table)
        
        # Default values for specific tables/fields
        defaults = {
            'delivery_note': {
                'customer_id': None,  # Will need to derive from related records or use a default
                'delivery_date': datetime.now(),  # Use current date if not available
            },
            'pack_info': {
                'piece_count': 1,  # Default to 1 if not available
            },
            'user_logs': {
                'action': 'login',  # Default action based on Login_Time presence
            },
        }
        
        # Apply defaults for this table
        if dest_table in defaults:
            for field, default_value in defaults[dest_table].items():
                if field in required_fields and field not in transformed:
                    transformed[field] = default_value
        
        # Special handling for delivery_note - try to derive customer_id from Delivery_No
        if dest_table == 'delivery_note' and 'customer_id' not in transformed:
            # Try to find customer from related production_information or pack_info
            # For now, set to None (nullable in schema)
            pass
        
        # Special handling for user_logs - set action based on Login_Time
        if dest_table == 'user_logs' and 'action' not in transformed:
            if source_record.get('Login_Time'):
                transformed['action'] = 'login'
            elif source_record.get('Logout_Time'):
                transformed['action'] = 'logout'
            else:
                transformed['action'] = 'unknown'
    
    def _insert_record(self, table_name: str, record: Dict[str, Any]):
        """Insert a single record into PostgreSQL"""
        # Filter out None values for optional fields (let DB use defaults)
        # But keep required fields even if None (will cause error if truly required)
        filtered_record = {k: v for k, v in record.items() if v is not None or k in ['id', 'created_at', 'updated_at']}
        
        if not filtered_record:
            return
        
        # Build INSERT query
        columns = list(filtered_record.keys())
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join([f'"{col}"' for col in columns])
        values = tuple(filtered_record.values())
        
        query = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
        
        try:
            self.postgres_db.execute_query(query, values)
        except Exception as e:
            # Check if it's a duplicate key error (unique constraint)
            error_str = str(e).lower()
            if 'duplicate key' in error_str or 'unique constraint' in error_str:
                # Skip duplicate (idempotent)
                return
            # Re-raise other errors
            raise
    
    def run(self):
        """Run the migration"""
        try:
            self.logger.info("=" * 60)
            self.logger.info("Starting Migration")
            self.logger.info("=" * 60)
            
            if self.dry_run:
                self.logger.warning("DRY RUN MODE - No data will be inserted")
            
            if self.force:
                self.logger.warning("FORCE MODE - Will re-migrate all tables")
                self.state.reset_all()
            
            # Connect to databases
            self.connect_databases()
            
            # Validate schemas
            if not self.validate_schemas():
                self.logger.error("Schema validation failed. Fix errors and try again.")
                return False
            
            # Build lookup maps (migrate reference tables first)
            self.build_lookup_maps()
            
            # Start migration
            self.state.start_migration()
            
            # Get tables to migrate (in dependency order)
            tables_to_migrate = self.config.get('tables', [])
            if not tables_to_migrate:
                from mappers import TABLE_MAPPINGS
                tables_to_migrate = list(TABLE_MAPPINGS.keys())
            else:
                # Convert config table names (lowercase) to Access table names (from TABLE_MAPPINGS)
                from mappers import TABLE_MAPPINGS
                # Reverse lookup: dest_table -> access_table
                reverse_mapping = {v: k for k, v in TABLE_MAPPINGS.items()}
                access_tables_to_migrate = []
                for table_name in tables_to_migrate:
                    # Try to find Access table name
                    access_table = reverse_mapping.get(table_name.lower())
                    if access_table:
                        access_tables_to_migrate.append(access_table)
                    else:
                        # Try direct match (case-insensitive)
                        for acc_tbl, dest_tbl in TABLE_MAPPINGS.items():
                            if dest_tbl.lower() == table_name.lower():
                                access_tables_to_migrate.append(acc_tbl)
                                break
                        else:
                            self.logger.warning(f"Table '{table_name}' not found in mappings, skipping")
                tables_to_migrate = access_tables_to_migrate
            
            # Migration order (dependencies first)
            migration_order = [
                'Customers', 'Yarn_Types', 'Fabric_Quality', 'Users',  # Reference data
                'Fabric_Content',  # Depends on Fabric_Quality, Yarn_Types
                'Stock_Ref', 'Customer_Orders',  # Depends on Customers, Yarn_Types, Fabric_Quality
                'Yarn_Stock', 'Production_Information',  # Depends on CustomerOrder
                'Delivery_Note', 'Pack_Info',  # Depends on CustomerOrder, ProductionInfo
                'UserLogs',  # Depends on Users
            ]
            
            # Filter to only tables in config
            migration_order = [t for t in migration_order if t in tables_to_migrate]
            
            if not migration_order:
                self.logger.warning("No tables to migrate after filtering. Check config.yaml table names.")
                return False
            
            # Migrate each table
            results = {}
            for access_table in migration_order:
                dest_table = get_table_mapping(access_table)
                result = self.migrate_table(
                    access_table,
                    dest_table,
                    batch_size=self.config.get('migration', {}).get('batch_size', 1000)
                )
                results[dest_table] = result
            
            # Print summary
            self._print_summary(results)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Migration failed: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return False
        finally:
            if self.access_db:
                self.access_db.close()
            if self.postgres_db:
                self.postgres_db.close()
    
    def _print_summary(self, results: Dict[str, Any]):
        """Print migration summary"""
        self.logger.info("\n" + "=" * 60)
        self.logger.info("Migration Summary")
        self.logger.info("=" * 60)
        
        total_migrated = sum(r.get('records_migrated', 0) for r in results.values())
        completed = sum(1 for r in results.values() if r.get('status') == 'completed')
        failed = sum(1 for r in results.values() if r.get('status') == 'failed')
        skipped = sum(1 for r in results.values() if r.get('status') == 'skipped')
        
        self.logger.info(f"Tables processed: {len(results)}")
        self.logger.info(f"  Completed: {completed}")
        self.logger.info(f"  Failed: {failed}")
        self.logger.info(f"  Skipped: {skipped}")
        self.logger.info(f"Total records migrated: {total_migrated:,}")
        
        state_summary = self.state.get_summary()
        self.logger.info(f"\nMigration state saved to: migration-state.json")
        
        if self.dry_run:
            self.logger.warning("\nThis was a DRY RUN - no data was actually migrated")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Migrate Access database to Supabase PostgreSQL")
    parser.add_argument(
        '--config',
        type=str,
        default='config.yaml',
        help='Path to config file (default: config.yaml)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate and show what would be migrated without inserting data'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force re-migration of all tables (clears state)'
    )
    
    args = parser.parse_args()
    
    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        sys.exit(1)
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Override config with CLI args
    if args.dry_run:
        config['migration']['dry_run'] = True
    
    if args.force:
        config['migration']['force'] = True
    
    # Run migration
    runner = MigrationRunner(
        config,
        dry_run=config['migration'].get('dry_run', False),
        force=config['migration'].get('force', False)
    )
    
    success = runner.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

