import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { typeFixturesTable } from "./__fixtures__/data"
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

  it.each([
    ["ConstantValueManager.ИспользоватьНачислениеЗарплаты", "cfg:ConstantValueManager.ИспользоватьНачислениеЗарплаты"],
    ["AccumulationRegisterRecordSet.РасчетыСКлиентами", "cfg:AccumulationRegisterRecordSet.РасчетыСКлиентами"],
    ["SequenceRecordSet.ДокументыОрганизаций", "cfg:SequenceRecordSet.ДокументыОрганизаций"],
    ["CatalogManager", "cfg:CatalogManager"],
    ["DocumentManager", "cfg:DocumentManager"],
    ["FixedStructure", "v8:FixedStructure"],
    ["FixedArray", "v8:FixedArray"],
    ["FixedMap", "v8:FixedMap"],
    ["Field", "dcscor:Field"],
    ["ComparisonType", "ent:ComparisonType"],
    ["DataCompositionComparisonType", "dcsset:DataCompositionComparisonType"],
  ])("should export generated platform type to XML: %s", (type, xmlType) => {
    const resultXml = exportTypeDescriptionToXML(mockContext, mockRule, { type: [type] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(`<TypeDescription>\n\t<v8:Type>${xmlType}</v8:Type>\n</TypeDescription>`)
  })

  it("should export known system enumeration type to XML with v8 prefix", () => {
    const resultXml = exportTypeDescriptionToXML(mockContext, mockRule, { type: ["FillChecking"] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual("<TypeDescription>\n\t<v8:Type>v8:FillChecking</v8:Type>\n</TypeDescription>")
  })

  it("should throw on unknown non-enumeration type during XML export", () => {
    expect(() =>
      exportTypeDescriptionToXML(mockContext, mockRule, { type: ["DefinitelyUnknownType"] })
    ).toThrow("Type DefinitelyUnknownType not found in TypeDescriptionRules")
  })
})
