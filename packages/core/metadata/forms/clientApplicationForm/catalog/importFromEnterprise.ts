import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importChoiceParametersFromEnterprise } from "~/metadata/commonObjects/сhoiceParameters/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChildItemsStructureResult } from "../../collections/childItems/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { importClientApplicationFormFromEnterprise } from "../base/importFromEnterprise"
import { CatalogForm, CatalogFormEnterprise, CatalogFormEvents } from "./types"

const catalogFormEnterpriseEventNameMapping: Record<string, keyof CatalogFormEvents> = {
  ВыборЗначения: "valueChoice",
  ПередЗаписью: "beforeWrite",
  ПередЗаписьюНаСервере: "beforeWriteAtServer",
  ПослеЗаписи: "afterWrite",
  ПослеЗаписиНаСервере: "afterWriteAtServer",
  ПриЗаписиНаСервере: "onWriteAtServer",
  ПриЧтенииНаСервере: "onReadAtServer",
}

const importCatalogFormEventsFromEnterprise = (
  data: CatalogFormEnterprise["События"] | undefined
): CatalogFormEvents | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: CatalogFormEvents = {}

  for (const [enterpriseEventName, eventValue] of Object.entries(data)) {
    const eventName = catalogFormEnterpriseEventNameMapping[enterpriseEventName]
    if (eventName && eventValue) {
      result[eventName as keyof CatalogFormEvents] = eventValue as string
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const importCatalogFormFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CatalogFormEnterprise,
  structure: ChildItemsStructureResult
): CatalogForm => {
  const result = importClientApplicationFormFromEnterprise(context, data, structure) as CatalogForm

  const choiceAvailable = importBooleanFromEnterprise(context, undefined, data.ВыборДоступен)
  if (choiceAvailable !== undefined) result.choiceAvailable = choiceAvailable

  const useForFoldersAndItems = importSystemEnumerationFromEnterprise<SE.FoldersAndItemsUse>(
    context,
    undefined,
    data.ИспользованиеДляГруппИЭлементов,
    SE.FoldersAndItemsUseFromEnterprise
  )
  if (useForFoldersAndItems !== undefined) result.useForFoldersAndItems = useForFoldersAndItems

  const choiceParameters = importChoiceParametersFromEnterprise(context, undefined, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const choiceMode = importSystemEnumerationFromEnterprise<SE.ChoiceMode>(
    context,
    undefined,
    data.РежимВыбора,
    SE.ChoiceModeFromEnterprise
  )
  if (choiceMode !== undefined) result.choiceMode = choiceMode

  const catalogEvents = importCatalogFormEventsFromEnterprise(data.События)
  if (catalogEvents !== undefined) {
    result.events = { ...result.events, ...catalogEvents }
  }

  return result
}
