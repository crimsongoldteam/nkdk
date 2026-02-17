import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUsePurposesFromEnterprise } from "~/metadata/commonObjects/usePurposes/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsFromPartialYAML } from "../../collections/childItems/importFromEnterprise"
import { ChildItemsStructureResult } from "../../collections/childItems/types"
import { importCommandInterfaceFromEnterprise } from "../../commonObjects/commandInterface/importFromEnterprise"
import { importCommandSetFromEnterprise } from "../../commonObjects/commandSet/importFromEnterprise"
import { importFormAttributesFromEnterprise } from "../../commonObjects/formAttribute/importFromEnterprise"
import { importCommandsFromEnterprise } from "../../commonObjects/formCommand/importFromEnterprise"
import { importFormParametersFromEnterprise } from "../../commonObjects/formParameter/importFromEnterprise"
import { ClientApplicationForm, ClientApplicationFormEnterprise } from "./types"

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
    commands: importCommandsFromEnterprise(context, undefined, data.Команды),
    childItems: [],
    itemType: "ClientApplicationForm",
  }

  const autoTitle = importBooleanFromEnterprise(context, undefined, data.АвтоЗаголовок)
  if (autoTitle !== undefined) result.autoTitle = autoTitle

  const commandSet = importCommandSetFromEnterprise(context, undefined, data.СоставКоманд)
  if (commandSet !== undefined) result.commandSet = commandSet

  const autoSaveDataInSettings = importSystemEnumerationFromYAML<SE.AutoSaveFormDataInSettings>(
    context,
    { type: "SystemEnumeration", typeSE: "AutoSaveFormDataInSettings" },
    data.АвтоматическоеСохранениеДанныхВНастройках
  )
  if (autoSaveDataInSettings !== undefined) result.autoSaveDataInSettings = autoSaveDataInSettings

  const autoURL = importBooleanFromEnterprise(context, undefined, data.АвтоНавигационнаяСсылка)
  if (autoURL !== undefined) result.autoURL = autoURL

  const verticalScroll = importSystemEnumerationFromYAML<SE.VerticalFormScroll>(
    context,
    { type: "SystemEnumeration", typeSE: "VerticalFormScroll" },
    data.ВертикальнаяПрокрутка
  )
  if (verticalScroll !== undefined) result.verticalScroll = verticalScroll

  const childItemsVerticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.ВертикальноеПоложениеПодчиненных
  )
  if (childItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = childItemsVerticalAlign

  const verticalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    { type: "SystemEnumeration", typeSE: "FormItemSpacing" },
    data.ВертикальныйИнтервал
  )
  if (verticalSpacing !== undefined) result.verticalSpacing = verticalSpacing

  const itemsAndTitlesAlign = importSystemEnumerationFromYAML<SE.ItemsAndTitlesAlignVariant>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemsAndTitlesAlignVariant" },
    data.ВыравниваниеЭлементовИЗаголовков
  )
  if (itemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = itemsAndTitlesAlign

  if (data.Высота !== undefined) result.height = data.Высота

  const childItemsHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.ГоризонтальноеПоложениеПодчиненных
  )
  if (childItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = childItemsHorizontalAlign

  const horizontalSpacing = importSystemEnumerationFromYAML<SE.FormItemSpacing>(
    context,
    { type: "SystemEnumeration", typeSE: "FormItemSpacing" },
    data.ГоризонтальныйИнтервал
  )
  if (horizontalSpacing !== undefined) result.horizontalSpacing = horizontalSpacing

  const group = importSystemEnumerationFromYAML<SE.ChildFormItemsGroup>(
    context,
    { type: "SystemEnumeration", typeSE: "ChildFormItemsGroup" },
    data.Группировка
  )
  if (group !== undefined) result.group = group

  const customizable = importBooleanFromEnterprise(context, undefined, data.РазрешитьИзменятьФорму)
  if (customizable !== undefined) result.customizable = customizable

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const title = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Заголовок)
  if (title !== undefined) result.title = title

  const closeOnChoice = importBooleanFromEnterprise(context, undefined, data.ЗакрыватьПриВыборе)
  if (closeOnChoice !== undefined) result.closeOnChoice = closeOnChoice

  const closeOnOwnerClose = importBooleanFromEnterprise(context, undefined, data.ЗакрыватьПриЗакрытииВладельца)
  if (closeOnOwnerClose !== undefined) result.closeOnOwnerClose = closeOnOwnerClose

  const usedFormServer = importSystemEnumerationFromYAML<SE.UsedServer>(
    context,
    { type: "SystemEnumeration", typeSE: "UsedServer" },
    data.ИспользуемыйСерверФормы
  )
  if (usedFormServer !== undefined) result.usedFormServer = usedFormServer

  const commandInterface = importCommandInterfaceFromEnterprise(context, undefined, data.ИнтерфейсКоманды)
  if (commandInterface !== undefined) result.commandInterface = commandInterface

  if (data.КлючНазначенияИспользования !== undefined) result.purposeUseKey = data.КлючНазначенияИспользования

  if (data.КлючСохраненияПоложенияОкна !== undefined) result.windowOptionsKey = data.КлючСохраненияПоложенияОкна

  const autoCommandBar = importAutoCommandBarFromEnterprise(
    itemsContext,
    undefined,
    structure.autoCommandBar,
    data.КоманднаяПанель
  )
  if (autoCommandBar !== undefined) result.autoCommandBar = autoCommandBar

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  const modalMode = importBooleanFromEnterprise(context, undefined, data.МодальныйРежим)
  if (modalMode !== undefined) result.modalMode = modalMode

  const modified = importBooleanFromEnterprise(context, undefined, data.Модифицированность)
  if (modified !== undefined) result.modified = modified

  const showTitle = importBooleanFromEnterprise(context, undefined, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const showCloseButton = importBooleanFromEnterprise(context, undefined, data.ОтображатьКнопкуЗакрытия)
  if (showCloseButton !== undefined) result.showCloseButton = showCloseButton

  const conversationsRepresentation = importSystemEnumerationFromYAML<SE.FormConversationsRepresentation>(
    context,
    { type: "SystemEnumeration", typeSE: "FormConversationsRepresentation" },
    data.ОтображениеОбсуждений
  )
  if (conversationsRepresentation !== undefined) result.conversationsRepresentation = conversationsRepresentation

  const enterKeyBehavior = importSystemEnumerationFromYAML<SE.EnterKeyBehaviorType>(
    context,
    { type: "SystemEnumeration", typeSE: "EnterKeyBehaviorType" },
    data.ПоведениеКлавишиEnter
  )
  if (enterKeyBehavior !== undefined) result.enterKeyBehavior = enterKeyBehavior

  const commandBarLocation = importSystemEnumerationFromYAML<SE.FormCommandBarLabelLocation>(
    context,
    { type: "SystemEnumeration", typeSE: "FormCommandBarLabelLocation" },
    data.ПоложениеКоманднойПанели
  )
  if (commandBarLocation !== undefined) result.commandBarLocation = commandBarLocation

  const autoFillCheck = importBooleanFromEnterprise(context, undefined, data.ПроверятьЗаполнениеАвтоматически)
  if (autoFillCheck !== undefined) result.autoFillCheck = autoFillCheck

  const formWindowOpeningMode = importSystemEnumerationFromYAML<SE.FormWindowOpeningMode>(
    context,
    { type: "SystemEnumeration", typeSE: "FormWindowOpeningMode" },
    data.РежимОткрытияОкнаФормы
  )
  if (formWindowOpeningMode !== undefined) result.formWindowOpeningMode = formWindowOpeningMode

  const collapseItemsByImportance = importSystemEnumerationFromYAML<SE.CollapseFormItemsByImportance>(
    context,
    { type: "SystemEnumeration", typeSE: "CollapseFormItemsByImportance" },
    data.СворачиваниеЭлементовПоВажности
  )
  if (collapseItemsByImportance !== undefined) result.collapseItemsByImportance = collapseItemsByImportance

  const saveDataInSettings = importSystemEnumerationFromYAML<SE.SaveFormDataInSettings>(
    context,
    { type: "SystemEnumeration", typeSE: "SaveFormDataInSettings" },
    data.СохранениеДанныхВНастройках
  )
  if (saveDataInSettings !== undefined) result.saveDataInSettings = saveDataInSettings

  const savedInSettingsDataModified = importBooleanFromEnterprise(
    context,
    undefined,
    data.СохраняемыеВНастройкахДанныеМодифицированы
  )
  if (savedInSettingsDataModified !== undefined) result.savedInSettingsDataModified = savedInSettingsDataModified

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  if (data.Ширина !== undefined) result.width = data.Ширина

  const slaveItemsWidth = importSystemEnumerationFromYAML<SE.ChildFormItemsWidth>(
    context,
    { type: "SystemEnumeration", typeSE: "ChildFormItemsWidth" },
    data.ШиринаПодчиненныхЭлементов
  )
  if (slaveItemsWidth !== undefined) result.slaveItemsWidth = slaveItemsWidth

  const saveWindowSettings = importBooleanFromEnterprise(context, undefined, data.СохранятьНастройкиОкна)
  if (saveWindowSettings !== undefined) result.saveWindowSettings = saveWindowSettings

  const events = importClientApplicationFormEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  const attributes = importFormAttributesFromEnterprise(context, undefined, data.Реквизиты)
  if (attributes !== undefined) result.attributes = attributes

  const parameters = importFormParametersFromEnterprise(context, undefined, data.Параметры)
  if (parameters !== undefined) result.parameters = parameters

  const synonim = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Синоним)
  if (synonim !== undefined) result.synonym = synonim

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  const includeHelpInContents = importBooleanFromEnterprise(context, undefined, data.ВключатьСправкуВСодержание)
  if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents

  const usePurposes = importUsePurposesFromEnterprise(context, undefined, data.НазначенияИспользования)
  if (usePurposes !== undefined) result.usePurposes = usePurposes

  result.childItems = importChildItemsFromPartialYAML(itemsContext, undefined, structure.childItems)

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
