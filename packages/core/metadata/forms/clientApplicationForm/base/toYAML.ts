import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/metadataFactory"
import { exportEventsToYAML } from "~/metadata/metadataFactory/events"
import { exportChildItemsToPartialYAML } from "../../commonObjects/childItems/toYAML"
import { getAllElements } from "../getAllElements"
import { ClientApplicationFormRules } from "../rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "../types"

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
  const childItems = childItemsPartial ? { ПодчиненныеЭлементы: childItemsPartial } : {}

  return { ...result, ...events, ...childItems }
}
