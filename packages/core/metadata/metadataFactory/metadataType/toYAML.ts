import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType, FormElementTypeToYAML, FormElementTypeYAML } from "./types"

export const exportFormElementTypeToEnterprise = (
  _context: ConfigurationContext,
  element: CollectionFormElementType
): FormElementTypeYAML => {
  return FormElementTypeToYAML[element]
}
