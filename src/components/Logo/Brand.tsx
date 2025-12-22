import Logo from ".";
import Link from "next/link";

export default function Brand({ size }: { size: number }) {
    return (
        <Link href="/" className="flex items-center gap-1.5 w-fit">
            <Logo size={size} />
            <h1 className="text-3xl font-bold font-figtree mb-1">coset</h1>
        </Link>
    )
}