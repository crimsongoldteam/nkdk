import { describe, expect, it } from "vitest"
import {
  testAppliedObjectFromYAMLToXML,
  testMetadataItemFromYAMLToXML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"
import { withKnownXMLDefaults } from "../../../tests/knownXMLDefaults"

describe("MetadataCatalog YAML → XML", () => {
  it("exports full.xml exactly", () => {
    const result = testAppliedObjectFromYAMLToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      yaml: fullYAML,
    })

    expect(result.result).toEqual(withKnownXMLDefaults(result.expected))
  })

  it("preserves explicitly empty input fields for minimal.xml", () => {
    const result = testAppliedObjectFromYAMLToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      yaml: minimalYAML,
    })

    expect(result.result).toEqual(withKnownXMLDefaults(result.expected))
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
    expect(result.xml).toMatchObject({
      MetaDataObject: {
        Catalog: {
          ChildObjects: {
            Attribute: [{ _uuid: "11111111-1111-4111-8111-111111111111" }],
          },
        },
      },
    })
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
