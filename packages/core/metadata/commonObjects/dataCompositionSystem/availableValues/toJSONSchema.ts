import { TSchema, Type } from "@sinclair/typebox"
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import type { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const satisfies DcsMetadataValuePropertyRule
const presentationRule = { type: "DcsLocalStringType" } as const satisfies PropertyRule

export const exportDcsAvailableValuesToJSONSchema: ExportToJSONSchemaFn = ({ context }): TSchema =>
  Type.Array(
    Type.Object(
      {
        Значение: Type.Optional(requiredDcsMetadataValueSchema(context)),
        Представление: Type.Optional(requiredPresentationSchema(context)),
      },
      { additionalProperties: false }
    )
  )

function requiredDcsMetadataValueSchema(context: ConfigurationContext): TSchema {
  const schema = exportDcsMetadataValueToJSONSchema({ context, rule: valueRule, value: undefined })
  if (schema === undefined) throw new Error("MetadataDcsMetadataValue JSON Schema is not registered")
  return schema
}

function requiredPresentationSchema(context: ConfigurationContext): TSchema {
  const schema = exportI8nTextToJSONSchema({ context, rule: presentationRule, value: undefined })
  if (schema === undefined) throw new Error("DcsLocalStringType JSON Schema is not registered")
  return schema
}

registerTypeRule("DcsAvailableValues", "exportToJSONSchema", exportDcsAvailableValuesToJSONSchema)
