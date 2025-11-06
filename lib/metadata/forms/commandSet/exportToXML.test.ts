import { describe, it, expect } from "vitest"
import { TCommandSet, TCommandSetXML, ZCommandSetXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import { exportCommandSetToXML } from "./exportToXML"
import { importCommandSetFromXML } from "./importFromXML"
import z from "zod"

describe("exportCommandSetToXML", () => {
  it("should export command set", () => {
    const mockData: TCommandSet = ["WriteAndClose"]
    const expectedResult = `<CommandSet>
	<ExcludedCommand>WriteAndClose</ExcludedCommand>
</CommandSet>`

    const exported = exportCommandSetToXML(mockData)
    const resultXml = xmlExport(
      { CommandSet: exported },
      z.object({ CommandSet: ZCommandSetXML }),
      false
    )
    expect(resultXml).toEqual(expectedResult)
  })

  it("should export and import multiple command sets correctly (round-trip)", () => {
    const mockXml = `<CommandSet>
	<ExcludedCommand>WriteAndClose</ExcludedCommand>
	<ExcludedCommand>Copy</ExcludedCommand>
	<ExcludedCommand>Delete</ExcludedCommand>
</CommandSet>`

    const xml = xmlImport<{ CommandSet: TCommandSetXML }>(
      mockXml,
      z.object({ CommandSet: ZCommandSetXML })
    )
    const imported = importCommandSetFromXML(xml.CommandSet)
    const exported = exportCommandSetToXML(imported)

    const resultXml = xmlExport(
      { CommandSet: exported },
      z.object({ CommandSet: ZCommandSetXML }),
      false
    )
    expect(resultXml).toEqual(mockXml)
  })
})
