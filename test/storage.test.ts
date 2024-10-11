import KVStore from '../src/kvStore';
import { retry, sleep } from './testUtils';

describe('Storage test', () => {
    test('Get item that does not exist', async () => {
        const store = new KVStore();
        expect(store.get('key1')).toEqual(undefined);
    });

    test('Set new item', async () => {
        const store = new KVStore();
        const res = store.set('key1', { someData: 'test data' });
        expect(res).toEqual(true);
        expect(store.get('key1')).toEqual({ someData: 'test data' });
    });

    test('Does not replace item that has not expired yet, can be replaced when item is expired', async () => {
        const store = new KVStore();
        const res = store.set('key1', { someData: 'test data' }, 100);
        expect(res).toEqual(true);
        expect(store.get('key1')).toEqual({ someData: 'test data' });

        const res2 = store.set('key1', { someData: 'new data' }, 100);
        expect(res2).toEqual(false);
        expect(store.get('key1')).toEqual({ someData: 'test data' });

        await retry(() => expect(store.set('key1', { someData: 'new data' }, 200)).toEqual(true));
        expect(store.get('key1')).toEqual({ someData: 'new data' });
    });

    test('Returns current storage size', async () => {
        const store = new KVStore();

        expect(store.getSize()).toEqual(0);

        store.set('key1', { someData: 'test data' });
        expect(store.getSize()).toEqual(1);

        store.set('key2', { someData: 'test data' });
        expect(store.getSize()).toEqual(2);
    });

    test('Respects max storage size', async () => {
        const store = new KVStore(1);

        expect(store.getSize()).toEqual(0);

        const res1 = store.set('key1', { someData: 'test data' });
        expect(res1).toEqual(true);
        expect(store.getSize()).toEqual(1);

        const res2 = store.set('key2', { someData: 'test data' });
        expect(res2).toEqual(false);
        expect(store.getSize()).toEqual(1);
    });

    test('Can only use string and number as keys', async () => {
        const store = new KVStore();

        const res1 = store.set(1, { someData: 'test data' });
        expect(res1).toEqual(true);
        expect(store.getSize()).toEqual(1);

        const res2 = store.set('two', { someData: 'test data' });
        expect(res2).toEqual(true);
        expect(store.getSize()).toEqual(2);

        const notValidKeyNull = null;

        const res3 = store.set(notValidKeyNull as unknown as string, { someData: 'test data' });
        expect(res3).toEqual(false);
        expect(store.getSize()).toEqual(2);

        const notValidKeyUndefined = undefined;

        const res4 = store.set(notValidKeyUndefined as unknown as string, { someData: 'test data' });
        expect(res4).toEqual(false);
        expect(store.getSize()).toEqual(2);
    });

    test('Can store string value', async () => {
        const store = new KVStore(1);
        const res = store.set(1, 'test');
        expect(res).toEqual(true);
        expect(store.get(1)).toEqual('test');
    });

    test('Can store number value', async () => {
        const store = new KVStore(1);
        const res = store.set(1, 2);
        expect(res).toEqual(true);
        expect(store.get(1)).toEqual(2);
    });

    test('Can store object value', async () => {
        const store = new KVStore(1);
        const res = store.set(1, { one: 1, 2: 'two' });
        expect(res).toEqual(true);
        expect(store.get(1)).toEqual({ one: 1, 2: 'two' });
    });

    test('Can store undefined value', async () => {
        const store = new KVStore(1);
        const value = undefined;
        const res = store.set(1, value);
        expect(res).toEqual(true);
        expect(store.get(1)).not.toBeDefined();
    });

    test('Cleanup deletes expired items', async () => {
        const store = new KVStore();

        expect(store.getSize()).toEqual(0);

        store.set('key1', { someData: 'test data' }, 10);
        expect(store.getSize()).toEqual(1);
        expect(store.get('key1')).toEqual({ someData: 'test data' });

        await sleep(50);

        store.cleanUp();

        expect(store.get('key1')).toEqual(undefined);
        expect(store.getSize()).toEqual(0);
    });

    test('Can set default ttl', async () => {
        const store = new KVStore(1, 20);
        const res1 = store.set('key1', 'test');
        expect(res1).toEqual(true);
        expect(store.get('key1')).toEqual('test');

        await sleep(50);

        const res2 = store.set('key1', 'test');
        expect(res2).toEqual(true);
        expect(store.get('key1')).toEqual('test');
    });
});
