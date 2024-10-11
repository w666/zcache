import axios from 'axios';

/**
 * Await for specified amount of time
 * @param timeout in milliseconds
 */
export const sleep = async (timeout: number) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
};

/**
 * Retry to execute function within specified timeout, exit on success
 * @param func function to execute
 * @param timeout timeout in millisecinds
 * @returns
 */
export const retry = async (func: () => void, timeout = 1000) => {
    const startedAt = Date.now();
    let error: Error = new Error(`Retry did not run`);
    while (startedAt + timeout > Date.now()) {
        try {
            func();
            console.warn(`Assertion succeeded after ${Date.now() - startedAt} ms`);
            return;
        } catch (err: unknown) {
            error = err instanceof Error ? err : new Error(`Unknow  error`);
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
    const putUrl = `${url}/${key}`;
    const response = await axios.get(putUrl);
    return response.data;
}

/**
 * Helper to put item
 * @param url
 * @param key
 * @param obj
 * @param ttl in milliseconds
 */
export async function putItem(url: string, key: string, obj: unknown, ttl?: number): Promise<unknown> {
    const putUrl = `${url}/${key}${ttl ? '/' + ttl : ''}`;
    const response = await axios.post(putUrl, obj, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
    });
    return response.data;
}
