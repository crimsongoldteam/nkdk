import { describe, expect, it } from "vitest"
import { singleChoiceParameterLinks } from "~/metadata/commonObjects/сhoiceParameterLinks/__fixtures__/single"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { exportToDcsXML } from "./toDcsXML"

describe("exportToDcsXML", () => {
  it("should export single ChoiceParameterLink to DCS fragment", () => {
    const link = singleChoiceParameterLinks[0]
    const expectedResult = readXMLFixtureAsString(import.meta.url, "dcs/choiceParameterLinks.xml")

    const exported = exportToDcsXML(mockContext, mockRule, link)
    const xmlString = xmlExport(exported, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
