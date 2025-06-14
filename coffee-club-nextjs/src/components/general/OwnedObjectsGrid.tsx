"use client";

import React from "react";
import { Spinner } from "./Spinner";
import { useAuthentication } from "@/contexts/Authentication";
import { USER_ROLES } from "@/constants/USER_ROLES";
import { useGetOwnedObjects } from "@/hooks/useGetOwnedObjects";
import { SuiObjectCard } from "./SuiObjectCard";

export const OwnedObjectsGrid = () => {
  const { user, isLoading: isAuthLoading } = useAuthentication();
  const { data, isLoading, isError } = useGetOwnedObjects();

  if (user?.role === USER_ROLES.ROLE_4 && !isAuthLoading) {
    return (
      <div className="text-center">
        <div className="font-bold text-lg">Not logged in</div>
      </div>
    );
  }

  if (isAuthLoading || isLoading) {
    return <Spinner />;
  }
  if (isError) {
    return <h3>Error</h3>;
  }
  if (!data?.length) {
    return (
      <div className="font-bold text-lg text-center">No owned objects</div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="font-bold text-2xl">Owned Objects</div>
      <div className="flex flex-wrap gap-x-3 gap-y-3">
        {isLoading && <Spinner />}
        {!isLoading &&
          data &&
          data.map((datum) => (
            <SuiObjectCard key={datum.objectId} {...datum} />
          ))}
      </div>
    </div>
  );
};
