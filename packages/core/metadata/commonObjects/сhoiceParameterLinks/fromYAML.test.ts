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
import { importChoiceParameterLinksFromYAML } from "./fromYAML"

describe("importFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single link", () => {
    const yaml =
      "Отбор.Владелец(Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект)"

    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект",
        valueChange: "Clear",
      },
    ])
  })

  it("should import multiple links from yaml", () => {
    const yaml =
      "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"

    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
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
    ])
  })

  it("should import with `DontChange` parameter", () => {
    const yaml = "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1, НеИзменять)"

    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
    ])
  })

  it("should import multiple links with one having DontChange", () => {
    const yaml =
      "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1, НеИзменять), Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)"

    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "DontChange",
      },
      {
        name: "Отбор.Владелец2",
        dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
        valueChange: "Clear",
      },
    ])
  })

  it("imports structured links with raw dataPath", () => {
    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, [
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов",
      },
    ])

    expect(result).toEqual([
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов",
        valueChange: "Clear",
      },
    ])
  })

  it("imports structured links with DontChange", () => {
    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, [
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов.Ref",
        РежимИзменения: "НеИзменять",
      },
    ])

    expect(result).toEqual([
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов.Ref",
        valueChange: "DontChange",
      },
    ])
  })

  it("imports structured standard member in dataPath", () => {
    const result = importChoiceParameterLinksFromYAML(catalogContext(), mockRule, [
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Объект.Владелец",
      },
    ])

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Объект.Owner",
        valueChange: "Clear",
      },
    ])
  })

  it("imports string standard member in dataPath", () => {
    const result = importChoiceParameterLinksFromYAML(catalogContext(), mockRule, "Отбор.Владелец(Объект.Владелец)")

    expect(result).toEqual([
      {
        name: "Отбор.Владелец",
        dataPath: "Объект.Owner",
        valueChange: "Clear",
      },
    ])
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
