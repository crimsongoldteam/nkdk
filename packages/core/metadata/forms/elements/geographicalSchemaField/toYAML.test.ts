import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialYAML,
  minimalGeographicalSchemaField,
} from "~/metadata/forms/elements/geographicalSchemaField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportGeographicalSchemaFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullGeographicalSchemaField })

    expect(result).toEqual(fullGeographicalSchemaFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalGeographicalSchemaField })

    expect(result).toBeUndefined()
  })
})
