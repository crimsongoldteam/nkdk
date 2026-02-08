import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationPartialEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("exportLabelDecorationToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullLabelDecoration })

    expect(result).toEqual(fullLabelDecorationPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalLabelDecoration })

    expect(result).toEqual(minimalLabelDecorationPartialEnterprise)
  })
})
