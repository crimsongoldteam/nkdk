import { describe, expect, it } from "vitest"
import { idMap } from "~/metadata/appliedObjects/configDumpInfo/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportConfigDumpInfoToXML } from "./toXML"

describe("exportConfigDumpInfoToXML", () => {
  it("export then import equals fixture idMap and configVersionMap", () => {
    const expectedResult = readXMLFileAsString("configDumpInfo/data.xml")
    const result = exportConfigDumpInfoToXML({
      context: mockContext,
      idMap: idMap,
    })

    const resultString = xmlExport({ ConfigDumpInfo: result })

    expect(resultString).toEqual(expectedResult)
  })

  it("пишет пустой ConfigVersions без Metadata", () => {
    const result = exportConfigDumpInfoToXML({
      context: mockContext,
      idMap: new Map(),
    })

    const resultString = xmlExport({ ConfigDumpInfo: result })

    expect(resultString).toContain("<ConfigVersions/>")
    expect(resultString).not.toContain("<Metadata")
  })
})
