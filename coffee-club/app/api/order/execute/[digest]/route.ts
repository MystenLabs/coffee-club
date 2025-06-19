import { enokiClient } from "@/app/api/clients";
import { NextResponse } from "next/server";
import { z } from "zod";

const ExecuteRequest = z.object({
  signature: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: { digest: string } }
) {
  const { digest } = params;

  const body = await request.json();
  const parsed = ExecuteRequest.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const data = await enokiClient.executeSponsoredTransaction({
      digest: digest,
      signature: parsed.data.signature,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to execute transaction" },
      { status: 500 }
    );
  }
}
