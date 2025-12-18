import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importCommandSetFromXML } from "./importFromXML"
import { CommandSet, CommandSetXML } from "./types"

describe("importCommandSetFromXML", () => {
  it("should import single command set", () => {
    const mockXml = `<CommandSet>
		<ExcludedCommand>WriteAndClose</ExcludedCommand>
	</CommandSet>`

    const expectedResult: CommandSet = ["WriteAndClose"]

    const xml = xmlImport<{ CommandSet: CommandSetXML }>(mockXml)

    const result = importCommandSetFromXML(xml.CommandSet, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple command sets", () => {
    const mockXml = `<CommandSet>
		<ExcludedCommand>WriteAndClose</ExcludedCommand>
		<ExcludedCommand>Copy</ExcludedCommand>
		<ExcludedCommand>Delete</ExcludedCommand>
	</CommandSet>`

    const expectedResult: CommandSet = ["WriteAndClose", "Copy", "Delete"]

    const xml = xmlImport<{ CommandSet: CommandSetXML }>(mockXml)

    const result = importCommandSetFromXML(xml.CommandSet, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
