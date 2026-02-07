import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportFormAttributesToEnterprise } from "~/metadata/commonObjects/formAttribute/exportToEnterprise"
import { exportFormParametersToEnterprise } from "~/metadata/commonObjects/formParameter/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUsePurposesToEnterprise } from "~/metadata/commonObjects/usePurposes/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormEvents,
} from "~/metadata/forms/clientApplicationForm/base/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportPartialChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"
import { exportCommandsToEnterprise } from "../../commands/exportToEnterprise"
import { exportCommandSetToEnterprise } from "../../commandSet/exportToEnterprise"
import { exportCommandInterfaceToEnterprise } from "../../commonObjects/commandInterface/exportToEnterprise"
import { exportAutoCommandBarToEnterprise } from "../../elements/autoCommandBar/exportToEnterprise"
import { PropertyRule } from "../../elements/calendarField/rules"
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
  _rule: PropertyRule<any>,
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

  const synonym = exportI8nTextToYAML(context, undefined, data.synonim)
  if (synonym !== undefined) result.Синоним = synonym

  if (data.comment !== undefined) result.Комментарий = data.comment

  const includeHelpInContents = exportBooleanToEnterprise(context, undefined, data.includeHelpInContents)
  if (includeHelpInContents !== undefined) result.ВключатьСправкуВСодержание = includeHelpInContents

  const usePurposes = exportUsePurposesToEnterprise(context, undefined, data.usePurposes)
  if (usePurposes !== undefined) result.НазначенияИспользования = usePurposes

  const autoTitle = exportBooleanToEnterprise(context, undefined, data.autoTitle)
  if (autoTitle !== undefined) result.АвтоЗаголовок = autoTitle

  const autoSaveDataInSettings = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.autoSaveDataInSettings,
    SE.AutoSaveFormDataInSettingsToEnterprise
  )
  if (autoSaveDataInSettings !== undefined) result.АвтоматическоеСохранениеДанныхВНастройках = autoSaveDataInSettings

  const autoURL = exportBooleanToEnterprise(context, undefined, data.autoURL)
  if (autoURL !== undefined) result.АвтоНавигационнаяСсылка = autoURL

  const saveWindowSettings = exportBooleanToEnterprise(context, undefined, data.saveWindowSettings)
  if (saveWindowSettings !== undefined) result.СохранятьНастройкиОкна = saveWindowSettings

  const verticalScroll = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.verticalScroll,
    SE.VerticalFormScrollToEnterprise
  )
  if (verticalScroll !== undefined) result.ВертикальнаяПрокрутка = verticalScroll

  const childItemsVerticalAlign = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.childItemsVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (childItemsVerticalAlign !== undefined) result.ВертикальноеПоложениеПодчиненных = childItemsVerticalAlign

  const verticalSpacing = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.verticalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (verticalSpacing !== undefined) result.ВертикальныйИнтервал = verticalSpacing

  const itemsAndTitlesAlign = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.itemsAndTitlesAlign,
    SE.ItemsAndTitlesAlignVariantToEnterprise
  )
  if (itemsAndTitlesAlign !== undefined) result.ВыравниваниеЭлементовИЗаголовков = itemsAndTitlesAlign

  if (data.height !== undefined) result.Высота = data.height

  const childItemsHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.childItemsHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (childItemsHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеПодчиненных = childItemsHorizontalAlign

  const horizontalSpacing = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.horizontalSpacing,
    SE.FormItemSpacingToEnterprise
  )
  if (horizontalSpacing !== undefined) result.ГоризонтальныйИнтервал = horizontalSpacing

  const group = exportSystemEnumerationToEnterprise(context, undefined, data.group, SE.ChildFormItemsGroupToEnterprise)
  if (group !== undefined) result.Группировка = group

  const customizable = exportBooleanToEnterprise(context, undefined, data.customizable)
  if (customizable !== undefined) result.РазрешитьИзменятьФорму = customizable

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  const closeOnChoice = exportBooleanToEnterprise(context, undefined, data.closeOnChoice)
  if (closeOnChoice !== undefined) result.ЗакрыватьПриВыборе = closeOnChoice

  const closeOnOwnerClose = exportBooleanToEnterprise(context, undefined, data.closeOnOwnerClose)
  if (closeOnOwnerClose !== undefined) result.ЗакрыватьПриЗакрытииВладельца = closeOnOwnerClose

  const usedFormServer = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.usedFormServer,
    SE.UsedServerToEnterprise
  )
  if (usedFormServer !== undefined) result.ИспользуемыйСерверФормы = usedFormServer

  const commandInterface = exportCommandInterfaceToEnterprise(context, undefined, data.commandInterface)
  if (commandInterface !== undefined) result.ИнтерфейсКоманды = commandInterface

  if (data.purposeUseKey !== undefined) result.КлючНазначенияИспользования = data.purposeUseKey

  if (data.windowOptionsKey !== undefined) result.КлючСохраненияПоложенияОкна = data.windowOptionsKey

  const autoCommandBar = exportAutoCommandBarToEnterprise(context, undefined, data.autoCommandBar)
  if (autoCommandBar !== undefined) result.КоманднаяПанель = autoCommandBar

  const commands = exportCommandsToEnterprise(context, undefined, data.commands)
  if (commands !== undefined) result.Команды = commands

  if (data.scale !== undefined) result.Масштаб = data.scale

  const modalMode = exportBooleanToEnterprise(context, undefined, data.modalMode)
  if (modalMode !== undefined) result.МодальныйРежим = modalMode

  const modified = exportBooleanToEnterprise(context, undefined, data.modified)
  if (modified !== undefined) result.Модифицированность = modified

  // if (data.url !== undefined) result.НавигационнаяСсылка = data.url

  const showTitle = exportBooleanToEnterprise(context, undefined, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  const showCloseButton = exportBooleanToEnterprise(context, undefined, data.showCloseButton)
  if (showCloseButton !== undefined) result.ОтображатьКнопкуЗакрытия = showCloseButton

  const conversationsRepresentation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.conversationsRepresentation,
    SE.FormConversationsRepresentationToEnterprise
  )
  if (conversationsRepresentation !== undefined) result.ОтображениеОбсуждений = conversationsRepresentation

  const enterKeyBehavior = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.enterKeyBehavior,
    SE.EnterKeyBehaviorTypeToEnterprise
  )
  if (enterKeyBehavior !== undefined) result.ПоведениеКлавишиEnter = enterKeyBehavior

  const commandBarLocation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.commandBarLocation,
    SE.FormCommandBarLabelLocationToEnterprise
  )
  if (commandBarLocation !== undefined) result.ПоложениеКоманднойПанели = commandBarLocation

  const autoFillCheck = exportBooleanToEnterprise(context, undefined, data.autoFillCheck)
  if (autoFillCheck !== undefined) result.ПроверятьЗаполнениеАвтоматически = autoFillCheck

  const formWindowOpeningMode = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.formWindowOpeningMode,
    SE.FormWindowOpeningModeToEnterprise
  )
  if (formWindowOpeningMode !== undefined) result.РежимОткрытияОкнаФормы = formWindowOpeningMode

  const collapseItemsByImportance = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.collapseItemsByImportance,
    SE.CollapseFormItemsByImportanceToEnterprise
  )
  if (collapseItemsByImportance !== undefined) result.СворачиваниеЭлементовПоВажности = collapseItemsByImportance

  const commandSet = exportCommandSetToEnterprise(context, undefined, data.commandSet)
  if (commandSet !== undefined) result.СоставКоманд = commandSet

  const saveDataInSettings = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.saveDataInSettings,
    SE.SaveFormDataInSettingsToEnterprise
  )
  if (saveDataInSettings !== undefined) result.СохранениеДанныхВНастройках = saveDataInSettings

  const savedInSettingsDataModified = exportBooleanToEnterprise(context, undefined, data.savedInSettingsDataModified)
  if (savedInSettingsDataModified !== undefined)
    result.СохраняемыеВНастройкахДанныеМодифицированы = savedInSettingsDataModified

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  if (data.width !== undefined) result.Ширина = data.width

  const slaveItemsWidth = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.slaveItemsWidth,
    SE.ChildFormItemsWidthToEnterprise
  )
  if (slaveItemsWidth !== undefined) result.ШиринаПодчиненныхЭлементов = slaveItemsWidth

  const attributes = exportFormAttributesToEnterprise(context, undefined, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  const parameters = exportFormParametersToEnterprise(context, undefined, data.parameters)
  if (parameters !== undefined) result.Параметры = parameters

  const events = exportClientApplicationFormEventsToEnterprise(context, undefined, data.events)
  if (events !== undefined) result.События = events

  const allElements = getAllElements(data)
  const childItems = exportPartialChildItemsToEnterprise(context, undefined, allElements)
  if (childItems !== undefined) result.Элементы = childItems

  return result
}
