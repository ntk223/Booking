import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
const BASE_URL = 'http://localhost:5000/api/storage';
const FILE_SIZE_BYTES = 1024 * 1024; // 1MB
const VUS = 10;
const DURATION = '30s';

const fileContent = 'a'.repeat(FILE_SIZE_BYTES);

export const options = {
    scenarios: {
        valet_key: {
            executor: 'constant-vus',
            vus: VUS,
            duration: DURATION,
            exec: 'valetKeyUpload',
        },
        proxy_upload: {
            executor: 'constant-vus',
            vus: VUS,
            duration: DURATION,
            exec: 'proxyUpload',
            startTime: '35s',
        },
    },
};

export function valetKeyUpload() {
    const filename = `valet-${Date.now()}-${Math.random()}.txt`;

    const urlRes = http.get(`${BASE_URL}/upload-url?filename=${filename}&contentType=text/plain`);

    check(urlRes, {
        'valet: get url status is 200': (r) => r.status === 200,
    });

    if (urlRes.status === 200) {
        const { url } = urlRes.json();

        const uploadRes = http.put(url, fileContent, {
            headers: { 'Content-Type': 'text/plain' },
        });

        check(uploadRes, {
            'valet: upload status is 200': (r) => r.status === 200,
        });
    }
}

export function proxyUpload() {
    const filename = `proxy-${Date.now()}-${Math.random()}.txt`;

    const data = {
        file: http.file(fileContent, filename, 'text/plain'),
    };

    const res = http.post(`${BASE_URL}/upload`, data);

    check(res, {
        'proxy: status is 200': (r) => r.status === 200,
    });
}
