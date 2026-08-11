import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { FormDataPathColumnSource, OwnerTypeRef } from "../../validation/dataPath/types"
import { resolveObjectFieldSegment } from "../../validation/dataPath/objectFields"
import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataAccountingRegisterDataPathRules: readonly DataPathContribution[] = [{
  kind: "tableColumn",
  resolver: ({ table, segment, owner }) => {
    if (table.kind !== "RegisterRecordSet" || owner?.ref.kind !== "РегистрБухгалтерии") return undefined
    return accountingRegisterRecordSetColumn({ owner, segment })
  },
}]

function accountingRegisterRecordSetColumn(params: { owner: OwnerMetadata; segment: string }): FormDataPathColumnSource | undefined {
  return accountingRegisterAccountColumn(params.owner, params.segment)
    ?? accountingRegisterExtDimensionColumn(params.segment)
    ?? accountingRegisterDebitCreditFieldColumn(params.owner, params.segment)
}

function accountingRegisterAccountColumn(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  if (segment !== "Account" && segment !== "Счет" && segment !== "AccountDr" && segment !== "AccountCr") return undefined
  const chartOfAccounts = accountingRegisterChartOfAccounts(owner.facts)
  if (chartOfAccounts === undefined) return undefined
  const isStandardAccount = segment === "Account" || segment === "Счет"
  return {
    name: isStandardAccount ? "Счет" : segment,
    ...(isStandardAccount ? { targetName: "Account" } : {}),
    typeInfo: { kinds: ["object"], nextTypes: [chartOfAccounts], sourceText: `ChartOfAccounts.${chartOfAccounts.name ?? ""}` },
  }
}

function accountingRegisterChartOfAccounts(model: unknown): OwnerTypeRef | undefined {
  const value = metadataRecord(model).chartOfAccounts
  const prefix = "ChartOfAccounts."
  if (typeof value !== "string" || !value.startsWith(prefix)) return undefined
  const name = value.substring(prefix.length)
  return name.length === 0 ? undefined : { kind: "ПланСчетов", name }
}

function accountingRegisterExtDimensionColumn(segment: string): FormDataPathColumnSource | undefined {
  const number = /^ExtDimension(?:Dr|Cr)?(?<number>[1-9]\d?)$/.exec(segment)?.groups?.number
  if (number === undefined || Number(number) > 50) return undefined
  return { name: segment, typeInfo: { kinds: ["any"], nextTypes: [], sourceText: "AccountingRegisterRecordSet.ExtDimension" } }
}

function accountingRegisterDebitCreditFieldColumn(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  const name = /^(?<name>.+)(?:Dr|Cr)$/.exec(segment)?.groups?.name
  if (name === undefined) return undefined
  const field = resolveObjectFieldSegment({ index: owner.fieldIndex, segment: name, nameMode: "yaml" })
  return field === undefined ? undefined : { name: segment, typeInfo: field.typeInfo }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
