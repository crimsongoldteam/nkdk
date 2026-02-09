import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import { fullPage, fullPagePartialEnterprise, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPageToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPage })

    expect(result).toEqual(fullPagePartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPage })

    expect(result).toBeUndefined()
  })
})
