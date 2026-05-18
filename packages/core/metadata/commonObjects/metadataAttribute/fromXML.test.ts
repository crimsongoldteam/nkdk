import { describe, expect, it } from "vitest"
import {
  documentFromXML,
  documentTabularFromXML,
  fullFromXML,
  minimalFromXML,
  multipleFromXML,
} from "./__fixtures__/data"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataAttributes", xml: "Attribute" } as const

describe("import MetadataAttributes from XML", () => {
  it("should import minimal", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(minimalFromXML)
  })

  it("should import multiple attributes", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multiple.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(multipleFromXML)
  })

  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullFromXML)
  })

  it("imports explicit empty Synonym as empty i18n text", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "Attribute",
      xmlString:
        '<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1">' +
        "<Properties>" +
        "<Name>ПравилаОтправкиДокументов</Name>" +
        "<Synonym/>" +
        "<Comment/>" +
        "<Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type>" +
        "<PasswordMode>false</PasswordMode>" +
        "<Format/>" +
        "<EditFormat/>" +
        "<ToolTip/>" +
        "<MarkNegatives>false</MarkNegatives>" +
        "<Mask/>" +
        "<MultiLine>false</MultiLine>" +
        "<ExtendedEdit>false</ExtendedEdit>" +
        '<MinValue xsi:nil="true"/>' +
        '<MaxValue xsi:nil="true"/>' +
        "<FillFromFillingValue>false</FillFromFillingValue>" +
        '<FillValue xsi:type="xs:string"/>' +
        "<FillChecking>DontCheck</FillChecking>" +
        "<ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems>" +
        "<ChoiceParameterLinks/>" +
        "<ChoiceParameters/>" +
        "<QuickChoice>Auto</QuickChoice>" +
        "<CreateOnInput>Auto</CreateOnInput>" +
        "<ChoiceForm/>" +
        "<LinkByType/>" +
        "<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>" +
        "<Use>ForItem</Use>" +
        "<Indexing>DontIndex</Indexing>" +
        "<FullTextSearch>Use</FullTextSearch>" +
        "<DataHistory>Use</DataHistory>" +
        "</Properties>" +
        "</Attribute>",
    })

    expect(result).toEqual([
      {
        ...minimalFromXML[0],
        name: "ПравилаОтправкиДокументов",
        synonym: { items: {} },
      },
    ])
  })

  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<Root/>",
      xmlRootTag: "Root",
    })
    expect(result).toBeUndefined()
  })
})

describe("import MetadataDocumentAttributes from XML", () => {
  const documentRule = { type: "MetadataDocumentAttributes", xml: "Attribute" } as const

  it("should import document", () => {
    const result = testImportPropertyFromXML({
      rule: documentRule,
      path: "document.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(documentFromXML)
  })
})

describe("import MetadataTabularSectionAttributes from XML", () => {
  const tabularRule = { type: "MetadataTabularSectionAttributes", xml: "Attribute" } as const

  it("should import documentTabular", () => {
    const result = testImportPropertyFromXML({
      rule: tabularRule,
      path: "documentTabular.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(documentTabularFromXML)
  })
})
