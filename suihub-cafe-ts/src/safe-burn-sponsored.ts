import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { PaginatedCoins, SuiClient } from "@mysten/sui/client";
import { EnokiClient } from "@mysten/enoki";
import { fromB64, toB64 } from "@mysten/sui/utils";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE = "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x525948ad2ef9736d73516f0f128b513b59637f7f23eea6d5531f9ab8949b1b05";
  const SUILINK_REGISTRY_ID = "0x9b63f563698c5f3cc58f178f6ff3e540d0c4e69ef18335ad303a19b5e5c00f3e";
  const SUILINK_REGISTRY_V2_ID = "0xb29a475f6e41e1f9042addc0e2b6e15a15fe9956b9c91654d34dd3b9228d6d66";
  const NFT = "0x6648c462f3ca77f56c1762ce102d358b3bc54db480e8e84104684bc072ab64e0";

  const enokiClient = new EnokiClient({
    apiKey: ENOKI_SECRET_KEY,
  });

  console.log(ENOKI_SECRET_KEY);

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  // Client
  const client = new SuiClient({
    url: FULLNODE,
  });

  const packageId = PACKAGE_ID;
  const moduleName = "registry_v2";

  let transactionBlock = new Transaction();

  const rebateToPay = transactionBlock.moveCall({
    target: `${packageId}::utils::calculate_storage_rebate`,
    arguments: [
      transactionBlock.object(NFT),
      transactionBlock.pure.u64(15200n),
    ],
    typeArguments: [`${packageId}::solana::Solana`],
  });

  ////////////////////////////////////////
  const coins: PaginatedCoins["data"][number][] = [];
  let result: PaginatedCoins | undefined;

  do {
    result = await client.getCoins({
      owner: keypair.toSuiAddress(),
      coinType: "0x2::sui::SUI",
      cursor: result?.nextCursor,
    });
    coins.push(...result.data);
  } while (result.hasNextPage);
  ////////////////////////////////////////

  const coin = transactionBlock.splitCoins(coins[0].coinObjectId, [
    rebateToPay,
  ]);

  transactionBlock.moveCall({
    target: `${packageId}::registry_v2::safe_burn`,
    arguments: [
      transactionBlock.object(SUILINK_REGISTRY_V2_ID), // registry: &mut SuiLinkRegistryV2
      transactionBlock.object(NFT), // suilink: SuiLink<T>
      transactionBlock.pure.u32(1), // network: u32
      transactionBlock.object(coin), // c: Coin<SUI>
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
    allowedMoveCallTargets: [
      `${packageId}::${moduleName}::utils::calculate_storage_rebate`,
      `${packageId}::${moduleName}::safe_burn`,
    ],
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
})();
