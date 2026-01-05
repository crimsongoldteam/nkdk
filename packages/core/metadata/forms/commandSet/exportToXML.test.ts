import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { xmlImport } from "~/xml/import/importer"
import { exportCommandSetToXML } from "./exportToXML"
import { importCommandSetFromXML } from "./importFromXML"
import { CommandSet, CommandSetXML } from "./types"

describe("exportCommandSetToXML", () => {
  it("should export command set", () => {
    const mockData: CommandSet = ["WriteAndClose"]
    const expectedResult = `<CommandSet>
	<ExcludedCommand>WriteAndClose</ExcludedCommand>
</CommandSet>`

    const exported = exportCommandSetToXML(mockСontext, mockData)
    const resultXml = xmlExport({ CommandSet: exported }, false)
    expect(resultXml).toEqual(expectedResult)
  })

  it("should export and import multiple command sets correctly (round-trip)", () => {
    const mockXml = `<CommandSet>
	<ExcludedCommand>WriteAndClose</ExcludedCommand>
	<ExcludedCommand>Copy</ExcludedCommand>
	<ExcludedCommand>Delete</ExcludedCommand>
</CommandSet>`

    const xml = xmlImport<{ CommandSet: CommandSetXML }>(mockXml)
    const imported = importCommandSetFromXML(mockСontext, xml.CommandSet)
    const exported = exportCommandSetToXML(mockСontext, imported)

    const resultXml = xmlExport({ CommandSet: exported }, false)
    expect(resultXml).toEqual(mockXml)
  })
})
