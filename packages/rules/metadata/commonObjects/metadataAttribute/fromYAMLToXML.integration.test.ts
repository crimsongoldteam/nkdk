import { beforeAll,describe,expect,it } from "vitest"

import { importContentFromXML } from "@nkdk/runtime"
import { type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
createDirectRoundTripContexts,
serializeDirectXML,
testPropertyFixtureThroughYAML,
testPropertyFromXMLToYAML,
testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { mockContext } from "../../../tests/mockContext"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { MetadataCatalogAttributeRules } from "../../appliedObjects/metadataCatalog/childRules"
import { MetadataChartOfCharacteristicTypesAttributeRules } from "../../appliedObjects/metadataChartOfCharacteristicTypes/childRules"
import {
MetadataDataProcessorAttributeRules,
MetadataDataProcessorTabularSectionAttributeRules,
} from "../../appliedObjects/metadataDataProcessor/childRules"
import { MetadataDocumentAttributeRules,MetadataDocumentTabularSectionAttributeRules } from "../../appliedObjects/metadataDocument/childRules"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { expectFinishedRuleOrder } from "../metadataRuleTestHelpers"

const rule = probeRule("MetadataCatalogAttributes", MetadataCatalogAttributeRules)

describe("MetadataAttributes YAML → XML", () => {
  let attributeSchema: ReturnType<typeof compileValidationSchema>

  beforeAll(() => {
    attributeSchema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCatalogAttributeRules })
    )
    attributeSchema.Check(undefined)
  })

  it("should return undefined when data is undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule, yaml: {} }).xml).toEqual({})
  })

  it("should import full", () => {
    const result = convertYAML(FULL_YAML)
    expect(result).toContain("<Name>ТестовыйРеквизит</Name>")
    expect(result).toContain("<Comment>Комментарий к реквизиту</Comment>")
    expect(result).toContain("<ChoiceForm>Catalog.Справочник.Form.ФормаВыбора</ChoiceForm>")
  })

  it("rejects a choice form for a composite attribute type", () => {
    expect(() => convertYAML({
      ТестовыйРеквизит: {
        Тип: ["Справочник.Справочник", "Документ.Документ"],
        ФормаВыбора: "Справочник.Справочник.Форма.ФормаВыбора",
      },
    })).toThrow(/ФормаВыбора.*недоступна|единственн.*ссылочн/i)
  })

  it("should import minimal", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Строка", Синоним: "" } })
    expect(result).toContain("<Name>ТестовыйРеквизит</Name>")
    expect(result).toContain("<Synonym/>")
    expect(result).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
    expect(result).toContain("<Indexing>DontIndex</Indexing>")
    expect(result).toContain("<FullTextSearch>Use</FullTextSearch>")
    expect(result).toContain("<DataHistory>Use</DataHistory>")
  })

  it("does not export catalog-only Use for a document attribute", () => {
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule: probeRule("MetadataDocumentAttributes", MetadataDocumentAttributeRules),
        yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
      }).xml
    )
    expect(result).not.toContain("<Use>")
  })

  it.each([
    ["MetadataCatalogAttributes", MetadataCatalogAttributeRules],
    ["MetadataChartOfCharacteristicTypesAttributes", MetadataChartOfCharacteristicTypesAttributeRules],
  ] as const)(
    "exports Use for %s",
    (propertyType, itemRule) => {
      const result = serializeDirectXML(
        testPropertyFromYAMLToXML({
          rule: probeRule(propertyType, itemRule),
          yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
        }).xml
      )
      expect(result).toContain("<Use>ForItem</Use>")
    }
  )

  it("exports owner-specific order for Indexing and Use", () => {
    const serialize = (propertyType: string, itemRule: MetadataItemRule) =>
      serializeDirectXML(
        testPropertyFromYAMLToXML({
          rule: probeRule(propertyType, itemRule),
          yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
        }).xml
      )

    const characteristic = serialize(
      "MetadataChartOfCharacteristicTypesAttributes",
      MetadataChartOfCharacteristicTypesAttributeRules
    )
    const catalog = serialize("MetadataCatalogAttributes", MetadataCatalogAttributeRules)

    expect(characteristic.indexOf("<Indexing>")).toBeLessThan(characteristic.indexOf("<Use>"))
    expect(characteristic.indexOf("<Use>")).toBeLessThan(characteristic.indexOf("<FullTextSearch>"))
    expect(catalog.indexOf("<Use>")).toBeLessThan(catalog.indexOf("<Indexing>"))
  })

  it("should import object format", () => {
    expect(convertYAML({ ТестовыйРеквизит: { Тип: "Строка" } })).toContain("<Name>ТестовыйРеквизит</Name>")
  })

  it("should reject scalar short format", () => {
    expect(() => convertYAML({ ТестовыйРеквизит: "Строка" })).toThrow("MetadataAttribute: ожидался YAML-объект")
  })

  it("объявляет dcsset локально у типа прикладного реквизита", () => {
    const result = serializeDirectXML(testPropertyFromYAMLToXML({
      rule: probeRule("MetadataDataProcessorAttributes", MetadataDataProcessorAttributeRules),
      yaml: {
        Значение: {
          Компоновщик: { Тип: "КомпоновщикНастроекКомпоновкиДанных" },
        },
      },
    }).xml)

    expect(result).toContain(
      '<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>',
    )
  })

  it("should import multilanguage object format", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Строка", Синоним: { en: "Test attribute" } } })
    expect(result).toContain("<v8:lang>en</v8:lang>")
    expect(result).toContain("<v8:content>Test attribute</v8:content>")
  })

  it("should reject scalar values in JSON Schema", () => {
    expect(attributeSchema.Check("Справочник.Организации")).toBe(false)
    expect(attributeSchema.Check({ Тип: "Справочник.Организации" })).toBe(true)
  })

  it("should export minimal (round-trip)", () => expectFixtureRoundTrip("minimal.xml"))

  it("should export multiple (round-trip)", () => expectFixtureRoundTrip("multiple.xml"))

  it("should export full (round-trip)", () => {
    expectFinishedRuleOrder(MetadataCatalogAttributeRules)
    expectFixtureRoundTrip("full.xml", "MetadataCatalogAttributes")
  })

  it("does not add fill defaults to a tabular section attribute", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataDocumentTabularSectionAttributes",
      itemRule: MetadataDocumentTabularSectionAttributeRules,
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
      fixture: "documentTabular.xml",
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("adds fill defaults to a tabular section attribute with Fill", () => {
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule: probeRule(
          "MetadataDataProcessorTabularSectionAttributes",
          MetadataDataProcessorTabularSectionAttributeRules
        ),
        yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
      }).xml
    )

    expect(result).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
    expect(result).toContain('<FillValue xsi:type="xs:string"/>')
  })

  it("exports the canonical empty string FillValue from the attribute type without a snapshot", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Строка" } })

    expect(result).toContain('<FillValue xsi:type="xs:string"/>')
  })

  it("uses the canonical string FillValue instead of reference XML", () => {
    const referenceXML = importContentFromXML<Record<string, unknown>>(
      '<Attribute><Properties><Name>ТестовыйРеквизит</Name><FillValue xsi:type="v8:TypeDescription"/></Properties></Attribute>'
    )
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule,
        yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
        referenceXML,
      }).xml
    )

    expect(result).toContain('<FillValue xsi:type="xs:string"/>')
  })

  it("keeps xsi:nil as the canonical FillValue for a non-string attribute", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Булево" } })

    expect(result).toContain('<FillValue xsi:nil="true"/>')
  })

  it("exports explicit empty Synonym as empty XML tag", () => {
    const result = convertYAML({ ПравилаОтправкиДокументов: { Тип: "Строка", Синоним: "" } })
    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:item>")
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const referenceXML = importContentFromXML<Record<string, unknown>>(EMPTY_SYNONYM_XML)
    const contexts = createDirectRoundTripContexts()
    const yaml = testPropertyFromXMLToYAML({ rule, xml: referenceXML, context: contexts.importContext }).yaml
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({ rule, yaml, referenceXML, context: contexts.exportContext() }).xml
    )
    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("Правила отправки документов")
  })

  it("should export empty string when data is undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule, yaml: {} }).xml).toEqual({})
  })

  it("preserves minValue xsi type from reference", () => {
    const { result } = testAtomicToXML({
      rule: MetadataCatalogAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: 1,
      xmlRootTag: "MinValue",
    })
    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("fresh export MinValue uses rule typedXML", () => {
    const { result } = testAtomicToXML({
      rule: MetadataCatalogAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: undefined,
      xmlRootTag: "MinValue",
    })
    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("exports empty Type tag when attribute type is missing", () => {
    const { result } = testAtomicToXML({
      rule: MetadataDocumentAttributeRules.properties.type,
      value: undefined,
      xmlRootTag: "Type",
    })
    expect(result).toBe("<Type/>")
  })
})

function convertYAML(value: unknown): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule, yaml: { Значение: value } }).xml)
}

