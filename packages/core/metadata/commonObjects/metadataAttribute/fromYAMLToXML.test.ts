import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { mockContext } from "../../../tests/mockContext"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { importContentFromXML } from "../../../xml/import/importer"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataAttributeRules } from "./rules"
import { exportMetadataAttributesToJSONSchema } from "./register"

const rule = probeRule("MetadataAttributes")

describe("MetadataAttributes YAML → XML", () => {
  it("should return undefined when data is undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule, yaml: {} }).xml).toEqual({})
  })

  it("should import full", () => {
    const result = convertYAML(FULL_YAML)
    expect(result).toContain("<Name>ТестовыйРеквизит</Name>")
    expect(result).toContain("<Comment>Комментарий к реквизиту</Comment>")
    expect(result).toContain("<ChoiceForm>Catalog.Справочник.Form.ФормаВыбора</ChoiceForm>")
  })

  it("should import minimal", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Строка", Синоним: "" } })
    expect(result).toContain("<Name>ТестовыйРеквизит</Name>")
    expect(result).toContain("<Synonym/>")
  })

  it("should import object format", () => {
    expect(convertYAML({ ТестовыйРеквизит: { Тип: "Строка" } })).toContain("<Name>ТестовыйРеквизит</Name>")
  })

  it("should reject scalar short format", () => {
    expect(() => convertYAML({ ТестовыйРеквизит: "Строка" })).toThrow("MetadataAttribute: ожидался YAML-объект")
  })

  it("should import TypeDescription typeId object format", () => {
    const result = convertYAML({
      ТестовыйРеквизит: { Тип: { ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] } },
    })
    expect(result).toContain("8c1e3694-da12-44d5-8b1f-d134b89a1282")
  })

  it("should import multilanguage object format", () => {
    const result = convertYAML({ ТестовыйРеквизит: { Тип: "Строка", Синоним: { en: "Test attribute" } } })
    expect(result).toContain("<v8:lang>en</v8:lang>")
    expect(result).toContain("<v8:content>Test attribute</v8:content>")
  })

  it("should reject scalar values in JSON Schema", () => {
    const schema = exportMetadataAttributesToJSONSchema({ context: mockContext, rule: { type: "MetadataAttributes" }, value: undefined })
    const compiled = compileValidationSchema(schema)
    expect(compiled.Check({ Организация: "Справочник.Организации" })).toBe(false)
    expect(compiled.Check({ Организация: { Тип: "Справочник.Организации" } })).toBe(true)
  })

  it("should export minimal (round-trip)", () => expectFixtureRoundTrip("minimal.xml"))

  it("should export multiple (round-trip)", () => expectFixtureRoundTrip("multiple.xml"))

  it("should export full (round-trip)", () => expectFixtureRoundTrip("full.xml"))

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
      rule: MetadataAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: 1,
      xmlRootTag: "MinValue",
    })
    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("fresh export MinValue uses rule typedXML", () => {
    const { result } = testAtomicToXML({
      rule: MetadataAttributeRules.properties.minValue,
      value: 1,
      referenceMetadata: undefined,
      xmlRootTag: "MinValue",
    })
    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })

  it("exports empty Type tag when attribute type is missing", () => {
    const { result } = testAtomicToXML({
      rule: MetadataAttributeRules.properties.type,
      value: undefined,
      xmlRootTag: "Type",
    })
    expect(result).toBe("<Type/>")
  })
})

function convertYAML(value: unknown): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule, yaml: { Значение: value } }).xml)
}

function expectFixtureRoundTrip(fixture: string): void {
  const result = testPropertyFixtureThroughYAML({
    propertyType: "MetadataAttributes",
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture,
    metadataTargetOwners: [
      { itemType: "MetadataCatalog", name: "СправочникВладелец", owner: { root: "Catalog", objectName: "СправочникВладелец" } },
    ],
  })
  expect(normalize(result.result)).toBe(normalize(result.expected))
}

function probeRule(type: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "Attribute" } },
  } as MetadataItemRule
}

const normalize = (value: string): string =>
  value
    .replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "")
    .replace(/\r\n/g, "\n")
    .trim()

const FULL_YAML = {
  ТестовыйРеквизит: {
    Тип: "Строка",
    Синоним: "Какой-то тестовый реквизит",
    Комментарий: "Комментарий к реквизиту",
    ФормаВыбора: "Catalog.Справочник.Form.ФормаВыбора",
  },
}

const EMPTY_SYNONYM_XML = `<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1"><Properties><Name>ПравилаОтправкиДокументов</Name><Synonym/><Comment/><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type><PasswordMode>false</PasswordMode><Format/><EditFormat/><ToolTip/><MarkNegatives>false</MarkNegatives><Mask/><MultiLine>false</MultiLine><ExtendedEdit>false</ExtendedEdit><MinValue xsi:nil="true"/><MaxValue xsi:nil="true"/><FillFromFillingValue>false</FillFromFillingValue><FillValue xsi:type="xs:string"/><FillChecking>DontCheck</FillChecking><ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems><ChoiceParameterLinks/><ChoiceParameters/><QuickChoice>Auto</QuickChoice><CreateOnInput>Auto</CreateOnInput><ChoiceForm/><LinkByType/><ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput><Use>ForItem</Use><Indexing>DontIndex</Indexing><FullTextSearch>Use</FullTextSearch><DataHistory>Use</DataHistory></Properties></Attribute>`
