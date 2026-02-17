import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionPreview } from "~/metadata/commonObjects/typeDescription/types"
import { MetadataItem } from "~/metadata/metadataFactory"
import * as SE from "~/metadata/systemEnumerations/types"
import { GroupChildItem, GroupChilItemPartialEnterprise } from "../../collections/childItems/types"
import { CommandInterface, CommandInterfaceEnterprise } from "../../commonObjects/commandInterface/types"
import { CommandSet, CommandSetEnterprise } from "../../commonObjects/commandSet/types"
import { FormAttribute, FormAttributesXML, FormAttributesEnterprise } from "../../commonObjects/formAttribute/types"
import { FormCommand, FormCommandsXML, FormCommandsYAML } from "../../commonObjects/formCommand/types"
import { FormParameters, FormParametersXML, FormParametersEnterprise } from "../../commonObjects/formParameter/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "../../elements/autoCommandBar/types"

export interface ClientApplicationForm extends MetadataItem {
  itemType: "ClientApplicationForm"
  //#region ClientApplicationForm
  attributes?: FormAttribute[]
  autoCommandBar?: AutoCommandBar
  autoFillCheck?: boolean
  autoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  autoTitle?: boolean
  autoURL?: boolean
  childItems: GroupChildItem[]
  commandInterface?: CommandInterface
  parameters?: FormParameters
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  collapseItemsByImportance?: SE.CollapseFormItemsByImportance
  customizable?: boolean
  commandBarLocation?: SE.FormCommandBarLabelLocation
  commandSet?: CommandSet
  commands: FormCommand[]
  conversationsRepresentation?: SE.FormConversationsRepresentation
  enabled?: boolean
  enterKeyBehavior?: SE.EnterKeyBehaviorType
  formWindowOpeningMode?: SE.FormWindowOpeningMode
  group?: SE.ChildFormItemsGroup
  height?: number
  horizontalSpacing?: SE.FormItemSpacing
  itemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  modalMode?: boolean
  modified?: boolean
  purposeUseKey?: string
  readOnly?: boolean
  saveDataInSettings?: SE.SaveFormDataInSettings
  savedInSettingsDataModified?: boolean
  scale?: number
  showCloseButton?: boolean
  showTitle?: boolean
  slaveItemsWidth?: SE.ChildFormItemsWidth
  title?: I8nText
  usedFormServer?: SE.UsedServer
  verticalScroll?: SE.VerticalFormScroll
  verticalSpacing?: SE.FormItemSpacing
  width?: number
  windowOptionsKey?: string
  saveWindowSettings?: boolean
  //#endregion

  //#region FormMetadata
  synonym?: I8nText
  comment?: string
  includeHelpInContents?: boolean
  usePurposes?: ("PlatformApplication" | "MobilePlatformApplication")[]
  //#endregion

  events?: {
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
  // AutoFillCheck?: boolean
  // AutoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  // AutoTitle?: boolean
  // AutoURL?: boolean
  // ChildItemsHorizontalAlign?: SE.ItemHorizontalLocation
  // ChildItemsVerticalAlign?: SE.ItemVerticalAlign
  // CloseOnChoice?: boolean
  // CloseOnOwnerClose?: boolean
  // CollapseItemsByImportance?: SE.CollapseFormItemsByImportance
  // CommandBarLocation?: SE.FormCommandBarLabelLocation
  // CommandInterface?: CommandInterfaceXML
  // ConversationsRepresentation?: SE.FormConversationsRepresentation
  // Customizable?: boolean
  // Enabled?: boolean
  // EnterKeyBehavior?: SE.EnterKeyBehaviorType
  // WindowOpeningMode?: SE.FormWindowOpeningMode
  // Group?: SE.ChildFormItemsGroup
  // Height?: number
  // HorizontalSpacing?: SE.FormItemSpacing
  // ItemsAndTitlesAlign?: SE.ItemsAndTitlesAlignVariant
  // ModalMode?: boolean
  // Modified?: boolean
  // PurposeUseKey?: string
  // ReadOnly?: boolean
  // SaveDataInSettings?: SE.SaveFormDataInSettings
  // SavedInSettingsDataModified?: boolean
  // Scale?: number
  // ShowCloseButton?: boolean
  // ShowTitle?: boolean
  // SlaveItemsWidth?: SE.ChildFormItemsWidth
  // Title?: I8nTextXML
  // UsedFormServer?: SE.UsedServer
  // VerticalScroll?: SE.VerticalFormScroll
  // VerticalSpacing?: SE.FormItemSpacing
  // Width?: number
  // WindowOptionsKey?: string
  // CommandSet?: CommandSetXML
  // UseForFoldersAndItems?: SE.FoldersAndItemsUse
  // AutoCommandBar: AutoCommandBarXML
  // SaveWindowSettings?: boolean
  // Events?: EventsXML
  // ChildItems?: GroupChildItemXML[] | GroupChildItemXML
  Attributes?: {
    Attribute: FormAttributesXML
  }
  Parameters?: {
    Parameter: FormParametersXML
  }
  Commands?: { Command: FormCommandsXML }
  Events?: {
    Event: any
  }
  ChildItems?: {
    ChildItem: any
  }
  AutoCommandBar?: {
    CommandBar: any
  }
  [key: string]: any
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
  ИнтерфейсКоманды?: CommandInterfaceEnterprise
  КлючНазначенияИспользования?: string
  КлючСохраненияПоложенияОкна?: string
  КоманднаяПанель?: AutoCommandBarEnterprise
  Масштаб?: number
  МодальныйРежим?: StringboolEnterprise
  Модифицированность?: StringboolEnterprise
  // НавигационнаяСсылка?: string
  РазрешитьИзменятьФорму?: StringboolEnterprise
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
  СохранятьНастройкиОкна?: StringboolEnterprise
  Реквизиты?: FormAttributesEnterprise
  Параметры?: FormParametersEnterprise
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
  Команды?: FormCommandsYAML
  Элементы?: GroupChilItemPartialEnterprise

  Синоним?: I8nTextEnterprise
  Комментарий?: string
  ВключатьСправкуВСодержание?: StringboolEnterprise
  НазначенияИспользования?: "МобильноеПриложение" | "ПлатформаИМобильноеПриложение"
}

export interface FormMetadataXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string
  Form: {
    _uuid?: string
    Properties: Record<string, any>
  }
}

export interface ClientApplicationFormPreview {
  prefix: string
  attributes: PreviewAttributes
  childItems: any
}

export interface PreviewAttribute {
  Name: string
  Path?: string
  Title?: string
  Type: TypeDescriptionPreview
}

export type PreviewAttributes = PreviewAttribute[]

export interface PreviewAttributeMapItem {
  name: string
  parentPath?: string
  title?: string
  type: TypeDescriptionPreview
  childItems?: PreviewAttributesMap
}

export type PreviewAttributesMap = Record<string, PreviewAttributeMapItem>

export const FormRulesTags = {
  Form: "Form",
  Metadata: "Metadata",
} as const
