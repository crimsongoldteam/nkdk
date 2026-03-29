import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldEnterprise,
} from "~/metadata/forms/elements/graphicalSchemaField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export GraphicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullGraphicalSchemaField,
    })
    expect(result).toEqual(fullGraphicalSchemaFieldEnterprise)
  })
})
