import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { exportClientApplicationFormToEnterprise } from "../base/exportToEnterprise"
import { CatalogForm, CatalogFormEnterprise, CatalogFormEvents } from "./types"

const catalogFormEventNameMapping: Partial<Record<keyof CatalogFormEvents, string>> = {
  valueChoice: "ВыборЗначения",
  beforeWrite: "ПередЗаписью",
  beforeWriteAtServer: "ПередЗаписьюНаСервере",
  afterWrite: "ПослеЗаписи",
  afterWriteAtServer: "ПослеЗаписиНаСервере",
  onWriteAtServer: "ПриЗаписиНаСервере",
  onReadAtServer: "ПриЧтенииНаСервере",
}

const exportCatalogFormEventsToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CatalogFormEvents | undefined
): CatalogFormEnterprise["События"] | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: Record<string, string> = {}

  for (const [eventName, eventValue] of Object.entries(data)) {
    const enterpriseEventName = catalogFormEventNameMapping[eventName as keyof CatalogFormEvents]
    if (enterpriseEventName && eventValue) {
      result[enterpriseEventName] = eventValue
    }
  }

  return Object.keys(result).length > 0 ? (result as CatalogFormEnterprise["События"]) : undefined
}

export const exportCatalogFormToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CatalogForm | undefined
): CatalogFormEnterprise | undefined => {
  if (!data) return undefined

  const result = exportClientApplicationFormToEnterprise(context, data) as CatalogFormEnterprise
  if (!result) return undefined

  // const choiceAvailable = exportBooleanToEnterprise(context, undefined, data.choiceAvailable)
  // if (choiceAvailable !== undefined) result.ВыборДоступен = choiceAvailable

  // const useForFoldersAndItems = exportSystemEnumerationToYAML<SE.FoldersAndItemsUseEnterprise>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "FoldersAndItemsUse" },
  //   data.useForFoldersAndItems
  // )
  // if (useForFoldersAndItems !== undefined) result.ИспользованиеДляГруппИЭлементов = useForFoldersAndItems

  // const choiceParameters = exportChoiceParametersToEnterprise(context, undefined, data.choiceParameters)
  // if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  // const choiceMode = exportSystemEnumerationToYAML<SE.ChoiceModeEnterprise>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "ChoiceMode" },
  //   data.choiceMode
  // )
  // if (choiceMode !== undefined) result.РежимВыбора = choiceMode

  // const catalogEvents = exportCatalogFormEventsToEnterprise(context, undefined, data.events)
  // if (catalogEvents !== undefined) {
  //   result.События = { ...result.События, ...catalogEvents }
  // }

  return result
}
