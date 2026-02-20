import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType, FormElementTypeToYAML, FormElementTypeYAML } from "./types"

export const exportFormElementTypeToYAML = (
  _context: ConfigurationContext,
  element: CollectionFormElementType
): FormElementTypeYAML => {
  return FormElementTypeToYAML[element]
}
