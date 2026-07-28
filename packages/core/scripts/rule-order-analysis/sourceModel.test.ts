import { describe, expect, it } from "vitest"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"
import type { RuleOrderSource } from "../../metadata/ruleOrderAnalysis/types"
import { buildRuleSourceEdits } from "./sourceModel"

const filePath = "/rules.ts"

function ruleSource(overrides: Partial<RuleOrderSource> = {}): RuleOrderSource {
  return {
    candidate: "rules.ts#Rules",
    filePath,
    exportName: "Rules",
    propertyPath: [],
    declarationOrder: ["own", "title"],
    numericOrder: {},
    ...overrides,
  }
}

function order(propertyKeys: readonly string[], source = ruleSource()): CanonicalRuleOrder {
  return {
    source,
    propertyKeys,
    observationCount: 1,
  }
}

async function editFor(source: string, orders: readonly CanonicalRuleOrder[]) {
  const edits = await buildRuleSourceEdits({
    orders,
    sources: orders.map((item) => item.source),
    readFile: async (path) => {
      if (path !== filePath) throw new Error(`Неожиданный путь ${path}`)
      return source
    },
  })
  expect(edits).toHaveLength(1)
  return edits[0]!
}

describe("buildRuleSourceEdits", () => {
  it("добавляет xmlOrder, не раскрывая и не переставляя properties", async () => {
    const edit = await editFor(
      `
const common = { title: { type: "string" } }
export const Rules = {
  itemType: "Test",
  properties: {
    own: { type: "string", order: 2 },
    ...common,
  },
}
`,
      [order(["title", "own"])]
    )

    expect(edit.updatedText).toContain(`xmlOrder: [
    "title",
    "own",
  ],`)
    expect(edit.updatedText.indexOf("own:")).toBeLessThan(edit.updatedText.indexOf("...common"))
    expect(edit.updatedText).not.toContain("order: 2")
  })

  it("обновляет существующий readonly xmlOrder", async () => {
    const edit = await editFor(
      `
export const Rules = {
  itemType: "Test",
  xmlOrder: ["own"] as const,
  properties: {
    own: { type: "string" },
    title: { type: "string" },
  },
}
`,
      [order(["title", "own"])]
    )

    expect(edit.updatedText).not.toContain('xmlOrder: ["own"] as const')
    expect(edit.updatedText).toContain(`xmlOrder: [
    "title",
    "own",
  ]`)
  })

  it("добавляет xmlOrder во вложенное правило по propertyPath", async () => {
    const nestedSource = ruleSource({
      candidate: "rules.ts#Rules.properties.children.itemRule",
      propertyPath: ["properties", "children", "itemRule"],
      declarationOrder: ["name"],
    })
    const edit = await editFor(
      `
export const Rules = {
  itemType: "Test",
  properties: {
    children: {
      type: "Children",
      itemRule: {
        itemType: "Child",
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
}
`,
      [order(["name"], nestedSource)]
    )

    expect(edit.updatedText).toContain(`itemType: "Child",
        xmlOrder: [
          "name",
        ],
        properties:`)
    expect(edit.updatedText.match(/xmlOrder:/g)).toHaveLength(1)
  })

  it("сохраняет комментарии properties", async () => {
    const edit = await editFor(
      `
export const Rules = {
  itemType: "Test",
  properties: {
    // Собственное поле
    own: { type: "string" },
    title: { type: "string" }, // Заголовок
  },
}
`,
      [order(["title", "own"])]
    )

    expect(edit.updatedText).toContain("// Собственное поле")
    expect(edit.updatedText).toContain("// Заголовок")
    expect(edit.updatedText.indexOf("own:")).toBeLessThan(edit.updatedText.indexOf("title:"))
  })

  it("удаляет numeric order из ненаблюдавшегося импортированного правила", async () => {
    const derivedPath = "/metadata/derived/rules.ts"
    const basePath = "/metadata/base/rules.ts"
    const derivedSource = ruleSource({
      candidate: "derived/rules.ts#DerivedRules",
      filePath: derivedPath,
      exportName: "DerivedRules",
      declarationOrder: ["name", "extra"],
    })
    const baseSource = ruleSource({
      candidate: "base/rules.ts#BaseRules",
      filePath: basePath,
      exportName: "BaseRules",
      declarationOrder: ["name"],
    })
    const files = new Map([
      [
        derivedPath,
        `
import { BaseRules } from "../base/rules"
export const DerivedRules = {
  itemType: "Derived",
  properties: {
    ...BaseRules.properties,
    extra: { type: "string" },
  },
}
`,
      ],
      [
        basePath,
        `
export const BaseRules = {
  itemType: "Base",
  properties: {
    name: { type: "string", order: 1 },
  },
}
`,
      ],
    ])

    const edits = await buildRuleSourceEdits({
      orders: [order(["name", "extra"], derivedSource)],
      sources: [derivedSource, baseSource],
      readFile: async (path) => {
        const source = files.get(path)
        if (source === undefined) throw new Error(`Неожиданный путь ${path}`)
        return source
      },
    })

    expect(edits.map((edit) => edit.filePath).sort()).toEqual([basePath, derivedPath])
    expect(edits.find((edit) => edit.filePath === basePath)?.updatedText).not.toContain("order: 1")
    expect(edits.find((edit) => edit.filePath === derivedPath)?.updatedText).toContain("xmlOrder:")
  })

  it("отклоняет computed-свойство в пути правила", async () => {
    const nestedSource = ruleSource({
      propertyPath: ["properties", "child", "itemRule"],
      declarationOrder: ["name"],
    })

    await expect(
      editFor(
        `
const key = "child"
export const Rules = {
  itemType: "Test",
  properties: {
    [key]: {
      type: "Child",
      itemRule: { itemType: "Child", properties: { name: { type: "string" } } },
    },
  },
}
`,
        [order(["name"], nestedSource)]
      )
    ).rejects.toThrow(/computed|вычисляем/i)
  })
})
