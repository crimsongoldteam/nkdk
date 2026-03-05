import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/orchestration"
import { exportChildItemsToPartialYAML } from "../commonObjects/childItems/toYAML"
import { getAllElements } from "./getAllElements"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"
import { exportEventsToYAML } from "~/metadata/orchestration/event"

export const exportClientApplicationFormToYAML = (
  context: ConfigurationContext,
  data: ClientApplicationForm
): ClientApplicationFormYAML | undefined => {
  const properties = exportPropertiesToYAML({
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

  const result: ClientApplicationFormYAML = {
    ...properties,
    ...events,
    ...(childItemsPartial ? { Элементы: childItemsPartial } : {}),
  }

  return result
}
