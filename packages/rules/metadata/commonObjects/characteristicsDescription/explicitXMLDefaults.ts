import { registerExplicitXMLProperty } from "../../ruleRuntime/property/explicitXMLPropertyRegistry"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"

const omittedCharacteristicDefaultKeys = [
  "dataPathField",
  "multipleValuesUseField",
  "multipleValuesKeyField",
  "multipleValuesOrderField",
] as const

for (const propertyKey of omittedCharacteristicDefaultKeys) {
  registerExplicitXMLProperty({
    itemType: "CharacteristicsDescription",
    propertyKey,
    action: "omit",
    yamlValue: EMPTY_XML_TAG_VALUE,
  })
}
