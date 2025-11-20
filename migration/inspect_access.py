#!/usr/bin/env python3
"""
Inspect Access database structure and extract schema information
This script analyzes the source Access database and generates schema documentation
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any
import yaml

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils.db_connection import AccessConnection
from utils.logger import MigrationLogger


def inspect_database(db_path: str, output_dir: str = "schema-docs") -> Dict[str, Any]:
    """
    Inspect Access database and return schema information
    
    Args:
        db_path: Path to Access .mdb file
        output_dir: Directory to save schema documentation
    
    Returns:
        Dictionary containing schema information
    """
    logger = MigrationLogger()
    logger.info(f"Inspecting Access database: {db_path}")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    schema_info = {
        'database_path': db_path,
        'tables': {},
        'table_count': 0,
        'total_records': 0,
    }
    
    try:
        with AccessConnection(db_path) as access_db:
            # Get all tables
            tables = access_db.get_tables()
            schema_info['table_count'] = len(tables)
            logger.info(f"Found {len(tables)} tables")
            
            # Inspect each table
            for table_name in tables:
                logger.info(f"  Inspecting table: {table_name}")
                
                # Get table schema
                table_schema = access_db.get_table_schema(table_name)
                
                # Get record count
                try:
                    record_count = access_db.get_record_count(table_name)
                except Exception as e:
                    logger.warning(f"    Could not get record count for {table_name}: {e}")
                    record_count = 0
                
                schema_info['total_records'] += record_count
                
                # Get sample data (first 5 records)
                try:
                    sample_data = access_db.fetch_all(table_name, limit=5)
                except Exception as e:
                    logger.warning(f"    Could not fetch sample data for {table_name}: {e}")
                    sample_data = []
                
                schema_info['tables'][table_name] = {
                    'schema': table_schema,
                    'record_count': record_count,
                    'sample_data': sample_data,
                }
                
                logger.info(f"    Columns: {len(table_schema['columns'])}, Records: {record_count}")
        
        # Save schema to JSON file
        schema_file = output_path / "access-schema.json"
        with open(schema_file, 'w', encoding='utf-8') as f:
            json.dump(schema_info, f, indent=2, default=str)
        
        logger.success(f"Schema documentation saved to: {schema_file}")
        
        # Generate summary report
        summary_file = output_path / "schema-summary.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("Access Database Schema Summary\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Database: {db_path}\n")
            f.write(f"Total Tables: {schema_info['table_count']}\n")
            f.write(f"Total Records: {schema_info['total_records']:,}\n\n")
            f.write("Tables:\n")
            f.write("-" * 50 + "\n")
            
            for table_name, table_info in sorted(schema_info['tables'].items()):
                f.write(f"\n{table_name}\n")
                f.write(f"  Records: {table_info['record_count']:,}\n")
                f.write(f"  Columns ({len(table_info['schema']['columns'])}):\n")
                for col in table_info['schema']['columns']:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    size = f"({col['size']})" if col['size'] else ""
                    f.write(f"    - {col['name']}: {col['type']}{size} {nullable}\n")
        
        logger.success(f"Summary report saved to: {summary_file}")
        
        return schema_info
        
    except FileNotFoundError as e:
        logger.error(f"Database file not found: {e}")
        sys.exit(1)
    except ConnectionError as e:
        logger.error(f"Connection error: {e}")
        logger.error("\nTo fix this:")
        logger.error("1. Install Microsoft Access Database Engine:")
        logger.error("   https://www.microsoft.com/en-us/download/details.aspx?id=54920")
        logger.error("2. Or use mdbtools (alternative method)")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error inspecting database: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Inspect Access database structure")
    parser.add_argument(
        '--db-path',
        type=str,
        help='Path to Access .mdb file (overrides config.yaml)'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='config.yaml',
        help='Path to config file (default: config.yaml)'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='schema-docs',
        help='Output directory for schema documentation (default: schema-docs)'
    )
    
    args = parser.parse_args()
    
    # Load config if exists
    db_path = args.db_path
    if not db_path:
        config_path = Path(args.config)
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                db_path = config.get('source_database')
        
        if not db_path:
            print("Error: Database path not specified. Use --db-path or set in config.yaml")
            sys.exit(1)
    
    # Inspect database
    schema_info = inspect_database(db_path, args.output_dir)
    
    # Print summary
    logger = MigrationLogger()
    logger.info("\n" + "=" * 50)
    logger.info("Inspection Complete")
    logger.info("=" * 50)
    logger.info(f"Tables found: {schema_info['table_count']}")
    logger.info(f"Total records: {schema_info['total_records']:,}")
    logger.info(f"\nSchema documentation saved to: {args.output_dir}/")


if __name__ == "__main__":
    main()

