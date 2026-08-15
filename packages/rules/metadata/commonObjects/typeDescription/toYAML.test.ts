import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { exportTypeDescriptionToYAML } from "./toYAML"
import { TYPE_DESCRIPTION_SOURCE_TYPES } from "./types"
import { isTaggedYAMLScalar, xmlAnomalyTagValue, yamlScalarTagAt } from "@nkdk/runtime"

describe("exportTypeDescriptionToYAML", () => {
  const firstTypeId = "8c1e3694-da12-44d5-8b1f-d134b89a1282"
  const secondTypeId = "6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c"

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

  it("exports a single TypeId as an exact !xml/reference scalar", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, { type: [], typeId: [firstTypeId] })

    expect(isTaggedYAMLScalar(result)).toBe(true)
    if (!isTaggedYAMLScalar(result)) throw new Error("Expected tagged TypeId")
    expect(result.value).toBe(xmlAnomalyTagValue("xml/reference", firstTypeId))
    expect(result.tag).toBe("xml/reference")
  })

  it("exports ordinary types before exact !xml/reference TypeIds", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, {
      type: ["string"],
      typeId: [firstTypeId, secondTypeId],
    })

    expect(result).toEqual([
      "Строка",
      xmlAnomalyTagValue("xml/reference", firstTypeId),
      xmlAnomalyTagValue("xml/reference", secondTypeId),
    ])
    expect(yamlScalarTagAt(result as unknown[], 0)).toBeUndefined()
    expect(yamlScalarTagAt(result as unknown[], 1)).toBe("xml/reference")
    expect(yamlScalarTagAt(result as unknown[], 2)).toBe("xml/reference")
  })

  it("не помечает !xml составной тип с каноническим префиксом cfg", () => {
    const value = { type: ["CatalogObject.Товары"] }
    Object.defineProperty(value, TYPE_DESCRIPTION_SOURCE_TYPES, {
      value: {
        "CatalogObject.Товары": {
          value: "cfg:CatalogObject.Товары",
          namespace: "http://v8.1c.ru/8.1/data/enterprise/current-config",
        },
      },
    })

    expect(exportTypeDescriptionToYAML(mockContext, mockRule, value)).toBe("СправочникОбъект.Товары")
  })

  it("отклоняет несовместимый generated prefix ссылочного типа", () => {
    const value = { type: ["CatalogRef.Товары"] }
    Object.defineProperty(value, TYPE_DESCRIPTION_SOURCE_TYPES, {
      value: {
        "CatalogRef.Товары": {
          value: "d7p1:CatalogRef.Товары",
          namespace: "http://v8.1c.ru/8.1/data/enterprise/current-config",
        },
      },
    })

    expect(() => exportTypeDescriptionToYAML(mockContext, mockRule, value))
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
