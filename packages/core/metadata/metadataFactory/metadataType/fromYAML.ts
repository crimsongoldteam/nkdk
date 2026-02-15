import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType, FormElementTypeFromYAML, FormElementTypeYAML } from "./types"

export const importFormElementTypeFromEnterprise = (
  _context: ConfigurationContext,
  data: FormElementTypeYAML
): FormElementType => {
  return FormElementTypeFromYAML[data]
}
