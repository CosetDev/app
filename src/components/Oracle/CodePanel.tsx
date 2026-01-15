"use client";

import Image from "next/image";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { languageLabels } from "./constants";

export function CodePanel({
    language,
    code,
    onLanguageChange,
    loading,
    oracleData,
}: {
    language: string;
    code: string;
    onLanguageChange: (value: string) => void;
    loading: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oracleData: any;
}) {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        toast.success("Code copied");
    };

    return (
        <div className="flex flex-col gap-4 lg:flex-row">
            <div className="hidden w-1/2 lg:block">
                <p>
                    To interact with this oracle, you can use{" "}
                    <a
                        href="https://docs.coset.dev/sdk/getting-started"
                        className="text-primary"
                        target="_blank"
                    >
                        Coset SDK
                    </a>
                    . Every public oracle on Coset can be read without permissions or fees. If you
                    need fresh data, you need to call an update request and pay the update fee.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                    <h3 className="font-semibold">Current Data</h3>
                    <div className="w-full flex rounded-sm border p-4">
                        <pre>{JSON.stringify(oracleData, null, 2)}</pre>
                    </div>
                </div>
            </div>
            <div className="relative w-full lg:w-1/2">
                <div className="absolute right-2 top-2 flex flex-row-reverse items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-white! rounded-xs text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={`/tech/${language.toLowerCase()}.svg`}
                                        alt={languageLabels[language]}
                                        width={16}
                                        height={16}
                                    />
                                    {languageLabels[language]}
                                </div>
                                <ChevronDown className="ml-4 size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="rounded-xs p-0.5 w-[var(--radix-dropdown-menu-trigger-width)]"
                            align="end"
                        >
                            {(Object.keys(languageLabels) as string[]).map(key => (
                                <DropdownMenuItem key={key} onSelect={() => onLanguageChange(key)}>
                                    <Image
                                        src={`/tech/${key.toLowerCase()}.svg`}
                                        alt={languageLabels[key]}
                                        width={16}
                                        height={16}
                                    />
                                    {languageLabels[key]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={loading}>
                        <Copy className="text-white size-4" />
                    </Button>
                </div>

                <div className="rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                        {code}
                    </pre>
                </div>
                {language === "javascript" && (
                    <div className="flex flex-col gap-1">
                        <p className="mt-4 text-sm">Install Coset SDK using:</p>
                        <pre className="relative rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                            <code>npm install @coset-dev/sdk</code>
                            <Button
                                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                    await navigator.clipboard.writeText(
                                        "npm install @coset-dev/sdk",
                                    );
                                    toast.success("Code copied");
                                }}
                                disabled={loading}
                            >
                                <Copy className="text-white size-4" />
                            </Button>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
