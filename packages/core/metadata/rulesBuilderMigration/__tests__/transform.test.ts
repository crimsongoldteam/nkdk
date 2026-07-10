import { describe, expect, it } from "vitest"
import { createBuilderCatalog } from "../builderCatalog"
import { transformRulesSource } from "../transform"

describe("rules builder migration transform", () => {
  it("rewrites direct property rules and adds imports", () => {
    const source = `
      const properties = ["Properties"]
      export const ExampleRules = {
        properties: {
          name: {
            type: "string",
            xmlParents: properties,
            defaultValue: ({ name }: { name?: string }) => name,
          },
          synonym: {
            yaml: "Синоним",
            type: "I8nText",
            xmlParents: properties,
          },
        },
      } as const
    `

    const result = transformRulesSource("example/rules.ts", source, createBuilderCatalog())

    expect(result.code).toContain(
      'import { i8nTextRule } from "../commonObjects/i8nText/types";\n' +
        'import { stringRule } from "../commonObjects/string/types";'
    )
    expect(result.code).toContain("name: stringRule({")
    expect(result.code).toContain("defaultValue: ({ name }: {\n                name?: string;\n            }) => name")
    expect(result.code).toContain("synonym: i8nTextRule({")
    expect(result.changed).toBe(true)
  })

  it("rewrites nested defaultItemRule and leaves business data alone", () => {
    const source = `
      export const ExampleRules = {
        properties: {
          values: {
            type: "MetadataValue",
            defaultItemRule: {
              type: "string",
              xml: "Value",
            },
            sampleData: {
              type: "BusinessData",
              value: 1,
            },
          },
        },
      } as const
    `

    const result = transformRulesSource("example/rules.ts", source, createBuilderCatalog())

    expect(result.code).toContain("values: metadataValueRule({")
    expect(result.code).toContain("defaultItemRule: stringRule({")
    expect(result.code).toContain('sampleData: {\n                type: "BusinessData"')
  })
})
