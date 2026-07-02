import { describe, expect, it } from "vitest"
import { createBuilderCatalog } from "../builderCatalog"
import { inventoryRulesSource } from "../inventory"

describe("rules builder migration inventory", () => {
  it("counts direct property rules only in known rule positions", () => {
    const source = `
      export const ExampleRules = {
        properties: {
          name: { type: "string", xmlParents: properties },
          defaults: {
            type: "MetadataValue",
            defaultItemRule: { type: "string", xml: "Value" },
          },
        },
        notAProperty: { type: "BusinessData" },
      } as const
    `

    expect(inventoryRulesSource("example/rules.ts", source, createBuilderCatalog())).toEqual([
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.name",
        propertyType: "string",
        builderName: "stringRule",
        importPath: "../commonObjects/string/types",
        mode: "strict",
      },
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.defaults",
        propertyType: "MetadataValue",
        builderName: "metadataValueRule",
        importPath: "../commonObjects/metadataValue/types",
        mode: "wide",
      },
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.defaults.defaultItemRule",
        propertyType: "string",
        builderName: "stringRule",
        importPath: "../commonObjects/string/types",
        mode: "strict",
      },
    ])
  })
})
