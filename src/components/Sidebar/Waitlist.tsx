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

export function WaitlistButton() {
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
                <DialogHeader>
                    <DialogTitle>Join Waitlist</DialogTitle>
                    <DialogDescription>
                        Stay updated with the latest news and be the first to know about exciting
                        opportunities.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" placeholder="contact@coset.dev" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Submit</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
