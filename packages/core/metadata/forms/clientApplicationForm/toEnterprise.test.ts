import { describe, expect, it } from "vitest"
import { fullInputField } from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"
import { exportClientApplicationFormToEnterprise } from "./toEnterprise"
import { ClientApplicationForm } from "./types"

describe.skip("exportClientApplicationFormToEnterprise", () => {
  it("should export ClientApplicationForm to ClientApplicationFormEnterprise", () => {
    const form: ClientApplicationForm = {
      childItems: [fullInputField],
      commands: [],
      itemType: "ClientApplicationForm",
    }

    const preview = exportClientApplicationFormToEnterprise(mockContextToEnterprise, form)

    const text = JSON.stringify(preview, null, 2)

    expect(text).toEqual({
      attributes: [],
      childItems: [],
    })
  })
})
