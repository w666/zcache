import axios from 'axios';

/**
 * Await for specified amount of time
 * @param timeout in milliseconds
 */
export const sleep = async (timeout: number) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
};

/**
 * Retry to execute function and compare result with provided value within specified timeout, exit on success
 * @param func function to execute
 * @param timeout timeout in millisecinds
 * @returns
 */
export const retryAssertEqual = async (func: () => unknown, expectedValue: unknown, timeout = 5000) => {
    const startedAt = Date.now();
    let error: Error = new Error(`Retry did not run`);
    while (startedAt + timeout > Date.now()) {
        try {
            const actualValue = await func();
            expect(actualValue).toEqual(expectedValue);
            console.warn(`Assertion succeeded after ${Date.now() - startedAt} ms`);
            return;
        } catch (err: unknown) {
            error = err instanceof Error ? err : new Error(`Unknown  error`);
            console.warn(`Assert failed, re-trying`, err);
            await sleep(100);
        }
    }
    console.warn(`Assertion failed after ${Date.now() - startedAt} ms`);
    throw error;
};

/**
 * Helper to get item
 * @param url
 * @param key
 */
export async function getItem(url: string, key: string): Promise<unknown> {
    const getUrl = `${url}/${key}`;
    const response = await axios.get(getUrl, { timeout: 100 });
    return response.data;
}

/**
 * Helper to put item
 * @param url
 * @param key
 */
export async function putItem(url: string, key: string, obj: unknown, ttl?: number): Promise<unknown> {
    const putUrl = `${url}/${key}${ttl ? '/' + ttl : ''}`;
    const response = await axios.post(putUrl, obj, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 100,
    });
    return response.data;
}

/**
 * Helper to get server stats
 * @param url
 */
export async function getHealth(url: string): Promise<unknown> {
    const response = await axios.get(url, { timeout: 100 });
    return response.data;
}
