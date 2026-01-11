import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { importClientApplicationFormFromEnterprise } from "./importFromEnterprise"

describe("importClientApplicationFormFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, undefined, { childItems: [] })

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, fullClientApplicationFormEnterprise, {
      childItems: [{ name: "ПолеВвода1", elementType: FormElementType.InputField }],
      autoCommandBar: { autofill: false, elementType: FormElementType.AutoCommandBar, childItems: [] },
    })

    expect(result).toEqual(fullClientApplicationForm)
  })
})
