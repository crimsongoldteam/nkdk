import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { CommandSet, CommandSetEnterprise, CommandSetXML } from "~/metadata/forms/commandSet/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormAttribute, FormAttributesEnterprise, FormAttributesXML } from "../../../commonObjects/formAttribute/types"
import { ChildItems, ChildItemsPartialEnterprise, ChildItemsXML } from "../../collections/childItems/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { CommandBarEnterprise, CommandBarXML } from "../../elements/commandBar/types"
import { EventsXML } from "../../events/types"

export interface ClientApplicationFormEvents {
  collaborationSystemUsersAutoComplete?: string
  externalEvent?: string
  activationProcessing?: string
  choiceProcessing?: string
  newWriteProcessing?: string
  uRLProcessing?: string
  notificationProcessing?: string
  navigationProcessing?: string
  uRLGetProcessing?: string
  uRLListGetProcessing?: string
  collaborationSystemUsersChoiceFormGetProcessing?: string
  fillCheckProcessingAtServer?: string
  addInDetachmentOnError?: string
  beforeLoadDataFromSettingsAtServer?: string
  beforeClose?: string
  beforeReopenFromOtherServer?: string
  onPasteFromClipboard?: string
  onLoadDataFromSettingsAtServer?: string
  onClose?: string
  onMainServerAvailabilityChange?: string
  onChangeDisplaySettings?: string
  onOpen?: string
  onReopenFromOtherServer?: string
  onReopen?: string
  onCreateAtServer?: string
  onSaveDataInSettingsAtServer?: string
}

export interface ClientApplicationForm {
  commandSet?: CommandSet
  // elementType: FormElementType
  attributes?: FormAttribute[]
  autoCommandBar?: AutoCommandBar
  autoTitle?: boolean
  autoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  autoURL?: boolean
  verticalScroll?: SE.VerticalFormScroll
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  verticalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  height?: number
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  horizontalSpacing?: SE.FormItemSpacing
  group?: SE.ChildFormItemsGroup
  enabled?: boolean
  title?: I8nText
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  // formName?: string
  usedFormServer?: SE.UsedServer
  purposeUseKey?: string
  windowOptionsKey?: string
  scale?: number
  modalMode?: boolean
  modified?: boolean
  url?: string
  showTitle?: boolean
  showCloseButton?: boolean
  conversationsRepresentation?: SE.FormConversationsRepresentation
  enterKeyBehavior?: SE.EnterKeyBehaviorType
  childItems: ChildItems
  commandBarLocation?: SE.FormCommandBarLabelLocation
  autoFillCheck?: boolean
  formWindowOpeningMode?: SE.FormWindowOpeningMode
  collapseItemsByImportance?: SE.CollapseFormItemsByImportance
  saveDataInSettings?: SE.SaveFormDataInSettings
  savedInSettingsDataModified?: boolean
  readOnly?: boolean
  uuid?: string
  width?: number
  slaveItemsWidth?: SE.ChildFormItemsWidth
  events?: ClientApplicationFormEvents
}

export interface ClientApplicationFormXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:dcscor"?: string
  "_xmlns:dcssch"?: string
  "_xmlns:dcsset"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string
  AutoFillCheck?: boolean
  AutoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  AutoTitle?: boolean
  AutoURL?: boolean
  ChildItemsHorizontalAlign?: SE.ItemHorizontalLocation
  ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  CloseOnChoice?: boolean
  CloseOnOwnerClose?: boolean
  CollapseItemsByImportance?: SE.CollapseFormItemsByImportance
  CommandBarLocation?: SE.FormCommandBarLabelLocation
  ConversationsRepresentation?: SE.FormConversationsRepresentation
  Enabled?: boolean
  EnterKeyBehavior?: SE.EnterKeyBehaviorType
  // FormName?: string
  FormWindowOpeningMode?: SE.FormWindowOpeningMode
  Group?: SE.ChildFormItemsGroup
  Height?: number
  HorizontalSpacing?: SE.FormItemSpacing
  ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  ModalMode?: boolean
  Modified?: boolean
  PurposeUseKey?: string
  ReadOnly?: boolean
  SaveDataInSettings?: SE.SaveFormDataInSettings
  SavedInSettingsDataModified?: boolean
  Scale?: number
  ShowCloseButton?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.ChildFormItemsWidth
  Title?: I8nTextXML
  URL?: string
  UUID?: string
  UsedFormServer?: SE.UsedServer
  VerticalScroll?: SE.VerticalFormScroll
  VerticalSpacing?: SE.FormItemSpacing
  Width?: number
  WindowOptionsKey?: string
  CommandSet?: CommandSetXML
  UseForFoldersAndItems?: SE.FoldersAndItemsUse
  AutoCommandBar: CommandBarXML
  Events?: EventsXML
  ChildItems?: ChildItemsXML
  Attributes?: {
    Attribute: FormAttributesXML
  }
}

