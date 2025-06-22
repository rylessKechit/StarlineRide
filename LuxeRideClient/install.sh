#!/bin/bash

echo "🔧 CORRECTION MODULE STRIPE"
echo "=========================="

# Arrêter Xcode temporairement
echo "🛑 Fermeture de Xcode..."
killall Xcode 2>/dev/null || true

cd ios

echo "📦 Vérification de Stripe dans les Pods..."
if [ -d "Pods/StripeCore" ]; then
    echo "✅ StripeCore trouvé dans Pods"
else
    echo "❌ StripeCore manquant dans Pods"
fi

# Nettoyer et réinstaller spécifiquement pour Stripe
echo "🧹 Nettoyage spécifique Stripe..."
rm -rf build
rm -rf DerivedData

# Réinstaller les pods avec focus sur Stripe
echo "🍎 Réinstallation pods avec correction Stripe..."
pod deintegrate --silent 2>/dev/null || true
pod install --repo-update

# Vérifier l'installation de Stripe
echo "🔍 Vérification post-installation..."
if [ -d "Pods/StripeCore" ]; then
    echo "✅ StripeCore correctement installé"
    ls -la Pods/ | grep -i stripe
else
    echo "❌ Problème avec l'installation de Stripe"
fi

cd ..

# Alternative : Temporairement supprimer Stripe pour tester
echo ""
echo "💡 SOLUTIONS ALTERNATIVES :"
echo "========================================="
echo ""
echo "OPTION A - TESTER AVEC STRIPE :"
echo "1. open ios/LuxeRideClient.xcworkspace"
echo "2. Clean Build Folder (Cmd+Shift+K)"
echo "3. Build (Cmd+B)"
echo ""
echo "OPTION B - TESTER SANS STRIPE (temporaire) :"
echo "1. npm uninstall @stripe/stripe-react-native"
echo "2. cd ios && pod install && cd .."
echo "3. npm run ios"
echo ""
echo "OPTION C - DOWNGRADE STRIPE :"
echo "1. npm install @stripe/stripe-react-native@0.35.0 --save"
echo "2. cd ios && pod install && cd .."
echo "3. npm run ios"