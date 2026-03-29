import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialYAML,
  minimalProgressBarField,
} from "~/metadata/forms/elements/progressBarField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportProgressBarFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullProgressBarField })

    expect(result).toEqual(fullProgressBarFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalProgressBarField })

    expect(result).toBeUndefined()
  })
})
