import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import { fullPages, fullPagesPartialYAML, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPagesToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPages })

    expect(result).toEqual(fullPagesPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPages })

    expect(result).toBeUndefined()
  })
})
