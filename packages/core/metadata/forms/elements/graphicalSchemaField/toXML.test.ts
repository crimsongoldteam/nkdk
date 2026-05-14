import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { GraphicalSchemaField } from "./types"

describe("export GraphicalSchemaField to XML", () => {
  it("exports XML-only Edit value", () => {
    const element: GraphicalSchemaField = {
      itemType: "GraphicalSchemaField",
      name: "Схема",
      edit: false,
    }

    const xmlData = exportElementToXML({
      context: mockContextToXML(),
      element,
    })
    const result = xmlExport({ GraphicalSchemaField: xmlData }, false)

    expect(result).toContain("<Edit>false</Edit>")
  })
})
