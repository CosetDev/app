export function GET() {
    const oneUsdcInCst = 2;
    return new Response(
        JSON.stringify(oneUsdcInCst),
        { status: 200 },
    );
}
