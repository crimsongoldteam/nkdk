import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importFormAttributesFromEnterprise } from "~/metadata/commonObjects/formAttribute/importFromEnterprise"
import { importFormParametersFromEnterprise } from "~/metadata/commonObjects/formParameter/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUsePurposesFromEnterprise } from "~/metadata/commonObjects/usePurposes/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormEvents,
} from "~/metadata/forms/clientApplicationForm/base/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsPartialFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { ChildItemsStructureResult } from "../../collections/childItems/types"
import { importCommandsFromEnterprise } from "../../commands/importFromEnterprise"
import { importCommandSetFromEnterprise } from "../../commandSet/importFromEnterprise"
import { importCommandInterfaceFromEnterprise } from "../../commonObjects/commandInterface/importFromEnterprise"
import { importAutoCommandBarFromEnterprise } from "../../elements/autoCommandBar/importFromEnterprise"

const clientApplicationFormEnterpriseEventNameMapping: Record<string, keyof ClientApplicationFormEvents> = {
  АвтоПодборПользователейСистемыВзаимодействия: "collaborationSystemUsersAutoComplete",
  ВнешнееСобытие: "externalEvent",
  ОбработкаАктивизации: "activationProcessing",
  ОбработкаВыбора: "choiceProcessing",
  ОбработкаЗаписиНового: "newWriteProcessing",
  ОбработкаНавигационнойСсылки: "uRLProcessing",
  ОбработкаОповещения: "notificationProcessing",
  ОбработкаПерехода: "navigationProcessing",
  ОбработкаПолученияНавигационнойСсылки: "uRLGetProcessing",
  ОбработкаПолученияСпискаНавигационныхСсылок: "uRLListGetProcessing",
  ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия: "collaborationSystemUsersChoiceFormGetProcessing",
  ОбработкаПроверкиЗаполненияНаСервере: "fillCheckProcessingAtServer",
  ОтключениеВнешнейКомпонентыПриОшибке: "addInDetachmentOnError",
  ПередЗагрузкойДанныхИзНастроекНаСервере: "beforeLoadDataFromSettingsAtServer",
  ПередЗакрытием: "beforeClose",
  ПередПереоткрытиемСДругогоСервера: "beforeReopenFromOtherServer",
  ПриВставкеИзБуфераОбмена: "onPasteFromClipboard",
  ПриЗагрузкеДанныхИзНастроекНаСервере: "onLoadDataFromSettingsAtServer",
  ПриЗакрытии: "onClose",
  ПриИзмененииДоступностиОсновногоСервера: "onMainServerAvailabilityChange",
  ПриИзмененииПараметровЭкрана: "onChangeDisplaySettings",
  ПриОткрытии: "onOpen",
  ПриПереоткрытииСДругогоСервера: "onReopenFromOtherServer",
  ПриПовторномОткрытии: "onReopen",
  ПриСозданииНаСервере: "onCreateAtServer",
  ПриСохраненииДанныхВНастройкахНаСервере: "onSaveDataInSettingsAtServer",
}

