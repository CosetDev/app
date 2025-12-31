import { getIdentityToken } from "@privy-io/react-auth";

let identityToken: string | null = null;
let identityTokenPromise: Promise<string | null> | null = null;

async function resolveIdentityToken() {
    if (identityToken) return identityToken;
    if (!identityTokenPromise) {
        identityTokenPromise = getIdentityToken()
            .then(token => {
                identityToken = token || null;
                return identityToken;
            })
            .finally(() => {
                identityTokenPromise = null;
            });
    }

    return identityTokenPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchWithWallet(url: string, options?: any) {
    const token = await resolveIdentityToken();

    const headers = {
        ...options?.headers,
        "privy-id-token": token || "",
    };

    return fetch(url, { ...options, headers });
}
