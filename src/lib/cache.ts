/**
 * 🚀 Système de Cache Intelligent avec TTL
 * 
 * Permet de réduire les requêtes Firestore en cachant les données
 * avec un Time To Live (TTL) configurable
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Définir une valeur dans le cache
   * @param key Clé unique
   * @param data Données à cacher
   * @param ttl Durée de vie en ms (défaut: 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    
    console.log(`📦 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }
  
  /**
   * Récupérer une valeur du cache
   * @param key Clé unique
   * @returns Données ou null si expiré/inexistant
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }
    
    // Vérifier si le cache est expiré
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      console.log(`⏰ Cache EXPIRED: ${key} (age: ${age}ms, ttl: ${entry.ttl}ms)`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ Cache HIT: ${key} (age: ${age}ms)`);
    return entry.data as T;
  }
  
  /**
   * Vérifier si une clé existe et est valide
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Invalider un cache spécifique
   */
  invalidate(key: string): void {
    if (this.cache.delete(key)) {
      console.log(`🗑️ Cache INVALIDATED: ${key}`);
    }
  }
  
  /**
   * Invalider tous les caches avec un préfixe
   * Exemple: invalidatePrefix('listing:') invalide tous les caches de listings
   */
  invalidatePrefix(prefix: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Cache INVALIDATED (prefix: ${prefix}): ${count} entries`);
  }
  
  /**
   * Invalider tous les caches
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache CLEARED: ${size} entries`);
  }
  
  /**
   * Nettoyer les caches expirés
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleaned} expired entries removed`);
    }
  }
  
  /**
   * Obtenir des statistiques sur le cache
   */
  getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Instance singleton
export const cache = new CacheManager();

// Cleanup automatique toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
  
  // Cleanup au beforeunload
  window.addEventListener('beforeunload', () => {
    const stats = cache.getStats();
    console.log('📊 Cache stats avant fermeture:', stats);
  });
}

// Export pour usage dans les tests
export { CacheManager };













