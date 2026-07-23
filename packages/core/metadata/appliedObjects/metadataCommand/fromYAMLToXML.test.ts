import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { convertMetadataItemFromYAMLToXML } from "../../orchestration/metadataItem/fromYAMLToXML"
import { mockContext, mockContextToXML } from "../../../tests/mockContext"
import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { MetadataCommandRules } from "./rules"

const normalizeXML = (value: string) =>
  value
    .replace(/^\uFEFF?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("MetadataCommands YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips $fixture through one traversal", (fixture) => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataCommands",
      xmlRootTag: "Command",
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(result.yaml).toBeDefined()
    expect(normalizeXML(result.result)).toBe(normalizeXML(result.expected))
  })

  it("validates object command YAML and rejects scalar shorthand", () => {
    const schema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
    )

    expect(schema.Check("ПанельНавигацииВажное")).toBe(false)
    expect(schema.Check({ Группа: "ПанельНавигацииВажное" })).toBe(true)
    expect(schema.Check({ Группа: "CommandGroup.ГруппаКомандПоУмолчанию" })).toBe(true)

    expect(() =>
      convertMetadataItemFromYAMLToXML({
        context: mockContextToXML(),
        rule: MetadataCommandRules,
        name: "Команда1",
        yaml: "ПанельНавигацииВажное",
        outputs: [{ key: "owner" }],
      })
    ).toThrow("MetadataCommand: ожидался YAML-объект")
  })
})
