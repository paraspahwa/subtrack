import { createClient } from 'npm:@insforge/sdk';

export default async function (req: Request): Promise<Response> {
  return new Response("Hello with Import", { status: 200 });
}
