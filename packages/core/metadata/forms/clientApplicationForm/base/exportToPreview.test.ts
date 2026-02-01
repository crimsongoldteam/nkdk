import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToPreview"
import { fullInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportClientApplicationFormToPreview } from "./exportToPreview"
import { ClientApplicationForm } from "./types"

describe("exportClientApplicationFormToPreview", () => {
  it("should export ClientApplicationForm to ClientApplicationFormPreview", () => {
    const form: ClientApplicationForm = {
      childItems: [fullInputField],
      commands: [],
    }

    const context = {
      ...mockСontext,
      preview: {
        attributes: {},
        prefix: "p_",
      },
    }

    const preview = exportClientApplicationFormToPreview(context, form)

    const text = JSON.stringify(preview, null, 2)

    expect(text).toEqual({
      attributes: [],
      childItems: [],
    })
  })
})
