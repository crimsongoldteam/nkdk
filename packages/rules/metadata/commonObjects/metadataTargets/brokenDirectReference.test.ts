import { describe, expect, it } from "vitest"
import { Type } from "typebox"

import { importFromYAML, xmlAnomalyTagValue, yamlScalarTagAt } from "@nkdk/runtime"
import {
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import { exportPropertiesToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { mockContext } from "../../../tests/mockContext"

const UUID = "3062c54f-92ed-42c5-b62f-1c0e685cfe75"
const SEGMENTED = "1:93701593-5ac8-4266-b471-7e9ed35a9c3e"
const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))

const rules = {
  MetadataItemLink: directRule("MetadataItemLink"),
  string: directRule("string"),
  MetadataField: directRule("MetadataField"),
} as const

describe("прямая битая metadataTarget-ссылка", () => {
  it.each([
    ["MetadataItemLink", UUID],
    ["string", SEGMENTED],
    ["MetadataField", UUID],
  ] as const)("переносит значение типа %s без поиска", (type, payload) => {
    const contexts = createDirectRoundTripContexts()
    const rule = rules[type]
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      execution,
      rule,
      xml: { Reference: payload },
    })

    expect(imported.yaml).toEqual({
      Ссылка: xmlAnomalyTagValue("xml/reference", payload),
    })
    expect(yamlScalarTagAt(imported.yaml, "Ссылка")).toBe("xml/reference")

    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule,
      yaml: importFromYAML(`Ссылка: !xml/reference ${payload}`),
    })
    expect(exported.xml).toEqual({ Reference: payload })
  })

  it("не подключается без metadataTarget", () => {
    const carrier = execution.getTypeRule("string", "brokenXMLReferenceCarrier")
    const rule = { type: "string", xml: "Reference", yaml: "Ссылка" } as const

    expect(carrier?.tryImport({ rule, xmlValue: SEGMENTED, yamlValue: SEGMENTED }))
      .toBeUndefined()
  })

  it.each(["не ссылка", `x:${UUID}`, `1:${UUID}:extra`])(
    "не принимает произвольное внутреннее значение %s",
    (payload) => {
      const carrier = execution.getTypeRule("string", "brokenXMLReferenceCarrier")
      const rule = rules.string.properties.reference!

      expect(carrier?.tryImport({ rule, xmlValue: payload, yamlValue: payload }))
        .toBeUndefined()
    },
  )

  it("отклоняет нетегированную внутреннюю форму YAML", () => {
    expect(() => testPropertyFromYAMLToXML({
      execution,
      rule: rules.string,
      yaml: { Ссылка: SEGMENTED },
    })).toThrow()
  })

  it("не принимает текст тега в кавычках за тегированную ссылку", () => {
    expect(() => testPropertyFromYAMLToXML({
      execution,
      rule: rules.MetadataItemLink,
      yaml: importFromYAML(`Ссылка: "!xml/reference ${UUID}"`),
    })).toThrow()
  })

  it("отклоняет неверное содержимое !xml/reference", () => {
    expect(() => testPropertyFromYAMLToXML({
      execution,
      rule: rules.string,
      yaml: importFromYAML("Ссылка: !xml/reference не-ссылка"),
    })).toThrow("Битая прямая ссылка не соответствует зарегистрированной грамматике")
  })

  it("разрешает в validation graph только тегированную строгую форму", () => {
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule: rules.string,
      execution,
    })
    const validation = compileValidationSchema({}, Type.Object(properties))

    expect(validation.Check({ Ссылка: `!xml/reference ${UUID}` })).toBe(true)
    expect(validation.Check({ Ссылка: `!xml/reference ${SEGMENTED}` })).toBe(true)
    expect(validation.Check({ Ссылка: UUID })).toBe(false)
    expect(validation.Check({ Ссылка: `!xml/reference ${UUID}x` })).toBe(false)
    expect(validation.Check({ Ссылка: `!xml/value ${UUID}` })).toBe(false)
  })

  it("переносит UUID реального свойства SettingsStorage", () => {
    const rule = propertyProbe(
      "SettingsStorageProbe",
      "settingsStorage",
      ClientApplicationFormRules.properties.settingsStorage,
    )
    const contexts = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      execution,
      rule,
      xml: { SettingsStorage: UUID },
    })

    expect(imported.yaml).toEqual({
      ХранилищеНастроек: `!xml/reference ${UUID}`,
    })
    expect(yamlScalarTagAt(imported.yaml, "ХранилищеНастроек")).toBe("xml/reference")
    expect(testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule,
      yaml: imported.yaml,
    }).xml).toEqual({ SettingsStorage: UUID })
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

  it("переносит число:UUID реальной основной таблицы DynamicList", () => {
    const rule = propertyProbe(
      "DynamicListProbe",
      "value",
      { type: "DynamicList", xml: "Settings", yaml: "Значение" },
    )
    const contexts = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      execution,
      rule,
      xml: { Settings: { "_xsi:type": "DynamicList", MainTable: SEGMENTED } },
    })
    const value = (imported.yaml as { Значение: Record<string, unknown> }).Значение

    expect(value.ОсновнаяТаблица).toBe(`!xml/reference ${SEGMENTED}`)
    expect(yamlScalarTagAt(value, "ОсновнаяТаблица")).toBe("xml/reference")
    expect(testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule,
      yaml: imported.yaml,
    }).xml).toMatchObject({ Settings: { MainTable: SEGMENTED } })
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
