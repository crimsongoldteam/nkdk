import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule, ValidationSchemaRefFn } from "../orchestration"
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

export const systemEnumerationValidationSchemaRef: ValidationSchemaRefFn = ({ rule }) => {
  const systemEnumerationRule = rule as SystemEnumerationPropertyRule
  const implicitValueYAML = systemEnumerationRule.implicitValueYAML
  if (typeof implicitValueYAML !== "string") {
    return `SystemEnumeration/${systemEnumerationRule.typeSE}`
  }

  return `SystemEnumeration/${systemEnumerationRule.typeSE}/without-${implicitValueYAML}`
}

registerTypeRule("SystemEnumeration", "exportToJSONSchema", exportSystemEnumerationToJSONSchema)
registerTypeRule("SystemEnumeration", "validationSchemaRef", systemEnumerationValidationSchemaRef)
