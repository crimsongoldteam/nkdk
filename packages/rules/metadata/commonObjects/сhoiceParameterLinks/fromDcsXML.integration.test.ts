import { describe, expect, it } from "vitest"
import { singleChoiceParameterLinks } from "./__fixtures__/single"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { importChoiceParameterLinkFromDcsXML } from "./fromDcsXML"
import { ChoiceParameterLinkDcsValueRootXML } from "./types"
import {
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  xmlImportCompatibilityContainer,
} from "@nkdk/runtime"

describe("importChoiceParameterLinkFromDcsXML", () => {
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
    const root = parseXmlDocumentWithSaxes(`<dcscor:value xsi:type="dcscor:ChoiceParameterLinks">
      <dcscor:item>
        <dcscor:choiceParameter>Параметр</dcscor:choiceParameter>
        <dcscor:value>Поле</dcscor:value>
        <dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode>
      </dcscor:item>
    </dcscor:value>`).roots[0]!
    const audit = createXmlImportAuditSession([root])
    const xml = xmlImportCompatibilityContainer({
      node: root,
      audit,
      boundary: { itemType: "Owner", yamlPath: ["Связи"] },
    }) as ChoiceParameterLinkDcsValueRootXML["dcscor:value"]

    importChoiceParameterLinkFromDcsXML(
      mockContextFromXML(),
      mockRule,
      { "dcscor:value": xml },
    )
    audit.finalize()

    expect(audit.outcomes().find(
      ({ node }) => !("type" in node) && node.name === "xsi:type" && node.path.includes("dcscor:mode"),
    )?.state).toBe("claimed")
  })
})
