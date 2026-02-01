import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { exportTypeDescriptionToXML } from "./exportToXML"

describe("exportTypeDescriptionToXML", () => {
  it("should export undefined type description to XML", () => {
    const result = exportTypeDescriptionToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export type to XML: $internal.type", ({ internal, xml }) => {
    const resultXml = exportTypeDescriptionToXML(mockContext, internal)

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(xml)
  })
})
