import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "./__fixtures__/table"
import { mockContext, mockRule } from "../../../tests/mockContext"
import type { ConfigurationContext } from "../../context/types"
import "../../appliedObjects/metadataCatalog/register"
import { importDataPathStandardMembersFromYAML } from "./dataPathStandardMembers"
import { importMetadataFieldStringFromYAML, importMetadataValueStringFromYAML } from "./fromYAML"

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("importMetadataFieldFromYAML", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })

  test("imports full field path with service segments", () => {
    expect(
      importMetadataFieldStringFromYAML(
        mockContext,
        mockRule,
        "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"
      )
    ).toBe("Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество")
  })

  test("rejects short field path without service segments", () => {
    expect(() =>
      importMetadataFieldStringFromYAML(mockContext, mockRule, "Справочник.Номенклатура.Количество")
    ).toThrow("Некорректный формат цели метаданных")
  })

  test("rejects English YAML root", () => {
    expect(() => importMetadataFieldStringFromYAML(mockContext, mockRule, "Catalog.Контрагенты")).toThrow(
      'Неизвестный корень "Catalog"'
    )
  })
})

describe("importMetadataValueStringFromYAML", () => {
  test.each(tableMetadataValues)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataValueStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })

  test("keeps user-defined value path segment that matches metadata type alias literal", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "Справочник.ИмяСправочника.ПланСчетов")).toBe(
      "Catalog.ИмяСправочника.ПланСчетов"
    )
  })

  test("converts real value path category and empty reference segments", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "ПланСчетов.Хозрасчетный.ПустаяСсылка")).toBe(
      "ChartOfAccounts.Хозрасчетный.EmptyRef"
    )
  })
})

describe("importDataPathStandardMembersFromYAML", () => {
  test("imports direct standard attribute of current object", () => {
    expect(importDataPathStandardMembersFromYAML(catalogContext(), "Объект.Владелец")).toBe("Объект.Owner")
  })

  test("keeps tabular section attribute with the same name", () => {
    expect(importDataPathStandardMembersFromYAML(catalogContext(), "Объект.Товары.Владелец")).toBe(
      "Объект.Товары.Владелец"
    )
  })

  test("preserves disabled data path prefix", () => {
    expect(importDataPathStandardMembersFromYAML(catalogContext(), "~Список.Владелец")).toBe("~Список.Owner")
  })
})

function catalogContext(): ConfigurationContext {
  const projectDir = catalogProjectDir()
  return {
    ...mockContext,
    importFromYAML: {
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Контрагенты" }],
      formAttributes: [
        { itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Контрагенты"] }, columns: [] },
        { itemType: "FormAttribute", name: "Список", type: { type: ["CatalogRef.Контрагенты"] }, columns: [] },
      ],
    },
  }
}

function catalogProjectDir(): string {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-metadata-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Контрагенты"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
  return projectDir
}
