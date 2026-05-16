import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromXML } from "./fromXML"
import { TypeDescriptionXML } from "./types"

describe("importTypeDescriptionFromXML", () => {
  it("should import undefined type description from XML", () => {
    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should ignore non-string type ids from XML", () => {
    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, {
      "v8:TypeId": 123,
    } as unknown as TypeDescriptionXML)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from XML: $internal.type", ({ internal, xml }) => {
    const xmlData = importContentFromXML<{ TypeDescription?: TypeDescriptionXML; Type?: TypeDescriptionXML }>(xml)
    const typeDescription = xmlData.TypeDescription || xmlData.Type
    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, typeDescription)

    expect(result).toEqual(internal)
  })

  it("should import ConditionalAppearance type from XML", () => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(result).toEqual({ type: ["ConditionalAppearance"] })
  })
})
