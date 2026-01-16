import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Iridescence from "@/components/ui/Iridescence";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { fetchWithWallet } from "@/lib/web3";

export default function WaitListButton() {
    const { user, login } = usePrivy();
    const [email, setEmail] = useState("");
    const closeRef = useRef<HTMLButtonElement>(null);
    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter an email address");
            return;
        }
        const wallet = user?.wallet?.address || "";
        if (!wallet) {
            toast.error("Please connect your wallet");
            return;
        }

        const response = await fetchWithWallet("/api/wait-list", {
            method: "POST",
            body: JSON.stringify({
                email,
                wallet,
            }),
        });

        const body = await response.json();

        if (!response.ok) {
            toast.error(body.message);
            return;
        }

        setEmail("");
        closeRef.current?.click();
        toast.success("Successfully joined the waitlist!");
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative h-40 w-full rounded-lg cursor-pointer">
                    <Iridescence
                        color={[1, 71 / 255, 18 / 255]}
                        mouseReact={false}
                        amplitude={0.1}
                        speed={1.8}
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 w-full text-center">
                        <p className="text-center text-sm text-white">JOIN THE</p>
                        <h2 className="font-figtree text-2xl font-bold text-white">WAITLIST</h2>
                        <p className="text-center text-sm text-white">FOR</p>
                        <h2 className="font-figtree text-2xl font-bold text-white">AIRDROP</h2>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Join Waitlist</DialogTitle>
                        <DialogDescription>
                            Stay updated with the latest news and be the first to know about
                            exciting opportunities.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="contact@coset.dev"
                                required={true}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button ref={closeRef} variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        {user?.wallet ? (
                            <Button type="submit">Submit</Button>
                        ) : (
                            <Button type="button" onClick={login} className="text-xs h-8">
                                Connect wallet
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
