# Setup Guide - Homebrew Installation

## Install Python 3 (if not already installed)

```bash
# Update Homebrew
brew update

# Install Python 3 (latest version)
brew install python@3.11

# Or install Python 3.12 (newest)
brew install python@3.12

# Verify installation
python3 --version
```

**Note:** You already have Python 3.9.6 installed, which should work fine. You can skip this step if you prefer.

## Install pip (if needed)

Python 3.9+ should come with pip, but if you need to install it:

```bash
# Install pip
python3 -m ensurepip --upgrade

# Or use get-pip.py
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
```

## Install Migration Dependencies

```bash
cd /Users/sam/Dev/Gilnokie/migration

# Install all required packages
python3 -m pip install -r requirements.txt
```

## Install Microsoft Access Database Engine (for macOS)

**Note:** Microsoft Access Database Engine is Windows-only. For macOS, you have two options:

### Option 1: Use mdbtools (Recommended for macOS)

```bash
# Install mdbtools via Homebrew
brew install mdbtools

# Then you'll need to modify the migration script to use mdbtools instead of pyodbc
# Or use a Python wrapper like pymdb
python3 -m pip install pymdb
```

### Option 2: Use Wine + Access Database Engine (Complex)

This requires running Windows software on macOS, which is more complex.

### Option 3: Use a Windows VM or Remote Windows Machine

Run the migration on a Windows machine that has Access Database Engine installed.

## Verify Installation

```bash
# Check Python
python3 --version

# Check pip
python3 -m pip --version

# Check installed packages
python3 -m pip list

# Test imports (will fail if dependencies not installed)
cd /Users/sam/Dev/Gilnokie/migration
python3 -c "import yaml, psycopg2, pandas, tqdm, colorama; print('✓ All dependencies installed')"
```

## Alternative: Use Python Virtual Environment (Recommended)

```bash
cd /Users/sam/Dev/Gilnokie/migration

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# When done, deactivate
deactivate
```

## Troubleshooting

### "Command not found: python3"
```bash
# Add Python to PATH (if using Homebrew Python)
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "pip: command not found"
```bash
# Use python3 -m pip instead
python3 -m pip install -r requirements.txt
```

### "Microsoft Access Database Engine not found"
- On macOS, use mdbtools (see Option 1 above)
- Or run migration on Windows machine
- Or use a Windows VM

### "psycopg2 installation failed"
```bash
# Install PostgreSQL development libraries first
brew install postgresql

# Then install psycopg2
python3 -m pip install psycopg2-binary
```

