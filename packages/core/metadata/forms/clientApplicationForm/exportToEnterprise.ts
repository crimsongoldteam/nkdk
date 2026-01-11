import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportFormAttributesToEnterprise } from "~/metadata/commonObjects/formAttribute/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormEvents,
} from "~/metadata/forms/clientApplicationForm/types"
import { exportCommandBarToEnterprise } from "~/metadata/forms/elements/commandBar/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportChildItemsToEnterprise } from "../collections/childItems/exportToEnterprise"
import { getAllElements } from "./getAllElements"

const clientApplicationFormEventNameMapping: Record<keyof ClientApplicationFormEvents, string> = {
  collaborationSystemUsersAutoComplete: "АвтоПодборПользователейСистемыВзаимодействия",
  externalEvent: "ВнешнееСобытие",
  activationProcessing: "ОбработкаАктивизации",
  choiceProcessing: "ОбработкаВыбора",
  newWriteProcessing: "ОбработкаЗаписиНового",
  uRLProcessing: "ОбработкаНавигационнойСсылки",
  notificationProcessing: "ОбработкаОповещения",
  navigationProcessing: "ОбработкаПерехода",
  uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
  uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
  collaborationSystemUsersChoiceFormGetProcessing: "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
  fillCheckProcessingAtServer: "ОбработкаПроверкиЗаполненияНаСервере",
  addInDetachmentOnError: "ОтключениеВнешнейКомпонентыПриОшибке",
  beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
  beforeClose: "ПередЗакрытием",
  beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
  onPasteFromClipboard: "ПриВставкеИзБуфераОбмена",
  onLoadDataFromSettingsAtServer: "ПриЗагрузкеДанныхИзНастроекНаСервере",
  onClose: "ПриЗакрытии",
  onMainServerAvailabilityChange: "ПриИзмененииДоступностиОсновногоСервера",
  onChangeDisplaySettings: "ПриИзмененииПараметровЭкрана",
  onOpen: "ПриОткрытии",
  onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
  onReopen: "ПриПовторномОткрытии",
  onCreateAtServer: "ПриСозданииНаСервере",
  onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
}

