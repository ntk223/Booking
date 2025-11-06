const axios  = require('axios')
const { performance } = require('perf_hooks')
async function testAPI(url, times = 5) {
  let total = 0
  for (let i = 0; i < times; i++) {
    const start = performance.now()
    const res = await axios.get(url)
    const end = performance.now()
    const duration = end - start
    console.log(`Request ${i + 1}: ${duration.toFixed(2)} ms`)
    total += duration
  }
  // console.log(`👉 Trung bình: ${(total / times).toFixed(2)} ms\n`)
}

async function runBenchmark() {
  const url = `http://localhost:5000/api/list`

  await testAPI(url, 100)   // lần đầu lấy từ DB, set cache

}

runBenchmark()