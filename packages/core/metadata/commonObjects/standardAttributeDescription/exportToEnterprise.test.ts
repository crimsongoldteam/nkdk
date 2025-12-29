import { describe, expect, it } from "vitest"
import {
  allParameters,
  allParametersEnterprise,
  necessaryParameters,
  necessaryParametersEnterprise,
} from "~/tests/fixtures/standartAttributeDescription/data"
import { mockСontext } from "~/tests/mockContext"
import { exportStandardAttributeDescriptionsToEnterprise } from "./exportToEnterprise"

describe("exportStandardAttributeDescriptionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when array is empty", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockСontext, [])
    expect(result).toBeUndefined()
  })

  it("should export all parameters to enterprise", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockСontext, allParameters)

    expect(result).toEqual(allParametersEnterprise)
  })

  it("should export with only name", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockСontext, necessaryParameters)
    expect(result).toEqual(necessaryParametersEnterprise)
  })
})
