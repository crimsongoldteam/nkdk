import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { exportTypeDescriptionToYAML } from "./toYAML"

describe("exportTypeDescriptionToYAML", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export composite type to YAML: $YAML", ({ internal, YAML: YAML }) => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, internal)
    expect(result).toEqual(YAML)
  })

  it("should export known system enumeration type to explicit YAML form", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, { type: ["FillChecking"] })

    expect(result).toEqual("СистемноеПеречисление.ПроверкаЗаполнения")
  })

  it("should throw on unknown non-enumeration type during YAML export", () => {
    expect(() => exportTypeDescriptionToYAML(mockContext, mockRule, { type: ["DefinitelyUnknownType"] })).toThrow(
      "Type DefinitelyUnknownType not found in TypeDescriptionRules"
    )
  })

  it("should throw on system enumeration type with complex suffix during YAML export", () => {
    expect(() => exportTypeDescriptionToYAML(mockContext, mockRule, { type: ["FillChecking.Anything"] })).toThrow(
      "Type FillChecking.Anything not found in TypeDescriptionRules"
    )
  })
})

describe("external data source TypeDescription YAML export", () => {
  it("exports external data source table short form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: ["ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
      })
    ).toBe("ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства")
  })

  it("exports external data source cube dimension table short form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: [
          "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
        ],
      })
    ).toBe("ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства")
  })

  it.each([
    "ExternalDataSourceTableRef.Справочник.Контрагенты",
    "ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
    "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства",
  ])("throws on invalid external data source path %s", (type) => {
    expect(() => exportTypeDescriptionToYAML(mockContext, mockRule, { type: [type] })).toThrow(
      `Type ${type} not found in TypeDescriptionRules`
    )
  })

  it.each([
    {
      yaml: "ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства",
      type: "ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства",
    },
    {
      yaml: "ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
      type: "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
    },
  ])("round-trips external data source short form $yaml", ({ yaml, type }) => {
    const internal = importTypeDescriptionFromYAML(mockContext, mockRule, yaml)

    expect(internal).toEqual({ type: [type] })
    expect(exportTypeDescriptionToYAML(mockContext, mockRule, internal)).toBe(yaml)
  })
})
