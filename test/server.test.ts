import KVServer from '../src/kvHttpServer';
import { PutResponse } from '../src/types';
import { getHealth, getItem, putItem, retryAssertEqual, sleep } from './testUtils';
import request, { Response } from 'supertest';

describe('Storage test', () => {
    let server: KVServer;

    const defaultPort = 8080;
    const nonDefaultPort = 8081;

    const urlPutDefault = `http://localhost:${defaultPort}/kv/v1/put`;
    const urlGetDefault = `http://localhost:${defaultPort}/kv/v1/get`;
    const urlHealthDefault = `http://localhost:${defaultPort}/kv/v1/health`;

    const urlPut = `http://localhost:${nonDefaultPort}/kv/v1/put`;
    const urlGet = `http://localhost:${nonDefaultPort}/kv/v1/get`;
    const urlHealth = `http://localhost:${nonDefaultPort}/kv/v1/health`;

    afterEach(async () => {
        server.stop();
    });

    test('Can override default max storage size', async () => {
        server = new KVServer(2, 9999, nonDefaultPort);
        server.start();
        await retryAssertEqual(() => getHealth(urlHealth), {
            defaultTTL: 9999,
            maxStorageSize: 2,
            storageUsed: 0,
        });
        await putItem(urlPut, 'key1', { item1: 1 }, 1000);
        await putItem(urlPut, 'key2', { item1: 2 }, 1000);
        await request(urlPut)
            .post('/key3/1000')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(432)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: false });
            });

        expect(await getHealth(urlHealth)).toEqual({
            defaultTTL: 9999,
            maxStorageSize: 2,
            storageUsed: 2,
        });

        const resp = await getItem(urlGet, 'key1');
        expect(resp).toEqual({ data: { item1: 1 } });
        const resp2 = await getItem(urlGet, 'key2');
        expect(resp2).toEqual({ data: { item1: 2 } });
        const resp3 = await getItem(urlGet, 'key3');
        expect(resp3).toEqual({ data: null });
    });

    test('Can override default ttl', async () => {
        server = new KVServer(2, 10, nonDefaultPort);
        server.start();
        await retryAssertEqual(() => getHealth(urlHealth), {
            defaultTTL: 10,
            maxStorageSize: 2,
            storageUsed: 0,
        });
        await putItem(urlPut, 'key1', { item1: 1 });
        await sleep(11);
        await request(urlPut)
            .post('/key1')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(201)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: true });
            });

        expect(await getHealth(urlHealth)).toEqual({
            defaultTTL: 10,
            maxStorageSize: 2,
            storageUsed: 1,
        });

        const resp = await getItem(urlGet, 'key1');
        expect(resp).toEqual({ data: { item1: 1, item2: 'two' } });
    });

    test('Can use default port', async () => {
        server = new KVServer(2, 10);
        server.start();
        await retryAssertEqual(() => getHealth(urlHealthDefault), {
            defaultTTL: 10,
            maxStorageSize: 2,
            storageUsed: 0,
        });
        await putItem(urlPutDefault, 'key1', { item1: 1 });
        const resp = await getItem(urlGetDefault, 'key1');
        expect(resp).toEqual({ data: { item1: 1 } });
        expect(await getHealth(urlHealthDefault)).toEqual({
            defaultTTL: 10,
            maxStorageSize: 2,
            storageUsed: 1,
        });
    });

    test('Can use default port and default ttl', async () => {
        server = new KVServer(2);
        server.start();
        await retryAssertEqual(() => getHealth(urlHealthDefault), {
            defaultTTL: 60000,
            maxStorageSize: 2,
            storageUsed: 0,
        });
        await putItem(urlPutDefault, 'key1', { item1: 1 });
        const resp = await getItem(urlGetDefault, 'key1');
        expect(resp).toEqual({ data: { item1: 1 } });
        expect(await getHealth(urlHealthDefault)).toEqual({
            defaultTTL: 60000,
            maxStorageSize: 2,
            storageUsed: 1,
        });
    });

    test('Can use all default properties', async () => {
        server = new KVServer();
        server.start();
        await retryAssertEqual(() => getHealth(urlHealthDefault), {
            defaultTTL: 60000,
            maxStorageSize: 1000000,
            storageUsed: 0,
        });
        await putItem(urlPutDefault, 'key1', { item1: 1 });
        const resp = await getItem(urlGetDefault, 'key1');
        expect(resp).toEqual({ data: { item1: 1 } });
        expect(await getHealth(urlHealthDefault)).toEqual({
            defaultTTL: 60000,
            maxStorageSize: 1000000,
            storageUsed: 1,
        });
    });
});
