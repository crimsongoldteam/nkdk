import { InputField } from "./types"

export const isMultiline = (element: InputField): boolean => {
  return element.height !== undefined && element.height > 1 && element.multiLine !== undefined && element.multiLine
}
