import { GasCostSummary } from "@mysten/sui.js/client";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";

export const formatGasSummary = (gasUsed: GasCostSummary) => {
  const totalGas =
    Number(gasUsed.storageCost) +
    Number(gasUsed.computationCost) -
    Number(gasUsed.storageRebate);
  const totalGasInSui = totalGas / Number(MIST_PER_SUI);
  return totalGasInSui;
};
