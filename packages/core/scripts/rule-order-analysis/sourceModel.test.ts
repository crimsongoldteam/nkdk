import { describe, expect, it } from "vitest"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"
import type { RuleOrderSource } from "../../metadata/ruleOrderAnalysis/types"
import { buildRuleSourceEdits } from "./sourceModel"

const filePath = "/rules.ts"

function order(
  propertyKeys: readonly string[],
  overrides: Partial<RuleOrderSource> = {}
): CanonicalRuleOrder {
  return {
    source: {
      candidate: "rules.ts#Rules",
      filePath,
      exportName: "Rules",
      propertyPath: [],
      declarationOrder: propertyKeys,
      numericOrder: {},
      ...overrides,
    },
    propertyKeys,
    observationCount: 1,
  }
}

async function editFor(source: string, orders: readonly CanonicalRuleOrder[]) {
  const edits = await buildRuleSourceEdits({
    orders,
    readFile: async (path) => {
      if (path !== filePath) throw new Error(`Неожиданный путь ${path}`)
      return source
    },
  })
  expect(edits).toHaveLength(1)
  return edits[0]!
}

describe("buildRuleSourceEdits", () => {
  it("reorders properties and removes numeric order without changing values", async () => {
    const edit = await editFor(
      `
export const Rules = {
  itemType: "Test",
  properties: {
    use: { type: "boolean", order: 2 },
    name: { type: "string", order: 1 },
    unseen: { type: "string" },
  },
}
`,
      [order(["name", "use", "unseen"])]
    )

    expect(edit.updatedText).toContain(`properties: {
    name: { type: "string" },
    use: { type: "boolean" },
    unseen: { type: "string" },
  }`)
  })

  it("moves a leading comment together with its property", async () => {
    const edit = await editFor(
      `
export const Rules = {
  itemType: "Test",
  properties: {
    // Использование
    use: { type: "boolean" },
    name: { type: "string" },
  },
}
`,
      [order(["name", "use"])]
    )

    expect(edit.updatedText.indexOf("name:")).toBeLessThan(edit.updatedText.indexOf("// Использование"))
    expect(edit.updatedText.indexOf("// Использование")).toBeLessThan(edit.updatedText.indexOf("use:"))
  })

  it("reorders a spread fragment as one proven composition", async () => {
    const edit = await editFor(
      `
const common = {
  use: { type: "boolean" },
  name: { type: "string" },
}
export const Rules = {
  itemType: "Test",
  properties: {
    ...common,
    unseen: { type: "string" },
  },
}
`,
      [order(["name", "use", "unseen"])]
    )

    expect(edit.updatedText.indexOf("name:")).toBeLessThan(edit.updatedText.indexOf("use:"))
  })

  it("reorders direct properties around a non-interleaved spread group", async () => {
    const edit = await editFor(
      `
const common = {
  use: { type: "boolean" },
  name: { type: "string" },
}
export const Rules = {
  itemType: "Test",
  properties: {
    extra: { type: "string" },
    ...common,
  },
}
`,
      [order(["name", "use", "extra"])]
    )

    expect(edit.updatedText.indexOf("...common")).toBeLessThan(edit.updatedText.indexOf("extra:"))
    expect(edit.updatedText.indexOf("name:")).toBeLessThan(edit.updatedText.indexOf("use:"))
  })

  it("reorders a spread fragment imported from another rules.ts", async () => {
    const derivedPath = "/metadata/derived/rules.ts"
    const basePath = "/metadata/base/rules.ts"
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
    use: { type: "boolean" },
    name: { type: "string" },
  },
}
`,
      ],
    ])

    const edits = await buildRuleSourceEdits({
      orders: [
        order(["name", "use", "extra"], {
          candidate: "derived/rules.ts#DerivedRules",
          filePath: derivedPath,
          exportName: "DerivedRules",
        }),
      ],
      readFile: async (path) => {
        const source = files.get(path)
        if (source === undefined) throw new Error(`Неожиданный путь ${path}`)
        return source
      },
    })

    expect(edits).toHaveLength(1)
    expect(edits[0]?.filePath).toBe(basePath)
    expect(edits[0]?.updatedText.indexOf("name:")).toBeLessThan(edits[0]!.updatedText.indexOf("use:"))
  })

  it("keeps the insertion position of an override after a spread", async () => {
    const edit = await editFor(
      `
const common = {
  use: { type: "boolean" },
  name: { type: "string" },
}
export const Rules = {
  itemType: "Test",
  properties: {
    ...common,
    name: { type: "required-string" },
    unseen: { type: "string" },
  },
}
`,
      [order(["name", "use", "unseen"])]
    )

    expect(edit.updatedText.indexOf("name: { type: \"string\" }")).toBeLessThan(
      edit.updatedText.indexOf("use:")
    )
    expect(edit.updatedText).toContain('name: { type: "required-string" }')
  })

  it("accepts compatible consumers of one fragment", async () => {
    const source = `
const common = {
  use: { type: "boolean" },
  name: { type: "string" },
}
export const First = { itemType: "First", properties: { ...common } }
export const Second = { itemType: "Second", properties: { ...common } }
`
    const edits = await buildRuleSourceEdits({
      orders: [
        order(["name", "use"], { candidate: "rules.ts#First", exportName: "First" }),
        order(["name", "use"], { candidate: "rules.ts#Second", exportName: "Second" }),
      ],
      readFile: async () => source,
    })

    expect(edits[0]?.updatedText.indexOf("name:")).toBeLessThan(edits[0]!.updatedText.indexOf("use:"))
  })

  it("rejects incompatible consumers of one fragment", async () => {
    const source = `
const common = {
  use: { type: "boolean" },
  name: { type: "string" },
}
export const First = { itemType: "First", properties: { ...common } }
export const Second = { itemType: "Second", properties: { ...common } }
`

    await expect(
      buildRuleSourceEdits({
        orders: [
          order(["name", "use"], { candidate: "rules.ts#First", exportName: "First" }),
          order(["use", "name"], { candidate: "rules.ts#Second", exportName: "Second" }),
        ],
        readFile: async () => source,
      })
    ).rejects.toThrow(/common|несовмест/i)
  })

  it("rejects a computed property without producing edits", async () => {
    await expect(
      editFor(
        `
const key = "name"
export const Rules = {
  itemType: "Test",
  properties: {
    [key]: { type: "string" },
  },
}
`,
        [order(["name"])]
      )
    ).rejects.toThrow(/computed|вычисляем/i)
  })
})
