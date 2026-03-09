import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { exportEventsToJSONSchema } from "../event/toJSONSchema"
import { exportPropertiesToJSONSchema } from "../property/toJSONSchema"
import { getElementRule } from "./ruleFactory"

export const exportElementToJSONSchema = <T extends NamedElement>(params: {
  context: ConfigurationContext
  value: T
}): TSchema => {
  const { context, value: element } = params
  const itemType = element.itemType

  const rules = getElementRule(itemType)

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: element,
    rule: rules,
  })

  const events = exportEventsToJSONSchema({ rule: rules })

  const result = Type.Object(
    {
      ...properties,
      ...events,
    },
    { additionalProperties: false }
  )

  return result
}
