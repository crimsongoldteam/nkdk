import { describe, expect, it } from "vitest"
import {
  all,
  allYAML,
  minimal,
  minimalYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/data"
import { StandartAttributeName, StandartAttributeNameToYAML } from "./types"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const standardAttributeNames = Object.keys(StandartAttributeNameToYAML) as StandartAttributeName[]
const rule: PropertyRule = { type: "StandardAttributeDescriptions", standartAttributeNames: standardAttributeNames }

describe("importStandardAttributeDescriptionsFromYAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports empty object", () => {
    const result = testImportPropertyFromYAML({ rule, value: {} })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: allYAML })

    expect(result).toEqual(all)
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML })
    expect(result).toEqual(minimal)
  })
})
