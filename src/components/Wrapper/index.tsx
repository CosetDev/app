import WalletWrapper from "./Wallet";
import { Toaster } from "@/components/ui/sonner";

export default function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <WalletWrapper>
                {children}
            </WalletWrapper>
            <Toaster expand richColors />
        </>
    );
}
