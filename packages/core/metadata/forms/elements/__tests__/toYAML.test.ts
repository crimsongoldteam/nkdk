import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import type { CollectableElement, TypedFormElement } from "~/metadata/orchestration"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { exportChildItemToTreeNodeYAML } from "../../commonObjects/childItems/treeYAML"
import { groupedFixtures, groupedTypedFixtures } from "./fixtures"

describe("exportElementToPartialYAML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fixture.model as CollectableElement,
      })

      expect(result).toEqual(fixture.yaml)
    })
  })

  it("omits search string addition source from partial YAML", () => {
    const result = exportElementToPartialYAML({
      context: mockContext,
      element: {
        itemType: "SearchStringAddition",
        name: "ТаблицаСтрокаПоиска",
        additionSource: "Таблица",
      },
    })

    expect(result).toBeUndefined()
  })

  it("omits search control addition source from partial YAML", () => {
    const result = exportElementToPartialYAML({
      context: mockContext,
      element: {
        itemType: "SearchControlAddition",
        name: "ТаблицаУправлениеПоиском",
        additionSource: "Таблица",
        childItems: [],
      },
    })

    expect(result).toBeUndefined()
  })
})

describe("exportElementToTypedYAML", () => {
  describe.each(Object.entries(groupedTypedFixtures))("%s", (group, fixtures) => {
    it.each(fixtures)(`${group} -  $name`, (fixture) => {
      const result = exportElementToTypedYAML({
        context: mockContext,
        element: fixture.model as TypedFormElement,
      })

      expect(result).toEqual(fixture.typedYAML)
    })
  })
})

describe("form element rules", () => {
  it("do not hide fields from partial YAML", () => {
    const elementsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const ruleFiles = collectRuleFiles(elementsRoot)
    const offenders = ruleFiles.flatMap((file) => {
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)
      const hasActiveFlag = lines.some((line) => {
        return line.includes("toPartialYAML: false") && !line.trimStart().startsWith("//")
      })
      return hasActiveFlag ? [path.relative(elementsRoot, file)] : []
    })

    expect(offenders).toEqual([])
  })
})

function collectRuleFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectRuleFiles(fullPath)
    return entry.name === "rules.ts" ? [fullPath] : []
  })
}

describe("exportChildItemToTreeNodeYAML", () => {
  it("exports search string addition kind without source", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "SearchStringAddition",
        name: "ТаблицаСтрокаПоиска",
        additionSource: "Таблица",
      },
    })

    expect(result).toEqual({
      Вид: "ОтображениеСтрокиПоиска",
    })
  })

  it("exports search control addition kind without source", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "SearchControlAddition",
        name: "ТаблицаУправлениеПоиском",
        additionSource: "Таблица",
        childItems: [],
      },
    })

    expect(result).toEqual({
      Вид: "УправлениеПоиском",
    })
  })

  it("exports group kind, group mode and nested child items", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "UsualGroup",
        name: "Группа",
        group: "Vertical",
        childItems: [
          {
            itemType: "InputField",
            name: "Реквизит",
            dataPath: "Объект.Реквизит",
          },
        ],
      },
    })

    expect(result).toEqual({
      Вид: "Группа",
      Группировка: "Вертикальная",
      Элементы: {
        Реквизит: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Реквизит",
        },
      },
    })
  })

  it("exports explicit table data path", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Объект.Таблица",
        childItems: [],
      },
    })

    expect(result).toEqual({
      Вид: "ТаблицаФормы",
      ПутьКДанным: "Объект.Таблица",
    })
  })
})
