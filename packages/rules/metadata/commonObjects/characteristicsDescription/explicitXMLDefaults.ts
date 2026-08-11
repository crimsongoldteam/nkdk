import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

const omittedCharacteristicDefaultKeys = [
  "dataPathField",
  "multipleValuesUseField",
  "multipleValuesKeyField",
  "multipleValuesOrderField",
] as const

export const characteristicsDescriptionExplicitXmlRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: Object.fromEntries(
    omittedCharacteristicDefaultKeys.map((propertyKey) => {
      const registration = {
        itemType: "CharacteristicsDescription",
        propertyKey,
        action: "omit" as const,
        yamlValue: EMPTY_XML_TAG_VALUE,
      }
      return [`CharacteristicsDescription\0${propertyKey}`, registration]
    }),
  ),
})
