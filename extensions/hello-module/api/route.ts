type HelloModuleResponse = {
  ok: boolean;
  module: string;
  message: string;
};

export async function GET() {
  const payload: HelloModuleResponse = {
    ok: true,
    module: 'hello-module',
    message: 'Hello from the reference module API.',
  };
  return Response.json(payload);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!name) {
    return Response.json({ error: 'Field "name" is required.' }, { status: 400 });
  }

  return Response.json({ data: { greeting: `Hello, ${name}.` } });
}
