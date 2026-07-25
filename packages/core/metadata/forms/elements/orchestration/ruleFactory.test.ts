import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import type { MetadataItemRule } from "../../../orchestration/property/types"

import "../index"

describe("одиночный элемент формы", () => {
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
