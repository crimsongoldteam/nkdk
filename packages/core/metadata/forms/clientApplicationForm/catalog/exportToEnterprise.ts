import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceParametersToEnterprise } from "~/metadata/commonObjects/сhoiceParameters/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
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
  data: CatalogForm | undefined
): CatalogFormEnterprise | undefined => {
  if (!data) return undefined

  const result = exportClientApplicationFormToEnterprise(context, data) as CatalogFormEnterprise
  if (!result) return undefined

  const choiceAvailable = exportBooleanToEnterprise(context, data.choiceAvailable)
  if (choiceAvailable !== undefined) result.ВыборДоступен = choiceAvailable

  const useForFoldersAndItems = exportSystemEnumerationToYAML(
    context,
    data.useForFoldersAndItems,
    SE.FoldersAndItemsUseToEnterprise
  )
  if (useForFoldersAndItems !== undefined) result.ИспользованиеДляГруппИЭлементов = useForFoldersAndItems

  const choiceParameters = exportChoiceParametersToEnterprise(context, data.choiceParameters)
  if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  const choiceMode = exportSystemEnumerationToYAML(context, data.choiceMode, SE.ChoiceModeToEnterprise)
  if (choiceMode !== undefined) result.РежимВыбора = choiceMode

  const catalogEvents = exportCatalogFormEventsToEnterprise(context, data.events)
  if (catalogEvents !== undefined) {
    result.События = { ...result.События, ...catalogEvents }
  }

  return result
}
