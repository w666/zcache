type StorageData = {
    expireAt: number;
    data: unknown;
};

class KVStore {
    private store: Map<string | number, StorageData>;
    private maxStorageSize: number;
    private defaultTTL: number;

    constructor(maxStorageSize = 1000000, defaultTTL = 60000) {
        this.maxStorageSize = maxStorageSize;
        this.defaultTTL = defaultTTL;
        this.store = new Map();
    }

    public cleanUp = () => {
        const timeNow = Date.now();
        const keys = this.store.keys();
        for (const key of keys) {
            const v = this.store.get(key);
            if (v && v.expireAt < timeNow) {
                this.delete(key);
            }
        }
    };

    public get(key: string | number): unknown {
        return this.store.get(key)?.data;
    }

    public set(key: string | number, value: unknown, ttl?: number): boolean {
        if (typeof key !== 'string' && typeof key !== 'number') {
            console.error(`Invalid key type '${typeof key}', must be string or number`);
            return false;
        }

        const timeNow = Date.now();
        if (this.store.has(key)) {
            const i = this.store.get(key);
            if (i && i.expireAt > timeNow) {
                console.debug(`Can't replace key '${key}', it will expire in ${i.expireAt - timeNow} ms`);
                return false;
            }

            this.replace(key, value, timeNow, ttl);
            return true;
        }

        if (this.store.size >= this.maxStorageSize) {
            console.warn(`Storage is full (${this.store.size})), cleaning up`);
            this.cleanUp();

            if (this.store.size >= this.maxStorageSize) {
                console.warn(`Storage is full after cleanup (${this.store.size}), can't add more items`);
                return false;
            }
        }

        this.replace(key, value, timeNow, ttl);

        return true;
    }

    private replace(key: string | number, value: unknown, timeNow: number, ttl?: number): void {
        this.store.set(key, {
            expireAt: timeNow + (ttl || this.defaultTTL),
            data: value,
        });
    }

    public delete(key: string | number): boolean {
        return this.store.delete(key);
    }

    public getSize(): number {
        return this.store.size;
    }
}

export default KVStore;
