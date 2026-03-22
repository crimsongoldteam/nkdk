import { describe, expect, it } from "vitest"
import { dcsDecimalChoiceParameter } from "~/metadata/commonObjects/сhoiceParameters/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceParameterToDcsXML } from "./toDcsXML"

describe("exportChoiceParameterToDcsXML", () => {
  it("should export single ChoiceParameter to DCS fragment", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "dcs/full.xml")

    const exported = exportChoiceParameterToDcsXML(mockContext, mockRule, dcsDecimalChoiceParameter)
    const xmlString = xmlExport(exported, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
