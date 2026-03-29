import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialYAML,
  minimalDendrogramField,
} from "~/metadata/forms/elements/dendrogramField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportDendrogramFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullDendrogramField })

    expect(result).toEqual(fullDendrogramFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalDendrogramField })

    expect(result).toBeUndefined()
  })
})
