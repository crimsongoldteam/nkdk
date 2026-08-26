import { describe, expect, it } from "vitest"
import { serializeYAMLDocument, yamlScalarTagAt } from "@nkdk/runtime"
import { exportPropertyToYAML } from "../../../ruleRuntime"
import { mockContext } from "../../../../tests/mockContext"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"
import "../index"
import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"

const rule = { type: "DcsAvailableValues", yaml: "ДоступныеЗначения" } as const
const registries = createMetadataExecutionRegistrySets(metadataRules)

describe("export DcsAvailableValues to YAML", () => {
  it("exports string values", () => {
    const result = exportValues(stringAvailableValues)

    expect(result).toEqual({ ДоступныеЗначения: stringAvailableValuesYAML })
  })

  it("exports absent value as absent key", () => {
    const result = exportValues(nilAndBooleanAvailableValues)

    expect(result).toEqual({ ДоступныеЗначения: nilAndBooleanAvailableValuesYAML })
  })

  it("exports xmlString presentation with !xml/string", () => {
    const result = exportValues([{
        itemType: "DcsAvailableValue",
        value: { type: "decimal", value: 2 },
        presentation: { kind: "xmlString", text: "2 знака" },
      }])!
    const item = (result.ДоступныеЗначения as Record<string, unknown>[])[0]!

    expect(serializeYAMLDocument(result).text).toContain("Представление: !xml/string 2 знака")
    expect(yamlScalarTagAt(item, "Представление")).toBe("xml/string")
  })
})

function exportValues(value: Parameters<typeof exportPropertyToYAML>[0]["value"]) {
  return withMetadataExecutionRegistrySets(registries, () =>
    exportPropertyToYAML({ context: mockContext, rule, value }))
}
