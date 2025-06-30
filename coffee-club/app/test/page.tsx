"use client";

import { useOwnedObjects } from "@/hooks/useGetOwnedObjectsByType";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function TestPage() {
  const currentAccount = useCurrentAccount();

  const { objects, loading, error, pageInfo } = useOwnedObjects(
    currentAccount?.address || "",
    "0x6a2ef1107c4880f8d6c8e2495be361cda67caa835cb9d1a90f81a5b1ee36fda2::suihub_cafe::CafeManager"
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {objects.map((obj) => (
        <li key={obj.id}>
          <p>Cafe ID: {obj.cafe_id}</p>
          <p>Manager: {obj.manager_address}</p>
        </li>
      ))}
    </ul>
  );
}
