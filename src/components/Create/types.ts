export type OracleDraft = {
    name: string;
    description: string;
    endpoint: string;
    price: string;
    duration: string;
};

export type TransferAuthorizationTypes = Record<string, { name: string; type: string }[]>;

export type TransferAuthorizationPayload = {
    domain: {
        name: string;
        version: string;
        verifyingContract: string;
        chainId: number;
    };
    types: TransferAuthorizationTypes;
    nonce: string;
    message: {
        from: string;
        to: string;
        value: string;
        validAfter: number;
        validBefore: number;
        nonce: string;
    };
    primaryType: string;
};
