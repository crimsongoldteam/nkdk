import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export const dcsParameterExplicitUndefinedRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    dcsParameterUndefinedValue: {
      action: "transportScalar",
      itemType: "DCSParameter",
      propertyKey: "value",
      overrides: {
        Undefined: {
          "_xmlns:d6p1": "http://v8.1c.ru/8.2/data/types",
          "_xsi:type": "v8:Type",
          "#text": "d6p1:Undefined",
        },
      },
    },
  },
})
