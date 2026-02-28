#!/bin/bash

# Setup script for Smart Warehouse System
# This script installs all dependencies and prepares the development environment

echo "🚀 Setting up Smart Warehouse System..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check Firebase CLI
echo ""
echo "🔍 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI detected"
fi

# Install web app dependencies
echo ""
echo "📦 Installing web app dependencies..."
cd web-app
npm install
if [ $? -eq 0 ]; then
    echo "✅ Web app dependencies installed"
else
    echo "❌ Failed to install web app dependencies"
    exit 1
fi
cd ..

# Install Firebase functions dependencies
echo ""
echo "📦 Installing Firebase functions dependencies..."
cd firebase/functions
npm install
if [ $? -eq 0 ]; then
    echo "✅ Firebase functions dependencies installed"
else
    echo "❌ Failed to install Firebase functions dependencies"
    exit 1
fi
cd ../..

# Install IoT simulator dependencies
echo ""
echo "📦 Installing IoT simulator dependencies..."
cd iot-simulator
npm install
if [ $? -eq 0 ]; then
    echo "✅ IoT simulator dependencies installed"
else
    echo "❌ Failed to install IoT simulator dependencies"
    exit 1
fi
cd ..

# Check for .env.local
echo ""
echo "🔧 Checking environment configuration..."
if [ ! -f "web-app/.env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp web-app/.env.example web-app/.env.local
    echo "📝 Please edit web-app/.env.local with your Firebase configuration"
fi

if [ ! -f "iot-simulator/.env" ]; then
    echo "⚠️  IoT simulator .env not found. Creating from template..."
    cp iot-simulator/.env.example iot-simulator/.env
    echo "📝 Please edit iot-simulator/.env with your Firebase configuration"
fi

# Summary
echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Create a Firebase project at https://console.firebase.google.com"
echo "2. Edit web-app/.env.local with your Firebase config"
echo "3. Run 'firebase login' to authenticate"
echo "4. Run 'cd firebase && firebase use --add' to select your project"
echo "5. Start development:"
echo "   Terminal 1: cd firebase && firebase emulators:start"
echo "   Terminal 2: cd web-app && npm run dev"
echo "   Terminal 3: cd iot-simulator && npm run simulate"
echo ""
echo "📖 Read GETTING_STARTED.md for detailed instructions"
echo ""
echo "Happy coding! 🎉"
