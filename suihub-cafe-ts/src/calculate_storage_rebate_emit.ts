import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const phrase = process.env.ADMIN_PHRASE;
  const keypair = Ed25519Keypair.deriveKeypair(phrase!);

  // Client
  const fullnode = process.env.FULLNODE!;
  const client = new SuiClient({
    url: fullnode,
  });

  const packageId = process.env.PACKAGE_ID;
  const suilink =
    "0x604a3523a00eb25e0aeadf35768c44d44322c017126db6b60c294de90b18fd40"!;

  let transactionBlock = new Transaction();

  transactionBlock.moveCall({
    target: `${packageId}::utils::calculate_storage_rebate_emit`,
    arguments: [
      transactionBlock.object(suilink),
      transactionBlock.pure.u64(15200),
    ],
    typeArguments: [`${packageId}::solana::Solana`],
  });

  try {
    await client.signAndExecuteTransaction({
      transaction: transactionBlock,
      signer: keypair,
    });
  } catch (e) {
    console.error(e);
  }
})();
