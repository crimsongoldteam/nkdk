import { describe, expect, it } from "vitest"
import {
  testAppliedObjectFromYAMLToXML,
  testMetadataItemFromYAMLToXML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"

describe("MetadataCatalog YAML → XML", () => {
  it.each([
    ["full.xml", fullYAML],
    ["minimal.xml", minimalYAML],
  ] as const)("exports %s exactly", (fixture, yaml) => {
    const result = testAppliedObjectFromYAMLToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture,
      yaml,
    })

    expect(result.result).toEqual(result.expected)
  })

  it.each([
    ["ПланВидовХарактеристик.ВопросыДляАнкетирования", "ChartOfCharacteristicTypes.ВопросыДляАнкетирования"],
    ["ПланОбмена.ИнтеграцияСМагазинамиСоцСетей", "ExchangePlan.ИнтеграцияСМагазинамиСоцСетей"],
  ])("exports owner %s to XML", (yamlReference, xmlReference) => {
    const result = testPropertyFromYAMLToXML({
      rule: {
        itemType: "CatalogOwnersProbe",
        properties: {
          owners: MetadataCatalogRules.properties.owners,
        },
      },
      yaml: { Владельцы: [yamlReference] },
    })

    expect(result.xml).toEqual({
      Properties: {
        Owners: {
          "xr:Item": [
            {
              "_xsi:type": "xr:MDObjectRef",
              "#text": xmlReference,
            },
          ],
        },
      },
    })
  })

  it.each([
    ["Строка", "xs:string"],
    ["Справочник.Контрагенты", "cfg:CatalogRef.Контрагенты"],
  ])("exports allowed catalog attribute type %s", (yamlType, xmlType) => {
    const result = testMetadataItemFromYAMLToXML({
      rule: MetadataCatalogRules,
      name: "Товары",
      yaml: {
        Реквизиты: {
          Реквизит: { Тип: yamlType },
        },
      },
    })

    expect(JSON.stringify(result.xml)).toContain(xmlType)
  })

  it.each([
    [{ Реквизиты: { Неверный: { Тип: "НесуществующийТип" } } }, "TypeDescription YAML value is not allowed"],
    [
      { Реквизиты: { Неверный: { Тип: ["Строка", "ХранилищеЗначения"] } } },
      "TypeDescription YAML value is not allowed",
    ],
    [{ ВводитсяНаОсновании: ["Перечисление.Статусы"] }, 'Вид цели "Enum" не разрешён'],
    [{ Владельцы: ["Перечисление.Статусы"] }, 'Корень "Enum" не разрешён'],
  ])("rejects invalid catalog YAML %#", (yaml, message) => {
    expect(() =>
      testMetadataItemFromYAMLToXML({
        rule: MetadataCatalogRules,
        name: "Товары",
        yaml,
      })
    ).toThrow(message)
  })
})
