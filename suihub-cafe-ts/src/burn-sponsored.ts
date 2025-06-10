import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { EnokiClient } from "@mysten/enoki";
import { fromB64, toB64 } from "@mysten/sui/utils";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE = "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x5e74ed009c121e64cf98e2883d6de4837b551c47b4e4024d9d9ca35223fd7eac";
  const SUILINK_REGISTRY_ID = "0xac15747c44a84bb6eaf13458d90bcb08fd3d9352ee0a55382fd1a279188d3449";
  const SUILINK_REGISTRY_V2_ID="0x68f41f670878efac9539fd959cfb808a107d1a3eaad503c81be10c5552bc74f4"

  const enokiClient = new EnokiClient({
    apiKey: ENOKI_SECRET_KEY,
  });

  console.log(ENOKI_SECRET_KEY);

  const phrase = ADMIN_PHRASE;
  console.log(ADMIN_PHRASE!);
  const keypair = Ed25519Keypair.deriveKeypair(phrase!);

  // Client
  const fullnode = FULLNODE!;
  console.log(FULLNODE!);
  const client = new SuiClient({
    url: fullnode,
  });

  const packageId = PACKAGE_ID;
  console.log(PACKAGE_ID!);
  const registryV2 = SUILINK_REGISTRY_V2_ID!;
  console.log(SUILINK_REGISTRY_V2_ID!);
  const moduleName = "registry_v2";

  let transactionBlock = new Transaction();

  transactionBlock.moveCall({
    target: `${packageId}::${moduleName}::burn`,
    arguments: [
      transactionBlock.object(registryV2), // registry: &mut SuiLinkRegistry
      transactionBlock.object(
        "0xc9320aef89a4bbe52f0bbc1cc06aeb7504476ec0dee60c06421ba7b0da0d23ac"
      ), // suilink: SuiLink<T>
      transactionBlock.pure.u32(1), // network: u32
    ],
    typeArguments: [`${packageId}::solana::Solana`],
  });

  const txBytes = await transactionBlock.build({
    client,
    onlyTransactionKind: true,
  });

  const sponsored = await enokiClient.createSponsoredTransaction({
    network: "testnet",
    transactionKindBytes: toB64(txBytes),
    sender: keypair.toSuiAddress(),
    allowedMoveCallTargets: [`${packageId}::${moduleName}::burn`],
    allowedAddresses: [keypair.toSuiAddress()],
  });

  const { signature } = await keypair.signTransaction(fromB64(sponsored.bytes));
  try {
    await enokiClient.executeSponsoredTransaction({
      digest: sponsored.digest,
      signature,
    });
  } catch (e) {
    console.error(e);
  }

  // try {
  //   await client.signAndExecuteTransactionBlock({
  //     transactionBlock: transactionBlock,
  //     signer: keypair,
  //   });
  // } catch (e) {
  //   console.error(e);
  // }
})();
