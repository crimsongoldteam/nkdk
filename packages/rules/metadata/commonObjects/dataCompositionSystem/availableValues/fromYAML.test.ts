import { describe, expect, it } from "vitest"
import { callAtomicFromYAML } from "../../../ruleRuntime"
import { mockContext } from "../../../../tests/mockContext"
import { importFromYAML } from "@nkdk/runtime"
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

const rule = { type: "DcsAvailableValues" } as const
const registries = createMetadataExecutionRegistrySets(metadataRules)

describe("import DcsAvailableValues from YAML", { timeout: 30_000 }, () => {
  it("imports string values", () => {
    const result = importValues(stringAvailableValuesYAML)

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports double-quoted numeric string value from parsed YAML as string", () => {
    const yaml = importFromYAML(['- Значение: "2"', "  Представление: 2 знака"].join("\n"))

    const result = importValues(yaml)

    expect(result).toEqual([
      {
        itemType: "DcsAvailableValue",
        value: { type: "string", value: "2" },
        presentation: { items: { ru: "2 знака" } },
      },
    ])
  })

  it("imports tagged presentation as xmlString", () => {
    const yaml = importFromYAML<unknown[]>([
      "- Значение: 2",
      "  Представление: !xml/string 2 знака",
    ].join("\n"))

    expect(importValues(yaml)).toEqual([
      {
        itemType: "DcsAvailableValue",
        value: { type: "decimal", value: 2 },
        presentation: { kind: "xmlString", text: "2 знака" },
      },
    ])
  })

  it("imports absent value as undefined", () => {
    const result = importValues(nilAndBooleanAvailableValuesYAML)

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })

})

function importValues(value: unknown): unknown {
  return withMetadataExecutionRegistrySets(registries, () =>
    callAtomicFromYAML({ context: mockContext, rule, value }))
}
