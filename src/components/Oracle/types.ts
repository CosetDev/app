export type TabKey = "code" | "stats";

export type LanguageKey = "javascript" | "python" | "curl";

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
};

