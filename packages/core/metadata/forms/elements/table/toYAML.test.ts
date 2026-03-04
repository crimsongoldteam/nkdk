import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { fullTable, fullTableYAML, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"

describe("exportTableToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: undefined })

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullTable })

    expect(result).toEqual(fullTableYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalTable })

    expect(result).toBeUndefined()
  })
})
