import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { fullCommandBar, fullCommandBarPartialYAML, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"
import { mockContextToYAML } from "~/tests/mockContext"

describe("exportCommandBarToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContextToYAML, element: fullCommandBar })

    expect(result).toEqual(fullCommandBarPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContextToYAML, element: minimalCommandBar })

    expect(result).toBeUndefined()
  })
})
