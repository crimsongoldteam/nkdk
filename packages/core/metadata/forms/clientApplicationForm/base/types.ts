import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataSimpleValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { CommandSet, CommandSetEnterprise, CommandSetXML } from "~/metadata/forms/commandSet/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormAttribute, FormAttributesEnterprise, FormAttributesXML } from "../../../commonObjects/formAttribute/types"
import { GroupChilItemPartialEnterprise, GroupChildItem, GroupChildItemXML } from "../../collections/childItems/types"
import { Command, CommandsEnterprise, CommandsXML } from "../../commands/types"
import { AutoCommandBar, AutoCommandBarEnterprise, AutoCommandBarXML } from "../../elements/autoCommandBar/types"
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
  //#region ClientApplicationForm
  attributes?: FormAttribute[]
  autoCommandBar?: AutoCommandBar
  autoFillCheck?: boolean
  autoSaveDataInSettings?: SE.AutoSaveFormDataInSettings
  autoTitle?: boolean
  autoURL?: boolean
  childItems: GroupChildItem[]
  childItemsHorizontalAlign?: SE.ItemHorizontalLocation
  childItemsVerticalAlign?: SE.ItemVerticalAlign
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  collapseItemsByImportance?: SE.CollapseFormItemsByImportance
  commandBarLocation?: SE.FormCommandBarLabelLocation
  commandSet?: CommandSet
  commands: Command[]
  conversationsRepresentation?: SE.FormConversationsRepresentation
  enabled?: boolean
  enterKeyBehavior?: SE.EnterKeyBehaviorType
  events?: ClientApplicationFormEvents
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
  //#endregion

  //#region FormMetadata
  synonim?: I8nText
  comment?: string
  includeHelpInContents?: boolean
  usePurposes?: ("PlatformApplication" | "MobilePlatformApplication")[]
  //#endregion
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
  UsedFormServer?: SE.UsedServer
  VerticalScroll?: SE.VerticalFormScroll
  VerticalSpacing?: SE.FormItemSpacing
  Width?: number
  WindowOptionsKey?: string
  CommandSet?: CommandSetXML
  UseForFoldersAndItems?: SE.FoldersAndItemsUse
  AutoCommandBar: AutoCommandBarXML
  Events?: EventsXML
  ChildItems?: GroupChildItemXML[] | GroupChildItemXML
  Attributes?: {
    Attribute: FormAttributesXML
  }
  Commands?: { Command: CommandsXML }
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
  КоманднаяПанель?: AutoCommandBarEnterprise
  Масштаб?: number
  МодальныйРежим?: StringboolEnterprise
  Модифицированность?: StringboolEnterprise
  // НавигационнаяСсылка?: string
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
  Команды?: CommandsEnterprise
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
    Properties: {
      Name: string
      Synonym?: I8nTextXML
      Comment?: string
      FormType: "Managed"
      IncludeHelpInContents?: boolean
      UsePurposes?: {
        "v8:Value": MetadataSimpleValueXML | MetadataSimpleValueXML[]
      }
    }
  }
}
