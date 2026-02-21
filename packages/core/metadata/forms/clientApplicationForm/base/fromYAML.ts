import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "~/metadata/metadataFactory"
import { importEventsFromYAML } from "~/metadata/metadataFactory/events"
import { importChildItemsFromPartialYAML } from "../../collections/childItems/fromYAML"
import { ChildItemsStructureResult } from "../../collections/childItems/types"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source: ChildItemsStructureResult
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

  const events = importEventsFromYAML({
    rule: ClientApplicationFormRules,
    yaml: data,
  })

  const childItems = importChildItemsFromPartialYAML({
    context: itemsContext,
    // data: data.Элементы,
    childItems: source.childItems,
  })

  const result: ClientApplicationForm = {
    ...properties,
    ...events,
    childItems: childItems,
    itemType: "ClientApplicationForm",
  }

  // result.childItems = importChildItemsFromPartialYAML(itemsContext, undefined, structure.childItems)

  return result
}
