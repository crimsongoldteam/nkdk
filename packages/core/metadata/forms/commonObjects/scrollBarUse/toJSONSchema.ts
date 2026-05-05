import { TSchema, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportScrollBarUseToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  const enumeration = SE.ScrollBarUseFromYAML
  const values = Object.keys(enumeration)

  if (values.length === 1) {
    return Type.Literal(values[0])
  }

  const literals = values.map((v) => Type.Literal(v)) as TSchema[]
  return Type.Union(literals as [TSchema, TSchema, ...TSchema[]])
}

registerTypeRule("ScrollBarUseBoolean", "exportToJSONSchema", exportScrollBarUseToJSONSchema)

