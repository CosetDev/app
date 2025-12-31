"use client";

import type { FormEvent } from "react";
import { toast } from "sonner";

import { fetchWithWallet } from "@/lib/web3";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { OracleDraft } from "./types";

type OracleInfoFormProps = {
    data: OracleDraft;
    onChange: (field: keyof OracleDraft, value: string | number) => void;
    onNext: () => void;
    setID: React.Dispatch<React.SetStateAction<string | null>>;
    onPrefill?: (draft: OracleDraft) => void;
};

export function OracleInfoForm({ data, onChange, onNext, setID, onPrefill }: OracleInfoFormProps) {
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const response = await fetchWithWallet("/api/oracle/create", {
            method: "POST",
            body: JSON.stringify(data),
        });

        const body = await response.json();

        if (!response.ok) {
            toast.error(body.message);
            return;
        }

        if (body?.oracle && onPrefill) {
            onPrefill({
                name: body.oracle.name ?? data.name,
                description: body.oracle.description ?? data.description,
                endpoint: body.oracle.endpoint ?? data.endpoint,
                price: body.oracle.price?.toString?.() ?? data.price,
                duration: body.oracle.duration?.toString?.() ?? data.duration,
            });
        }

        setID(body.id);
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="oracle-name">Oracle Name</Label>
                    <Input
                        id="oracle-name"
                        name="name"
                        maxLength={64}
                        value={data.name}
                        onChange={e => onChange("name", e.target.value)}
                        placeholder="Weather Oracle"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="oracle-price">Data Update Price</Label>
                    <Input
                        id="oracle-price"
                        name="price"
                        type="number"
                        min="0"
                        value={data.price}
                        onChange={e => onChange("price", parseFloat(e.target.value))}
                        placeholder="10"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="oracle-description">Oracle Description</Label>
                <textarea
                    id="oracle-description"
                    name="description"
                    maxLength={1024}
                    value={data.description}
                    onChange={e => onChange("description", e.target.value)}
                    className="min-h-[90px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    placeholder="Describe what your oracle provides..."
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="oracle-endpoint">API Endpoint</Label>
                <Input
                    id="oracle-endpoint"
                    name="endpoint"
                    type="url"
                    maxLength={256}
                    value={data.endpoint}
                    onChange={e => onChange("endpoint", e.target.value)}
                    placeholder="https://api.example.com/oracle"
                    required
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="oracle-duration">
                        Recommended Update Duration (ms){" "}
                        <span className="text-gray-500">(optional)</span>
                    </Label>
                    <Input
                        id="oracle-duration"
                        name="duration"
                        type="number"
                        min="0"
                        step="1"
                        value={data.duration}
                        onChange={e => onChange("duration", parseInt(e.target.value))}
                        placeholder="60000"
                    />
                </div>
            </div>

            <div className="pt-2 flex justify-end">
                <Button type="submit" className="w-full md:w-auto">
                    Continue to verification
                </Button>
            </div>
        </form>
    );
}
