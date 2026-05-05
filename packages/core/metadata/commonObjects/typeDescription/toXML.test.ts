import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { exportTypeDescriptionToXML } from "./toXML"

describe("exportTypeDescriptionToXML", () => {
  it("should export undefined type description to XML", () => {
    const result = exportTypeDescriptionToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export type to XML: $internal.type", ({ internal, xml }) => {
    const resultXml = exportTypeDescriptionToXML(mockContext, mockRule, internal)

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(xml)
  })
})
