# Quick Start Guide

## Prerequisites Checklist

- [ ] Microsoft Access Database Engine installed
- [ ] Supabase Docker instance running
- [ ] Python 3.9+ installed
- [ ] Dependencies installed: `pip install -r requirements.txt`

## Step-by-Step Migration

### 1. Install Dependencies

```bash
cd /Users/sam/Dev/Gilnokie/migration
pip install -r requirements.txt
```

### 2. Configure Migration

Edit `config.yaml`:
- Set `source_database` path to your Access .mdb file
- Verify `target_database` connection settings (default should work if Supabase is running)
- Review `tables` list (empty = migrate all)

### 3. Inspect Source Database

```bash
python inspect_access.py
```

This will:
- Analyze the Access database structure
- Generate schema documentation in `schema-docs/`
- Help you verify field mappings

**Review the output** and check if field names in `mappers.py` match your actual Access schema.

### 4. Validate Schemas (Dry Run)

```bash
python migrate.py --dry-run
```

This will:
- Validate source and destination schemas
- Check field mappings
- Show what would be migrated
- **No data is inserted**

**Fix any validation errors** before proceeding.

### 5. Run Migration

```bash
python migrate.py
```

This will:
- Validate schemas
- Migrate tables in dependency order
- Track progress in `migration-state.json`
- Log to `reports/migration-log.txt`

**If interrupted**, simply run again - it will resume automatically.

### 6. Validate Results

```bash
python validate.py
```

This will:
- Compare record counts
- Check foreign key integrity
- Validate required fields
- Generate validation report

## Troubleshooting

### "Could not connect to Access database"
- Install Microsoft Access Database Engine
- Check file path in `config.yaml`
- Verify file permissions

### "Destination table not found"
- Run Prisma migrations: `cd ../gilnokie-app && npx prisma migrate dev`
- Verify Supabase is running: `supabase status`
- Check table name mappings in `mappers.py`

### "Schema validation failed"
- Review validation errors
- Update field mappings in `mappers.py` if needed
- Ensure Prisma schema matches expected structure

### "Foreign key lookup failed"
- Ensure reference tables (customers, yarn_types, etc.) are migrated first
- Check lookup key values match between source and destination
- Review lookup map building in migration logs

## Field Mapping Adjustments

If field names don't match, edit `mappers.py`:

1. Find the table mapping in `FIELD_MAPPINGS`
2. Update source field names to match your Access schema
3. Verify destination field names match Prisma schema
4. Re-run inspection and validation

## Re-running Migration

- **Resume**: Just run `python migrate.py` again
- **Force re-run**: `python migrate.py --force` (clears state)
- **Skip completed tables**: Automatic - already migrated tables are skipped

## Output Files

- `migration-state.json`: Progress tracking (don't delete unless forcing re-run)
- `reports/migration-log.txt`: Execution log
- `reports/validation-report.json`: Post-migration validation
- `schema-docs/access-schema.json`: Source database structure

