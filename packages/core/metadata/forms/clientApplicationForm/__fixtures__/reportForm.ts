import { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"

type ReportFormClientApplicationForm = ClientApplicationForm & {
  reportResult: string
  detailsData: string
  reportFormType: "Main"
  variantAppearance: string
  autoShowState: "Auto"
  customSettingsFolder: string
  reportResultViewMode: "Auto"
  viewModeApplicationOnSetReportResult: "Auto"
}

export const reportFormClientApplicationForm = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  childItems: [
    {
      itemType: "InputField",
      name: "РеквизитВсеСвойства",
      dataPath: "Отчет.РеквизитВсеСвойства",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
    },
    {
      itemType: "CheckBoxField",
      name: "РеквизитБулево",
      dataPath: "Отчет.РеквизитБулево",
      editMode: "EnterOnInput",
      checkBoxType: "Auto",
    },
    {
      itemType: "Table",
      name: "ТабличнаяЧастьВсеСвойства",
      representation: "List",
      autoInsertNewRow: true,
      enableStartDrag: true,
      enableDrag: true,
      dataPath: "Отчет.ТабличнаяЧастьВсеСвойства",
      childItems: [
        {
          itemType: "TableLabelField",
          name: "ТабличнаяЧастьВсеСвойстваНомерСтроки",
          dataPath: "Отчет.ТабличнаяЧастьВсеСвойства.LineNumber",
          editMode: "EnterOnInput",
        },
        {
          itemType: "TableInputField",
          name: "ТабличнаяЧастьВсеСвойстваРеквизитТаблицыВсеСвойства",
          dataPath: "Отчет.ТабличнаяЧастьВсеСвойства.РеквизитТаблицыВсеСвойства",
          editMode: "EnterOnInput",
          multipleValuesExtendedEdit: true,
        },
      ],
    },
    {
      itemType: "UsualGroup",
      name: "КомпоновщикНастроекПользовательскиеНастройки",
      title: { items: { ru: "Настройки" } },
      verticalStretch: false,
      group: "Vertical",
      showTitle: false,
      childItems: [],
    },
    {
      itemType: "SpreadSheetDocumentField",
      name: "Результат",
      dataPath: "Результат",
      defaultItem: true,
      titleLocation: "None",
      width: 100,
    },
  ],
  attributes: [
    {
      itemType: "FormAttribute",
      name: "Отчет",
      type: { type: ["ReportObject.ОтчетВсеСвойства"] },
      mainAttribute: true,
      title: { items: { ru: "" } },
      columns: [],
    },
    {
      itemType: "FormAttribute",
      name: "Результат",
      title: { items: { ru: "Результат" } },
      type: { type: ["SpreadsheetDocument"] },
      columns: [],
    },
    {
      itemType: "FormAttribute",
      name: "ДанныеРасшифровки",
      type: { type: ["string"] },
      title: { items: { ru: "" } },
      columns: [],
    },
  ],
  commands: [],
  events: {
    activationProcessing: "ОбработкаАктивизации",
    addInDetachmentOnError: "ОтключениеВнешнейКомпонентыПриОшибке",
    beforeClose: "ПередЗакрытием",
    beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    beforeLoadUserSettingsAtServer: "ПередЗагрузкойПользовательскихНастроекНаСервере",
    beforeLoadVariantAtServer: "ПередЗагрузкойВариантаНаСервере",
    beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
    choiceProcessing: "ОбработкаВыбора",
    collaborationSystemUsersAutoComplete: "АвтоПодборПользователейСистемыВзаимодействия",
    collaborationSystemUsersChoiceFormGetProcessing: "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    externalEvent: "ВнешнееСобытие",
    fillCheckProcessingAtServer: "ОбработкаПроверкиЗаполненияНаСервере",
    navigationProcessing: "ОбработкаПерехода",
    newWriteProcessing: "ОбработкаЗаписиНового",
    notificationProcessing: "ОбработкаОповещения",
    onChangeDisplaySettings: "ПриИзмененииПараметровЭкрана",
    onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
    onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
    onClose: "ПриЗакрытии",
    onCreateAtServer: "ПриСозданииНаСервере",
    onLoadDataFromSettingsAtServer: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
    onLoadVariantAtServer: "ПриЗагрузкеВариантаНаСервере",
    onMainServerAvailabilityChange: "ПриИзмененииДоступностиОсновногоСервера",
    onOpen: "ПриОткрытии",
    onPasteFromClipboard: "ПриВставкеИзБуфераОбмена",
    onReopen: "ПриПовторномОткрытии",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
    onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
    onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
    onSaveVariantAtServer: "ПриСохраненииВариантаНаСервере",
    onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
    uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
    uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
    uRLProcessing: "ОбработкаНавигационнойСсылки",
  },
  reportResult: "Результат",
  detailsData: "ДанныеРасшифровки",
  reportFormType: "Main",
  variantAppearance: "ДанныеРасшифровки",
  autoShowState: "Auto",
  customSettingsFolder: "КомпоновщикНастроекПользовательскиеНастройки",
  reportResultViewMode: "Auto",
  viewModeApplicationOnSetReportResult: "Auto",
} satisfies ReportFormClientApplicationForm
