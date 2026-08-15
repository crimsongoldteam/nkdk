import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importContentFromXML } from "@nkdk/runtime"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromXML } from "./fromXML"
import { exportTypeDescriptionToYAML } from "./toYAML"
import { isTaggedYAMLScalar, xmlAnomalyTagPayload } from "@nkdk/runtime"
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

  it.each(["cfg:AnyRef", "cfg:AnyIBRef"])("imports %s as ЛюбаяСсылка", (xmlType) => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      `<Type><v8:TypeSet>${xmlType}</v8:TypeSet></Type>`
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(result).toEqual({ type: ["AnyIBRef"] })
    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("ЛюбаяСсылка")
  })

  it("imports a system enumeration with its canonical v8 prefix", () => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      "<Type><v8:Type>v8:FillChecking</v8:Type></Type>"
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result))
      .toBe("СистемноеПеречисление.ПроверкаЗаполнения")
  })

  it("should import ConditionalAppearance type from XML", () => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(result).toEqual({ type: ["ConditionalAppearance"] })
  })

  it("should import type with reference prefix spelling from XML", () => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(result).toEqual({ type: ["Chart"] })
    const yaml = exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)
    expect(isTaggedYAMLScalar(yaml)).toBe(true)
    if (!isTaggedYAMLScalar(yaml)) throw new Error("Expected !xml scalar")
    expect(yaml.tag).toBe("xml/type")
    expect(xmlAnomalyTagPayload("xml/type", yaml.value as string)).toBe("d7p1:Диаграмма")
  })

  it("does not mark the canonical type prefix", () => {
    const xmlData = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData.Type)

    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("Диаграмма")
  })

  it("reads the XML type collection once", () => {
    let reads = 0
    const xml = Object.defineProperty({} as TypeDescriptionXML, "v8:Type", {
      enumerable: true,
      get: () => {
        reads++
        return "xs:string"
      },
    })

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual({ type: ["string"] })
    expect(reads).toBe(1)
  })

})
