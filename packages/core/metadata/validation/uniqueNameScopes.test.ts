import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import type { MetadataItem } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { validateUniqueNameScopes } from "./uniqueNameScopes"

type ValidationModel = MetadataItem & Record<string, unknown>

describe("validateUniqueNameScopes", () => {
  it("reports a catalog duplicate between attributes and tabular sections", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  ОбщееИмя:
    Тип: Строка
ТабличныеЧасти:
  ОбщееИмя:
    Реквизиты: {}
`)
    const model: ValidationModel = {
      itemType: "MetadataCatalog",
      attributes: [{ name: "ОбщееИмя" }],
      tabularSections: [{ name: "ОбщееИмя" }],
    }

    const diagnostics = validateUniqueNameScopes({
      filePath: "Справочник/Товары/Свойства.yaml",
      parsed,
      model,
      rule: MetadataCatalogRules,
    })

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: "Справочник/Товары/Свойства.yaml",
        line: 5,
        col: 3,
        path: "/ТабличныеЧасти/ОбщееИмя",
        severity: "error",
        source: "structure",
      }),
    ])
    expect(diagnostics[0]?.message).toContain("ОбщееИмя")
  })

  it("reports a register duplicate between attributes, dimensions and resources", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Остаток: Строка
Измерения:
  Склад:
    Тип: Строка
Ресурсы:
  Склад:
    Тип: Число
`)
    const model: ValidationModel = {
      itemType: "MetadataInformationRegister",
      attributes: [{ name: "Остаток" }],
      dimensions: [{ name: "Склад" }],
      resources: [{ name: "Склад" }],
    }

    const diagnostics = validateUniqueNameScopes({
      filePath: "РегистрСведений/Остатки/Свойства.yaml",
      parsed,
      model,
      rule: MetadataInformationRegisterRules,
    })

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics).toEqual([
      expect.objectContaining({
        line: 7,
        col: 3,
        path: "/Ресурсы/Склад",
        severity: "error",
        source: "structure",
      }),
    ])
  })

  it("treats names with different case as distinct", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Имя:
    Тип: Строка
ТабличныеЧасти:
  имя:
    Реквизиты: {}
`)
    const model: ValidationModel = {
      itemType: "MetadataCatalog",
      attributes: [{ name: "Имя" }],
      tabularSections: [{ name: "имя" }],
    }

    const diagnostics = validateUniqueNameScopes({
      filePath: "Справочник/Товары/Свойства.yaml",
      parsed,
      model,
      rule: MetadataCatalogRules,
    })

    expect(diagnostics).toEqual([])
  })

  it("points diagnostic to the second duplicate name key", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  ОбщееИмя:
    Тип: Строка
ТабличныеЧасти:
  ОбщееИмя:
    Реквизиты: {}
`)
    const model: ValidationModel = {
      itemType: "MetadataCatalog",
      attributes: [{ name: "ОбщееИмя" }],
      tabularSections: [{ name: "ОбщееИмя" }],
    }

    const [diagnostic] = validateUniqueNameScopes({
      filePath: "Справочник/Товары/Свойства.yaml",
      parsed,
      model,
      rule: MetadataCatalogRules,
    })

    expect(diagnostic).toEqual(
      expect.objectContaining({
        line: 5,
        col: 3,
        path: "/ТабличныеЧасти/ОбщееИмя",
      }),
    )
  })
})