function expectFixtureRoundTrip(fixture: string, propertyType = "MetadataCatalogAttributes"): void {
  const result = testPropertyFixtureThroughYAML({
    propertyType,
    itemRule: MetadataCatalogAttributeRules,
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture,
    metadataTargetOwners: [
      { itemType: "MetadataCatalog", name: "СправочникВладелец", owner: { root: "Catalog", objectName: "СправочникВладелец" } },
    ],
  })
  expect(normalize(result.result)).toBe(normalize(result.expected))
}

function probeRule(type: string, itemRule: MetadataItemRule): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "Attribute", itemRule } },
  } as MetadataItemRule
}

const normalize = (value: string): string =>
  value
    .replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "")
    .replace(/\r\n/g, "\n")
    .trim()

const FULL_YAML = {
  ТестовыйРеквизит: {
    Тип: "Справочник.Справочник",
    Синоним: "Какой-то тестовый реквизит",
    Комментарий: "Комментарий к реквизиту",
    ФормаВыбора: "ФормаВыбора",
  },
}

const EMPTY_SYNONYM_XML = `<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1"><Properties><Name>ПравилаОтправкиДокументов</Name><Synonym/><Comment/><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type><PasswordMode>false</PasswordMode><Format/><EditFormat/><ToolTip/><MarkNegatives>false</MarkNegatives><Mask/><MultiLine>false</MultiLine><ExtendedEdit>false</ExtendedEdit><MinValue xsi:nil="true"/><MaxValue xsi:nil="true"/><FillFromFillingValue>false</FillFromFillingValue><FillValue xsi:type="xs:string"/><FillChecking>DontCheck</FillChecking><ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems><ChoiceParameterLinks/><ChoiceParameters/><QuickChoice>Auto</QuickChoice><CreateOnInput>Auto</CreateOnInput><ChoiceForm/><LinkByType/><ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput><Use>ForItem</Use><Indexing>DontIndex</Indexing><FullTextSearch>Use</FullTextSearch><DataHistory>Use</DataHistory></Properties></Attribute>`
