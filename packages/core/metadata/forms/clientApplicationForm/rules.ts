import { metadataItemLinkRule } from "~/metadata/commonObjects/metadataPath/types"
import { mobileDeviceCommandBarContentRule } from "~/metadata/commonObjects/mobileDeviceCommandBarContent/types"
import { stringOrNumberRule } from "~/metadata/commonObjects/stringOrNumber/types"
import { usePurposesRule } from "~/metadata/commonObjects/usePurposes/types"
import { choiceParametersRule } from "~/metadata/commonObjects/\u0441hoiceParameters/types"
import {
  autoCommandBarRule,
  conditionalAppearanceRule,
  externalFormItemFileRule,
} from "~/metadata/forms/clientApplicationForm/builders"
import { groupChildItemsRule } from "~/metadata/forms/commonObjects/childItems/types"
import { commandInterfaceRule } from "~/metadata/forms/commonObjects/commandInterface/types"
import { commandSetRule } from "~/metadata/forms/commonObjects/commandSet/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { formAttributesRule } from "~/metadata/forms/commonObjects/formAttribute/builders"
import { FormAttributeRules } from "~/metadata/forms/commonObjects/formAttribute/rules"
import { formCommandsRule } from "~/metadata/forms/commonObjects/formCommand/builders"
import { formParametersRule } from "~/metadata/forms/commonObjects/formParameter/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration"
import { ElementRule } from "../../orchestration/formElement/types"
import { FormRulesTags } from "./types"
export type { ElementRule, PropertyRule }
export const ClientApplicationFormRules = {
  itemType: "ClientApplicationForm",
  metadataTargetOwner: { kind: "inherit" },
  properties: {
    // #region Form
    itemPictures: externalFormItemFileRule({
      xml: "Picture",
      yaml: "Картинки",
      syncExternalOnly: true,
    }),
    itemHeaderPictures: externalFormItemFileRule({
      xml: "HeaderPicture",
      yaml: "КартинкиШапки",
      syncExternalOnly: true,
    }),
    itemValuesPictures: externalFormItemFileRule({
      xml: "ValuesPicture",
      yaml: "КартинкиЗначений",
      syncExternalOnly: true,
    }),
    itemRowsPictures: externalFormItemFileRule({
      xml: "RowsPicture",
      yaml: "КартинкиСтрок",
      syncExternalOnly: true,
    }),
    autoCommandBar: autoCommandBarRule({
      yaml: "КоманднаяПанель",
      tag: FormRulesTags.Form,
      order: 1,
    }),
    autoFillCheck: booleanRule({
      yaml: "ПроверятьЗаполнениеАвтоматически",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    autoSaveDataInSettings: systemEnumerationRule({
      yaml: "АвтоматическоеСохранениеДанныхВНастройках",
      typeSE: "AutoSaveFormDataInSettings",
      tag: FormRulesTags.Form,
      implicitValueYAML: "DontUse",
    }),
    autoTitle: booleanRule({
      yaml: "АвтоЗаголовок",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    autoURL: booleanRule({
      yaml: "АвтоНавигационнаяСсылка",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    childItems: groupChildItemsRule({
      yaml: "Элементы",
      tag: FormRulesTags.Form,
      defaultValue: [],
      order: 2,
    }),
    attributes: formAttributesRule({
      yaml: "Реквизиты",
      tag: FormRulesTags.Form,
      defaultValueXMLEmpty: [],
      itemRule: FormAttributeRules,
      order: 3,
    }),
    attributesConditionalAppearance: conditionalAppearanceRule({
      yaml: "УсловноеОформлениеРеквизитов",
      xml: "ConditionalAppearance",
      xmlParents: ["Attributes"],
      tag: FormRulesTags.Form,
    }),
    childItemsHorizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      xml: "HorizontalAlign",
      xmlAliases: ["ChildItemsHorizontalAlign"],
      typeSE: "ItemHorizontalLocation",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    childItemsVerticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложениеПодчиненных",
      xml: "VerticalAlign",
      xmlAliases: ["ChildItemsVerticalAlign"],
      typeSE: "ItemVerticalAlign",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    closeOnChoice: booleanRule({
      yaml: "ЗакрыватьПриВыборе",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    closeOnOwnerClose: booleanRule({
      yaml: "ЗакрыватьПриЗакрытииВладельца",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    collapseItemsByImportance: systemEnumerationRule({
      yaml: "СворачиваниеЭлементовПоВажности",
      xml: "CollapseItemsByImportanceVariant",
      xmlAliases: ["CollapseItemsByImportance"],
      typeSE: "CollapseFormItemsByImportance",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    commandBarLocation: systemEnumerationRule({
      yaml: "ПоложениеКоманднойПанели",
      typeSE: "FormCommandBarLabelLocation",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    commandInterface: commandInterfaceRule({
      yaml: "ИнтерфейсКоманды",
      tag: FormRulesTags.Form,
    }),
    commandSet: commandSetRule({
      yaml: "СоставКоманд",
      tag: FormRulesTags.Form,
    }),
    reportResult: stringOrNumberRule({
      yaml: "РезультатОтчета",
      xml: "ReportResult",
      tag: FormRulesTags.Form,
    }),
    detailsData: stringOrNumberRule({
      yaml: "ДанныеРасшифровки",
      xml: "DetailsData",
      tag: FormRulesTags.Form,
    }),
    reportFormType: systemEnumerationRule({
      yaml: "ТипФормыОтчета",
      xml: "ReportFormType",
      typeSE: "ReportFormType",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    variantAppearance: stringRule({
      yaml: "ПредставлениеВарианта",
      xml: "VariantAppearance",
      tag: FormRulesTags.Form,
    }),
    autoShowState: systemEnumerationRule({
      yaml: "АвтоОтображениеСостояния",
      xml: "AutoShowState",
      typeSE: "AutoShowStateMode",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
      omitImplicitValueYAMLBySource: true,
    }),
    customSettingsFolder: stringRule({
      yaml: "ГруппаПользовательскихНастроек",
      xml: "CustomSettingsFolder",
      tag: FormRulesTags.Form,
    }),
    reportResultViewMode: systemEnumerationRule({
      yaml: "РежимОтображенияРезультатаОтчета",
      xml: "ReportResultViewMode",
      typeSE: "ReportResultViewMode",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
      omitImplicitValueYAMLBySource: true,
    }),
    viewModeApplicationOnSetReportResult: systemEnumerationRule({
      yaml: "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета",
      xml: "ViewModeApplicationOnSetReportResult",
      typeSE: "ViewModeApplicationOnSetReportResult",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
      omitImplicitValueYAMLBySource: true,
    }),
    mobileDeviceCommandBarContent: mobileDeviceCommandBarContentRule({
      yaml: "СоставКоманднойПанелиНаМобильномУстройстве",
      tag: FormRulesTags.Form,
    }),
    commands: formCommandsRule({
      yaml: "Команды",
      tag: FormRulesTags.Form,
      defaultValue: [],
    }),
    conversationsRepresentation: systemEnumerationRule({
      yaml: "ОтображениеОбсуждений",
      typeSE: "FormConversationsRepresentation",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    customizable: booleanRule({
      yaml: "РазрешитьИзменятьФорму",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    enabled: booleanRule({
      yaml: "Доступность",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    enterKeyBehavior: systemEnumerationRule({
      yaml: "ПоведениеКлавишиEnter",
      typeSE: "EnterKeyBehaviorType",
      tag: FormRulesTags.Form,
      implicitValueYAML: "ControlNavigation",
    }),
    formWindowOpeningMode: systemEnumerationRule({
      yaml: "РежимОткрытияОкнаФормы",
      typeSE: "FormWindowOpeningMode",
      xml: "WindowOpeningMode",
      tag: FormRulesTags.Form,
      implicitValueYAML: "DontBlock",
    }),
    group: systemEnumerationRule({
      yaml: "Группировка",
      typeSE: "ChildFormItemsGroup",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Vertical",
    }),
    groupList: stringRule({
      yaml: "СписокГрупп",
      xml: "GroupList",
      tag: FormRulesTags.Form,
    }),
    height: numberRule({
      yaml: "Высота",
      tag: FormRulesTags.Form,
      implicitValueYAML: 0,
    }),
    horizontalSpacing: systemEnumerationRule({
      yaml: "ГоризонтальныйИнтервал",
      typeSE: "FormItemSpacing",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    itemsAndTitlesAlign: systemEnumerationRule({
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      xmlAliases: ["ItemsAndTitlesAlign"],
      typeSE: "ItemsAndTitlesAlignVariant",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    modalMode: booleanRule({
      yaml: "МодальныйРежим",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    modified: booleanRule({
      yaml: "Модифицированность",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    parameters: formParametersRule({
      yaml: "Параметры",
      tag: FormRulesTags.Form,
    }),
    purposeUseKey: stringRule({
      yaml: "КлючНазначенияИспользования",
      tag: FormRulesTags.Form,
    }),
    readOnly: booleanRule({
      yaml: "ТолькоПросмотр",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    saveDataInSettings: systemEnumerationRule({
      yaml: "СохранениеДанныхВНастройках",
      typeSE: "SaveFormDataInSettings",
      tag: FormRulesTags.Form,
      implicitValueYAML: "DontUse",
    }),
    savedInSettingsDataModified: booleanRule({
      yaml: "СохраняемыеВНастройкахДанныеМодифицированы",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    scale: numberRule({
      yaml: "Масштаб",
      tag: FormRulesTags.Form,
      implicitValueYAML: 100,
    }),
    saveWindowSettings: booleanRule({
      yaml: "СохранятьНастройкиОкна",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    settingsStorage: metadataItemLinkRule({
      yaml: "ХранилищеНастроек",
      metadataTarget: {
        kind: "member",
        owner: "this",
        memberKinds: ["Form"],
        objectRoots: ["SettingsStorage"],
        allowedMemberPaths: [["Report", "Form"]],
      },
      tag: FormRulesTags.Form,
    }),
    showCloseButton: booleanRule({
      yaml: "ОтображатьКнопкуЗакрытия",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    showTitle: booleanRule({
      yaml: "ОтображатьЗаголовок",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    slaveItemsWidth: systemEnumerationRule({
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      xmlAliases: ["SlaveItemsWidth"],
      typeSE: "ChildFormItemsWidth",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    title: i8nTextRule({
      yaml: "Заголовок",
      tag: FormRulesTags.Form,
    }),
    usedFormServer: systemEnumerationRule({
      yaml: "ИспользуемыйСерверФормы",
      typeSE: "UsedServer",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Main",
    }),
    verticalScroll: systemEnumerationRule({
      yaml: "ВертикальнаяПрокрутка",
      typeSE: "VerticalFormScroll",
      tag: FormRulesTags.Form,
      implicitValueYAML: "auto",
    }),
    scalingMode: systemEnumerationRule({
      yaml: "ВариантМасштаба",
      xml: "ScalingMode",
      typeSE: "ClientApplicationFormScaleVariant",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    verticalSpacing: systemEnumerationRule({
      yaml: "ВертикальныйИнтервал",
      typeSE: "FormItemSpacing",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    width: numberRule({
      yaml: "Ширина",
      tag: FormRulesTags.Form,
      implicitValueYAML: 0,
    }),
    windowOptionsKey: stringRule({
      yaml: "КлючСохраненияПоложенияОкна",
      tag: FormRulesTags.Form,
    }),
    // #endregion
    // #region Metadata
    uuid: stringRule({
      xml: "_uuid",
      forReferenceOnly: true,
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form"],
    }),
    name: stringRule({
      tag: FormRulesTags.Metadata,
      fromXML: false,
      xmlParents: ["Form", "Properties"],
    }),
    formType: systemEnumerationRule({
      typeSE: "FormType",
      tag: FormRulesTags.Metadata,
      defaultValueXML: "Managed",
      xml: "FormType",
      xmlParents: ["Form", "Properties"],
      implicitValueYAML: "Managed",
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
      defaultValueXMLEmpty: { items: {} },
    }),
    comment: stringRule({
      yaml: "Комментарий",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
      defaultValueXMLEmpty: "",
      implicitValueYAML: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
      defaultValueXMLEmpty: false,
      implicitValueYAML: "Ложь",
    }),
    usePurposes: usePurposesRule({
      yaml: "НазначенияИспользования",
      tag: FormRulesTags.Metadata,
      xmlParents: ["Form", "Properties"],
    }),
    extendedPresentation: i8nTextRule({
      yaml: "РасширенноеПредставление",
      tag: FormRulesTags.Metadata,
      xml: "ExtendedPresentation",
      xmlParents: ["Form", "Properties"],
      defaultValueXMLEmpty: { items: {} },
      defaultValueXMLRaw: "",
      preserveFromReferenceXML: true,
    }),
    // #endregion
    // #region Catalog
    choiceAvailable: booleanRule({
      yaml: "ВыборДоступен",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    useForFoldersAndItems: systemEnumerationRule({
      yaml: "ИспользованиеДляГруппИЭлементов",
      typeSE: "FoldersAndItemsUse",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Items",
    }),
    choiceParameters: choiceParametersRule({
      yaml: "ПараметрыВыбора",
      tag: FormRulesTags.Form,
    }),
    choiceMode: systemEnumerationRule({
      yaml: "РежимВыбора",
      typeSE: "ChoiceMode",
      tag: FormRulesTags.Form,
      noImplicitValueYAML: true,
    }),
    // #endregion
    // #region Document
    autoTime: systemEnumerationRule({
      yaml: "АвтоВремя",
      typeSE: "AutoTimeMode",
      tag: FormRulesTags.Form,
      implicitValueYAML: "CurrentOrLast",
    }),
    usePostingMode: systemEnumerationRule({
      yaml: "РежимПроведения",
      xml: "UsePostingMode",
      typeSE: "DocumentPostingMode",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    }),
    repostOnWrite: booleanRule({
      yaml: "ПерепроводитьПриЗаписи",
      tag: FormRulesTags.Form,
      implicitValueYAML: true,
    }),
    // #endregion
    events: eventsRule({
      yaml: "События",
      tag: FormRulesTags.Form,
      items: {
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
        collaborationSystemUsersChoiceFormGetProcessing:
          "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
        fillCheckProcessingAtServer: "ОбработкаПроверкиЗаполненияНаСервере",
        addInDetachmentOnError: "ОтключениеВнешнейКомпонентыПриОшибке",
        beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
        beforeExecute: "ПередВыполнением",
        beforeLoadUserSettingsAtServer: "ПередЗагрузкойПользовательскихНастроекНаСервере",
        beforeLoadVariantAtServer: "ПередЗагрузкойВариантаНаСервере",
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
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onLoadVariantAtServer: "ПриЗагрузкеВариантаНаСервере",
        onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
        onSaveVariantAtServer: "ПриСохраненииВариантаНаСервере",
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
        onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
        onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
        // #region Catalog
        valueChoice: "ВыборЗначения",
        beforeWrite: "ПередЗаписью",
        beforeWriteAtServer: "ПередЗаписьюНаСервере",
        afterWrite: "ПослеЗаписи",
        afterWriteAtServer: "ПослеЗаписиНаСервере",
        onWriteAtServer: "ПриЗаписиНаСервере",
        onReadAtServer: "ПриЧтенииНаСервере",
      },
    }),
  },
  eventsTag: FormRulesTags.Form,
} as const satisfies MetadataItemRule
