// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!,
        gqlClient: "https://sui-testnet.mystenlabs.com/graphql",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
