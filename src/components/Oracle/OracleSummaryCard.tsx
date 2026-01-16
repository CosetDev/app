import Image from "next/image";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supportedNetworks } from "@/lib/networks";

import type { OraclePublic } from "./types";
import { formatCurrency } from "./utils";
import { SummaryTile } from "./SummaryTile";

export function OracleSummaryCard({
    oracle,
    loading,
}: {
    oracle: OraclePublic | null;
    loading: boolean;
}) {
    return (
        <Card className="border bg-white/80">
            <CardHeader className="pb-1">
                <CardTitle className="text-xl text-gray-900">
                    <span className="inline-flex items-center gap-2">
                        {loading && <Loader2 className="size-4 animate-spin text-gray-500" />}
                        {oracle?.name || "Oracle"}
                    </span>
                </CardTitle>
                <p className="text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2">
                        {loading && <Loader2 className="size-4 animate-spin text-gray-500" />}
                        {oracle?.description || "Public oracle information"}
                    </span>
                </p>
            </CardHeader>
            <CardContent>
                <small className="text-xs font-semibold text-gray-700">Oracle Address</small>
                <div className="mb-4 flex items-center space-x-2">
                    <div className="relative w-full">
                        <Input value={loading ? "" : (oracle?.address || "--")} readOnly className="pr-10" />
                        {loading && (
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="size-4 animate-spin text-gray-500" />
                            </div>
                        )}
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={loading || !oracle?.address}
                        onClick={() => {
                            if (oracle?.address) {
                                navigator.clipboard.writeText(oracle.address);
                                toast.success("Address copied");
                            }
                        }}
                    >
                        <Copy />
                    </Button>
                </div>
                <small className="text-xs font-semibold text-gray-700">Details</small>
                <div className="flex gap-3 flex-wrap">
                    <SummaryTile
                        title="Update price"
                        loading={loading}
                        value={<span className="text-primary font-semibold">{formatCurrency(oracle?.requestPrice)}</span>}
                    />
                    {oracle?.recommendedUpdateDuration && (
                        <SummaryTile
                            title="Update interval"
                            loading={loading}
                            value={`${oracle.recommendedUpdateDuration} secs`}
                        />
                    )}
                    <SummaryTile
                        title="Network"
                        loading={loading}
                        value={
                            <div className="flex items-center gap-2">
                                {oracle?.network && (
                                    <Image
                                        src={supportedNetworks[oracle.network].icon || ""}
                                        alt=""
                                        className="h-4 w-4"
                                        width={32}
                                        height={32}
                                    />
                                )}
                                {supportedNetworks[oracle?.network || ""]?.name || "--"}
                            </div>
                        }
                    />
                    <SummaryTile title="Owner" loading={loading} value={oracle?.owner || "--"} />
                </div>
            </CardContent>
        </Card>
    );
}

