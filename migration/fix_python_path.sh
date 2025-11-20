#!/bin/zsh
# Fix Python PATH for zsh terminal

echo "🔍 Checking Python installation..."

# Check if python3 exists
if command -v python3 &> /dev/null; then
    PYTHON3_PATH=$(which python3)
    echo "✓ Found python3 at: $PYTHON3_PATH"
    python3 --version
else
    echo "✗ python3 not found in PATH"
    exit 1
fi

# Check if python exists (alias)
if command -v python &> /dev/null; then
    PYTHON_PATH=$(which python)
    echo "✓ Found python at: $PYTHON_PATH"
else
    echo "⚠ python command not found (this is normal - use python3)"
fi

echo ""
echo "📝 Adding aliases to ~/.zshrc..."

# Check if aliases already exist
if grep -q "alias python=" ~/.zshrc 2>/dev/null; then
    echo "⚠ Python aliases already exist in ~/.zshrc"
else
    # Add aliases
    cat >> ~/.zshrc << 'EOF'

# Python aliases (added by migration setup)
alias python=python3
alias pip=pip3
EOF
    echo "✓ Added aliases to ~/.zshrc"
fi

# Check if Homebrew Python should be installed
if [ ! -f "/opt/homebrew/bin/python3" ] && [ ! -f "/usr/local/bin/python3" ]; then
    echo ""
    echo "💡 To install Homebrew Python (recommended):"
    echo "   brew install python@3.11"
    echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the changes, run:"
echo "  source ~/.zshrc"
echo ""
echo "Or open a new terminal window."
echo ""
echo "Then verify with:"
echo "  python --version"
echo "  pip --version"

