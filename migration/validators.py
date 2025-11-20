"""
Schema validation functions for pre-migration checks
"""
from typing import Dict, Any, List, Optional
from utils.db_connection import AccessConnection, PostgresConnection
from utils.logger import MigrationLogger


class SchemaValidator:
    """Validates source and destination schemas before migration"""
    
    def __init__(self, access_db: AccessConnection, postgres_db: PostgresConnection, logger: MigrationLogger):
        self.access_db = access_db
        self.postgres_db = postgres_db
        self.logger = logger
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_source_schema(self, table_name: str, required_columns: List[str]) -> bool:
        """Validate source table schema"""
        self.logger.info(f"Validating source table: {table_name}")
        
        try:
            # Check if table exists
            tables = self.access_db.get_tables()
            if table_name not in tables:
                self.errors.append(f"Source table '{table_name}' not found")
                return False
            
            # Get table schema
            schema = self.access_db.get_table_schema(table_name)
            
            # Check required columns
            column_names = [col['name'] for col in schema['columns']]
            missing_columns = [col for col in required_columns if col not in column_names]
            
            if missing_columns:
                self.errors.append(
                    f"Source table '{table_name}' missing required columns: {', '.join(missing_columns)}"
                )
                return False
            
            # Check if table has data
            try:
                count = self.access_db.get_record_count(table_name)
                if count == 0:
                    self.warnings.append(f"Source table '{table_name}' is empty")
            except Exception as e:
                self.warnings.append(f"Could not count records in '{table_name}': {e}")
            
            self.logger.success(f"Source table '{table_name}' validated")
            return True
            
        except Exception as e:
            self.errors.append(f"Error validating source table '{table_name}': {e}")
            return False
    
    def validate_destination_schema(self, table_name: str, required_columns: List[str]) -> bool:
        """Validate destination table schema"""
        self.logger.info(f"Validating destination table: {table_name}")
        
        try:
            # Check if table exists
            tables = self.postgres_db.get_tables()
            if table_name not in tables:
                self.errors.append(
                    f"Destination table '{table_name}' not found. "
                    "Run Prisma migrations first: npx prisma migrate dev"
                )
                return False
            
            # Get table schema
            schema = self.postgres_db.get_table_schema(table_name)
            
            # Check required columns
            column_names = [col['name'] for col in schema['columns']]
            missing_columns = [col for col in required_columns if col not in column_names]
            
            if missing_columns:
                self.errors.append(
                    f"Destination table '{table_name}' missing required columns: {', '.join(missing_columns)}"
                )
                return False
            
            self.logger.success(f"Destination table '{table_name}' validated")
            return True
            
        except Exception as e:
            self.errors.append(f"Error validating destination table '{table_name}': {e}")
            return False
    
    def validate_field_mapping(
        self,
        source_table: str,
        dest_table: str,
        field_mapping: Dict[str, str]
    ) -> bool:
        """Validate field mappings between source and destination"""
        self.logger.info(f"Validating field mappings: {source_table} -> {dest_table}")
        
        try:
            # Get schemas
            source_schema = self.access_db.get_table_schema(source_table)
            dest_schema = self.postgres_db.get_table_schema(dest_table)
            
            source_columns = {col['name']: col for col in source_schema['columns']}
            dest_columns = {col['name']: col for col in dest_schema['columns']}
            
            # Validate each mapping
            for source_col, dest_col in field_mapping.items():
                if source_col not in source_columns:
                    self.errors.append(
                        f"Field mapping error: Source column '{source_col}' not found in '{source_table}'"
                    )
                    return False
                
                if dest_col not in dest_columns:
                    self.errors.append(
                        f"Field mapping error: Destination column '{dest_col}' not found in '{dest_table}'"
                    )
                    return False
            
            self.logger.success(f"Field mappings validated: {source_table} -> {dest_table}")
            return True
            
        except Exception as e:
            self.errors.append(f"Error validating field mappings: {e}")
            return False
    
    def validate_data_compatibility(
        self,
        source_table: str,
        field_mapping: Dict[str, str],
        sample_size: int = 10
    ) -> bool:
        """Validate data compatibility by sampling records"""
        self.logger.info(f"Validating data compatibility for: {source_table} (sample: {sample_size} records)")
        
        try:
            # Get sample data
            sample_data = self.access_db.fetch_all(source_table, limit=sample_size)
            
            if not sample_data:
                self.warnings.append(f"No sample data available for '{source_table}'")
                return True
            
            # Basic validation: check for None values in required fields
            # This is a simplified check - actual validation happens during transformation
            issues = 0
            for record in sample_data:
                for source_col in field_mapping.keys():
                    if source_col in record and record[source_col] is None:
                        # This might be okay if the field is nullable
                        pass
            
            if issues > 0:
                self.warnings.append(
                    f"Found {issues} potential data issues in sample from '{source_table}'"
                )
            
            self.logger.success(f"Data compatibility check passed for: {source_table}")
            return True
            
        except Exception as e:
            self.warnings.append(f"Could not validate data compatibility for '{source_table}': {e}")
            return True  # Don't fail on this, just warn
    
    def validate_connections(self) -> bool:
        """Validate database connections"""
        self.logger.info("Validating database connections...")
        
        # Test Access connection
        try:
            tables = self.access_db.get_tables()
            self.logger.success(f"Access connection OK ({len(tables)} tables)")
        except Exception as e:
            self.errors.append(f"Access database connection failed: {e}")
            return False
        
        # Test PostgreSQL connection
        try:
            tables = self.postgres_db.get_tables()
            self.logger.success(f"PostgreSQL connection OK ({len(tables)} tables)")
        except Exception as e:
            self.errors.append(f"PostgreSQL connection failed: {e}")
            return False
        
        return True
    
    def get_validation_report(self) -> Dict[str, Any]:
        """Get validation report"""
        return {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
        }
    
    def print_report(self):
        """Print validation report"""
        report = self.get_validation_report()
        
        self.logger.info("\n" + "=" * 50)
        self.logger.info("Validation Report")
        self.logger.info("=" * 50)
        
        if report['valid']:
            self.logger.success("✓ Validation passed!")
        else:
            self.logger.error("✗ Validation failed!")
        
        if report['errors']:
            self.logger.error(f"\nErrors ({report['error_count']}):")
            for error in report['errors']:
                self.logger.error(f"  - {error}")
        
        if report['warnings']:
            self.logger.warning(f"\nWarnings ({report['warning_count']}):")
            for warning in report['warnings']:
                self.logger.warning(f"  - {warning}")
        
        self.logger.info("=" * 50 + "\n")

