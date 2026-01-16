import "server-only";
import { headers } from "next/headers";
import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

export async function getUser(idToken: string | null) {
    if (!idToken) return null;
    try {
        const user = await privy.getUser({ idToken });
        return { wallet: user.wallet!.address, id: user.id, email: user.email?.address };
    } catch {
        return null;
    }
}

export async function getIdTokenFromHeaders(headers_?: Headers): Promise<string | null> {
    if (!headers_) headers_ = await headers();
    return headers_.get("privy-id-token");
}
