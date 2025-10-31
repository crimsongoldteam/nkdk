import { type TInputField } from "./types"

export function isMultiline(element: TInputField): boolean {
  return element.height !== undefined && element.height > 1 && element.multiLine !== undefined && element.multiLine
}
