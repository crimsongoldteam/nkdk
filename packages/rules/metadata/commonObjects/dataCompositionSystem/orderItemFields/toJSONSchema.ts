import { Type } from "typebox"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "@nkdk/runtime/rule-kit"
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
