import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  minimalPeriodField,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPeriodFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPeriodField })

    expect(result).toEqual(fullPeriodFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPeriodField })

    expect(result).toBeUndefined()
  })
})
