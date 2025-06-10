import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import * as dotenv from "dotenv";
import { bcs } from "@mysten/sui/bcs";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE = "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x73181a56a5097e298c2a725f1ce71cd41d118a946c5c59439a7bcda01a569d27";
  const SUILINK_REGISTRY_ID = "0xf7a55d83e961a3078b240cedb4a9c61a34a85ce44c840fba0636f43ffa0608c3";
  const SUILINK_REGISTRY_V2_ID="0xb32de9a15b891ca6d6493e2929e7bafedf575545d8d9233596584bbebe3423a9";

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  // Client
  const client = new SuiClient({
    url: FULLNODE,
  });

  const packageId = PACKAGE_ID;
  const registry = SUILINK_REGISTRY_ID;
  const moduleName = "solana";

  const signature = [
    96, 210, 10, 51, 3, 68, 238, 68, 220, 24, 177, 117, 5, 54, 22, 160, 186, 68,
    173, 218, 229, 238, 83, 88, 8, 189, 9, 139, 199, 211, 70, 61, 64, 13, 81,
    140, 189, 102, 86, 46, 114, 18, 103, 209, 76, 75, 90, 16, 67, 190, 74, 121,
    196, 230, 60, 247, 59, 200, 14, 101, 180, 216, 79, 0,
  ];
  const public_key = [
    100, 177, 129, 138, 95, 191, 78, 10, 29, 240, 216, 216, 21, 110, 20, 92,
    223, 6, 82, 166, 11, 244, 106, 71, 26, 109, 25, 131, 64, 141, 165, 135,
  ];

  let transactionBlock = new Transaction();

  transactionBlock.moveCall({
    target: `${packageId}::${moduleName}::link_v2`,
    arguments: [
      transactionBlock.object(SUILINK_REGISTRY_V2_ID), // registry: &mut SuiLinkRegistry
      transactionBlock.pure(bcs.vector(bcs.U8).serialize(signature)), // signature: vector<u8>
      transactionBlock.object(SUI_CLOCK_OBJECT_ID), // clock: &Clock
      transactionBlock.pure(bcs.vector(bcs.U8).serialize(public_key)), // public_key: vector<u8>
    ],
  });

  transactionBlock.setGasBudget(100000000);

  try {
    await client.signAndExecuteTransaction({
      transaction: transactionBlock,
      signer: keypair,
    });
  } catch (e) {
    console.error(e);
  }
})();
