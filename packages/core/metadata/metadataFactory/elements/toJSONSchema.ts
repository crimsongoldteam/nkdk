import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { FormElementType } from "../metadataType/types"
import { exportPropertiesToJSONSchema } from "../properties/toJSONSchema"
import { getElementRule } from "./ruleFactory"

export const exportElementToJSONSchema = <T extends NamedElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  value: T
}): TSchema => {
  const { context, itemType, value: element } = params

  const rules = getElementRule(itemType)

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: element,
    rule: rules,
  })

  const result = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  return result
}
