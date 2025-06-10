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
  const SUILINK_REGISTRY_V2_ID = "0xb32de9a15b891ca6d6493e2929e7bafedf575545d8d9233596584bbebe3423a9";

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  // Client
  const client = new SuiClient({
    url: FULLNODE,
  });

  const packageId = PACKAGE_ID;
  const registry = SUILINK_REGISTRY_ID;
  const moduleName = "ethereum";

  const fromHexString = (hexString: string) => {
    if (hexString !== null) {
      return Uint8Array.from(
        hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );
    }
  };

  const hexString = "57e97fbf43b221bbf0e40c018bd8b15f5e337768e7a1b12b309ab2e07cf0ae6f73afde279c0cd171014ab5f0e7896064f59b8157c241920fc11cfb2dcdabc13a1b";
  const byteArray = fromHexString(hexString);
  console.log(byteArray);

  let transactionBlock = new Transaction();

  transactionBlock.moveCall({
    target: `${packageId}::${moduleName}::link_v3`,
    arguments: [
      transactionBlock.object(SUILINK_REGISTRY_V2_ID), // registry: &mut SuiLinkRegistry
      transactionBlock.pure(bcs.vector(bcs.U8).serialize(byteArray!)), // signature: vector<u8>
      transactionBlock.object(SUI_CLOCK_OBJECT_ID), // clock: &Clock
      transactionBlock.pure.string("0x70925e1d31b0c8a32fee1c8f55d6ff519849c443"),
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
