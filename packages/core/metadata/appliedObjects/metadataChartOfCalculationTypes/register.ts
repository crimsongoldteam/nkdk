import type { OwnerMetadata } from "~/metadata/validation/dataPath/ownerCache"
import type { FormDataPathColumnSource } from "~/metadata/validation/dataPath/types"
import { registerDataPathOwnerKind, registerVirtualOwnerFieldResolver } from "~/metadata/validation/dataPath/registry"
import { MetadataChartOfCalculationTypesRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ПланВидовРасчета",
  projectDir: "ПланВидовРасчета",
  rule: MetadataChartOfCalculationTypesRules,
  typeDescriptionBases: ["ChartOfCalculationTypesRef"],
  metadataLinkPrefixes: ["ChartOfCalculationTypes"],
  aliases: ["ПланВидовРасчетаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовРасчетаОбъект",
  projectDir: "ПланВидовРасчета",
  rule: MetadataChartOfCalculationTypesRules,
  typeDescriptionBases: ["ChartOfCalculationTypesObject"],
  metadataLinkPrefixes: ["ChartOfCalculationTypes"],
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланВидовРасчета" && owner.ref.kind !== "ПланВидовРасчетаОбъект") return undefined
  if (segment === "ActionPeriodIsBasic") {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfCalculationTypes.ActionPeriodIsBasic" },
    }
  }
  if (!isCalculationTypesVirtualTableName(segment)) return undefined

  const table = { kind: "ValueTable" as const }
  return {
    name: segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `ChartOfCalculationTypes.${segment}`,
    },
    tableSource: {
      table,
      columns: chartOfCalculationTypesVirtualTableColumns(owner),
      hasColumns: true,
    },
  }
})

function chartOfCalculationTypesVirtualTableColumns(owner: OwnerMetadata): Map<string, FormDataPathColumnSource> {
  const columns = new Map<string, FormDataPathColumnSource>()
  columns.set("CalculationType", {
    name: "CalculationType",
    typeInfo: {
      kinds: ["object"],
      nextTypes: [owner.ref],
      sourceText: `ChartOfCalculationTypes.${owner.ref.name}`,
    },
  })
  return columns
}

function isCalculationTypesVirtualTableName(segment: string): boolean {
  return segment === "BaseCalculationTypes" ||
    segment === "LeadingCalculationTypes" ||
    segment === "DisplacingCalculationTypes"
}
