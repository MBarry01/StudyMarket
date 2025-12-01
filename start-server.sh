#!/bin/bash
# Script pour démarrer le serveur avec les variables d'environnement

echo "🚀 Démarrage du serveur StudyMarket..."

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé"
    echo "📝 Créez un fichier .env avec les variables suivantes :"
    echo "   STRIPE_SECRET_KEY=sk_test_..."
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo "   FIREBASE_SERVICE_ACCOUNT={\"project_id\":\"...\",\"client_email\":\"...\",\"private_key\":\"...\"}"
    echo "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..."
    echo ""
    echo "📖 Consultez FIREBASE_SETUP.md pour plus de détails"
    echo ""
fi

# Charger les variables d'environnement et démarrer le serveur
if [ -f .env ]; then
    echo "✅ Variables d'environnement chargées depuis .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Utilisation des valeurs par défaut (persistance Firebase désactivée)"
fi

echo "🌐 Serveur démarré sur http://localhost:3001"
echo "📡 Endpoints disponibles :"
echo "   POST /api/create-payment-intent"
echo "   POST /api/confirm-payment" 
echo "   POST /api/webhook/stripe"
echo "   GET  /api/test"
echo ""

node server.js
















