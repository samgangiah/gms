"""
Database connection utilities for Access and PostgreSQL
"""
import os
import subprocess
import csv
import tempfile
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any, List
from pathlib import Path

# Try to import pyodbc, but it's optional if mdbtools is available
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False


class AccessConnection:
    """Connection to Microsoft Access database using pyodbc or mdbtools"""
    
    def __init__(self, db_path: str, use_mdbtools: Optional[bool] = None):
        self.db_path = Path(db_path)
        if not self.db_path.exists():
            raise FileNotFoundError(f"Access database not found: {db_path}")
        
        self.use_mdbtools = use_mdbtools
        self.conn = None
        self._mdbtools_mode = False
        
        # Auto-detect: try pyodbc first, fallback to mdbtools
        if use_mdbtools is None:
            use_mdbtools = not PYODBC_AVAILABLE
        
        if not use_mdbtools and PYODBC_AVAILABLE:
            # Try pyodbc connection
            connection_strings = [
                f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={self.db_path};",
                f"DRIVER={{Microsoft Access Driver (*.mdb)}};DBQ={self.db_path};",
                f"DRIVER={{Microsoft Access Driver (*.accdb)}};DBQ={self.db_path};",
            ]
            
            for conn_str in connection_strings:
                try:
                    self.conn = pyodbc.connect(conn_str)
                    break
                except (pyodbc.Error, Exception):
                    continue
        
        # If pyodbc failed or not available, try mdbtools
        if self.conn is None:
            if self._check_mdbtools():
                self._mdbtools_mode = True
            else:
                raise ConnectionError(
                    "Could not connect to Access database.\n"
                    "Options:\n"
                    "1. Install Microsoft Access Database Engine (Windows only)\n"
                    "   https://www.microsoft.com/en-us/download/details.aspx?id=54920\n"
                    "2. Install mdbtools: brew install mdbtools\n"
                    "3. Use a Windows machine for migration"
                )
    
    def _check_mdbtools(self) -> bool:
        """Check if mdbtools is available"""
        try:
            result = subprocess.run(
                ['mdb-ver', str(self.db_path)],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def get_tables(self) -> list:
        """Get list of all tables in the database"""
        if self._mdbtools_mode:
            return self._get_tables_mdbtools()
        
        cursor = self.conn.cursor()
        tables = []
        for table_info in cursor.tables(tableType='TABLE'):
            table_name = table_info.table_name
            # Skip system tables
            if not table_name.startswith('MSys') and not table_name.startswith('~'):
                tables.append(table_name)
        cursor.close()
        return tables
    
    def _get_tables_mdbtools(self) -> list:
        """Get tables using mdbtools"""
        try:
            result = subprocess.run(
                ['mdb-tables', str(self.db_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                tables = [t.strip() for t in result.stdout.strip().split() if t.strip()]
                # Filter out system tables
                return [t for t in tables if not t.startswith('MSys') and not t.startswith('~')]
            return []
        except Exception:
            return []
    
    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get schema information for a table"""
        if self._mdbtools_mode:
            return self._get_table_schema_mdbtools(table_name)
        
        cursor = self.conn.cursor()
        columns = []
        
        # Get column information
        for column in cursor.columns(table=table_name):
            columns.append({
                'name': column.column_name,
                'type': column.type_name,
                'size': column.column_size,
                'nullable': column.nullable == 1,
                'default': column.column_def,
            })
        
        cursor.close()
        return {
            'table_name': table_name,
            'columns': columns,
        }
    
    def _get_table_schema_mdbtools(self, table_name: str) -> Dict[str, Any]:
        """Get table schema using mdbtools"""
        columns = []
        try:
            # Get schema from mdb-schema command
            result = subprocess.run(
                ['mdb-schema', str(self.db_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Parse the CREATE TABLE statement for this table
                import re
                lines = result.stdout.split('\n')
                in_table = False
                table_pattern = re.compile(r'CREATE TABLE\s+\[?' + re.escape(table_name) + r'\]?', re.IGNORECASE)
                
                for i, line in enumerate(lines):
                    stripped = line.strip()
                    
                    # Check if this is the start of our table
                    if table_pattern.search(stripped):
                        in_table = True
                        continue
                    
                    if in_table:
                        # Parse column definition: [Column_Name] Type (Size),
                        if stripped.startswith('[') and ']' in stripped:
                            # Extract column name: [Column_Name]
                            col_match = re.match(r'\[([^\]]+)\]\s+(.+)', stripped)
                            if col_match:
                                col_name = col_match.group(1)
                                rest = col_match.group(2).strip()
                                
                                # Remove trailing comma if present
                                rest = rest.rstrip(',')
                                
                                # Extract type and size
                                col_type = 'VARCHAR'
                                col_size = None
                                
                                if 'Text' in rest:
                                    col_type = 'VARCHAR'
                                    size_match = re.search(r'\((\d+)\)', rest)
                                    if size_match:
                                        col_size = int(size_match.group(1))
                                elif 'Long Integer' in rest or 'Integer' in rest:
                                    col_type = 'INTEGER'
                                elif 'DateTime' in rest:
                                    col_type = 'DATETIME'
                                elif 'Double' in rest or 'Decimal' in rest or 'Currency' in rest:
                                    col_type = 'DECIMAL'
                                elif 'Yes/No' in rest or 'Boolean' in rest:
                                    col_type = 'BOOLEAN'
                                
                                columns.append({
                                    'name': col_name,
                                    'type': col_type,
                                    'size': col_size,
                                    'nullable': True,  # mdbtools doesn't show nullability
                                    'default': None,
                                })
                        
                        # Stop when we hit the closing parenthesis
                        if stripped == ');' or (stripped.startswith(')') and ';' in stripped):
                            break
                        
                        # Stop if we hit another CREATE TABLE
                        if stripped.startswith('CREATE TABLE') and not table_pattern.search(stripped):
                            break
            
            # Fallback: if schema parsing failed, try to get column names from export header
            if not columns:
                try:
                    sample_result = subprocess.run(
                        ['mdb-export', '-H', str(self.db_path), table_name],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    if sample_result.returncode == 0 and sample_result.stdout:
                        # Get first non-empty line as header
                        lines = [l for l in sample_result.stdout.strip().split('\n') if l.strip()]
                        if lines:
                            reader = csv.reader([lines[0]])
                            header = next(reader, None)
                            if header:
                                for col_name in header:
                                    if col_name.strip():  # Skip empty column names
                                        columns.append({
                                            'name': col_name.strip(),
                                            'type': 'VARCHAR',
                                            'size': None,
                                            'nullable': True,
                                            'default': None,
                                        })
                except Exception:
                    pass
            
            return {
                'table_name': table_name,
                'columns': columns,
            }
        except Exception as e:
            return {
                'table_name': table_name,
                'columns': [],
            }
    
    def get_record_count(self, table_name: str) -> int:
        """Get number of records in a table"""
        if self._mdbtools_mode:
            return self._get_record_count_mdbtools(table_name)
        
        cursor = self.conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    
    def _get_record_count_mdbtools(self, table_name: str) -> int:
        """Get record count using mdbtools"""
        try:
            result = subprocess.run(
                ['mdb-export', str(self.db_path), table_name],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                lines = [l for l in result.stdout.strip().split('\n') if l.strip()]
                return len(lines) - 1 if lines else 0  # Subtract header
            return 0
        except Exception:
            return 0
    
    def fetch_all(self, table_name: str, limit: Optional[int] = None):
        """Fetch all records from a table"""
        if self._mdbtools_mode:
            return self._fetch_all_mdbtools(table_name, limit)
        
        cursor = self.conn.cursor()
        query = f"SELECT * FROM [{table_name}]"
        if limit:
            query += f" TOP {limit}"
        cursor.execute(query)
        
        # Get column names
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows
        rows = cursor.fetchall()
        cursor.close()
        
        # Convert to list of dicts
        return [dict(zip(columns, row)) for row in rows]
    
    def _fetch_all_mdbtools(self, table_name: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Fetch all records using mdbtools"""
        try:
            # Don't use -H flag so we get the header row for DictReader
            result = subprocess.run(
                ['mdb-export', str(self.db_path), table_name],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes for large tables
            )
            if result.returncode == 0:
                lines = [l for l in result.stdout.strip().split('\n') if l.strip()]
                if not lines:
                    return []
                
                # Parse CSV with header row
                reader = csv.DictReader(lines)
                records = list(reader)
                
                if limit:
                    records = records[:limit]
                
                return records
            return []
        except Exception as e:
            return []
    
    def fetch_batch(self, table_name: str, offset: int = 0, batch_size: int = 1000):
        """Fetch a batch of records"""
        if self._mdbtools_mode:
            all_records = self._fetch_all_mdbtools(table_name)
            return all_records[offset:offset + batch_size]
        
        cursor = self.conn.cursor()
        # Access doesn't support LIMIT/OFFSET, so we use TOP
        # This is a simplified version - for large datasets, consider using record IDs
        query = f"SELECT * FROM [{table_name}]"
        cursor.execute(query)
        
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        cursor.close()
        
        # Manual pagination
        start = offset
        end = offset + batch_size
        batch = rows[start:end]
        
        return [dict(zip(columns, row)) for row in batch]
    
    def close(self):
        """Close the connection"""
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class PostgresConnection:
    """Connection to PostgreSQL database (Supabase)"""
    
    def __init__(self, host: str, port: int, database: str, user: str, password: str):
        self.conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
    
    @classmethod
    def from_connection_string(cls, connection_string: str):
        """Create connection from connection string"""
        # Parse connection string: postgresql://user:password@host:port/database
        import urllib.parse
        parsed = urllib.parse.urlparse(connection_string)
        return cls(
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            database=parsed.path.lstrip('/') or "postgres",
            user=parsed.username or "postgres",
            password=parsed.password or ""
        )
    
    def get_tables(self) -> list:
        """Get list of all tables in the database"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        return tables
    
    def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get schema information for a table"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'name': row[0],
                'type': row[1],
                'size': row[2],
                'nullable': row[3] == 'YES',
                'default': row[4],
            })
        
        cursor.close()
        return {
            'table_name': table_name,
            'columns': columns,
        }
    
    def get_record_count(self, table_name: str) -> int:
        """Get number of records in a table"""
        cursor = self.conn.cursor()
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    
    def execute_query(self, query: str, params: Optional[tuple] = None):
        """Execute a query (INSERT, UPDATE, DELETE)"""
        cursor = self.conn.cursor()
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            raise
        finally:
            cursor.close()
    
    def fetch_one(self, query: str, params: Optional[tuple] = None):
        """Fetch one row"""
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return dict(result) if result else None
    
    def fetch_all(self, query: str, params: Optional[tuple] = None):
        """Fetch all rows"""
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        return [dict(row) for row in results]
    
    def close(self):
        """Close the connection"""
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

