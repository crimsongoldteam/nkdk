import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullTable,
  fullTablePartialEnterprise,
  minimalTable,
  minimalTablePartialEnterprise,
} from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.Table,
      data: fullTablePartialEnterprise,
      source: fullTable,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.Table,
      data: minimalTablePartialEnterprise,
      source: minimalTable,
    })

    expect(result).toEqual(minimalTable)
  })
})
