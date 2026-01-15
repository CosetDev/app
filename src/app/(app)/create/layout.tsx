import { Suspense } from "react";

export default function CreateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <Suspense>{children}</Suspense>;
}
