import type { TabKey } from "./types";
import { TabButton } from "./TabButton";

export function OracleTabs({
    tab,
    onTabChange,
}: {
    tab: TabKey;
    onTabChange: (value: TabKey) => void;
}) {
    return (
        <nav className="flex border-b border-border">
            <TabButton label="Run" active={tab === "code"} onClick={() => onTabChange("code")} />
            <TabButton
                label="Statistics"
                active={tab === "stats"}
                onClick={() => onTabChange("stats")}
            />
        </nav>
    );
}

