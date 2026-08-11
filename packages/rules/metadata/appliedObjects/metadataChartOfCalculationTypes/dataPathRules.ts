import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { FormDataPathColumnSource } from "../../validation/dataPath/types"
import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataChartOfCalculationTypesDataPathRules: readonly DataPathContribution[] = [{
  kind: "virtualOwnerField",
  resolver: ({ owner, segment }) => {
    if (owner.ref.kind !== "ПланВидовРасчета" && owner.ref.kind !== "ПланВидовРасчетаОбъект") return undefined
    if (segment === "ActionPeriodIsBasic") {
      return { name: segment, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfCalculationTypes.ActionPeriodIsBasic" } }
    }
    if (!isVirtualTableName(segment)) return undefined
    const table = { kind: "ValueTable" as const }
    return {
      name: segment,
      typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: `ChartOfCalculationTypes.${segment}` },
      tableSource: { table, columns: virtualTableColumns(owner), hasColumns: true },
    }
  },
}]

function virtualTableColumns(owner: OwnerMetadata): Map<string, FormDataPathColumnSource> {
  return new Map([["CalculationType", {
    name: "CalculationType",
    typeInfo: { kinds: ["object"], nextTypes: [owner.ref], sourceText: `ChartOfCalculationTypes.${owner.ref.name}` },
  }]])
}

function isVirtualTableName(segment: string): boolean {
  return segment === "BaseCalculationTypes" || segment === "LeadingCalculationTypes" || segment === "DisplacingCalculationTypes"
}
