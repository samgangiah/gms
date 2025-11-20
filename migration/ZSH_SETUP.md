# Fix Python Command in zsh Terminal

## Quick Fix

Your terminal can't find `python` because macOS only provides `python3`. Here are your options:

### Option 1: Use `python3` directly (Recommended)

Just use `python3` instead of `python`:

```bash
# Instead of: python
python3 --version

# Instead of: pip
python3 -m pip install -r requirements.txt
```

### Option 2: Add Aliases (Easiest)

Run this command to add aliases to your `~/.zshrc`:

```bash
echo 'alias python=python3' >> ~/.zshrc
echo 'alias pip=pip3' >> ~/.zshrc
source ~/.zshrc
```

Then you can use `python` and `pip` commands.

### Option 3: Run the Setup Script

```bash
cd /Users/sam/Dev/Gilnokie/migration
./fix_python_path.sh
source ~/.zshrc
```

## Verify It Works

After adding aliases, verify:

```bash
python --version
pip --version
```

## Install Homebrew Python (Optional)

If you want a newer Python version managed by Homebrew:

```bash
# Install Python via Homebrew
brew install python@3.11

# This will also install pip and make python3 available
# You may need to add to PATH:
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## For Migration Scripts

All migration scripts use `python3` explicitly, so they should work as-is. But if you want to run them manually, use:

```bash
python3 inspect_access.py
python3 migrate.py --dry-run
python3 migrate.py
python3 validate.py
```

Or after adding aliases:

```bash
python inspect_access.py
python migrate.py --dry-run
python migrate.py
python validate.py
```

