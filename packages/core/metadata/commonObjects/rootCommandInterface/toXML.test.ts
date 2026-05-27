import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { RootCommandInterfaceRules } from "./rules"

import "./register"

const commandInterfaceXmlPath = "/Users/nikita/git/roundTripElements/ext/CommandInterface.xml"
const mainSectionCommandInterfaceXmlPath = "/Users/nikita/git/roundTripElements/ext/MainSectionCommandInterface.xml"
const subsystemCommandInterfaceXmlPath =
  "/Users/nikita/git/roundTripElements/Subsystems/ПодсистемаВсеСвойства/Ext/CommandInterface.xml"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

const roundTripRootCommandInterface = (path: string) => {
  const xmlString = readFileSync(path, "utf-8")
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    rule: RootCommandInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

describe("export RootCommandInterface to XML", () => {
  it("round-trips root CommandInterface.xml", () => {
    expect(roundTripRootCommandInterface(commandInterfaceXmlPath)).toBe(
      normalizeXML(readFileSync(commandInterfaceXmlPath, "utf-8").trimEnd())
    )
  })

  it("round-trips MainSectionCommandInterface.xml", () => {
    expect(roundTripRootCommandInterface(mainSectionCommandInterfaceXmlPath)).toBe(
      normalizeXML(readFileSync(mainSectionCommandInterfaceXmlPath, "utf-8").trimEnd())
    )
  })

  it("round-trips subsystem CommandInterface.xml and keeps uuid-like command names", () => {
    const result = roundTripRootCommandInterface(subsystemCommandInterfaceXmlPath)
    const expected = normalizeXML(readFileSync(subsystemCommandInterfaceXmlPath, "utf-8").trimEnd())

    expect(result).toBe(expected)
    expect(result).toContain('name="0:2f109eaa-d341-4592-a04f-3f199e75d879"')
  })
})
