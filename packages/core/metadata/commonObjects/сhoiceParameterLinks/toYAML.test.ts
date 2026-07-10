import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import type { ConfigurationContext } from "../../context/types"

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})
import "../../appliedObjects/metadataCatalog/register"
import { exportChoiceParameterLinksToYAML } from "./toYAML"
import { ChoiceParameterLinks } from "./types"

describe("exportToYAML", () => {
  it("should export single link", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
        valueChange: "Clear",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
      },
    ])
  })

  it("should export multiple links to yaml", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "Clear",
      },
      {
        name: "Отбор.Владелец2",
        dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
        valueChange: "Clear",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник1.Attribute.Реквизит1",
      },
      {
        Имя: "Отбор.Владелец2",
        ПутьКДанным: "Catalog.Справочник2.Attribute.Реквизит2",
      },
    ])
  })

  it("should export with `DontChange` parameter", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)
    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник1.Attribute.Реквизит1",
        РежимИзменения: "НеИзменять",
      },
    ])
  })

  it("exports structured links without translating dataPath", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов",
        valueChange: "Clear",
      },
      {
        name: "Отбор.Характеристика",
        dataPath: "Характеристика",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)

    expect(result).toEqual([
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов",
      },
      {
        Имя: "Отбор.Характеристика",
        ПутьКДанным: "Характеристика",
        РежимИзменения: "НеИзменять",
      },
    ])
  })

  it("exports standard member in dataPath", () => {
    const result = exportChoiceParameterLinksToYAML(catalogContext(), mockRule, [
      {
        name: "Отбор.Владелец",
        dataPath: "Объект.Owner",
        valueChange: "Clear",
      },
    ])

    expect(result).toEqual([
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Объект.Владелец",
      },
    ])
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
      ],
    },
  }
}

function catalogProjectDir(): string {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-choice-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Контрагенты"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
  return projectDir
}
