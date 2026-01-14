import { cn } from "@/lib/utils";

export function TabButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex items-center justify-between px-6 py-3 text-sm font-medium",
                active && "border-b border-primary",
            )}
        >
            <span
                className={cn(
                    "text-[12px] font-medium group-hover:text-black",
                    active && "text-primary!",
                )}
            >
                {label}
            </span>
        </button>
    );
}

