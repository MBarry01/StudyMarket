# 🚀 Setup Redis sur Windows

## Option 1 : Docker (Recommandé)

### Installer Docker Desktop
1. Télécharger : https://www.docker.com/products/docker-desktop/
2. Installer
3. Démarrer Docker Desktop
4. Puis :
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

### Vérifier
```bash
docker ps
```

---

## Option 2 : Windows Redis (Direct)

### Via WSL
```bash
wsl --install
# Puis dans WSL :
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

### Via Chocolatey
```bash
choco install redis-64
redis-server
```

### Via Download
1. Télécharger : https://github.com/microsoftarchive/redis/releases
2. Extraire
3. Lancer `redis-server.exe`

---

## Option 3 : Pour Tester (Temporaire)

Pour l'instant, **le système fonctionne SANS Redis** !

Les jobs sont **simulés** et ça marche déjà.

Vous pouvez :
- ✅ Tester le système maintenant
- ✅ Upload documents
- ✅ Voir les badges
- ✅ Workflow complet

**Redis/BullMQ est optionnel** pour l'instant.

Quand vous voudrez le vrai worker, suivez Option 1 ou 2 ci-dessus.

---

## 🎯 Recommandation

**Garder la simulation pour l'instant** ✅

Le système fonctionne parfaitement avec simulation :
- Upload ✅
- Validation auto ✅
- Badge ✅
- Admin panel ✅

**Worker réel = OPTIONNEL** et peut être activé plus tard ! 🚀

