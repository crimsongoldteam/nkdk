import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = { type: "ViewStatusAddition" }

describe("exportViewStatusAdditionToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContextWithExportToXML = {
      ...mockContext,
      exportToXML: {
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
        configDumpInfo: new Map(),
        version: "2.20",
        context: {
          forms: [],
          templates: [],
          parentName: "",
        },
      },
    }
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/minimal.xml")

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: undefined,
    })

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context: ConfigurationContextWithExportToXML = {
      ...mockContext,
      exportToXML: {
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
        configDumpInfo: new Map(),
        version: "2.20",
        context: {
          forms: [],
          templates: [],
          parentName: "",
        },
      },
    }
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/full.xml").trimEnd()

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: fullViewStatusAddition,
    })

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
