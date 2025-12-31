import Image from "next/image";

export default function Logo({ size = 32 }: { size?: number }) {
    return <Image src="/logo.svg" alt="Coset Logo" width={size} height={size} quality={100} />;
}
