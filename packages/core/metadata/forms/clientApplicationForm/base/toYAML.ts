import { ConfigurationContext } from "~/metadata/context/types"
import { ClientApplicationForm, ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/base/types"
import { exportPropertiesToYAML } from "~/metadata/metadataFactory"
import { exportEventsToYAML } from "~/metadata/metadataFactory/events"
import { exportChildItemsToPartialYAML } from "../../collections/childItems/toYAML"
import { getAllElements } from "./getAllElements"
import { ClientApplicationFormRules } from "./rules"

export const exportClientApplicationFormToYAML = (
  context: ConfigurationContext,
  data: ClientApplicationForm
): ClientApplicationFormYAML | undefined => {
  const result = exportPropertiesToYAML({
    context,
    data: data,
    rules: ClientApplicationFormRules,
  })

  const events = exportEventsToYAML({
    rule: ClientApplicationFormRules,
    data: data,
  })

  const allElements = getAllElements(data)
  const childItemsPartial = exportChildItemsToPartialYAML(context, allElements)
  const childItems = childItemsPartial ? { Элементы: childItemsPartial } : {}

  return { ...result, ...events, ...childItems }
}
