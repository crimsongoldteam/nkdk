import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import "../../commonObjects/metadataCommandGroup/fromYAML"
import "../../commonObjects/metadataCommandGroup/toJSONSchema"
import { MetadataCommandRules } from "./rules"

describe("MetadataCommand YAML", () => {
  it("rejects scalar command group shorthand in JSON Schema", () => {
    const schema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
    )

    expect(schema.Check("ПанельНавигацииВажное")).toBe(false)
  })

  it("accepts command group property in JSON Schema", () => {
    const schema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
    )

    expect(schema.Check({ Группа: "ПанельНавигацииВажное" })).toBe(true)
    expect(schema.Check({ Группа: "CommandGroup.ГруппаКомандПоУмолчанию" })).toBe(true)
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
