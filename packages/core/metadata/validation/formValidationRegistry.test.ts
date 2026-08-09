import { afterEach, describe, expect, it } from "vitest"
import {
  clearFormValidationAdapterForTests,
  getFormValidationAdapter,
  registerFormValidationAdapter,
  requireFormValidationAdapter,
} from "./formValidationRegistry"

describe("form validation adapter", () => {
  const registeredAdapter = getFormValidationAdapter()
  afterEach(() => {
    clearFormValidationAdapterForTests()
    if (registeredAdapter !== undefined) registerFormValidationAdapter(registeredAdapter)
  })

  it("fails clearly when the adapter is not registered", () => {
    clearFormValidationAdapterForTests()
    expect(() => requireFormValidationAdapter()).toThrow(
      "Не зарегистрирован адаптер validation для ClientApplicationForm"
    )
  })
})
