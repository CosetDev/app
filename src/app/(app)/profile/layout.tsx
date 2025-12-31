import ProfileNavbar from "@/components/Profile/Navbar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ProfileNavbar />
            <div>{children}</div>
        </>
    );
}
