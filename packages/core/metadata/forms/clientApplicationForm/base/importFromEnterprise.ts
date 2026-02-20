import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "~/metadata/metadataFactory"
import { ChildItemsStructureResult } from "../../collections/childItems/types"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  _source: ChildItemsStructureResult
): ClientApplicationForm => {
  const itemsContext: ConfigurationContext = {
    ...context,
    allElements: data.Элементы,
  }

  const properties = importPropertiesFromYAML({
    context: itemsContext,
    yaml: data,
    metadataType: "ClientApplicationForm",
    rules: ClientApplicationFormRules,
  })

  const result: ClientApplicationForm = {
    ...properties,
    itemType: "ClientApplicationForm",
  }

  // result.childItems = importChildItemsFromPartialYAML(itemsContext, undefined, structure.childItems)

  return result
}
