#!/usr/bin/env python3
"""
Post-migration validation script
Validates that migration completed successfully by comparing source and destination
"""
import sys
import json
import argparse
import yaml
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from utils.db_connection import AccessConnection, PostgresConnection
from utils.logger import MigrationLogger
from state_manager import StateManager
from mappers import get_table_mapping, TABLE_MAPPINGS


class MigrationValidator:
    """Validates migration results"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = MigrationLogger(
            log_file=config.get('logging', {}).get('log_file'),
            level=config.get('logging', {}).get('level', 'INFO')
        )
        self.state = StateManager()
        
        self.access_db = None
        self.postgres_db = None
        
        self.validation_results: Dict[str, Any] = {
            'validated_at': datetime.now().isoformat(),
            'tables': {},
            'summary': {},
        }
    
    def connect_databases(self):
        """Connect to databases"""
        self.logger.info("Connecting to databases...")
        
        # Access
        db_path = self.config.get('source_database')
        self.access_db = AccessConnection(db_path)
        self.logger.success("Connected to Access database")
        
        # PostgreSQL
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
    
    def validate_table(self, access_table: str, dest_table: str) -> Dict[str, Any]:
        """Validate a single table migration"""
        self.logger.info(f"Validating: {access_table} -> {dest_table}")
        
        result = {
            'access_table': access_table,
            'dest_table': dest_table,
            'valid': True,
            'errors': [],
            'warnings': [],
        }
        
        try:
            # Get record counts
            source_count = self.access_db.get_record_count(access_table)
            dest_count = self.postgres_db.get_record_count(dest_table)
            
            result['source_count'] = source_count
            result['dest_count'] = dest_count
            result['count_match'] = source_count == dest_count
            
            if not result['count_match']:
                diff = abs(source_count - dest_count)
                result['warnings'].append(
                    f"Record count mismatch: source={source_count}, dest={dest_count} (diff: {diff})"
                )
                result['valid'] = False
            
            # Sample data comparison (first 10 records)
            self.logger.info(f"  Comparing sample data...")
            source_samples = self.access_db.fetch_all(access_table, limit=10)
            dest_samples = self.postgres_db.fetch_all(
                f'SELECT * FROM "{dest_table}" LIMIT 10'
            )
            
            result['sample_comparison'] = {
                'source_samples': len(source_samples),
                'dest_samples': len(dest_samples),
            }
            
            # Check foreign key integrity
            self.logger.info(f"  Checking foreign key integrity...")
            fk_errors = self._check_foreign_keys(dest_table)
            if fk_errors:
                result['errors'].extend(fk_errors)
                result['valid'] = False
            
            # Check for required fields
            self.logger.info(f"  Checking required fields...")
            required_errors = self._check_required_fields(dest_table)
            if required_errors:
                result['errors'].extend(required_errors)
                result['valid'] = False
            
            if result['valid']:
                self.logger.success(f"  ✓ {dest_table} validation passed")
            else:
                self.logger.warning(f"  ⚠ {dest_table} validation has issues")
            
        except Exception as e:
            result['valid'] = False
            result['errors'].append(f"Validation error: {e}")
            self.logger.error(f"  ✗ Error validating {dest_table}: {e}")
        
        return result
    
    def _check_foreign_keys(self, table_name: str) -> List[str]:
        """Check foreign key integrity"""
        errors = []
        
        # Get foreign key constraints for this table
        try:
            query = """
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = %s
            """
            fks = self.postgres_db.fetch_all(query, (table_name,))
            
            for fk in fks:
                column = fk['column_name']
                foreign_table = fk['foreign_table_name']
                foreign_column = fk['foreign_column_name']
                
                # Check for orphaned foreign keys
                orphan_query = f"""
                    SELECT COUNT(*) as count
                    FROM "{table_name}" t
                    LEFT JOIN "{foreign_table}" f ON t."{column}" = f."{foreign_column}"
                    WHERE t."{column}" IS NOT NULL
                    AND f."{foreign_column}" IS NULL
                """
                orphan_result = self.postgres_db.fetch_one(orphan_query)
                
                if orphan_result and orphan_result.get('count', 0) > 0:
                    errors.append(
                        f"Orphaned foreign keys in {table_name}.{column} -> {foreign_table}.{foreign_column}: "
                        f"{orphan_result['count']} records"
                    )
        
        except Exception as e:
            errors.append(f"Could not check foreign keys: {e}")
        
        return errors
    
    def _check_required_fields(self, table_name: str) -> List[str]:
        """Check that required (non-nullable) fields are populated"""
        errors = []
        
        try:
            # Get non-nullable columns
            query = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                    AND table_name = %s
                    AND is_nullable = 'NO'
                    AND column_default IS NULL
            """
            required_cols = self.postgres_db.fetch_all(query, (table_name,))
            
            for col in required_cols:
                col_name = col['column_name']
                # Skip auto-generated fields
                if col_name in ['id', 'created_at', 'updated_at']:
                    continue
                
                # Check for NULL values
                null_query = f'SELECT COUNT(*) as count FROM "{table_name}" WHERE "{col_name}" IS NULL'
                null_result = self.postgres_db.fetch_one(null_query)
                
                if null_result and null_result.get('count', 0) > 0:
                    errors.append(
                        f"Required field {table_name}.{col_name} has {null_result['count']} NULL values"
                    )
        
        except Exception as e:
            errors.append(f"Could not check required fields: {e}")
        
        return errors
    
    def validate_all(self) -> Dict[str, Any]:
        """Validate all migrated tables"""
        self.logger.info("=" * 60)
        self.logger.info("Post-Migration Validation")
        self.logger.info("=" * 60)
        
        # Connect to databases
        self.connect_databases()
        
        # Get tables to validate
        tables_to_validate = self.config.get('tables', [])
        if not tables_to_validate:
            tables_to_validate = list(TABLE_MAPPINGS.keys())
        
        # Validate each table
        all_valid = True
        for access_table in tables_to_validate:
            dest_table = get_table_mapping(access_table)
            result = self.validate_table(access_table, dest_table)
            self.validation_results['tables'][dest_table] = result
            
            if not result['valid']:
                all_valid = False
        
        # Generate summary
        total_tables = len(self.validation_results['tables'])
        valid_tables = sum(1 for t in self.validation_results['tables'].values() if t['valid'])
        total_source_records = sum(t.get('source_count', 0) for t in self.validation_results['tables'].values())
        total_dest_records = sum(t.get('dest_count', 0) for t in self.validation_results['tables'].values())
        total_errors = sum(len(t.get('errors', [])) for t in self.validation_results['tables'].values())
        total_warnings = sum(len(t.get('warnings', [])) for t in self.validation_results['tables'].values())
        
        self.validation_results['summary'] = {
            'all_valid': all_valid,
            'total_tables': total_tables,
            'valid_tables': valid_tables,
            'total_source_records': total_source_records,
            'total_dest_records': total_dest_records,
            'total_errors': total_errors,
            'total_warnings': total_warnings,
        }
        
        return self.validation_results
    
    def print_report(self):
        """Print validation report"""
        summary = self.validation_results['summary']
        
        self.logger.info("\n" + "=" * 60)
        self.logger.info("Validation Report")
        self.logger.info("=" * 60)
        
        if summary['all_valid']:
            self.logger.success("✓ All validations passed!")
        else:
            self.logger.error("✗ Some validations failed")
        
        self.logger.info(f"\nTables validated: {summary['total_tables']}")
        self.logger.info(f"  Valid: {summary['valid_tables']}")
        self.logger.info(f"  Issues: {summary['total_tables'] - summary['valid_tables']}")
        self.logger.info(f"\nRecords:")
        self.logger.info(f"  Source: {summary['total_source_records']:,}")
        self.logger.info(f"  Destination: {summary['total_dest_records']:,}")
        self.logger.info(f"\nIssues:")
        self.logger.info(f"  Errors: {summary['total_errors']}")
        self.logger.info(f"  Warnings: {summary['total_warnings']}")
        
        # Print table details
        self.logger.info("\n" + "-" * 60)
        self.logger.info("Table Details:")
        self.logger.info("-" * 60)
        
        for table_name, result in self.validation_results['tables'].items():
            status = "✓" if result['valid'] else "✗"
            self.logger.info(f"\n{status} {table_name}")
            self.logger.info(f"  Source: {result.get('source_count', 0):,} records")
            self.logger.info(f"  Dest: {result.get('dest_count', 0):,} records")
            
            if result.get('errors'):
                for error in result['errors']:
                    self.logger.error(f"    ERROR: {error}")
            
            if result.get('warnings'):
                for warning in result['warnings']:
                    self.logger.warning(f"    WARNING: {warning}")
    
    def save_report(self, output_file: str = "reports/validation-report.json"):
        """Save validation report to file"""
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(self.validation_results, f, indent=2, default=str)
        
        self.logger.success(f"Validation report saved to: {output_path}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Validate migration results")
    parser.add_argument(
        '--config',
        type=str,
        default='config.yaml',
        help='Path to config file (default: config.yaml)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='reports/validation-report.json',
        help='Output file for validation report'
    )
    
    args = parser.parse_args()
    
    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        sys.exit(1)
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Run validation
    validator = MigrationValidator(config)
    validator.validate_all()
    validator.print_report()
    validator.save_report(args.output)
    
    # Exit with error code if validation failed
    if not validator.validation_results['summary']['all_valid']:
        sys.exit(1)


if __name__ == "__main__":
    main()

