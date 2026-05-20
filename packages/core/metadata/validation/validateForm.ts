import { Diagnostic } from "./types"

export interface ValidateFormParams {
  formDir: string
  formName: string
}

export function validateForm(params: ValidateFormParams): Diagnostic[] {
  void params
  return []
}
