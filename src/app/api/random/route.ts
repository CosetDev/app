import dummyJson from "dummy-json";

export function GET() {
    const template = `{
        "name": "{{firstName}}",
        "age": "{{int 18 65}}"
    }`;

    return new Response(dummyJson.parse(template), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