const exportClientApplicationFormEventsToEnterprise = (
  _context: ConfigurationContext,
  data: ClientApplicationFormEvents | undefined
): ClientApplicationFormEnterprise["События"] | undefined => {
  if (!data || Object.keys(data).length === 0) return undefined

  const result: ClientApplicationFormEnterprise["События"] = {}

  for (const [eventName, eventValue] of Object.entries(data)) {
    const enterpriseEventName = clientApplicationFormEventNameMapping[eventName as keyof ClientApplicationFormEvents]
    if (enterpriseEventName && eventValue) {
      ;(result as Record<string, string>)[enterpriseEventName] = eventValue
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportClientApplicationFormToEnterprise = (
  context: ConfigurationContext,
  data: ClientApplicationForm | undefined
): ClientApplicationFormEnterprise | undefined => {
  if (!data) return undefined

  const result: ClientApplicationFormEnterprise = {}

  const autoTitle = exportBooleanToEnterprise(context, data.autoTitle)
  if (autoTitle !== undefined) result.АвтоЗаголовок = autoTitle

  const autoSaveDataInSettings = exportSystemEnumerationToEnterprise(
    context,
    data.autoSaveDataInSettings,
    SE.AutoSaveFormDataInSettingsToEnterprise
  )
  if (autoSaveDataInSettings !== undefined) result.АвтоматическоеСохранениеДанныхВНастройках = autoSaveDataInSettings

  const autoURL = exportBooleanToEnterprise(context, data.autoURL)
  if (autoURL !== undefined) result.АвтоНавигационнаяСсылка = autoURL

  const verticalScroll = exportSystemEnumerationToEnterprise(
    context,
    data.verticalScroll,
    SE.VerticalFormScrollToEnterprise
  )
  if (verticalScroll !== undefined) result.ВертикальнаяПрокрутка = verticalScroll

  const childItemsVerticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.childItemsVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.ВертикальноеПоложениеПодчиненных = childItemsVerticalAlign

  const verticalSpacing = exportSystemEnumerationToEnterprise(
    context,
    data.verticalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (verticalSpacing !== undefined) result.ВертикальныйИнтервал = verticalSpacing

  const itemsAndTitlesAlign = exportSystemEnumerationToEnterprise(
    context,
    data.itemsAndTitlesAlign,
    SE.ItemsAndTitlesAlignVariantToEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.ВыравниваниеЭлементовИЗаголовков = itemsAndTitlesAlign

  if (data.height !== undefined) result.Высота = data.height

  const childItemsHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.childItemsHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеПодчиненных = childItemsHorizontalAlign

  const horizontalSpacing = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (horizontalSpacing !== undefined) result.ГоризонтальныйИнтервал = horizontalSpacing

  const group = exportSystemEnumerationToEnterprise(context, data.group, SE.ChildFormItemsGroupToEnterprise)
  if (group !== undefined) result.Группировка = group

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  const closeOnChoice = exportBooleanToEnterprise(context, data.closeOnChoice)
  if (closeOnChoice !== undefined) result.ЗакрыватьПриВыборе = closeOnChoice

  const closeOnOwnerClose = exportBooleanToEnterprise(context, data.closeOnOwnerClose)
  if (closeOnOwnerClose !== undefined) result.ЗакрыватьПриЗакрытииВладельца = closeOnOwnerClose

  const usedFormServer = exportSystemEnumerationToEnterprise(context, data.usedFormServer, SE.UsedServerToEnterprise)
  if (usedFormServer !== undefined) result.ИспользуемыйСерверФормы = usedFormServer

  if (data.purposeUseKey !== undefined) result.КлючНазначенияИспользования = data.purposeUseKey

  if (data.windowOptionsKey !== undefined) result.КлючСохраненияПоложенияОкна = data.windowOptionsKey

  const commandBar = exportCommandBarToEnterprise(context, data.commandBar)
  if (commandBar !== undefined) result.КоманднаяПанель = commandBar

  if (data.scale !== undefined) result.Масштаб = data.scale

  const modalMode = exportBooleanToEnterprise(context, data.modalMode)
  if (modalMode !== undefined) result.МодальныйРежим = modalMode

  const modified = exportBooleanToEnterprise(context, data.modified)
  if (modified !== undefined) result.Модифицированность = modified

  if (data.url !== undefined) result.НавигационнаяСсылка = data.url

  const showTitle = exportBooleanToEnterprise(context, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  const showCloseButton = exportBooleanToEnterprise(context, data.showCloseButton)
  if (showCloseButton !== undefined) result.ОтображатьКнопкуЗакрытия = showCloseButton

  const conversationsRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.conversationsRepresentation,
    SE.FormConversationsRepresentationToEnterprise
  )
  if (conversationsRepresentation !== undefined) result.ОтображениеОбсуждений = conversationsRepresentation

  const enterKeyBehavior = exportSystemEnumerationToEnterprise(
    context,
    data.enterKeyBehavior,
    SE.EnterKeyBehaviorTypeToEnterprise
  )
  if (enterKeyBehavior !== undefined) result.ПоведениеКлавишиEnter = enterKeyBehavior

  const commandBarLocation = exportSystemEnumerationToEnterprise(
    context,
    data.commandBarLocation,
    SE.FormCommandBarLabelLocationToEnterprise
  )
  if (commandBarLocation !== undefined) result.ПоложениеКоманднойПанели = commandBarLocation

  const autoFillCheck = exportBooleanToEnterprise(context, data.autoFillCheck)
  if (autoFillCheck !== undefined) result.ПроверятьЗаполнениеАвтоматически = autoFillCheck

  const formWindowOpeningMode = exportSystemEnumerationToEnterprise(
    context,
    data.formWindowOpeningMode,
    SE.FormWindowOpeningModeToEnterprise
  )
  if (formWindowOpeningMode !== undefined) result.РежимОткрытияОкнаФормы = formWindowOpeningMode

  const collapseItemsByImportance = exportSystemEnumerationToEnterprise(
    context,
    data.collapseItemsByImportance,
    SE.CollapseFormItemsByImportanceToEnterprise
  )
  if (collapseItemsByImportance !== undefined) result.СворачиваниеЭлементовПоВажности = collapseItemsByImportance

  const saveDataInSettings = exportSystemEnumerationToEnterprise(
    context,
    data.saveDataInSettings,
    SE.SaveFormDataInSettingsToEnterprise
  )
  if (saveDataInSettings !== undefined) result.СохранениеДанныхВНастройках = saveDataInSettings

  const savedInSettingsDataModified = exportBooleanToEnterprise(context, data.savedInSettingsDataModified)
  if (savedInSettingsDataModified !== undefined)
    result.СохраняемыеВНастройкахДанныеМодифицированы = savedInSettingsDataModified

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  if (data.width !== undefined) result.Ширина = data.width

  const slaveItemsWidth = exportSystemEnumerationToEnterprise(
    context,
    data.slaveItemsWidth,
    SE.ChildFormItemsWidthToEnterprise
  )
  if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  const attributes = exportFormAttributesToEnterprise(context, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  const events = exportClientApplicationFormEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  const allElements = getAllElements(data)
  const childItems = exportChildItemsToEnterprise(context, allElements)
  if (childItems !== undefined) result.Элементы = childItems

  return result
}

registerMetadata("ExportToEnterprise", "ClientApplicationForm", exportClientApplicationFormToEnterprise)
