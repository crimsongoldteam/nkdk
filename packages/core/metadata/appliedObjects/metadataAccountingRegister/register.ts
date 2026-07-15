import type { OwnerMetadata } from "../../validation/dataPath/ownerCache"
import type { FormDataPathColumnSource, OwnerTypeRef } from "../../validation/dataPath/types"
import { resolveObjectFieldSegment } from "../../validation/dataPath/objectFields"
import { registerDataPathOwnerKind, registerTableColumnResolver } from "../../validation/dataPath/registry"
import { MetadataAccountingRegisterRules } from "./rules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "РегистрБухгалтерии",
  projectDir: "РегистрБухгалтерии",
  rule: MetadataAccountingRegisterRules,
  typeDescriptionBases: ["AccountingRegisterRecordManager"],
  registerRecordSetBases: ["AccountingRegisterRecordSet"],
  metadataLinkPrefixes: ["AccountingRegister", "РегистрБухгалтерии"],
})

registerTableColumnResolver(({ table, segment, owner }) => {
  if (table.kind !== "RegisterRecordSet" || owner?.ref.kind !== "РегистрБухгалтерии") return undefined
  return accountingRegisterRecordSetColumn({ owner, segment })
})

function accountingRegisterRecordSetColumn(params: {
  owner: OwnerMetadata
  segment: string
}): FormDataPathColumnSource | undefined {
  const accountColumn = accountingRegisterAccountColumn(params.owner, params.segment)
  if (accountColumn !== undefined) return accountColumn

  const extDimensionColumn = accountingRegisterExtDimensionColumn(params.segment)
  if (extDimensionColumn !== undefined) return extDimensionColumn

  return accountingRegisterDebitCreditFieldColumn(params.owner, params.segment)
}

function accountingRegisterAccountColumn(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  if (segment !== "Account" && segment !== "Счет" && segment !== "AccountDr" && segment !== "AccountCr")
    return undefined

  const chartOfAccounts = accountingRegisterChartOfAccounts(owner.model)
  if (chartOfAccounts === undefined) return undefined

  const isStandardAccount = segment === "Account" || segment === "Счет"
  return {
    name: isStandardAccount ? "Счет" : segment,
    ...(isStandardAccount ? { targetName: "Account" } : {}),
    typeInfo: {
      kinds: ["object"],
      nextTypes: [chartOfAccounts],
      sourceText: `ChartOfAccounts.${chartOfAccounts.name ?? ""}`,
    },
  }
}

function accountingRegisterChartOfAccounts(model: unknown): OwnerTypeRef | undefined {
  const value = metadataRecord(model).chartOfAccounts
  if (typeof value !== "string") return undefined

  const prefix = "ChartOfAccounts."
  if (!value.startsWith(prefix)) return undefined

  const name = value.substring(prefix.length)
  if (name.length === 0) return undefined

  return { kind: "ПланСчетов", name }
}

function accountingRegisterExtDimensionColumn(segment: string): FormDataPathColumnSource | undefined {
  const match = /^ExtDimension(?:Dr|Cr)?(?<number>[1-9]\d?)$/.exec(segment)
  const number = match?.groups?.number
  if (number === undefined || Number(number) > 50) return undefined

  return {
    name: segment,
    typeInfo: {
      kinds: ["any"],
      nextTypes: [],
      sourceText: "AccountingRegisterRecordSet.ExtDimension",
    },
  }
}

function accountingRegisterDebitCreditFieldColumn(
  owner: OwnerMetadata,
  segment: string
): FormDataPathColumnSource | undefined {
  const match = /^(?<name>.+)(?:Dr|Cr)$/.exec(segment)
  const name = match?.groups?.name
  if (name === undefined) return undefined

  const field = resolveObjectFieldSegment({ index: owner.fieldIndex, segment: name, nameMode: "yaml" })
  if (field === undefined) return undefined

  return {
    name: segment,
    typeInfo: field.typeInfo,
  }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
