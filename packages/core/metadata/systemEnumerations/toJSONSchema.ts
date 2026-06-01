import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "./types"
import { SystemEnumerationPropertyRule } from "./types"

export const exportSystemEnumerationToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const rule = params.rule as SystemEnumerationPropertyRule
  const enumeration = (SE as Record<string, Record<string, string>>)[rule.typeSE + "FromYAML"]
  if (!enumeration) {
    throw new Error(`Enumeration ${rule.typeSE} not found`)
  }
  if (allowsUnknownYAMLValues(rule)) {
    return Type.String()
  }
  const values = Object.keys(enumeration)
  if (values.length === 1) {
    return Type.Literal(values[0])
  }
  const literals = values.map((v) => Type.Literal(v)) as TSchema[]
  return Type.Union(literals as [TSchema, TSchema, ...TSchema[]])
}

const allowsUnknownYAMLValues = (rule: SystemEnumerationPropertyRule): boolean =>
  Object.prototype.hasOwnProperty.call(rule, "implicitValueYAML") && rule.implicitValueYAML === undefined

registerTypeRule("SystemEnumeration", "exportToJSONSchema", exportSystemEnumerationToJSONSchema)
