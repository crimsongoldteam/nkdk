import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { TypeDescriptionYAML } from "./types"

const importUnsafeTypeDescriptionFromYAML = (value: unknown) =>
  importTypeDescriptionFromYAML(mockContext, mockRule, value as TypeDescriptionYAML)

const restrictedCatalogAttributeRule = {
  type: "TypeDescription",
  allowedTypes: [
    "string",
    "decimal",
    "date",
    "boolean",
    "ValueStorage",
    "UUID",
    "CatalogRef",
    "CatalogRef.*",
    "DefinedType.*",
  ],
} as const

describe("importTypeDescriptionFromYAML", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "   ")
    expect(result).toBeUndefined()
  })

  it("should parse empty type ids as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, { ИдентификаторТипа: [] })
    expect(result).toBeUndefined()
  })

  it("should ignore string type ids property from YAML", () => {
    const result = importUnsafeTypeDescriptionFromYAML({ ИдентификаторТипа: "8c1e3694-da12-44d5-8b1f-d134b89a1282" })
    expect(result).toBeUndefined()
  })

  it("should ignore non-string type ids from YAML", () => {
    const result = importUnsafeTypeDescriptionFromYAML({ ИдентификаторТипа: [123] })
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from YAML: $enterprise", ({ internal, YAML: enterprise }) => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(internal)
  })

  it("should import known system enumeration type from explicit YAML form", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "СистемноеПеречисление.ПроверкаЗаполнения")

    expect(result).toEqual({ type: ["FillChecking"] })
  })

  it("should keep system enumeration type with complex suffix unchanged during YAML import", () => {
    const result = importTypeDescriptionFromYAML(
      mockContext,
      mockRule,
      "СистемноеПеречисление.ПроверкаЗаполнения.Anything"
    )

    expect(result).toEqual({ type: ["СистемноеПеречисление.ПроверкаЗаполнения.Anything"] })
  })
})

describe("importTypeDescriptionFromYAML with allowedTypes", () => {
  it("imports allowed primitive and catalog reference values", () => {
    expect(
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, [
        "Строка(10)",
        "Справочник",
        "Справочник.Контрагенты",
      ])
    ).toEqual({
      type: ["string", "CatalogRef", "CatalogRef.Контрагенты"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    })
  })

  it("rejects unknown type strings", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "НесуществующийТип")
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects single-only values inside composite arrays", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, ["Строка", "ХранилищеЗначения"])
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects type id object when allowedTypes is set", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, {
        ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"],
      })
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects invalid primitive parameter syntax", () => {
    expect(() => importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "Число(abc, 2)")).toThrow(
      "TypeDescription YAML value is not allowed by rule.allowedTypes"
    )
  })
})

const externalDataSourceRule = {
  type: "TypeDescription",
  allowedTypes: ["ExternalDataSourceTableRef.*", "ExternalDataSourceCubeDimensionTableRef.*"],
} as const

describe("external data source TypeDescription YAML import", () => {
  it("imports external data source table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
    })
  })

  it("imports external data source table object explicit form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        { type: "TypeDescription" },
        "ВнешнийИсточникДанныхТаблицаОбъект.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceTableObject.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
    })
  })

  it("imports external data source cube dimension table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства"
      )
    ).toEqual({
      type: [
        "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
      ],
    })
  })

  it("imports external data source cube record manager explicit form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        { type: "TypeDescription" },
        "ВнешнийИсточникДанныхКубМенеджерЗаписи.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceCubeRecordManager.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства"],
    })
  })
})
