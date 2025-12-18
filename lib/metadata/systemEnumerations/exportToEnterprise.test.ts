import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { exportSystemEnumerationToEnterprise } from "./exportToEnterprise"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

describe("exportSystemEnumerationToEnterprise", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToEnterprise(
      mockValue,
      SE.ChildFormItemsGroupToEnterprise,
      mockConfigurationSettings
    )

    expect(result).toBe(expectedResult)
  })
})
