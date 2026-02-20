import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { importTypeDescriptionFromXML } from "./fromXML"
import { TypeDescriptionXML } from "./types"

describe("importTypeDescriptionFromXML", () => {
  it("should import undefined type description from XML", () => {
    const result = importTypeDescriptionFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from XML: $internal.type", ({ internal, xml }) => {
    const xmlData = importContentFromXML<{ TypeDescription?: TypeDescriptionXML; Type?: TypeDescriptionXML }>(xml)
    const typeDescription = xmlData.TypeDescription || xmlData.Type
    const result = importTypeDescriptionFromXML(mockContext, mockRule, typeDescription)

    expect(result).toEqual(internal)
  })
})
