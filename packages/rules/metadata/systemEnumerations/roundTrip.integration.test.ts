import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../tests/directConversion"
import {
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../composition/metadataRules"

import "./index"

const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))

describe("SystemEnumeration XML → YAML → XML", () => {
  it("преобразует XML Switcher в YAML Выключатель и обратно", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "CheckBoxTypeAliasProbe",
      properties: {
        mode: {
          type: "SystemEnumeration",
          typeSE: "CheckBoxType",
          xml: "CheckBoxType",
          yaml: "ВидФлажка",
        },
      },
    } as const satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      execution,
      rule,
      xml: { CheckBoxType: "Switcher" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({ ВидФлажка: "Выключатель" })
    expect(exported.xml).toEqual({ CheckBoxType: "Switcher" })
  })

  it("преобразует XML RadioButtons в YAML Переключатель и обратно без снимка", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "SystemEnumerationAliasProbe",
      properties: {
        mode: {
          type: "SystemEnumeration",
          typeSE: "RadioButtonType",
          xml: "RadioButtonType",
          yaml: "Вид",
        },
      },
    } as const satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      execution,
      rule,
      xml: { RadioButtonType: "RadioButtons" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({ Вид: "Переключатель" })
    expect(exported.xml).toEqual({ RadioButtonType: "RadioButtons" })
  })

  it("выводит RadioButtons из YAML Переключатель без configuration index", () => {
    const rule = {
      itemType: "SystemEnumerationCanonicalAliasProbe",
      properties: {
        mode: {
          type: "SystemEnumeration",
          typeSE: "RadioButtonType",
          xml: "RadioButtonType",
          yaml: "Вид",
        },
      },
    } as const satisfies MetadataItemRule

    const exported = testPropertyFromYAMLToXML({
      execution,
      rule,
      yaml: { Вид: "Переключатель" },
    })

    expect(exported.xml).toEqual({ RadioButtonType: "RadioButtons" })
  })
})
