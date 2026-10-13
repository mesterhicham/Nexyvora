#!/usr/bin/env node
/**
 * Standalone CLI script for payment renewal cycle
 * Usage:
 *   node backend/scripts/cron/renew_payments.js
 * Or in crontab:
 *   * /5 * * * * cd /path/to/Nextvora && node backend/scripts/cron/renew_payments.js >> /var/log/nexyvora_renewal.log 2>&1
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const worker = require('../../workers/paymentRenewalWorker');

async function main() {
    console.log(`[Cron:RenewPayments] Execution started at ${new Date().toISOString()}`);
    try {
        const results = await worker.runRenewalCycle();
        console.log(`[Cron:RenewPayments] Finished with results:`, JSON.stringify(results));
        process.exit(0);
    } catch (err) {
        console.error(`[Cron:RenewPayments] Fatal error:`, err);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