export const importClientApplicationFormFromEnterprise = (
  context: ConfigurationContext,
  data: ClientApplicationFormEnterprise,
  structure: ChildItemsStructureResult
): ClientApplicationForm => {
  const itemsContext: ConfigurationContext = {
    ...context,
    allElements: data.Элементы,
  }

  const result: ClientApplicationForm = {
    commands: importCommandsFromEnterprise(context, data.Команды),
    childItems: [],
  }

  const autoTitle = importBooleanFromEnterprise(context, data.АвтоЗаголовок)
  if (autoTitle !== undefined) result.autoTitle = autoTitle

  const commandSet = importCommandSetFromEnterprise(context, data.СоставКоманд)
  if (commandSet !== undefined) result.commandSet = commandSet

  const autoSaveDataInSettings = importSystemEnumerationFromYAML<SE.AutoSaveFormDataInSettings>(
    context,
    data.АвтоматическоеСохранениеДанныхВНастройках,
    SE.AutoSaveFormDataInSettingsFromEnterprise
  )
  if (autoSaveDataInSettings !== undefined) result.autoSaveDataInSettings = autoSaveDataInSettings

  const autoURL = importBooleanFromEnterprise(context, data.АвтоНавигационнаяСсылка)
  if (autoURL !== undefined) result.autoURL = autoURL

  const verticalScroll = importSystemEnumerationFromYAML<SE.VerticalFormScroll>(
    context,
    data.ВертикальнаяПрокрутка,
    SE.VerticalFormScrollFromEnterprise
  )
  if (verticalScroll !== undefined) result.verticalScroll = verticalScroll

  const childItemsVerticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеПодчиненных,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const verticalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    data.ВертикальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromYAML<SE.ItemsAndTitlesAlignVariant>(
    context,
    data.ВыравниваниеЭлементовИЗаголовков,
    SE.ItemsAndTitlesAlignVariantFromEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  if (data.Высота !== undefined) result.height = data.Высота

  const childItemsHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеПодчиненных,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const horizontalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    data.ГоризонтальныйИнтервал,
    SE.FormItemSpacingFromEnterprise
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const group = importSystemEnumerationFromYAML<SE.ChildFormItemsGroup>(
    context,
    data.Группировка,
    SE.ChildFormItemsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const customizable = importBooleanFromEnterprise(context, data.РазрешитьИзменятьФорму)
  if (customizable !== undefined) result.customizable = customizable

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  const closeOnChoice = importBooleanFromEnterprise(context, data.ЗакрыватьПриВыборе)
  if (closeOnChoice !== undefined) result.closeOnChoice = closeOnChoice

  const closeOnOwnerClose = importBooleanFromEnterprise(context, data.ЗакрыватьПриЗакрытииВладельца)
  if (closeOnOwnerClose !== undefined) result.closeOnOwnerClose = closeOnOwnerClose

  const usedFormServer = importSystemEnumerationFromYAML<SE.UsedServer>(
    context,
    data.ИспользуемыйСерверФормы,
    SE.UsedServerFromEnterprise
  )
  if (usedFormServer !== undefined) result.usedFormServer = usedFormServer

  const commandInterface = importCommandInterfaceFromEnterprise(context, data.ИнтерфейсКоманды)
  if (commandInterface !== undefined) result.commandInterface = commandInterface

  if (data.КлючНазначенияИспользования !== undefined) result.purposeUseKey = data.КлючНазначенияИспользования

  if (data.КлючСохраненияПоложенияОкна !== undefined) result.windowOptionsKey = data.КлючСохраненияПоложенияОкна

  const autoCommandBar = importAutoCommandBarFromEnterprise(
    itemsContext,
    structure.autoCommandBar,
    data.КоманднаяПанель
  )
  if (autoCommandBar !== undefined) result.autoCommandBar = autoCommandBar

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  const modalMode = importBooleanFromEnterprise(context, data.МодальныйРежим)
  if (modalMode !== undefined) result.modalMode = modalMode

  const modified = importBooleanFromEnterprise(context, data.Модифицированность)
  if (modified !== undefined) result.modified = modified

  const showTitle = importBooleanFromEnterprise(context, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const showCloseButton = importBooleanFromEnterprise(context, data.ОтображатьКнопкуЗакрытия)
  if (showCloseButton !== undefined) result.showCloseButton = showCloseButton

  const conversationsRepresentation = importSystemEnumerationFromYAML<SE.FormConversationsRepresentation>(
    context,
    data.ОтображениеОбсуждений,
    SE.FormConversationsRepresentationFromEnterprise
  )
  if (conversationsRepresentation !== undefined) result.conversationsRepresentation = conversationsRepresentation

  const enterKeyBehavior = importSystemEnumerationFromYAML<SE.EnterKeyBehaviorType>(
    context,
    data.ПоведениеКлавишиEnter,
    SE.EnterKeyBehaviorTypeFromEnterprise
  )
  if (enterKeyBehavior !== undefined) result.enterKeyBehavior = enterKeyBehavior

  const commandBarLocation = importSystemEnumerationFromYAML<SE.FormCommandBarLabelLocation>(
    context,
    data.ПоложениеКоманднойПанели,
    SE.FormCommandBarLabelLocationFromEnterprise
  )
  if (commandBarLocation !== undefined) result.commandBarLocation = commandBarLocation

  const autoFillCheck = importBooleanFromEnterprise(context, data.ПроверятьЗаполнениеАвтоматически)
  if (autoFillCheck !== undefined) result.autoFillCheck = autoFillCheck

  const formWindowOpeningMode = importSystemEnumerationFromYAML<SE.FormWindowOpeningMode>(
    context,
    data.РежимОткрытияОкнаФормы,
    SE.FormWindowOpeningModeFromEnterprise
  )
  if (formWindowOpeningMode !== undefined) result.formWindowOpeningMode = formWindowOpeningMode

  const collapseItemsByImportance = importSystemEnumerationFromYAML<SE.CollapseFormItemsByImportance>(
    context,
    data.СворачиваниеЭлементовПоВажности,
    SE.CollapseFormItemsByImportanceFromEnterprise
  )
  if (collapseItemsByImportance !== undefined) result.collapseItemsByImportance = collapseItemsByImportance

  const saveDataInSettings = importSystemEnumerationFromYAML<SE.SaveFormDataInSettings>(
    context,
    data.СохранениеДанныхВНастройках,
    SE.SaveFormDataInSettingsFromEnterprise
  )
  if (saveDataInSettings !== undefined) result.saveDataInSettings = saveDataInSettings

  const savedInSettingsDataModified = importBooleanFromEnterprise(
    context,
    data.СохраняемыеВНастройкахДанныеМодифицированы
  )
  if (savedInSettingsDataModified !== undefined) result.savedInSettingsDataModified = savedInSettingsDataModified

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  if (data.Ширина !== undefined) result.width = data.Ширина

  const slaveItemsWidth = importSystemEnumerationFromYAML<SE.ChildFormItemsWidth>(
    context,
    data.ШиринаПодчиненныхЭлементов,
    SE.ChildFormItemsWidthFromEnterprise
  )
  if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  const saveWindowSettings = importBooleanFromEnterprise(context, data.СохранятьНастройкиОкна)
  if (saveWindowSettings !== undefined) result.saveWindowSettings = saveWindowSettings

  const events = importClientApplicationFormEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  const attributes = importFormAttributesFromEnterprise(context, data.Реквизиты)
  if (attributes !== undefined) result.attributes = attributes

  const parameters = importFormParametersFromEnterprise(context, data.Параметры)
  if (parameters !== undefined) result.parameters = parameters

  const synonim = importI8nTextFromEnterprise(context, data.Синоним)
  if (synonim !== undefined) result.synonim = synonim

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  const includeHelpInContents = importBooleanFromEnterprise(context, data.ВключатьСправкуВСодержание)
  if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents

  const usePurposes = importUsePurposesFromEnterprise(context, data.НазначенияИспользования)
  if (usePurposes !== undefined) result.usePurposes = usePurposes

  result.childItems = importChildItemsPartialFromEnterprise(itemsContext, structure.childItems)

  return result
}

const importClientApplicationFormEventsFromEnterprise = (
  data: ClientApplicationFormEnterprise["События"] | undefined
): ClientApplicationFormEvents | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: ClientApplicationFormEvents = {}

  for (const [enterpriseEventName, eventValue] of Object.entries(data)) {
    const eventName = clientApplicationFormEnterpriseEventNameMapping[enterpriseEventName]
    if (eventName && eventValue) {
      result[eventName] = eventValue
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
