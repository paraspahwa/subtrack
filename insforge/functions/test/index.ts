export default async function (req: Request): Promise<Response> {
  return new Response("Hello World", { status: 200 });
}
