import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/metadataFactory"
import { SystemEnumerationPropertyRule } from "~/metadata/metadataFactory/properties/types"
import * as SE from "./types"

export const exportSystemEnumerationToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const rule = params.rule as SystemEnumerationPropertyRule
  const enumeration = (SE as Record<string, Record<string, string>>)[rule.typeSE + "FromYAML"]
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
