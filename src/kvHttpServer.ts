import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import KVStore from './kvStore';
import { GetResponse, InvalidRequestError, PutResponse, Stats } from './types';
import { AddressInfo } from 'net';

class KVServer {
    private port: number;
    private app;
    private server: http.Server | null;
    private store: KVStore;

    constructor(maxStorageSize = 1000000, defaultTTL = 60000, port = 8080) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.store = new KVStore(maxStorageSize, defaultTTL);
    }

    private handlePutResponse(res: Response, putRes: PutResponse) {
        if (putRes.putResult) {
            console.log(`return 1`);
            res.status(201).json(putRes);
            return;
        }
        console.log(`return 2`);
        res.status(432).json(putRes);
    }

    private registerRoutes() {
        this.app.use(express.json());
        this.app.use((_req: Request, res: Response, next: NextFunction) => {
            res.header('Content-Type', 'application/json');
            next();
        });

        this.app.route('/kv/v1/health').get((_req: Request, res: Response) => {
            const healthResp: Stats = {
                defaultTTL: this.store.getDefaultTTL(),
                maxStorageSize: this.store.getMaxStorageSize(),
                storageUsed: this.store.getSize(),
            };
            res.json(healthResp);
        });

        this.app.route('/kv/v1/get/:key').get((req: Request, res: Response) => {
            const key = req.params['key'];

            if (!key) {
                const errResp: InvalidRequestError = {
                    error: `Invalid request`,
                    message: `key must be string or number`,
                };
                res.status(400).json(errResp);
                return;
            }

            const getResp: GetResponse = {
                data: this.store.get(key) || null,
            };
            if (getResp.data) {
                res.status(200).json(getResp);
                return;
            }
            res.status(200).json(getResp);
            res.json(getResp);
        });

        this.app.route('/kv/v1/put/:key').post((req, res: Response) => {
            const putResp: PutResponse = {
                putResult: this.store.set(req.params.key, req.body),
            };
            this.handlePutResponse(res, putResp);
        });

        this.app.route('/kv/v1/put/:key/:ttl').post((req, res: Response) => {
            const ttl = Number(req.params.ttl);

            if (isNaN(ttl)) {
                const errResp: InvalidRequestError = {
                    error: `Invalid request`,
                    message: `ttl parameter must be a number`,
                };
                res.status(400).json(errResp);
            }

            const putResp: PutResponse = {
                putResult: this.store.set(req.params.key, req.body, ttl),
            };

            this.handlePutResponse(res, putResp);
        });
    }

    public start() {
        this.registerRoutes();
        this.server = this.app.listen(this.port);
        console.log(
            `Server version ${process.env['npm_package_version']} started on port ${
                (this.server.address() as AddressInfo)?.port
            }`,
        );
    }

    public async stop() {
        if (this.server) {
            let isClosed = false;

            this.server.close((err: unknown) => {
                if (err) {
                    console.log(`Failed to stop server`, err);
                }
                isClosed = true;
            });

            const waitUntil = Date.now() + 5000;
            while (waitUntil > Date.now() && !isClosed) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
    }

    public getInstance() {
        return this.app;
    }
}

export default KVServer;
