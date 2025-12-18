import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportCommandSetToXML } from "./exportToXML"
import { importCommandSetFromXML } from "./importFromXML"
import { CommandSet, CommandSetXML } from "./types"

describe("exportCommandSetToXML", () => {
  it("should export command set", () => {
    const mockData: CommandSet = ["WriteAndClose"]
    const expectedResult = `<CommandSet>
	<ExcludedCommand>WriteAndClose</ExcludedCommand>
</CommandSet>`

    const exported = exportCommandSetToXML(mockData, mockConfigurationSettings)
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
    const imported = importCommandSetFromXML(xml.CommandSet, mockConfigurationSettings)
    const exported = exportCommandSetToXML(imported, mockConfigurationSettings)

    const resultXml = xmlExport({ CommandSet: exported }, false)
    expect(resultXml).toEqual(mockXml)
  })
})
