import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"

describe("exportSearchStringAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: undefined })

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullSearchStringAddition })

    expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchStringAddition })

    expect(result).toBeUndefined()
  })
})
