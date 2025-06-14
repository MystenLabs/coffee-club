export interface GeneralSuiObject {
  objectId: string;
  packageId: string;
  moduleName: string;
  structName: string;
  version: string;
  msg?: string;
  otherParty?: string;
  createdAt?: string;
  direction?: string;
  resolvedName?: string | null;
}
