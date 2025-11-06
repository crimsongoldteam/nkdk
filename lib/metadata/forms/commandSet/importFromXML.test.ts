import { describe, it, expect } from "vitest"
import z from "zod"
import xmlImport from "~/lib/xml/import/importer"
import { importCommandSetFromXML } from "./importFromXML"
import { TCommandSet, TCommandSetXML, ZCommandSetXML } from "./types"


describe("importCommandSetFromXML", () => {
  it("should import command sets", () => {
    const mockXml = `
    <CommandSet>
		<ExcludedCommand>WriteAndClose</ExcludedCommand>
	</CommandSet>
    `

    const expectedResult: TCommandSet = ["WriteAndClose"  ]

    const xml = xmlImport<{ CommandSet: TCommandSetXML }>(mockXml, z.object({ CommandSet: ZCommandSetXML }))

    const result = importCommandSetFromXML(xml.CommandSet)

    expect(result).toEqual(expectedResult)
  })
})