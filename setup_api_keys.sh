#!/bin/bash

echo "==================================="
echo "Scanner Pro API Keys Configuration"
echo "==================================="
echo ""
echo "This script will help you set up your API keys."
echo "Your keys will be stored in .env.local file."
echo ""

# Function to update or add a key in .env.local
update_env_key() {
    local key=$1
    local value=$2
    local file=".env.local"
    
    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Key exists, update it
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
        # Key doesn't exist, add it
        echo "${key}=${value}" >> "$file"
    fi
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
# API Keys Configuration
# Add your actual API keys here

# Polygon API (Paid) - Stocks & Options
POLYGON_API_KEY=75rlu6cWGNnIqqR_x8M384YUjBgGk6kT

# Financial Modeling Prep (Paid) - For real-time bid/ask
FMP_API_KEY=your_fmp_api_key_here

# Ortex (Paid) - Short interest data
ORTEX_API_KEY=your_ortex_api_key_here

# Alpha Vantage (Free) - Additional market data
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Twelve Data (Free) - Alternative market data
TWELVE_DATA_API_KEY=your_twelve_data_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF
fi

echo "Current API Keys Status:"
echo "------------------------"

# Check each API key
if grep -q "FMP_API_KEY=your_fmp_api_key_here" .env.local; then
    echo "❌ FMP API Key: Not configured"
else
    echo "✅ FMP API Key: Configured"
fi

if grep -q "ORTEX_API_KEY=your_ortex_api_key_here" .env.local; then
    echo "❌ Ortex API Key: Not configured"
else
    echo "✅ Ortex API Key: Configured"
fi

echo ""
echo "Would you like to add/update your API keys now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Enter your FMP API key (or press Enter to skip):"
    read -r fmp_key
    if [ ! -z "$fmp_key" ]; then
        update_env_key "FMP_API_KEY" "$fmp_key"
        echo "✅ FMP API key updated"
    fi
    
    echo ""
    echo "Enter your Ortex API key (or press Enter to skip):"
    read -r ortex_key
    if [ ! -z "$ortex_key" ]; then
        update_env_key "ORTEX_API_KEY" "$ortex_key"
        echo "✅ Ortex API key updated"
    fi
    
    echo ""
    echo "Enter your Alpha Vantage API key (or press Enter to skip):"
    read -r av_key
    if [ ! -z "$av_key" ]; then
        update_env_key "ALPHA_VANTAGE_API_KEY" "$av_key"
        echo "✅ Alpha Vantage API key updated"
    fi
    
    echo ""
    echo "Enter your Twelve Data API key (or press Enter to skip):"
    read -r td_key
    if [ ! -z "$td_key" ]; then
        update_env_key "TWELVE_DATA_API_KEY" "$td_key"
        echo "✅ Twelve Data API key updated"
    fi
    
    echo ""
    echo "API keys have been updated in .env.local"
    echo ""
    echo "Restarting the application with new keys..."
    pm2 restart scanner-pro --update-env
    echo "✅ Application restarted with new API keys"
else
    echo ""
    echo "To manually add your API keys, edit the .env.local file:"
    echo "  nano .env.local"
    echo ""
    echo "Then restart the app with:"
    echo "  pm2 restart scanner-pro --update-env"
fi

echo ""
echo "To test FMP API connection, run:"
echo "  node test_fmp_api.js"
echo ""