import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType, FormElementTypeEnterprise, FormElementTypeToEnterprise } from "./types"

export const exportFormElementTypeToEnterprise = (
  _context: ConfigurationContext,
  element: FormElementType
): FormElementTypeEnterprise => {
  return FormElementTypeToEnterprise[element]
}
