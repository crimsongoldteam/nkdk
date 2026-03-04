import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { exportPropertiesToJSONSchema } from "../property/toJSONSchema"
import { getElementRule } from "./ruleFactory"
import { FormElementType } from "./types"

export const exportElementToJSONSchema = <T extends NamedElement>(params: {
  context: ConfigurationContext
  // TODO Лишнее поле
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
