import express from 'express';
import http from 'http';
import KVStore from './kvStore';
import { GetResponse, InvalidRequestError, PutResponse } from './types';
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

    private registerRoutes() {
        this.app.use(express.json());
        this.app.use((_req, res, next) => {
            res.header('Content-Type', 'application/json');
            next();
        });

        this.app.route('/kv/v1/get/:key').get((req, res) => {
            const getResp: GetResponse = {
                data: this.store.get(req.params.key) || null,
            };
            res.json(getResp);
        });

        this.app.route('/kv/v1/put/:key').post((req, res) => {
            const putResp: PutResponse = {
                result: this.store.set(req.params.key, req.body),
            };
            res.json(putResp);
        });

        this.app.route('/kv/v1/put/:key/:ttl').post((req, res) => {
            const ttl = Number(req.params.ttl);

            if (isNaN(ttl)) {
                const errResp: InvalidRequestError = {
                    code: 400,
                    error: `Invalid request`,
                    message: `ttl parameter must be a number`,
                };
                res.status(400).json(errResp);
            }

            const putResp: PutResponse = {
                result: this.store.set(req.params.key, req.body, ttl),
            };
            res.json(putResp);
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

    public stop() {
        this.server?.close();
    }

    public getInstance() {
        return this.app;
    }
}

export default KVServer;
