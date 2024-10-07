/**
 * Await for specified amount of time
 * @param timeout in milliseceonds
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
