import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const BENCHMARK_SCRIPT = path.join(ROOT_DIR, 'benchmark', 'stress-test.js');
const TEMP_JSON = path.join(ROOT_DIR, 'temp-summary.json');
const TEMPLATE_HTML = path.join(ROOT_DIR, 'benchmark', 'report-template.html');
const OUTPUT_HTML = path.join(ROOT_DIR, 'benchmark-report.html');

console.log('Starting Benchmark (Stress Test)...');
console.log('This may take about 30-40 seconds.');

exec(`k6 run "${BENCHMARK_SCRIPT}" --summary-export="${TEMP_JSON}"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error running k6: ${error.message}`);
        return;
    }
    console.log('Benchmark completed.');

    try {
        const jsonData = fs.readFileSync(TEMP_JSON, 'utf8');
        let htmlTemplate = fs.readFileSync(TEMPLATE_HTML, 'utf8');

        // Inject data
        const finalHtml = htmlTemplate.replace(/{{\s*BENCHMARK_DATA\s*}}/, jsonData);

        fs.writeFileSync(OUTPUT_HTML, finalHtml);
        console.log(`Report generated successfully: ${OUTPUT_HTML}`);

        // Cleanup
        fs.unlinkSync(TEMP_JSON);
        console.log('Cleanup completed.');

    } catch (err) {
        console.error('Error generating report:', err);
    }
});
