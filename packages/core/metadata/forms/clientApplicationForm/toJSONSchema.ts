import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToJSONSchema } from "../commonObjects/childItems/toJSONSchema"
import { ClientApplicationForm } from "./types"

export const exportClientApplicationFormToJSONSchema = (params: {
  context: ConfigurationContext
  value: ClientApplicationForm
}): TSchema => {
  const { context, value: form } = params
  const childItems = exportChildItemsToJSONSchema({
    context,
    rule: { type: "GroupChildItems", defaultValue: [] },
    value: form.childItems,
  })

  const schema = Type.Object(
    {
      ...(childItems ? { Элементы: childItems } : {}),
    },
    { additionalProperties: false }
  )

  return schema
}
