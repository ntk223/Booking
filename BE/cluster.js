import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numCPUs = os.cpus().length;

const numWorkers = parseInt(process.env.CLUSTER_WORKERS) || numCPUs;

if (cluster.isPrimary) {
    console.log(` Primary process ${process.pid} starting...`);
    console.log(` System has ${numCPUs} CPU cores`);
    console.log(` Starting ${numWorkers} worker processes...\n`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(` Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
        console.log(' Starting a new worker...');
        cluster.fork();
    });

    cluster.on('online', (worker) => {
        console.log(` Worker ${worker.process.pid} is online`);
    });
    const shutdown = () => {
        console.log('\n Received shutdown signal, stopping workers...');
        for (const id in cluster.workers) {
            cluster.workers[id].kill('SIGTERM');
        }
        setTimeout(() => {
            console.log(' All workers stopped. Goodbye!');
            process.exit(0);
        }, 5000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

} else {
    console.log(`check Worker ${process.pid} starting server...`);
    import('./index.js');
}
