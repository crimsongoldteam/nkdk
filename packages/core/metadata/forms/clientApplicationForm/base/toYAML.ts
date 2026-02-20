import { ConfigurationContext } from "~/metadata/context/types"
import { ClientApplicationForm, ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/base/types"
import { exportPropertiesToYAML } from "~/metadata/metadataFactory"
import { exportEventsToYAML } from "~/metadata/metadataFactory/events"
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

  //   const allElements = getAllElements(data)
  //   const childItems = exportChildItemsToPartialYAML(context, undefined, allElements)
  //   if (childItems !== undefined) result.Элементы = childItems

  return { ...result, ...events }
}
