import { GeneralSuiObject } from "@/types/GeneralSuiObject";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SuiExplorerLink } from "./SuiExplorerLink";
import { formatString } from "@/helpers/formatString";
import Link from "next/link";
import { getSuiExplorerLink } from "@/helpers/getSuiExplorerLink";

export const SuiObjectCard = ({
  objectId,
  packageId,
  moduleName,
  structName,
  version,
  msg,
  otherParty,
  createdAt,
}: GeneralSuiObject) => {
  return (
    <Link
      href={getSuiExplorerLink({ objectId, type: "object", moduleName })}
      target="_blank"
      rel="noopenner noreferrer"
    >
      <Card className="w-[350px] hover:bg-gray-100">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="text-lg">{formatString(structName, 15)}</div>
            <div className="text-sm">
              <SuiExplorerLink
                objectId={objectId}
                type="object"
                isLink={false}
              />
            </div>
          </CardTitle>
          <div className="flex justify-between items-center text-muted-foreground text-sm">
            <div>{formatString(moduleName, 15)}</div>
            <div>
              <SuiExplorerLink
                objectId={packageId}
                type="module"
                moduleName={moduleName}
                isLink={false}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between space-x-2">
            <div>Version</div>
            <div className="text-gray-500">{version}</div>
          </div>
        </CardContent>
        <CardContent>
          <div className="flex justify-between space-x-2">
            <div>msg</div>
            <div className="text-gray-500">{msg}</div>
          </div>
        </CardContent>
        <CardContent>
          <div className="flex justify-between space-x-2">
            <div>other_party</div>
            <div className="text-gray-500">{otherParty}</div>
          </div>
        </CardContent>
        <CardContent>
          <div className="flex justify-between space-x-2">
            <div>created_at</div>
            <div className="text-gray-500">{createdAt}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
