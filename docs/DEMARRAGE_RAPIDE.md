# ⚡ Démarrage Rapide - Système de Paiement

## 🚀 En 3 minutes

### 1. Démarrer les serveurs

```bash
# Terminal 1 : Backend
node server.js

# Terminal 2 : Frontend
npm run dev

# Terminal 3 : Stripe Webhook (local)
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### 2. Tester un paiement

1. Ouvrir : http://localhost:5174/StudyMarket/
2. Cliquer sur une annonce
3. Cliquer "Acheter maintenant"
4. Choisir "Carte Bancaire"
5. Carte test : `4242 4242 4242 4242` (date future, CVC quelconque)
6. Confirmer

### 3. Vérifier

- ✅ Page success affiche confirmation
- ✅ Firestore : `orders` → commande en status `paid`
- ✅ Firestore : `listings` → annonce en status `sold`
- ✅ Badge "VENDU" sur l'annonce

---

## 📚 Documentation complète

| Document | Description |
|----------|-------------|
| **RESUME_MODIFICATIONS.md** | Résumé des changements |
| **IMPLEMENTATION_COMPLETE.md** | État complet du système |
| **SYSTEME_PAIEMENT_COMPLET.md** | Guide technique détaillé |
| **GUIDE_TEST_COMPLET.md** | 10 scénarios de test |

---

## 🆘 Problème ?

### Le serveur ne démarre pas
```bash
# Vérifier que le port 3001 est libre
netstat -ano | findstr :3001

# Arrêter les processus Node.js
Get-Process node | Stop-Process -Force
```

### Webhook ne reçoit rien
```bash
# Relancer Stripe CLI
stripe login
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Commande pas créée
Vérifier `vite.config.ts` :
```typescript
define: {
  'import.meta.env.VITE_API_BASE': JSON.stringify('http://localhost:3001'),
}
```

### Badge VENDU pas affiché
```bash
# Vider le cache du navigateur
Ctrl + F5 (ou Cmd + Shift + R sur Mac)
```

---

## 🎯 Nouveau flux en un coup d'œil

```
User clique "Acheter"
       ↓
Commande créée (pending) 🆕
       ↓
Choix de méthode 🆕
       ↓
PaymentIntent créé
       ↓
Récapitulatif des frais 🆕
       ↓
User paie
       ↓
Webhook met à jour (paid) 🆕
       ↓
Page success poll statut 🆕
       ↓
Confirmation finale ✅
```

---

## ✅ Ce qui fonctionne

- ✅ Paiement par carte (Stripe)
- ✅ Création commande avant paiement
- ✅ Récapitulatif des frais
- ✅ Polling du statut
- ✅ Badge VENDU
- ✅ Page Mes Commandes
- ✅ Page Mes Ventes

## ⏳ Ce qui vient ensuite

- ⏳ PayPal (UI prête)
- ⏳ Lydia (UI prête)
- ⏳ Espèces (UI prête)

---

**Le système est prêt ! 🚀**

*Pour plus d'infos : voir `RESUME_MODIFICATIONS.md`*

