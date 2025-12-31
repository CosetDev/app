"use client";

import { useMemo } from "react";

export function StepIndicator({ active }: { active: number }) {
    const steps = useMemo(() => ["Oracle Details", "API Verification", "Deployment"], []);

    return (
        <ol className="steps-container w-full flex flex-col gap-3 justify-between sm:flex-row sm:items-center sm:gap-6">
            {steps.map((label, index) => {
                const position = index + 1;
                const isActive = position === active;
                const isComplete = position < active;
                return (
                    <li key={label} className="flex items-start gap-2 sm:items-center">
                        <span
                            className={`flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : isComplete
                                      ? "border-green-600 bg-green-500 text-white"
                                      : "border-gray-300 bg-white text-gray-500"
                            }`}
                        >
                            {position}
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{label}</p>
                            <p className="hidden text-xs text-gray-500 sm:block">
                                {isComplete ? "Completed" : isActive ? "In progress" : "Pending"}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
