import { NextResponse } from "next/server";
import { z } from "zod";

import { enokiClient } from "../../clients";

const SponsorRequest = z.object({
  network: z.union([z.literal("mainnet"), z.literal("testnet")]),
  sender: z.string(),
  transactionKindBytes: z.string(),
  allowedMoveCallTargets: z.array(z.string()),
  allowedAddresses: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = SponsorRequest.parse(body);

    const data = await enokiClient.createSponsoredTransaction({
      ...payload,
      transactionKindBytes: payload.transactionKindBytes,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to sponsor transaction" },
      { status: 500 }
    );
  }
}
