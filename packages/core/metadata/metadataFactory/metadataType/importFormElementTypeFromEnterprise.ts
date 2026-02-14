import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType, FormElementTypeEnterprise, FormElementTypeFromEnterprise } from "./types"

export const importFormElementTypeFromEnterprise = (
  _context: ConfigurationContext,
  data: FormElementTypeEnterprise
): FormElementType => {
  return FormElementTypeFromEnterprise[data]
}
