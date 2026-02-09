import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"

describe("exportCommandBarToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullCommandBar })

    expect(result).toEqual(fullCommandBarPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalCommandBar })

    expect(result).toBeUndefined()
  })
})
