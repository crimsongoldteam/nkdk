import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialYAML,
  minimalGraphicalSchemaField,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
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
