/**
 * CRON/INDEX.JS — Enregistrement et démarrage des tâches planifiées
 *
 * Utilise node-cron pour les tâches simples.
 * Migration future : BullMQ repeatable jobs (si Redis disponible)
 * pour bénéficier de la persistance et du monitoring.
 */

let cron;
try {
  cron = require('node-cron');
} catch {
  // node-cron pas encore installé — les jobs seront listés mais pas planifiés
  cron = null;
}

// Chaque job exporte { run, schedule, name }
const jobs = [
  require('./jobs/refreshInventory'),
  require('./jobs/syncPrices'),
  require('./jobs/cleanExpiredTrades'),
];

function initCron() {
  if (!cron) {
    console.warn('[cron] node-cron non installé — jobs listés mais non planifiés');
    console.warn('[cron] Installer : npm install node-cron');
    jobs.forEach(j => console.log(`  → ${j.name} (${j.schedule})`));
    return;
  }

  for (const job of jobs) {
    cron.schedule(job.schedule, async () => {
      try {
        await job.run();
      } catch (err) {
        console.error(`[cron:${job.name}] Erreur non capturée:`, err.message);
      }
    });
    console.log(`[cron] ${job.name} planifié (${job.schedule})`);
  }

  // Exécuter syncPrices immédiatement au démarrage (cache froid)
  const priceJob = jobs.find(j => j.name === 'syncPrices');
  if (priceJob) {
    console.log('[cron] Chargement initial des prix...');
    priceJob.run().catch(err =>
      console.error('[cron:syncPrices] Échec au démarrage:', err.message)
    );
  }
}

module.exports = { initCron, jobs };
