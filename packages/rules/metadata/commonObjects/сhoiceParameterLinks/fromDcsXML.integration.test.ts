import { describe, expect, it } from "vitest"
import { singleChoiceParameterLinks } from "./__fixtures__/single"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { importChoiceParameterLinkFromDcsXML, importChoiceParameterLinksFromDcsXML } from "./fromDcsXML"
import { ChoiceParameterLinkDcsValueRootXML } from "./types"
import {
  parseXmlDocumentWithSaxes,
} from "@nkdk/runtime"
import { testPropertiesYamlRoundTrip } from "../../../tests/directConversion"

describe("importChoiceParameterLinkFromDcsXML", () => {
  it("reads repeated structural links and their modes", () => {
    const xml = parseXmlDocumentWithSaxes('<dcscor:value><dcscor:item><dcscor:choiceParameter>Параметр</dcscor:choiceParameter><dcscor:value>Поле</dcscor:value><dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode></dcscor:item><dcscor:item><dcscor:choiceParameter>Другой</dcscor:choiceParameter><dcscor:value>Поле2</dcscor:value></dcscor:item></dcscor:value>').roots[0]!
    Object.defineProperty(xml, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importChoiceParameterLinksFromDcsXML(mockContextFromXML(), mockRule, xml)).toEqual([
      { name: "Параметр", dataPath: "Поле", valueChange: "DontChange" },
      { name: "Другой", dataPath: "Поле2", valueChange: undefined },
    ])
  })

  it("should import DCS fragment to ChoiceParameterLink", () => {
    const parsed = readAndParseXMLFixture<ChoiceParameterLinkDcsValueRootXML>(
      import.meta.url,
      "dcs/choiceParameterLinks.xml"
    )
    const expected = singleChoiceParameterLinks[0]

    const result = importChoiceParameterLinkFromDcsXML(mockContextFromXML(), mockRule, parsed)

    expect(result).toEqual(expected)
  })

  it("считает канонический xsi:type режима частью семантического значения", () => {
    const sourceXML = `<dcscor:value xsi:type="dcscor:ChoiceParameterLinks">
      <dcscor:item>
        <dcscor:choiceParameter>Параметр</dcscor:choiceParameter>
        <dcscor:value>Поле</dcscor:value>
        <dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode>
      </dcscor:item>
    </dcscor:value>`
    const result = testPropertiesYamlRoundTrip({
      sourceXML,
      rule: { itemType: "ChoiceLinksProbe", properties: {
        links: { type: "MetadataDcsMetadataValue", valueType: "ChoiceParameterLinks", xml: "dcscor:value", yaml: "Связи" },
      } },
    })
    expect(result.yamlText).not.toContain("!xml/")
    expect(parseXmlDocumentWithSaxes(result.result).roots[0]!.structuralHash)
      .toEqual(parseXmlDocumentWithSaxes(sourceXML).roots[0]!.structuralHash)
  })
})
