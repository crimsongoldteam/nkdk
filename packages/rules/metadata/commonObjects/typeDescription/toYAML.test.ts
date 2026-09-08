import { describe,expect,it } from "vitest"
import { mockContext,mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { exportTypeDescriptionToYAML } from "./toYAML"
import { importTypeDescriptionFromXML } from "./fromXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { createXmlAnomalyAnnotations } from "@nkdk/runtime"

describe("exportTypeDescriptionToYAML", () => {
  it.each([
    [["UUID", "string"], [1]],
    [["string", "UUID", "boolean"], [1]],
    [["ValueStorage", "string", "boolean"], [1, 2]],
    [["DefinedType.Один", "DefinedType.Два"], [1]],
    [["Characteristic.Один", "boolean"], [1]],
    [["ExternalDataSourceTableRef.ВнешнийИсточникДанныхОдин.ТаблицаОдин", "boolean"], [1]],
    [["ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхОдин.КубОдин.ТаблицаИзмеренияОдин", "boolean"], [1]],
    [["string", "boolean"], []],
  ] as const)("помечает только несовместимые дополнительные типы %j", (types, invalidIndices) => {
    const annotations = createXmlAnomalyAnnotations()
    const yaml = exportTypeDescriptionToYAML(mockContext, mockRule, { type: [...types] }, annotations)
    expect([...annotations.entries()].filter(entry => entry.parent === yaml).map(entry => entry.key))
      .toEqual(invalidIndices)
  })
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

  it("не помечает !xml составной тип с каноническим префиксом cfg", () => {
    const value = importTypeDescriptionFromXML(mockContext, mockRule, parseStructuralXMLWithoutCompatibility(
      '<Type><v8:Type xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config">cfg:CatalogObject.Товары</v8:Type></Type>',
    ))

    expect(exportTypeDescriptionToYAML(mockContext, mockRule, value)).toBe("СправочникОбъект.Товары")
  })

  it("отклоняет несовместимый generated prefix ссылочного типа", () => {
    expect(() => importTypeDescriptionFromXML(mockContext, mockRule, parseStructuralXMLWithoutCompatibility(
      '<Type><v8:Type xmlns:d7p1="http://v8.1c.ru/8.1/data/enterprise/current-config">d7p1:CatalogRef.Товары</v8:Type></Type>',
    )))
      .toThrow("несовместимый XML-префикс d7p1")
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

  it("exports external data source table object explicit form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: ["ExternalDataSourceTableObject.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
      })
    ).toBe("ВнешнийИсточникДанныхТаблицаОбъект.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства")
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

  it("exports external data source cube record manager explicit form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: ["ExternalDataSourceCubeRecordManager.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства"],
      })
    ).toBe("ВнешнийИсточникДанныхКубМенеджерЗаписи.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства")
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
