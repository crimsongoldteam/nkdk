import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import type { MetadataTargetOwnerContext } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"

import "./register"

const rule = probeRule("MetadataAttributes")

describe("MetadataAttributes XML → YAML", () => {
  it("should import minimal", () => {
    expect(convert("minimal.xml").yaml).toEqual({
      Значение: { РеквизитМинимальный: { Тип: "Строка(10)", ЗначениеЗаполнения: expect.anything() } },
    })
  })

  it("should import multiple attributes", () => {
    expect(convert("multiple.xml").yaml).toEqual({
      Значение: {
        Реквизит1: { Тип: "Строка(10)", ЗначениеЗаполнения: expect.anything() },
        Реквизит2: { Тип: "Строка(10)", ЗначениеЗаполнения: expect.anything() },
      },
    })
  })

  it("should import full", () => {
    const yaml = convert("full.xml", catalogOwner).yaml
    expect(yaml).toHaveProperty("Значение.РеквизитПолный.Тип", "Справочник.СправочникПолный")
    expect(yaml).toHaveProperty("Значение.РеквизитПолный.Комментарий", "Комментарий")
    expect(yaml).toHaveProperty(
      "Значение.РеквизитПолный.ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      "РеквизитБулево"
    )
  })

  it("imports explicit empty Synonym as empty YAML string", () => {
    expect(convertInline(EMPTY_SYNONYM_XML)).toEqual({
      Значение: {
        ПравилаОтправкиДокументов: {
          Синоним: "",
          Тип: "Строка(10)",
          ЗначениеЗаполнения: expect.anything(),
        },
      },
    })
  })

  it("should return undefined when data is undefined", () => {
    expect(testPropertyFromXMLToYAML({ rule, xml: {} }).yaml).toEqual({})
  })

  it("should import document", () => {
    const yaml = convertType("document.xml", "MetadataDocumentAttributes", [
      { itemType: "MetadataDocument", name: "ДокументВсеСвойства", owner: { root: "Document", objectName: "ДокументВсеСвойства" } },
    ]).yaml
    expect(yaml).toHaveProperty("Значение.ПолныйРеквизит.Тип", "ХранилищеЗначения")
    expect(yaml).toHaveProperty("Значение.ПолныйРеквизит.МаксимальноеЗначение", 100)
  })

  it("should import documentTabular", () => {
    const yaml = convertType("documentTabular.xml", "MetadataTabularSectionAttributes").yaml
    expect(yaml).toHaveProperty("Значение.РеквизитТабличнойЧасти.Тип", "Число(10, 0)")
    expect(yaml).toHaveProperty("Значение.РеквизитТабличнойЧасти.МаксимальноеЗначение", 99)
  })

  it("should export undefined when data is undefined", () => {
    expect(testPropertyFromXMLToYAML({ rule, xml: {} }).yaml).toEqual({})
  })

  it("should export full", () => {
    expect(convert("full.xml", catalogOwner).yaml).toHaveProperty("Значение.РеквизитПолный")
  })

  it("should export object format", () => {
    expect(convert("minimal.xml").yaml).toEqual({
      Значение: { РеквизитМинимальный: { Тип: "Строка(10)", ЗначениеЗаполнения: expect.anything() } },
    })
  })

  it("should skip synonym if it is equal to name", () => {
    expect(convert("minimal.xml").yaml).not.toHaveProperty("Значение.РеквизитМинимальный.Синоним")
  })

  it("should export multilanguage object format", () => {
    expect(convertInline(MULTILANGUAGE_XML)).toEqual({
      Значение: { ТестовыйРеквизит: { Тип: "Строка", Синоним: { en: "Test attribute" } } },
    })
  })
})

const catalogOwner: readonly MetadataTargetOwnerContext[] = [
  { itemType: "MetadataCatalog" as const, name: "СправочникВладелец", owner: { root: "Catalog", objectName: "СправочникВладелец" } },
]

function convert(fixture: string, metadataTargetOwners?: readonly MetadataTargetOwnerContext[]) {
  return testPropertyFixtureThroughYAML({
    propertyType: "MetadataAttributes",
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture,
    metadataTargetOwners,
  })
}

function convertType(fixture: string, propertyType: string, metadataTargetOwners?: readonly MetadataTargetOwnerContext[]) {
  return testPropertyFixtureThroughYAML({
    propertyType,
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture,
    metadataTargetOwners,
  })
}

function convertInline(xmlString: string): unknown {
  return testPropertyFromXMLToYAML({
    rule,
    xml: importContentFromXML<Record<string, unknown>>(xmlString),
  }).yaml
}

function probeRule(type: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "Attribute" } },
  } as MetadataItemRule
}

const EMPTY_SYNONYM_XML = `<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1"><Properties><Name>ПравилаОтправкиДокументов</Name><Synonym/><Comment/><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type><PasswordMode>false</PasswordMode><Format/><EditFormat/><ToolTip/><MarkNegatives>false</MarkNegatives><Mask/><MultiLine>false</MultiLine><ExtendedEdit>false</ExtendedEdit><MinValue xsi:nil="true"/><MaxValue xsi:nil="true"/><FillFromFillingValue>false</FillFromFillingValue><FillValue xsi:type="xs:string"/><FillChecking>DontCheck</FillChecking><ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems><ChoiceParameterLinks/><ChoiceParameters/><QuickChoice>Auto</QuickChoice><CreateOnInput>Auto</CreateOnInput><ChoiceForm/><LinkByType/><ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput><Use>ForItem</Use><Indexing>DontIndex</Indexing><FullTextSearch>Use</FullTextSearch><DataHistory>Use</DataHistory></Properties></Attribute>`

const MULTILANGUAGE_XML = `<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1"><Properties><Name>ТестовыйРеквизит</Name><Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>Тестовый реквизит</v8:content></v8:item><v8:item><v8:lang>en</v8:lang><v8:content>Test attribute</v8:content></v8:item></Synonym><Type><v8:Type>xs:string</v8:Type></Type></Properties></Attribute>`
