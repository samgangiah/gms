# macOS Setup - Access Database Migration

## ✅ What's Already Done

1. ✅ **unixodbc installed** - Required for pyodbc
2. ✅ **mdbtools installed** - Alternative method for reading Access databases on macOS
3. ✅ **Migration script updated** - Now supports both pyodbc and mdbtools automatically

## How It Works

The migration script will **automatically**:
1. Try to use `pyodbc` first (if Microsoft Access drivers are available)
2. If that fails, automatically fall back to `mdbtools` (which you have installed)

## Test the Setup

```bash
cd /Users/sam/Dev/Gilnokie/migration

# Test that the script can import
python3 inspect_access.py --help
```

## Important Note About Access Drivers

**Microsoft Access Database Engine is Windows-only.** On macOS:
- `pyodbc` will import successfully (✅ you have this)
- But it **cannot connect** to `.mdb` files without Windows drivers
- The script will **automatically use mdbtools** instead (✅ you have this)

## Running the Migration

The script will automatically detect and use mdbtools:

```bash
# Inspect the database
python3 inspect_access.py

# Run dry-run migration
python3 migrate.py --dry-run

# Run actual migration
python3 migrate.py
```

## If You Get Errors

If you see connection errors, the script should automatically try mdbtools. If not, you can force mdbtools mode by editing the connection code, but the auto-detection should work.

## Summary

✅ **You're all set!** The migration script will use mdbtools automatically when pyodbc can't connect to the Access database.

