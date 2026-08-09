import { Type } from "typebox"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "../../../ruleRuntime/property/fn"
import { OrderItemFieldRules } from "./rules"

export const exportOrderItemFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) =>
  Type.Array(
    Type.Union([
      Type.Literal("[Авто]"),
      exportMetadataItemToJSONSchema({
        context,
        rule: OrderItemFieldRules,
      }),
    ])
  )
