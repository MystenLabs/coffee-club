import {
  useConnectWallet,
  useCurrentAccount,
  useWallets,
} from "@mysten/dapp-kit";
import { isEnokiWallet, EnokiWallet, AuthProvider } from "@mysten/enoki";
// import { type EnokiWallet } from "@mysten/enoki";

export function YourLoginComponent() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();

  const wallets = useWallets().filter(isEnokiWallet);
  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>()
  );

  const googleWallet = walletsByProvider.get("google");

  if (currentAccount) {
    return <div>Current address: {currentAccount.address}</div>;
  }

  return (
    <>
      {googleWallet ? (
        <button
          onClick={() => {
            connect({ wallet: googleWallet });
          }}
        >
          Sign in with Google
        </button>
      ) : null}
    </>
  );
}
