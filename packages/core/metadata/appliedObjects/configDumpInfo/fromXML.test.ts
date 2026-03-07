import { describe, expect, it } from "vitest"
import { configVersionMap, idMap } from "~/tests/fixtures/configDumpInfo/data"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importConfigDumpInfoFromXML } from "./fromXML"
import type { ConfigDumpInfoXML } from "./types"
import { mockContext } from "~/tests/mockContext"

describe("importConfigDumpInfoFromXML", () => {
  it("should import idMap and configVersionMap from data.xml fixture", () => {
    const xmlData = readAndParseXMLFile<{ ConfigDumpInfo: ConfigDumpInfoXML }>("configDumpInfo/data.xml")

    const result = importConfigDumpInfoFromXML({ context: mockContext, xml: xmlData.ConfigDumpInfo })

    expect(result.idMap).toEqual(idMap)
    expect(result.configVersionMap).toEqual(configVersionMap)
  })
})
