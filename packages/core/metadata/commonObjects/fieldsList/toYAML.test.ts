import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListYAML } from "~/metadata/commonObjects/fieldsList/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFieldsListToYAML } from "./toYAML"

describe("exportFieldsListToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFieldsListToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFieldsListToYAML(mockContext, mockRule, fullFieldsList)

    expect(result).toEqual(fullFieldsListYAML)
  })
})
