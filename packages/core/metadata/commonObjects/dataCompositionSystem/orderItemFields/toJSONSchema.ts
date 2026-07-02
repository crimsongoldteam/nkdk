import { Type } from "@sinclair/typebox"
import { exportMetadataItemToJSONSchema } from "../../../orchestration/metadataItem/toJSONSchema"
import { ExportToJSONSchemaFn } from "../../../orchestration/property/fn"
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
