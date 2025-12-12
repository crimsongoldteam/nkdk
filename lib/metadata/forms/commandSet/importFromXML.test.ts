import { describe, it, expect } from "vitest"
import z from "zod"
import xmlImport from "~/lib/xml/import/importer"
import { importCommandSetFromXML } from "./importFromXML"
import { CommandSet, CommandSetXML, ZCommandSetXML } from "./types"

describe("importCommandSetFromXML", () => {
  it("should import single command set", () => {
    const mockXml = `<CommandSet>
		<ExcludedCommand>WriteAndClose</ExcludedCommand>
	</CommandSet>`

    const expectedResult: CommandSet = ["WriteAndClose"]

    const xml = xmlImport<{ CommandSet: CommandSetXML }>(
      mockXml,
      z.object({ CommandSet: ZCommandSetXML })
    )

    const result = importCommandSetFromXML(xml.CommandSet)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple command sets", () => {
    const mockXml = `<CommandSet>
		<ExcludedCommand>WriteAndClose</ExcludedCommand>
		<ExcludedCommand>Copy</ExcludedCommand>
		<ExcludedCommand>Delete</ExcludedCommand>
	</CommandSet>`

    const expectedResult: CommandSet = ["WriteAndClose", "Copy", "Delete"]

    const xml = xmlImport<{ CommandSet: CommandSetXML }>(
      mockXml,
      z.object({ CommandSet: ZCommandSetXML })
    )

    const result = importCommandSetFromXML(xml.CommandSet)

    expect(result).toEqual(expectedResult)
  })
})
