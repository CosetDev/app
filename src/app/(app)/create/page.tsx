"use client";

import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import {
    EndpointVerification,
    OracleDeployment,
    OracleInfoForm,
    StepIndicator,
} from "@/components/Create";
import { fetchWithWallet } from "@/lib/web3";
import type { OracleDraft } from "@/components/Create";

import "./create.scss";

export default function Create() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { ready } = usePrivy();

    const initialOracleId = useMemo(() => searchParams.get("oracle"), [searchParams]);
    const initialStep = useMemo(() => {
        const stepParam = Number(searchParams.get("step"));
        const isRedirected = initialOracleId && (stepParam === 2 || stepParam === 3);
        return isRedirected ? stepParam : 1;
    }, [initialOracleId, searchParams]);

    const [step, setStepInternal] = useState(initialStep);
    const [id, setID] = useState<string | null>(initialOracleId);
    const [data, setData] = useState<OracleDraft>({
        name: "",
        description: "",
        endpoint: "",
        price: "",
        duration: "",
    });

    const setStep = useCallback(
        (newStep: number) => {
            setStepInternal(newStep);
            const params = new URLSearchParams(window.location.search);
            params.set("step", newStep.toString());
            if (id) {
                params.set("oracle", id);
            } else {
                params.delete("oracle");
            }
            const newUrl = `${pathname}?${params.toString()}`;
            router.replace(newUrl);
        },
        [pathname, router, id],
    );

    const handleChange = (field: keyof OracleDraft, value: string | number) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const preloadOracle = useCallback(
        async (oracleId: string, stepParam?: number) => {
            try {
                const response = await fetchWithWallet(`/api/oracle/${oracleId}`);
                const body = await response.json();

                if (!response.ok) {
                    toast.error(body?.message || "Unable to load oracle data");
                    return;
                }

                setData({
                    name: body.name || "",
                    description: body.description || "",
                    endpoint: typeof body.api?.url === "string" ? body.api.url : "",
                    price: body.requestPrice?.toString() || "",
                    duration: body.recommendedUpdateDuration?.toString() || "",
                });

                if (stepParam === 2 || stepParam === 3) {
                    setStep(stepParam);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to preload oracle";
                toast.error(message);
            }
        },
        [setStep],
    );

    useEffect(() => {
        if (!initialOracleId || !ready) return;
        void (async () => {
            await preloadOracle(initialOracleId, initialStep);
        })();
    }, [ready, initialOracleId, initialStep, preloadOracle]);

    return (
        <div
            id="create"
            className="mx-auto max-w-4xl space-y-6 p-6 md:p-10 flex flex-col h-full"
        >
            <div className="space-y-0.5 max-md:-mt-10">
                <h1 className="text-2xl font-bold text-gray-900">Create a new oracle</h1>
                <p className="text-sm text-gray-600">
                    Fill the details, verify the endpoint, and finalize deployment in three simple
                    steps.
                </p>
            </div>

            <StepIndicator active={step} />

            {step === 1 && (
                <OracleInfoForm
                    setID={setID}
                    data={data}
                    onChange={handleChange}
                    onPrefill={setData}
                    onNext={() => setStep(2)}
                />
            )}

            {step === 2 && id && (
                <EndpointVerification
                    endpoint={data.endpoint}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                    id={id}
                />
            )}

            {step === 3 && id && <OracleDeployment onBack={() => setStep(2)} id={id} />}
        </div>
    );
}
