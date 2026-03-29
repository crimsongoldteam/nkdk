import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldEnterprise,
} from "~/metadata/forms/elements/geographicalSchemaField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export GeographicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullGeographicalSchemaField,
    })
    expect(result).toEqual(fullGeographicalSchemaFieldEnterprise)
  })
})
