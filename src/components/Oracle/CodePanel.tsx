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

import type { LanguageKey } from "./types";
import { languageLabels } from "./constants";

export function CodePanel({
    language,
    code,
    onLanguageChange,
    loading,
}: {
    language: LanguageKey;
    code: string;
    onLanguageChange: (value: LanguageKey) => void;
    loading: boolean;
}) {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        toast.success("Code copied");
    };

    return (
        <div className="flex flex-col gap-4 lg:flex-row">
            <div className="hidden w-1/2 lg:block" aria-hidden />

            <div className="relative w-full lg:w-1/2">
                <div className="absolute right-2 top-2 flex flex-row-reverse items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-white! rounded-xs text-xs">
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
                            {(Object.keys(languageLabels) as LanguageKey[]).map(key => (
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
            </div>
        </div>
    );
}

