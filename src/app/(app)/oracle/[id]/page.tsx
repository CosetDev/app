"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
    CodePanel,
    OracleSummaryCard,
    OracleTabs,
    StatsPanel,
    buildCodeSample,
    type LanguageKey,
    type OraclePublic,
    type TabKey,
} from "@/components/Oracle";

export default function OraclePage() {
    const params = useParams<{ id?: string }>();
    const oracleId = useMemo(() => (params?.id as string) || "", [params]);

    const [tab, setTab] = useState<TabKey>("code");
    const [language, setLanguage] = useState<LanguageKey>("javascript");
    const [oracle, setOracle] = useState<OraclePublic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!oracleId) return;

        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/oracle/${oracleId}/public`);
                const body = await response.json();
                if (!response.ok) throw new Error(body?.message || "Failed to load oracle");

                setOracle({
                    id: body.id,
                    name: body.name,
                    description: body.description,
                    requestPrice: body.requestPrice,
                    recommendedUpdateDuration: body.recommendedUpdateDuration ?? null,
                    network: body.network ?? null,
                    owner: body.owner,
                    address: body.address ?? null,
                    earningsSeries: body.earningsSeries ?? [],
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load oracle";
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [oracleId]);

    const codeSample = useMemo(() => buildCodeSample(language, oracle), [language, oracle]);

    return (
        <div className="space-y-6">
            <OracleSummaryCard oracle={oracle} loading={loading} />

            <OracleTabs tab={tab} onTabChange={setTab} />

            {tab === "code" ? (
                <CodePanel language={language} code={codeSample} onLanguageChange={setLanguage} loading={loading} />
            ) : (
                <StatsPanel earningsSeries={oracle?.earningsSeries || []} loading={loading} />
            )}
        </div>
    );
}
