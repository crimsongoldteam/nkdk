import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { ChoiceParameters } from "~/metadata/commonObjects/сhoiceParameters/types"
import { MetadataItem } from "~/metadata/orchestration"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { GroupChildItem } from "../commonObjects/childItems/types"
import { CommandInterface } from "../commonObjects/commandInterface/types"
import { CommandSet } from "../commonObjects/commandSet/types"
import { FormAttribute, FormAttributesXML } from "../commonObjects/formAttribute/types"
import { FormCommand, FormCommandsXML } from "../commonObjects/formCommand/types"
import { FormParameters, FormParametersXML } from "../commonObjects/formParameter/types"
import { AutoCommandBar } from "../elements/autoCommandBar/types"
import { ClientApplicationFormRules } from "./rules"

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

  //#region Catalog
  choiceAvailable?: boolean
  useForFoldersAndItems?: SE.FoldersAndItemsUse
  choiceParameters?: ChoiceParameters
  choiceMode?: SE.ChoiceMode
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

    // #region Catalog
    valueChoice?: string
    beforeWrite?: string
    beforeWriteAtServer?: string
    afterWrite?: string
    afterWriteAtServer?: string
    onWriteAtServer?: string
    onReadAtServer?: string
    // #endregion
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

export type ClientApplicationFormYAML = YAMLTypeByRule<typeof ClientApplicationFormRules>

// export interface ClientApplicationFormYAML {
//   АвтоЗаголовок?: StringboolYAML
//   АвтоматическоеСохранениеДанныхВНастройках?: SE.AutoSaveFormDataInSettingsYAML
//   АвтоНавигационнаяСсылка?: StringboolYAML
//   ВертикальнаяПрокрутка?: SE.VerticalFormScrollYAML
//   ВертикальноеПоложениеПодчиненных?: SE.ItemVerticalAlignYAML
//   ВертикальныйИнтервал?: SE.FormItemSpacingYAML
//   ВыравниваниеЭлементовИЗаголовков?: SE.ItemsAndTitlesAlignVariantYAML
//   Высота?: number
//   ГоризонтальноеПоложениеПодчиненных?: SE.ItemHorizontalLocationYAML
//   ГоризонтальныйИнтервал?: SE.FormItemSpacingYAML
//   Группировка?: SE.ChildFormItemsGroupYAML
//   Доступность?: StringboolYAML
//   Заголовок?: I8nTextYAML
//   ЗакрыватьПриВыборе?: StringboolYAML
//   ЗакрыватьПриЗакрытииВладельца?: StringboolYAML
//   ИспользуемыйСерверФормы?: SE.UsedServerYAML
//   ИнтерфейсКоманды?: CommandInterfaceYAML
//   КлючНазначенияИспользования?: string
//   КлючСохраненияПоложенияОкна?: string
//   КоманднаяПанель?: AutoCommandBarYAML
//   Масштаб?: number
//   МодальныйРежим?: StringboolYAML
//   Модифицированность?: StringboolYAML
//   // НавигационнаяСсылка?: string
//   РазрешитьИзменятьФорму?: StringboolYAML
//   ОтображатьЗаголовок?: StringboolYAML
//   ОтображатьКнопкуЗакрытия?: StringboolYAML
//   ОтображениеОбсуждений?: SE.FormConversationsRepresentationYAML
//   ПоведениеКлавишиEnter?: SE.EnterKeyBehaviorTypeYAML
//   ПоложениеКоманднойПанели?: SE.FormCommandBarLabelLocationYAML
//   ПроверятьЗаполнениеАвтоматически?: StringboolYAML
//   РежимОткрытияОкнаФормы?: SE.FormWindowOpeningModeYAML
//   СворачиваниеЭлементовПоВажности?: SE.CollapseFormItemsByImportanceYAML
//   СохранениеДанныхВНастройках?: SE.SaveFormDataInSettingsYAML
//   СохраняемыеВНастройкахДанныеМодифицированы?: StringboolYAML
//   СоставКоманд?: CommandSetYAML
//   ТолькоПросмотр?: StringboolYAML
//   Ширина?: number
//   ШиринаПодчиненныхЭлементов?: SE.ChildFormItemsWidthYAML
//   СохранятьНастройкиОкна?: StringboolYAML
//   Реквизиты?: FormAttributesYAML
//   Параметры?: FormParametersYAML

//   //#region Catalog
//   ВыборДоступен?: StringboolYAML
//   ИспользованиеДляГруппИЭлементов?: SE.FoldersAndItemsUseYAML
//   ПараметрыВыбора?: ChoiceParametersYAML
//   РежимВыбора?: SE.ChoiceModeYAML
//   //#endregion

//   События?: {
//     АвтоПодборПользователейСистемыВзаимодействия?: string
//     ВнешнееСобытие?: string
//     ОбработкаАктивизации?: string
//     ОбработкаВыбора?: string
//     ОбработкаЗаписиНового?: string
//     ОбработкаНавигационнойСсылки?: string
//     ОбработкаОповещения?: string
//     ОбработкаПерехода?: string
//     ОбработкаПолученияНавигационнойСсылки?: string
//     ОбработкаПолученияСпискаНавигационныхСсылок?: string
//     ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия?: string
//     ОбработкаПроверкиЗаполненияНаСервере?: string
//     ОтключениеВнешнейКомпонентыПриОшибке?: string
//     ПередЗагрузкойДанныхИзНастроекНаСервере?: string
//     ПередЗакрытием?: string
//     ПередПереоткрытиемСДругогоСервера?: string
//     ПриВставкеИзБуфераОбмена?: string
//     ПриЗагрузкеДанныхИзНастроекНаСервере?: string
//     ПриЗакрытии?: string
//     ПриИзмененииДоступностиОсновногоСервера?: string
//     ПриИзмененииПараметровЭкрана?: string
//     ПриОткрытии?: string
//     ПриПереоткрытииСДругогоСервера?: string
//     ПриПовторномОткрытии?: string
//     ПриСозданииНаСервере?: string
//     ПриСохраненииДанныхВНастройкахНаСервере?: string

//     // #region Catalog
//     ВыборЗначения?: string
//     ПередЗаписью?: string
//     ПередЗаписьюНаСервере?: string
//     ПослеЗаписи?: string
//     ПослеЗаписиНаСервере?: string
//     ПриЗаписиНаСервере?: string
//     ПриЧтенииНаСервере?: string
//     // #endregion
//   }
//   Команды?: FormCommandsYAML
//   Элементы?: GroupChildItemsPartialYAML

//   Синоним?: I8nTextYAML
//   Комментарий?: string
//   ВключатьСправкуВСодержание?: StringboolYAML
//   НазначенияИспользования?: "МобильноеПриложение" | "ПлатформаИМобильноеПриложение"
// }

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

export interface ClientApplicationFormEnterprise {
  prefix: string
  attributes: EnterpriseAttributes
  childItems: any
}

export interface EnterpriseAttribute {
  Name: string
  Path?: string
  Title?: string
  Type: TypeDescriptionEnterprise
}

export type EnterpriseAttributes = EnterpriseAttribute[]

export interface EnterpriseAttributeMapItem {
  name: string
  path?: string
  title?: string
  type: TypeDescriptionEnterprise
  childItems?: EnterpriseAttributesMap
}

export type EnterpriseAttributesMap = Record<string, EnterpriseAttributeMapItem>

export const FormRulesTags = {
  Form: "Form",
  Metadata: "Metadata",
} as const
