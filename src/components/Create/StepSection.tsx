"use client";

import type { ReactNode } from "react";

type StepProps = {
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
};

export function StepSection({ title, description, children, footer }: StepProps) {
    return (
        <section className="rounded-xl border bg-white/70 p-6 backdrop-blur">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{description}</p>
            </div>

            <div className="mt-6 space-y-4">{children}</div>

            {footer ? <div className="mt-6 flex flex-wrap gap-3">{footer}</div> : null}
        </section>
    );
}
