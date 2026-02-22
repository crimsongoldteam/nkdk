import { describe, expect, it } from "vitest"
import { fullInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { exportClientApplicationFormToEnterprise } from "./toEnterprise"
import { ClientApplicationForm } from "./types"

describe("exportClientApplicationFormToEnterprise", () => {
  it("should export ClientApplicationForm to ClientApplicationFormEnterprise", () => {
    const form: ClientApplicationForm = {
      childItems: [fullInputField],
      commands: [],
      itemType: "ClientApplicationForm",
    }

    const context = {
      ...mockContext,
      preview: {
        attributes: {},
        prefix: "p_",
      },
    }

    const preview = exportClientApplicationFormToEnterprise(context, form)

    const text = JSON.stringify(preview, null, 2)

    expect(text).toEqual({
      attributes: [],
      childItems: [],
    })
  })
})
