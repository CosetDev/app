export type TabKey = "code" | "stats";

export type EarningsPoint = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

export type OraclePublic = {
    id: string;
    name: string;
    description: string;
    requestPrice: number;
    recommendedUpdateDuration: number | null;
    network: string | null;
    owner: string;
    address: string | null;
    earningsSeries: EarningsPoint[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oracleData: any;
};

