import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType, FormElementTypeFromYAML, FormElementTypeYAML } from "./types"

export const importFormElementTypeFromEnterprise = (
  _context: ConfigurationContext,
  data: FormElementTypeYAML
): CollectionFormElementType => {
  return FormElementTypeFromYAML[data]
}
