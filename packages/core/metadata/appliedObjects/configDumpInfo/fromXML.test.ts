import { describe, expect, it } from "vitest"
import { idMap } from "~/tests/fixtures/configDumpInfo/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importConfigDumpInfoFromXML } from "./fromXML"
import type { ConfigDumpInfoXML } from "./types"

describe("importConfigDumpInfoFromXML", () => {
  it("should import idMap and configVersionMap from data.xml fixture", () => {
    const xmlData = readAndParseXMLFile<{ ConfigDumpInfo: ConfigDumpInfoXML }>("configDumpInfo/data.xml")

    const result = importConfigDumpInfoFromXML({ context: mockContext, xml: xmlData.ConfigDumpInfo })

    expect(result).toEqual(idMap)
  })

  it("читает пустой ConfigVersions как пустую карту", () => {
    const result = importConfigDumpInfoFromXML({
      context: mockContext,
      xml: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/dumpinfo",
        "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _format: "Hierarchical",
        _version: "2.20",
        ConfigVersions: {},
      },
    })

    expect(result).toEqual(new Map())
  })
})
