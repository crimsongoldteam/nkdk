import { describe,expect,it } from "vitest"

import {
createPropertyRuleExecutor,
createPropertyRuleRegistrySet,
type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import {
createDirectRoundTripContexts,
testPropertyFromYAMLToXML
} from "../../../tests/directConversion"
import { metadataRules } from "../../composition/metadataRules"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
const SEGMENTED = "1:93701593-5ac8-4266-b471-7e9ed35a9c3e"
const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))

const rules = {
  MetadataItemLink: directRule("MetadataItemLink"),
  string: directRule("string"),
  MetadataField: directRule("MetadataField"),
} as const

describe("прямая битая metadataTarget-ссылка", () => {

  it("отклоняет нетегированную внутреннюю форму YAML", () => {
    expect(() => testPropertyFromYAMLToXML({
      execution,
      rule: rules.string,
      yaml: { Ссылка: SEGMENTED },
    })).toThrow()
  })

  it("сохраняет обычное имя реального свойства SettingsStorage", () => {
    const rule = propertyProbe(
      "ClientApplicationForm",
      "settingsStorage",
      ClientApplicationFormRules.properties.settingsStorage,
    )

    expect(testPropertyFromYAMLToXML({
      execution,
      rule,
      name: "ФормаЭлемента",
      yaml: { ХранилищеНастроек: "ФормаЭлемента" },
      context: createDirectRoundTripContexts({
        logicalAddress: "Catalog.Товары.Form.ФормаЭлемента",
        metadataTargetOwners: [{
          itemType: "ClientApplicationForm",
          name: "ФормаЭлемента",
          owner: { root: "Catalog", objectName: "Товары" },
        }],
      }).exportContext(),
    }).xml).toEqual({
      SettingsStorage: "Catalog.Товары.Form.ФормаЭлемента",
    })
  })
})

function directRule(type: "string" | "MetadataItemLink" | "MetadataField"): MetadataItemRule {
  return {
    itemType: `DirectBroken${type}Probe`,
    properties: {
      reference: {
        type,
        xml: "Reference",
        yaml: "Ссылка",
        metadataTarget: { kind: "object", roots: ["Catalog"] },
      },
    },
  } as MetadataItemRule
}

function propertyProbe(
  itemType: string,
  key: string,
  property: MetadataItemRule["properties"][string],
): MetadataItemRule {
  return { itemType, properties: { [key]: property } } as MetadataItemRule
}
