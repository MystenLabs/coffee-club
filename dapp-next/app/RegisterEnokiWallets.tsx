import { useSuiClientContext } from "@mysten/dapp-kit";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { useEffect } from "react";

export function RegisterEnokiWallets() {
  //   const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: "enoki_public_78c9554895cec42ffab8e488e858f911",
      providers: {
        google: {
          clientId:
            "884548132392-8scmjighk2g6b53lj14315b8ud5an2ob.apps.googleusercontent.com",
        },
      },
      client: client as never,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}
