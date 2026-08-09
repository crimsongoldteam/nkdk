import { registerExplicitXMLProperty } from "../../ruleRuntime/property/explicitXMLPropertyRegistry"

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
    yamlValue: "",
  })
}