export interface ClientApplicationFormEnterprise {
  АвтоЗаголовок?: StringboolEnterprise
  АвтоматическоеСохранениеДанныхВНастройках?: SE.AutoSaveFormDataInSettingsEnterprise
  АвтоНавигационнаяСсылка?: StringboolEnterprise
  ВертикальнаяПрокрутка?: SE.VerticalFormScrollEnterprise
  ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignEnterprise
  ВертикальныйИнтервал?: SE.FormItemSpacingEnterprise
  ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantEnterprise
  Высота?: number
  ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальныйИнтервал?: SE.FormItemSpacingEnterprise
  Группировка?: SE.ChildFormItemsGroupEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  ЗакрыватьПриВыборе?: StringboolEnterprise
  ЗакрыватьПриЗакрытииВладельца?: StringboolEnterprise
  ИспользуемыйСерверФормы?: SE.UsedServerEnterprise
  КлючНазначенияИспользования?: string
  КлючСохраненияПоложенияОкна?: string
  КоманднаяПанель?: CommandBarEnterprise
  Масштаб?: number
  МодальныйРежим?: StringboolEnterprise
  Модифицированность?: StringboolEnterprise
  НавигационнаяСсылка?: string
  ОтображатьЗаголовок?: StringboolEnterprise
  ОтображатьКнопкуЗакрытия?: StringboolEnterprise
  ОтображениеОбсуждений?: SE.FormConversationsRepresentationEnterprise
  ПоведениеКлавишиEnter?: SE.EnterKeyBehaviorTypeEnterprise
  ПоложениеКоманднойПанели?: SE.FormCommandBarLabelLocationEnterprise
  ПроверятьЗаполнениеАвтоматически?: StringboolEnterprise
  РежимОткрытияОкнаФормы?: SE.FormWindowOpeningModeEnterprise
  СворачиваниеЭлементовПоВажности?: SE.CollapseFormItemsByImportanceEnterprise
  СохранениеДанныхВНастройках?: SE.SaveFormDataInSettingsEnterprise
  СохраняемыеВНастройкахДанныеМодифицированы?: StringboolEnterprise
  СоставКоманд?: CommandSetEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  Ширина?: number
  ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthEnterprise
  Реквизиты?: FormAttributesEnterprise
  События?: {
    АвтоПодборПользователейСистемыВзаимодействия?: string
    ВнешнееСобытие?: string
    ОбработкаАктивизации?: string
    ОбработкаВыбора?: string
    ОбработкаЗаписиНового?: string
    ОбработкаНавигационнойСсылки?: string
    ОбработкаОповещения?: string
    ОбработкаПерехода?: string
    ОбработкаПолученияНавигационнойСсылки?: string
    ОбработкаПолученияСпискаНавигационныхСсылок?: string
    ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия?: string
    ОбработкаПроверкиЗаполненияНаСервере?: string
    ОтключениеВнешнейКомпонентыПриОшибке?: string
    ПередЗагрузкойДанныхИзНастроекНаСервере?: string
    ПередЗакрытием?: string
    ПередПереоткрытиемСДругогоСервера?: string
    ПриВставкеИзБуфераОбмена?: string
    ПриЗагрузкеДанныхИзНастроекНаСервере?: string
    ПриЗакрытии?: string
    ПриИзмененииДоступностиОсновногоСервера?: string
    ПриИзмененииПараметровЭкрана?: string
    ПриОткрытии?: string
    ПриПереоткрытииСДругогоСервера?: string
    ПриПовторномОткрытии?: string
    ПриСозданииНаСервере?: string
    ПриСохраненииДанныхВНастройкахНаСервере?: string
  }
  Элементы?: ChildItemsPartialEnterprise
}
