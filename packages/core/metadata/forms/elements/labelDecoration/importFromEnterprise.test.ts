import { describe, expect, it } from "vitest"
import {
  fullLabelDecoration,
  fullLabelDecorationEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { importLabelDecorationFromEnterprise } from "./importFromEnterprise"

describe("importLabelDecorationFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importLabelDecorationFromEnterprise(mockСontext, undefined, fullLabelDecoration.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importLabelDecorationFromEnterprise(mockСontext, fullLabelDecorationEnterprise, fullLabelDecoration.name)
    result!.id = "1"

    expect(result).toEqual(fullLabelDecoration)
  })

  it("should import minimal", () => {
    const result = importLabelDecorationFromEnterprise(mockСontext, minimalLabelDecorationEnterprise, minimalLabelDecoration.name)
    result!.id = "1"

    expect(result).toEqual(minimalLabelDecoration)
  })
})

