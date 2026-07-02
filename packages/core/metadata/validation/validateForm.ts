import { getRegisteredFormValidator, type RegisteredFormValidatorParams } from "./formValidationRegistry"
import type { Diagnostic } from "./types"

export type ValidateFormParams = RegisteredFormValidatorParams

export function validateForm(params: ValidateFormParams): Diagnostic[] {
  const validator = getRegisteredFormValidator()
  if (validator === undefined) return []
  return validator(params)
}
