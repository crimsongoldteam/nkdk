import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../property/types"
import type { ElementRule } from "./types"
import {
  defineElementAsType,
  defineElementRule,
  getElementRule,
} from "./ruleFactory"
import { typeRulesRegistryRevision } from "../property/typeRuleRegistry"

import "../../forms/elements/index"

describe("одиночный элемент формы", () => {
  it("создаёт definition без записи в legacy registry", () => {
    const revision = typeRulesRegistryRevision()
    const elementRule = {
      itemType: "ExtendedTooltip",
      enterpriseField: "FormDecoration",
      enterpriseFieldType: "None",
      properties: {},
    } as const satisfies ElementRule

    const definition = defineElementAsType({
      propertyType: "TestPureFormElement",
      elementRule,
      toXML: () => ({ name: "Поле" }),
    })

    expect(typeRulesRegistryRevision()).toBe(revision)
    expect(
      definition.propertyTypes.TestPureFormElement?.importFromXMLToYAML,
    ).toBeTypeOf("function")
    expect(definition.formElements.ExtendedTooltip).toBe(elementRule)
  })

  it("определяет element rule без изменения legacy registry", () => {
    const registeredRule = getElementRule("ExtendedTooltip")
    const elementRule = {
      itemType: "ExtendedTooltip",
      enterpriseField: "FormDecoration",
      enterpriseFieldType: "None",
      properties: {},
    } as const satisfies ElementRule

    const definition = defineElementRule("ExtendedTooltip", elementRule)

    expect(getElementRule("ExtendedTooltip")).toBe(registeredRule)
    expect(definition.formElements.ExtendedTooltip).toBe(elementRule)
  })

  it("восстанавливает имя и id перед остальными XML-атрибутами без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.Элемент.Кнопка",
      targetProjectPath: "Форма.yaml",
    })
    const rule = {
      itemType: "SingletonElementProbe",
      properties: {
        tooltip: {
          type: "ExtendedTooltip",
          xml: "ExtendedTooltip",
          yaml: "РасширеннаяПодсказка",
        },
      },
    } as const satisfies MetadataItemRule
    const source = {
      ExtendedTooltip: {
        _name: "КнопкаРасширеннаяПодсказка",
        _id: "2",
        _DisplayImportance: "VeryHigh",
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: source,
      name: "Кнопка",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Кнопка",
    })

    expect(Object.keys(exported.xml.ExtendedTooltip as Record<string, unknown>)).toEqual([
      "_name",
      "_id",
      "_DisplayImportance",
    ])
  })
})
