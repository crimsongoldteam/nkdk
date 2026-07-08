import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "./__fixtures__/table"
import { mockContext, mockRule } from "../../../tests/mockContext"
import type { ConfigurationContext } from "../../context/types"
import "../../appliedObjects/metadataCatalog/register"
import { exportDataPathStandardMembersToYAML } from "./dataPathStandardMembers"
import { exportMetadataFieldStringToYAML, exportMetadataValueStringToYAML } from "./toYAML"

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("exportMetadataFieldToYAML", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })

  test("exports full field path with service segments", () => {
    expect(
      exportMetadataFieldStringToYAML(
        mockContext,
        mockRule,
        "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество"
      )
    ).toBe("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")
  })

  test("keeps user-defined field path segment that matches metadata type alias literal", () => {
    expect(exportMetadataFieldStringToYAML(mockContext, mockRule, "Document.Продажа.Attribute.Документ")).toBe(
      "Документ.Продажа.Реквизит.Документ"
    )
  })
})

describe("exportMetadataValueStringToYAML", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })

  test("keeps user-defined value path segment that matches metadata type alias literal", () => {
    expect(exportMetadataValueStringToYAML(mockContext, mockRule, "Catalog.ИмяСправочника.ПланСчетов")).toBe(
      "Справочник.ИмяСправочника.ПланСчетов"
    )
  })
})

describe("exportDataPathStandardMembersToYAML", () => {
  test("exports direct standard attribute of current object", () => {
    expect(exportDataPathStandardMembersToYAML(catalogContext(), "Объект.Owner")).toBe("Объект.Владелец")
  })

  test("keeps tabular section attribute with the same name", () => {
    expect(exportDataPathStandardMembersToYAML(catalogContext(), "Объект.Товары.Owner")).toBe("Объект.Товары.Owner")
  })

  test("preserves disabled data path prefix", () => {
    expect(exportDataPathStandardMembersToYAML(catalogContext(), "~Список.Owner")).toBe("~Список.Владелец")
  })
})

function catalogContext(): ConfigurationContext {
  const projectDir = catalogProjectDir()
  return {
    ...mockContext,
    exportToYAML: {
      toTyped: false,
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
