# 💰 Coûts - Système de Notifications

## ✅ Firebase Cloud Messaging : GRATUIT

### Quotas Gratuits
- ✅ **10 millions de notifications/mois** incluses
- ✅ Pour toutes les plateformes (Web, iOS, Android)
- ✅ Pas de limite sur le nombre d'utilisateurs
- ✅ Messages en arrière-plan et hors ligne

### Au-Delà
- 💵 $0.0005 par notification supplémentaire
- Exemple : 20M notifications = $5/mois

## ✅ Firestore : GRATUIT

### Quotas Gratuits
- ✅ **1 Go** de stockage inclus
- ✅ **50,000 lectures/jour** incluses
- ✅ **20,000 écritures/jour** incluses
- ✅ Collection `notifications` + `user_tokens`

### Au-Delà
- 💵 $0.18/Go stockage supplémentaire
- 💵 $0.06/100,000 lectures supplémentaires
- 💵 $0.18/100,000 écritures supplémentaires

## ⚙️ Cloud Functions (Optionnel)

### Quotas Gratuits
- ✅ **2 millions d'invocations/mois** incluses
- ✅ 400,000 Go-secondes
- ✅ 200,000 GHz-secondes

### Au-Delà
- 💵 $0.40 par million d'invocations
- 💵 $0.0000025 par Go-seconde
- 💵 $0.0000100 par GHz-seconde

## 📊 Simulateur de Coûts

### Scénario 1 : Petite Application (1,000 utilisateurs)
- Notifications : 4-5M/mois (gratuit)
- Storage : <1GB (gratuit)
- Reads : 50K/mois (gratuit)
- Writes : 60K/mois (gratuit)
- **💰 Coût mensuel : $0**

### Scénario 2 : Application Moyenne (5,000 utilisateurs)
- Notifications : 8-9M/mois (gratuit)
- Storage : 2GB (gratuit)
- Reads : 200K/mois (gratuit)
- Writes : 250K/mois (gratuit)
- **💰 Coût mensuel : $0**

### Scénario 3 : Grande Application (10,000 utilisateurs)
- Notifications : 15-20M/mois (gratuit jusqu'à 10M)
- Stockage supplémentaire : 5GB = $0.90
- Lectures supplémentaires : 100K = $0.01
- Écritures supplémentaires : 150K = $0.03
- **💰 Coût mensuel : ~$1-5**

### Scénario 4 : Très Grande Application (50,000 utilisateurs)
- Notifications : 50M/mois
  - Gratuit : 10M
  - Payant : 40M × $0.0005 = $20
- Storage : 20GB = $3.42
- Reads : 1M = $0.57
- Writes : 1.5M = $2.16
- **💰 Coût mensuel : ~$25-30**

## 🎯 Estimation pour StudyMarket

### Phase Initiale (Lancement)
- **Utilisateurs** : 500-1,000
- **Notifications** : 2-3M/mois
- **💰 Coût : GRATUIT $0**

### Phase Croissance (3-6 mois)
- **Utilisateurs** : 2,000-5,000
- **Notifications** : 8-10M/mois
- **💰 Coût : GRATUIT $0**

### Phase Maturité (6-12 mois)
- **Utilisateurs** : 10,000+
- **Notifications** : 15-20M/mois
- **💰 Coût : $5-10/mois**

## 🔍 Détails des Quotas

### Firebase Cloud Messaging
| Mesure | Gratuit | Payant |
|--------|---------|--------|
| Notifications/mois | 10M | $0.0005 chacune |
| Utilisateurs | Illimité | Gratuit |
| Plateformes | Toutes | Gratuit |

### Firestore
| Mesure | Gratuit/mois | Payant |
|--------|--------------|--------|
| Storage | 1 GB | $0.18/GB |
| Reads | 1.5M | $0.06/100K |
| Writes | 600K | $0.18/100K |
| Deletes | 600K | $0.02/100K |

### Cloud Functions
| Mesure | Gratuit/mois | Payant |
|--------|--------------|--------|
| Invocations | 2M | $0.40/1M |
| Compute | 400K GB-sec | $0.0000025/GB-sec |
| Network | 5 GB | $0.12/GB |

## 💡 Recommandations

### Pour Démarrer
- ✅ **Gratuit total** pour <10K utilisateurs
- ✅ Pas besoin de Cloud Functions (notifications via Firestore)
- ✅ Pas de frais cachés

### Pour Évoluer
- 💰 Prévoir **$5-10/mois** après 6 mois
- 💰 Passer à Cloud Functions après 10K utilisateurs
- 💰 Optimiser les notifications pour réduire coûts

## 🎉 Conclusion

**Pour StudyMarket** :
- ✅ **Gratuit** pour les premiers 6-12 mois
- ✅ Coûts **minimes** ensuite
- ✅ Pas de frais cachés
- ✅ Très rentable comparé à SMS/Email providers

---

**Réponse courte** : OUI, les notifications sont **GRATUITES** jusqu'à 10 millions/mois ! 🎉
