/**
 * Worker indépendant pour traiter les vérifications
 * 
 * Usage: node start-worker.js
 */

import './src/queue/index.js';
import './src/worker/verificationWorker.js';

console.log('🚀 Verification Worker Started');
console.log('📊 Listening for verification jobs...');
console.log(`🔗 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

// Gestion graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  await verificationWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  await verificationWorker.close();
  process.exit(0);
});

