import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementTypeToYAML, FormElementTypeYAML, MetadataType } from "./types"

export const exportFormElementTypeToEnterprise = (
  _context: ConfigurationContext,
  element: MetadataType
): FormElementTypeYAML => {
  return FormElementTypeToYAML[element]
}
