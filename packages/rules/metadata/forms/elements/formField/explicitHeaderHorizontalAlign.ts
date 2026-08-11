import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export function defineExplicitHeaderHorizontalAlign(itemType: string) {
  const registration = {
    itemType,
    propertyKey: "headerHorizontalAlign",
    xmlValue: "Auto",
    yamlValue: EMPTY_XML_TAG_VALUE,
  } as const
  return defineMetadataRules({
    ...emptyMetadataRules,
    explicitXMLProperties: {
      [`${itemType}\0headerHorizontalAlign`]: registration,
    },
  })
}
