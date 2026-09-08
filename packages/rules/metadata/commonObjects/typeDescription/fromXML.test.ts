import { describe,expect,it } from "vitest"
import { mockContextFromXML,mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromXML } from "./fromXML"
import { exportTypeDescriptionToYAML } from "./toYAML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importTypeDescriptionFromXML", () => {
  it.each(["<Type/>", "<Type><v8:Type/></Type>", "<Type><v8:TypeSet/></Type>"])("does not create a type from empty XML: %s", (xml) => {
    expect(importTypeDescriptionFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toBeUndefined()
  })

  it("не сохраняет скрытую копию исходных XML-типов", () => {
    const source = parseStructuralXMLWithoutCompatibility('<Type><v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type></Type>')
    const value = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, source)
    expect(Object.getOwnPropertySymbols(value!)).toEqual([])
    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, value)).toBe("Диаграмма")
  })

  it("preserves type groups and repeated type IDs", () => {
    const source = parseStructuralXMLWithoutCompatibility('<Type><v8:TypeSet>cfg:AnyRef</v8:TypeSet><v8:Type>xs:string</v8:Type><v8:TypeId>id</v8:TypeId><v8:TypeId>id</v8:TypeId></Type>')
    expect(importTypeDescriptionFromXML(mockContextFromXML(), mockRule, source)).toEqual({ type: ["string", "AnyIBRef"], typeId: ["id", "id"] })
  })

  it.each(typeFixturesTable)("imports structural type: $internal.type", ({ internal, xml }) => {
    const source = parseStructuralXMLWithoutCompatibility(xml)
    expect(importTypeDescriptionFromXML(mockContextFromXML(), mockRule, source)).toEqual(internal)
  })

  it("should import undefined type description from XML", () => {
    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("не считает сложное содержимое идентификатором типа", () => {
    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule,
      parseStructuralXMLWithoutCompatibility('<Type><v8:TypeId><Value/></v8:TypeId></Type>'))
    expect(result).toBeUndefined()
  })


  it.each(["cfg:AnyRef", "cfg:AnyIBRef"])("imports %s as ЛюбаяСсылка", (xmlType) => {
    const xmlData = parseStructuralXMLWithoutCompatibility(
      `<Type><v8:TypeSet>${xmlType}</v8:TypeSet></Type>`
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual({ type: ["AnyIBRef"] })
    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("ЛюбаяСсылка")
  })

  it("imports a system enumeration with its canonical v8 prefix", () => {
    const xmlData = parseStructuralXMLWithoutCompatibility(
      "<Type><v8:Type>v8:FillChecking</v8:Type></Type>"
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result))
      .toBe("СистемноеПеречисление.ПроверкаЗаполнения")
  })

  it("should import ConditionalAppearance type from XML", () => {
    const xmlData = parseStructuralXMLWithoutCompatibility(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual({ type: ["ConditionalAppearance"] })
  })

  it("imports the meaning of a type with noncanonical XML prefix", () => {
    const xmlData = parseStructuralXMLWithoutCompatibility(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual({ type: ["Chart"] })
    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("Диаграмма")
  })

  it("does not mark the canonical type prefix", () => {
    const xmlData = parseStructuralXMLWithoutCompatibility(
      '<Type>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n</Type>'
    )

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(exportTypeDescriptionToYAML(mockContextFromXML(), mockRule, result)).toBe("Диаграмма")
  })

  it("reads the XML type collection once", () => {
    let reads = 0
    const xml = parseStructuralXMLWithoutCompatibility('<Type><v8:Type>xs:string</v8:Type></Type>')
    const content = xml.content
    Object.defineProperty(xml, "content", {
      enumerable: true,
      get: () => {
        reads++
        return content
      },
    })

    const result = importTypeDescriptionFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual({ type: ["string"] })
    expect(reads).toBe(1)
  })

})
