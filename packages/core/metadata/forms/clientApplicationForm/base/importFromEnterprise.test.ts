import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
  minimalClientApplicationForm,
  minimalClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { importClientApplicationFormFromEnterprise } from "./importFromEnterprise"

describe("importClientApplicationFormFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, undefined, [], "Форма")

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importClientApplicationFormFromEnterprise(
      mockСontext,
      fullClientApplicationFormEnterprise,
      [{ name: "ПолеВвода1", elementType: FormElementType.InputField }],
      "Форма"
    )

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import minimal", () => {
    const result = importClientApplicationFormFromEnterprise(
      mockСontext,
      minimalClientApplicationFormEnterprise,
      [],
      "Форма"
    )

    expect(result).toEqual(minimalClientApplicationForm)
  })
})
