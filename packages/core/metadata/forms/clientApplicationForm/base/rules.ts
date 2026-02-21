import { ClientApplicationFormRule } from "~/metadata/metadataFactory/form/types"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { ClientApplicationForm, FormRulesTags } from "./types"
export type { ElementRule, PropertyRule }

export const ClientApplicationFormRules: ClientApplicationFormRule<ClientApplicationForm> = {
  tags: [FormRulesTags.Form, FormRulesTags.Metadata] as const,
  properties: {
    // #region Form
    attributes: {
      yaml: "Реквизиты",
      type: "FormAttributes",
      tag: FormRulesTags.Form,
    },
    autoCommandBar: {
      yaml: "КоманднаяПанель",
      type: "AutoCommandBar",
      tag: FormRulesTags.Form,
      fromYAML: false,
    },
    autoFillCheck: {
      yaml: "ПроверятьЗаполнениеАвтоматически",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    autoSaveDataInSettings: {
      yaml: "АвтоматическоеСохранениеДанныхВНастройках",
      type: "SystemEnumeration",
      typeSE: "AutoSaveFormDataInSettings",
      tag: FormRulesTags.Form,
    },
    autoTitle: {
      yaml: "АвтоЗаголовок",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    autoURL: {
      yaml: "АвтоНавигационнаяСсылка",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    childItems: {
      type: "ChildItems",
      tag: FormRulesTags.Form,
      defaultValue: [],
    },
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      tag: FormRulesTags.Form,
    },
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      tag: FormRulesTags.Form,
    },
    closeOnChoice: {
      yaml: "ЗакрыватьПриВыборе",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    closeOnOwnerClose: {
      yaml: "ЗакрыватьПриЗакрытииВладельца",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    collapseItemsByImportance: {
      yaml: "СворачиваниеЭлементовПоВажности",
      type: "SystemEnumeration",
      typeSE: "CollapseFormItemsByImportance",
      tag: FormRulesTags.Form,
    },
    commandBarLocation: {
      yaml: "ПоложениеКоманднойПанели",
      type: "SystemEnumeration",
      typeSE: "FormCommandBarLabelLocation",
      tag: FormRulesTags.Form,
    },
    commandInterface: {
      yaml: "ИнтерфейсКоманды",
      type: "CommandInterface",
      tag: FormRulesTags.Form,
    },
    commandSet: {
      yaml: "СоставКоманд",
      type: "CommandSet",
      tag: FormRulesTags.Form,
    },
    commands: {
      yaml: "Команды",
      type: "FormCommands",
      tag: FormRulesTags.Form,
      defaultValue: [],
    },
    conversationsRepresentation: {
      yaml: "ОтображениеОбсуждений",
      type: "SystemEnumeration",
      typeSE: "FormConversationsRepresentation",
      tag: FormRulesTags.Form,
    },
    customizable: {
      yaml: "РазрешитьИзменятьФорму",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    enabled: {
      yaml: "Доступность",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    enterKeyBehavior: {
      yaml: "ПоведениеКлавишиEnter",
      type: "SystemEnumeration",
      typeSE: "EnterKeyBehaviorType",
      tag: FormRulesTags.Form,
    },
    formWindowOpeningMode: {
      yaml: "РежимОткрытияОкнаФормы",
      type: "SystemEnumeration",
      typeSE: "FormWindowOpeningMode",
      xml: "WindowOpeningMode",
      tag: FormRulesTags.Form,
    },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      tag: FormRulesTags.Form,
    },
    height: {
      yaml: "Высота",
      type: "number",
      tag: FormRulesTags.Form,
    },
    horizontalSpacing: {
      yaml: "ГоризонтальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      tag: FormRulesTags.Form,
    },
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
      tag: FormRulesTags.Form,
    },
    modalMode: {
      yaml: "МодальныйРежим",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    modified: {
      yaml: "Модифицированность",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    parameters: {
      yaml: "Параметры",
      type: "FormParameters",
      tag: FormRulesTags.Form,
    },
    purposeUseKey: {
      yaml: "КлючНазначенияИспользования",
      type: "string",
      tag: FormRulesTags.Form,
    },
    readOnly: {
      yaml: "ТолькоПросмотр",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    saveDataInSettings: {
      yaml: "СохранениеДанныхВНастройках",
      type: "SystemEnumeration",
      typeSE: "SaveFormDataInSettings",
      tag: FormRulesTags.Form,
    },
    savedInSettingsDataModified: {
      yaml: "СохраняемыеВНастройкахДанныеМодифицированы",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    scale: {
      yaml: "Масштаб",
      type: "number",
      tag: FormRulesTags.Form,
    },
    saveWindowSettings: {
      yaml: "СохранятьНастройкиОкна",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    showCloseButton: {
      yaml: "ОтображатьКнопкуЗакрытия",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    showTitle: {
      yaml: "ОтображатьЗаголовок",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
      tag: FormRulesTags.Form,
    },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      tag: FormRulesTags.Form,
    },
    usedFormServer: {
      yaml: "ИспользуемыйСерверФормы",
      type: "SystemEnumeration",
      typeSE: "UsedServer",
      tag: FormRulesTags.Form,
    },
    verticalScroll: {
      yaml: "ВертикальнаяПрокрутка",
      type: "SystemEnumeration",
      typeSE: "VerticalFormScroll",
      tag: FormRulesTags.Form,
    },
    verticalSpacing: {
      yaml: "ВертикальныйИнтервал",
      type: "SystemEnumeration",
      typeSE: "FormItemSpacing",
      tag: FormRulesTags.Form,
    },
    width: {
      yaml: "Ширина",
      type: "number",
      tag: FormRulesTags.Form,
    },
    windowOptionsKey: {
      yaml: "КлючСохраненияПоложенияОкна",
      type: "string",
      tag: FormRulesTags.Form,
    },
    // #endregion
    // #region Metadata
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
    },
    usePurposes: {
      yaml: "НазначенияИспользования",
      type: "UsePurposes",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
    },
    // #endregion

    // #region Catalog
    choiceAvailable: {
      yaml: "ВыборДоступен",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    useForFoldersAndItems: {
      yaml: "ИспользованиеДляГруппИЭлементов",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      tag: FormRulesTags.Form,
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      type: "ChoiceParameters",
      tag: FormRulesTags.Form,
    },
    choiceMode: {
      yaml: "РежимВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      tag: FormRulesTags.Form,
    },
    // #endregion
  },
  events: {
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

    // #region Catalog
    valueChoice: "ВыборЗначения",
    beforeWrite: "ПередЗаписью",
    beforeWriteAtServer: "ПередЗаписьюНаСервере",
    afterWrite: "ПослеЗаписи",
    afterWriteAtServer: "ПослеЗаписиНаСервере",
    onWriteAtServer: "ПриЗаписиНаСервере",
    onReadAtServer: "ПриЧтенииНаСервере",
    // #endregion
  },
}
