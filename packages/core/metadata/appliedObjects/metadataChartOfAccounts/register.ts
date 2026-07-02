import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource } from "../../validation/dataPath/types"
import { registerDataPathOwnerKind, registerVirtualOwnerFieldResolver } from "../../validation/dataPath/registry"
import { booleanColumn, metadataRecord, scalarColumn } from "../dataPathCommon/register"
import { MetadataChartOfAccountsRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ПланСчетов",
  projectDir: "ПланСчетов",
  rule: MetadataChartOfAccountsRules,
  typeDescriptionBases: ["ChartOfAccountsRef"],
  metadataLinkPrefixes: ["ChartOfAccounts"],
  aliases: ["ПланСчетовОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланСчетовОбъект",
  projectDir: "ПланСчетов",
  rule: MetadataChartOfAccountsRules,
  typeDescriptionBases: ["ChartOfAccountObject", "ChartOfAccountsObject"],
  metadataLinkPrefixes: ["ChartOfAccounts"],
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланСчетов" && owner.ref.kind !== "ПланСчетовОбъект") return undefined
  if (segment === "ExtDimensionTypes") return chartOfAccountsExtDimensionTypesField(owner, segment)

  const field = chartOfAccountsTerminalVirtualField(owner, segment)
  return field === undefined ? undefined : { name: segment, typeInfo: field.typeInfo }
})

function chartOfAccountsExtDimensionTypesField(
  owner: OwnerMetadata,
  segment: string
): {
  name: string
  typeInfo: DataPathTypeInfo
  tableSource: { table: DataPathTableInfo; columns: Map<string, FormDataPathColumnSource>; hasColumns: boolean }
} {
  const table = { kind: "ValueTable" as const }
  return {
    name: segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: "ChartOfAccounts.ExtDimensionTypes",
    },
    tableSource: {
      table,
      columns: chartOfAccountsExtDimensionTypesColumns(owner),
      hasColumns: true,
    },
  }
}

function chartOfAccountsTerminalVirtualField(
  owner: OwnerMetadata,
  segment: string
): FormDataPathColumnSource | undefined {
  if (segment === "Order" || segment === "Type") {
    return scalarColumn(segment, `ChartOfAccounts.${segment}`)
  }

  if (segment === "OffBalance") return booleanColumn(segment, "ChartOfAccounts.OffBalance")
  if (chartOfAccountsAccountingFlagNames(owner.model).includes(segment)) {
    return booleanColumn(segment, "ChartOfAccounts.AccountingFlag")
  }

  return undefined
}

function chartOfAccountsExtDimensionTypesColumns(owner: OwnerMetadata): Map<string, FormDataPathColumnSource> {
  const columns = new Map<string, FormDataPathColumnSource>()
  columns.set("ExtDimensionType", {
    name: "ExtDimensionType",
    typeInfo: chartOfAccountsExtDimensionTypeInfo(owner.model),
  })

  for (const name of ["TurnoversOnly", "ТолькоСальдо"]) {
    columns.set(name, booleanColumn(name, `ChartOfAccounts.ExtDimensionTypes.${name}`))
  }

  for (const name of chartOfAccountsExtDimensionAccountingFlagNames(owner.model)) {
    columns.set(name, booleanColumn(name, "ChartOfAccounts.ExtDimensionAccountingFlag"))
  }

  return columns
}

function chartOfAccountsExtDimensionTypeInfo(model: unknown): DataPathTypeInfo {
  const value = metadataRecord(model).extDimensionTypes
  if (typeof value !== "string")
    return { kinds: ["unknown"], nextTypes: [], sourceText: "ChartOfAccounts.ExtDimensionTypes.ExtDimensionType" }

  const prefix = "ChartOfCharacteristicTypes."
  if (!value.startsWith(prefix)) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  const name = value.substring(prefix.length)
  if (name.length === 0) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  return {
    kinds: ["object"],
    nextTypes: [{ kind: "ПланВидовХарактеристик", name }],
    sourceText: value,
  }
}

function chartOfAccountsExtDimensionAccountingFlagNames(model: unknown): string[] {
  const flags = metadataRecord(model).extDimensionAccountingFlags
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => metadataRecord(flag).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function chartOfAccountsAccountingFlagNames(model: unknown): string[] {
  const flags = metadataRecord(model).accountingFlags
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => metadataRecord(flag).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}
