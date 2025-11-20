# Data Migration: Access to Supabase

Standalone migration script to migrate data from Microsoft Access databases to Supabase PostgreSQL.

## Features

- **Re-runnable**: Safe to run multiple times, tracks progress
- **Resume Capability**: Automatically resumes from last position
- **Schema Validation**: Pre-migration schema checks for both source and destination
- **Idempotent**: Won't create duplicate records
- **Configurable**: Access database path configurable via config file
- **Standalone**: No dependencies on app codebase

## Prerequisites

1. **Microsoft Access Database Engine**
   - Download: https://www.microsoft.com/en-us/download/details.aspx?id=54920
   - Required for reading `.mdb` files

2. **Supabase Docker Running**
   - The script assumes Supabase is already running
   - Default connection: `postgresql://postgres:postgres@localhost:54322/postgres`

3. **Python 3.9+**
   - Install dependencies: `pip install -r requirements.txt`

## Setup

1. **Install Python dependencies:**
   ```bash
   cd /Users/sam/Dev/Gilnokie/migration
   pip install -r requirements.txt
   ```

2. **Configure migration:**
   - Edit `config.yaml` to set source database path
   - Adjust target database connection if needed
   - Configure which tables to migrate

## Usage

### 1. Inspect Source Database

First, inspect the Access database structure:

```bash
python inspect_access.py
```

This will:
- Analyze the Access database structure
- Generate schema documentation in `schema-docs/`
- Show table and column information

### 2. Run Migration (Dry Run)

Validate the migration without inserting data:

```bash
python migrate.py --dry-run
```

This will:
- Validate schemas
- Check field mappings
- Show what would be migrated
- **No data is inserted**

### 3. Run Migration

Execute the actual migration:

```bash
python migrate.py
```

This will:
- Validate schemas before starting
- Migrate tables in dependency order
- Track progress in `migration-state.json`
- Log progress to `reports/migration-log.txt`

### 4. Resume Migration

If migration is interrupted, simply run again:

```bash
python migrate.py
```

It will automatically:
- Skip already-completed tables
- Resume from last position
- Continue with remaining tables

### 5. Force Re-migration

To re-migrate everything (clears state):

```bash
python migrate.py --force
```

### 6. Validate Results

After migration, validate the results:

```bash
python validate.py
```

This will:
- Compare record counts (source vs destination)
- Check foreign key integrity
- Validate required fields
- Generate validation report

## Configuration

Edit `config.yaml` to configure:

- **Source database path**: Path to Access `.mdb` file
- **Target database**: Supabase PostgreSQL connection
- **Tables to migrate**: List of tables (empty = all)
- **Batch size**: Records per batch (default: 1000)
- **Validation settings**: Schema checks, sample size, etc.

## Migration Order

Tables are migrated in dependency order:

1. **Reference Data** (no dependencies):
   - `customers`
   - `yarn_types`
   - `fabric_quality`
   - `users`

2. **Fabric Content** (depends on fabric_quality, yarn_types)

3. **Stock & Orders** (depends on customers, yarn_types, fabric_quality)

4. **Production Data** (depends on customer_orders)

5. **Delivery & Packing** (depends on customer_orders, production_information)

6. **Logs** (depends on users)

## State Management

Migration state is tracked in `migration-state.json`:

- Tracks which tables are completed
- Records migrated count per table
- Enables resume capability
- Can be reset with `--force` flag

## Field Mappings

Field mappings are defined in `mappers.py`:

- Maps Access table/column names to PostgreSQL
- Defines transformation functions
- Handles data type conversions
- Manages foreign key lookups

## Troubleshooting

### "Could not connect to Access database"

- Install Microsoft Access Database Engine
- Check database file path in `config.yaml`
- Verify file permissions

### "Destination table not found"

- Run Prisma migrations first: `npx prisma migrate dev`
- Verify Supabase is running
- Check table name mappings in `mappers.py`

### "Schema validation failed"

- Review validation errors in output
- Fix schema mismatches
- Update field mappings if needed

### "Foreign key lookup failed"

- Ensure reference tables are migrated first
- Check lookup key values (customer names, codes, etc.)
- Verify data exists in source

## Output Files

- `migration-state.json`: Migration progress state
- `reports/migration-log.txt`: Migration execution log
- `reports/error-log.json`: Error details
- `reports/validation-report.json`: Post-migration validation
- `schema-docs/access-schema.json`: Source database schema
- `schema-docs/schema-summary.txt`: Schema summary

## Platform

**Technology Stack:**
- Python 3.9+
- pyodbc (Microsoft Access Database Engine)
- psycopg2 (PostgreSQL)
- PyYAML (Configuration)
- tqdm (Progress bars)

**Source Database:**
- Microsoft Access (.mdb files)
- Legacy VB6 application database

**Target Database:**
- Supabase PostgreSQL
- Prisma schema-based
- Docker instance (assumed running)

