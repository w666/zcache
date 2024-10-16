import KVStore from '../src/kvStore';

function getPercentile(latencyArr: number[], percentile: number) {
    latencyArr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * latencyArr.length) - 1;
    return latencyArr[index];
}

describe('Storage performance', () => {
    test.skip('Add 1M items', async () => {
        const store = new KVStore(1000000);

        console.log(`>>> memory usage`, process.memoryUsage());

        for (let i = 0; i < 1000000; i++) {
            store.set(i, { someData: 'test data' });
        }

        console.log(`>>> memory usage`, process.memoryUsage());

        const latency: number[] = [];

        for (let i = 0; i < 1000000; i++) {
            const start = performance.now();
            store.set(i, { someData: 'test data' });
            const end = performance.now();

            latency.push(Math.ceil(end - start));
        }

        console.log(`>>> memory usage`, process.memoryUsage());

        const p90 = getPercentile(latency, 90);
        console.log(`90th percentile: ${p90} ms`);
        const p95 = getPercentile(latency, 95);
        console.log(`95th percentile: ${p95} ms`);
        const p99 = getPercentile(latency, 99);
        console.log(`99th percentile: ${p99} ms`);
    });

    test.skip('Get 1M items', async () => {
        const store = new KVStore(1000000);

        for (let i = 0; i < 1000000; i++) {
            store.set(i, { someData: 'test data' });
        }

        const latency: number[] = [];

        for (let i = 0; i < 1000000; i++) {
            const start = performance.now();
            store.get(i);
            const end = performance.now();

            latency.push(Math.ceil(end - start));
        }

        const p90 = getPercentile(latency, 90);
        console.log(`90th percentile: ${p90} ms`);
        const p95 = getPercentile(latency, 95);
        console.log(`95th percentile: ${p95} ms`);
        const p99 = getPercentile(latency, 99);
        console.log(`99th percentile: ${p99} ms`);
    });
});
