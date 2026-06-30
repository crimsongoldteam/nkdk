import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "./types"
import { SystemEnumerationPropertyRule } from "./types"

const systemEnumerationTables = SE as unknown as Record<string, Record<string, string>>

export const exportSystemEnumerationToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const rule = params.rule as SystemEnumerationPropertyRule
  const enumeration = systemEnumerationTables[rule.typeSE + "FromYAML"]
  if (!enumeration) {
    throw new Error(`Enumeration ${rule.typeSE} not found`)
  }
  const values = Object.keys(enumeration)
  if (values.length === 1) {
    return Type.Literal(values[0])
  }
  const literals = values.map((v) => Type.Literal(v)) as TSchema[]
  return Type.Union(literals as [TSchema, TSchema, ...TSchema[]])
}

registerTypeRule("SystemEnumeration", "exportToJSONSchema", exportSystemEnumerationToJSONSchema)
