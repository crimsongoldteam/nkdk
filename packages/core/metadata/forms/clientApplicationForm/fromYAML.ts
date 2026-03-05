import { ConfigurationContext } from "~/metadata/context/types"
import { importEventsFromYAML } from "~/metadata/metadataFactory/events"
import { importPropertiesFromYAML, importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source: ClientApplicationForm
): ClientApplicationForm => {
  const itemsContext: ConfigurationContext = {
    ...context,
    allElements: data.Элементы,
  }

  const autoCommandBar = importPropertyFromYAML({
    context: itemsContext,
    rule: ClientApplicationFormRules.properties.autoCommandBar as PropertyRule,
    value: data.КоманднаяПанель,
    sourceValue: source.autoCommandBar,
  })

  const properties = importPropertiesFromYAML({
    context: itemsContext,
    yaml: data,
    metadataType: "ClientApplicationForm",
    metadataRule: ClientApplicationFormRules,
    source: source,
  })

  const events = importEventsFromYAML({
    rule: ClientApplicationFormRules,
    yaml: data,
  })

  // const childItems = importChildItemsFromPartialYAML({
  //   context: itemsContext,
  //   // data: data.Элементы,
  //   childItems: source.childItems,
  // })

  const result: ClientApplicationForm = {
    ...(autoCommandBar ? { autoCommandBar } : {}),
    ...properties,
    ...events,
    // childItems: childItems,
    itemType: "ClientApplicationForm",
  }

  // result.childItems = importChildItemsFromPartialYAML(itemsContext, undefined, structure.childItems)

  // const autoCommandBar = importAutoCommandBarFromEnterprise(
  //   itemsContext,
  //   undefined,
  //   structure.autoCommandBar,
  //   data.КоманднаяПанель
  // )
  // if (autoCommandBar !== undefined) result.autoCommandBar = autoCommandBar
  return result
}
