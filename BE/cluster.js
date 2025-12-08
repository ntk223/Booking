import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';
import logger from './logger/winston.log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numCPUs = os.cpus().length;

const numWorkers = parseInt(process.env.CLUSTER_WORKERS) || numCPUs;

if (cluster.isPrimary) {
    logger.info('Primary process starting', {
        pid: process.pid,
        cpuCores: numCPUs,
        workerCount: numWorkers,
        utilService: 'CLUSTER'
    });

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.error('Worker process died', {
            pid: worker.process.pid,
            exitCode: code,
            signal: signal,
            utilService: 'CLUSTER'
        });
        logger.info('Starting replacement worker', { utilService: 'CLUSTER' });
        cluster.fork();
    });

    cluster.on('online', (worker) => {
        logger.info('Worker process online', {
            pid: worker.process.pid,
            utilService: 'CLUSTER'
        });
    });
    const shutdown = () => {
        logger.info('Received shutdown signal, stopping workers', { utilService: 'CLUSTER' });
        for (const id in cluster.workers) {
            cluster.workers[id].kill('SIGTERM');
        }
        setTimeout(() => {
            logger.info('All workers stopped gracefully', { utilService: 'CLUSTER' });
            process.exit(0);
        }, 5000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

} else {
    logger.info('Worker starting server', {
        pid: process.pid,
        utilService: 'CLUSTER'
    });
    import('./index.js');
}
