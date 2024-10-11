export type GetResponse = {
    data: unknown;
};

export type PutResponse = {
    result: boolean;
};

export type InvalidRequestError = {
    code: 400;
    error: string;
    message: string;
};
