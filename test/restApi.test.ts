import KVServer from '../src/kvHttpServer';
import request, { Response } from 'supertest';
import { InvalidRequestError, PutResponse } from '../src/types';
import { getItem, putItem, sleep } from './testUtils';

describe('Storage test', () => {
    let server: KVServer;
    const port = 8081;
    const storageSize = 100;
    const defaultTTL = 1000;

    const urlPut = `http://localhost:${port}/kv/v1/put`;
    const urlGet = `http://localhost:${port}/kv/v1/get`;

    beforeAll(() => {
        server = new KVServer(storageSize, defaultTTL, port);
        server.start();
    });

    afterAll(() => {
        server.stop();
    });

    test('Get item that does not exist', async () => {
        await request(server.getInstance())
            .get('/kv/v1/get/keyDoesNotExist')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ data: null });
            });
    });

    test('Get item that does not exist, key is number', async () => {
        await request(server.getInstance())
            .get('/kv/v1/get/123456')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ data: null });
            });
    });

    test('Put new item then get existing item, key is a string (Axios)', async () => {
        await putItem(urlPut, 'key1', { item1: 1, item2: 'two' }, 1000);
        const resp = await getItem(urlGet, 'key1');
        expect(resp).toEqual({ data: { item1: 1, item2: 'two' } });
    });

    test('Put new item then get existing item, key is a number (Axios)', async () => {
        await putItem(urlPut, '123', { item1: 1, item2: 'two' }, 1000);
        const resp = await getItem(urlGet, '123');
        expect(resp).toEqual({ data: { item1: 1, item2: 'two' } });
    });

    test('Put new item then get existing item', async () => {
        await request(server.getInstance())
            .post('/kv/v1/put/key2')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(201)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: true });
            });
        await request(server.getInstance())
            .get('/kv/v1/get/key2')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ data: { item1: 1, item2: 'two' } });
            });
    });

    test('Put new item with TTL', async () => {
        await request(server.getInstance())
            .post('/kv/v1/put/key60000/60000')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(201)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: true });
            });
    });

    test('Put item overrides existing item with expired TTL', async () => {
        await putItem(urlPut, 'keyThatShouldExpire', { test: 'test' }, 100);

        await sleep(101);

        await request(server.getInstance())
            .post('/kv/v1/put/keyThatShouldExpire/60000')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(201)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: true });
            });
    });

    test('Put item does not override existing item if TTL not expired', async () => {
        await putItem(urlPut, 'keyNotExpired', { test: 'test' }, 10000);

        await request(server.getInstance())
            .post('/kv/v1/put/keyNotExpired/60000')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(432)
            .then((res: Response) => {
                const apiResp: PutResponse = res.body;
                expect(apiResp).toEqual({ putResult: false });
            });
    });

    test('Fails to put new item with invalid TTL', async () => {
        await request(server.getInstance())
            .post('/kv/v1/put/key1/123Boom')
            .send({ item1: 1, item2: 'two' })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .then((res: Response) => {
                const apiResp: InvalidRequestError = res.body;
                expect(apiResp).toEqual({
                    error: 'Invalid request',
                    message: 'ttl parameter must be a number',
                });
            });
    });
});
