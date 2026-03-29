import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { fullPage, fullPagePartialYAML, minimalPage } from "~/metadata/forms/elements/page/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPageToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPage })

    expect(result).toEqual(fullPagePartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPage })

    expect(result).toBeUndefined()
  })
})
