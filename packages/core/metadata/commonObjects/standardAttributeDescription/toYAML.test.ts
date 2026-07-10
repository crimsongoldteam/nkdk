import { describe, expect, it } from "vitest"
import { all, allYAML, minimal, minimalYAML } from "./__fixtures__/data"
import { StandartAttributeNameToYAML } from "./types"
import type { PropertyRule } from "../../orchestration/property/types"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  yaml: "СтандартныеРеквизиты",
  standartAttributeNames: StandartAttributeNameToYAML,
}

describe("exportStandardAttributeDescriptionsToYAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports empty array", () => {
    const result = testExportPropertyToYAML({ rule, value: [] })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: all })

    expect(result).toEqual({ СтандартныеРеквизиты: allYAML })
  })

  it("exports minimal fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: minimal })
    expect(result).toEqual({ СтандартныеРеквизиты: minimalYAML })
  })
})
