import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementTypeToYAML } from "~/metadata/orchestration/formElement/types"
import { CollectionFormElementType, FormElementTypeYAML } from "../../metadataFactory/metadataType/types"

export const exportFormElementTypeToYAML = (
  _context: ConfigurationContext,
  element: CollectionFormElementType
): FormElementTypeYAML => {
  return FormElementTypeToYAML[element]
}
