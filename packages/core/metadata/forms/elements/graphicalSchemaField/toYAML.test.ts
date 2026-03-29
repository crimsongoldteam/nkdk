import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialYAML,
  minimalGraphicalSchemaField,
} from "~/metadata/forms/elements/graphicalSchemaField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportGraphicalSchemaFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullGraphicalSchemaField })

    expect(result).toEqual(fullGraphicalSchemaFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalGraphicalSchemaField })

    expect(result).toBeUndefined()
  })
})
