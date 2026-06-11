import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import "~/metadata/commonObjects/metadataCommandGroup/fromYAML"
import { MetadataCommandRules } from "./rules"

describe("MetadataCommand YAML", () => {
  it("rejects scalar command group shorthand in JSON Schema", () => {
    const schema = TypeCompiler.Compile(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
    )

    expect(schema.Check("ПанельНавигацииВажное")).toBe(false)
  })

  it("imports object command group YAML and rejects scalar command YAML", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: MetadataCommandRules,
      name: "Команда1",
      yaml: { Группа: "ПанельНавигацииВажное" },
    })

    expect(result).toMatchObject({
      itemType: "MetadataCommand",
      group: "NavigationPanelImportant",
    })

    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataCommandRules,
        name: "Команда1",
        yaml: "ПанельНавигацииВажное" as never,
      })
    ).toThrow("MetadataCommand: ожидался YAML-объект")
  })
})
