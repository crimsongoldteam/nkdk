import { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"

type DocumentClientApplicationForm = ClientApplicationForm & {
  autoTime: "Last"
  usePostingMode: "Regular"
  repostOnWrite: false
}

const numberContextMenu = {
  itemType: "ContextMenu",
  name: "НомерКонтекстноеМеню",
  childItems: [],
} as const

const numberExtendedTooltip = {
  itemType: "ExtendedTooltip",
  name: "НомерРасширеннаяПодсказка",
} as const

const commandExtendedTooltip = {
  itemType: "ExtendedTooltip",
  name: "Команда1РасширеннаяПодсказка",
} as const

const documentFullClientApplicationFormData: DocumentClientApplicationForm = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
  title: { items: { ru: "Заголовок" } },
  width: 5,
  height: 10,
  formWindowOpeningMode: "LockOwnerWindow",
  enterKeyBehavior: "DefaultButton",
  autoSaveDataInSettings: "Use",
  saveDataInSettings: "UseList",
  saveWindowSettings: false,
  settingsStorage: "SettingsStorage.ХранилищеНастроек",
  autoTitle: false,
  autoURL: false,
  group: "HorizontalIfPossible",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  horizontalSpacing: "OneAndHalf",
  verticalSpacing: "Double",
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Center",
  autoFillCheck: false,
  customizable: false,
  enabled: false,
  commandBarLocation: "None",
  verticalScroll: "use",
  scalingMode: "Compact",
  scale: 96,
  conversationsRepresentation: "Show",
  mobileDeviceCommandBarContent: [{ type: "string", value: "Команда1" }],
  commandSet: ["PostAndClose"],
  showTitle: false,
  showCloseButton: false,
  collapseItemsByImportance: "DontUse",
  autoTime: "Last",
  usePostingMode: "Regular",
  repostOnWrite: false,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [],
  },
  events: {
    afterWrite: "ПослеЗаписи",
    beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
    valueChoice: "ВыборЗначения",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
    onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
    onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
    choiceProcessing: "ОбработкаВыбора",
    afterWriteAtServer: "ПослеЗаписиНаСервере",
    onPasteFromClipboard: "ПриВставкеИзБуфераОбмена",
    notificationProcessing: "ОбработкаОповещения",
    onReadAtServer: "ПриЧтенииНаСервере",
    newWriteProcessing: "ОбработкаЗаписиНового",
    onOpen: "ПриОткрытии",
    uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
    beforeClose: "ПередЗакрытием",
    externalEvent: "ВнешнееСобытие",
    collaborationSystemUsersAutoComplete: "АвтоПодборПользователейСистемыВзаимодействия",
    uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
    onReopen: "ПриПовторномОткрытии",
    onLoadDataFromSettingsAtServer: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    beforeWrite: "ПередЗаписью",
    onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
    beforeWriteAtServer: "ПередЗаписьюНаСервере",
    navigationProcessing: "ОбработкаПерехода",
    onCreateAtServer: "ПриСозданииНаСервере",
    collaborationSystemUsersChoiceFormGetProcessing: "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    activationProcessing: "ОбработкаАктивизации",
    onChangeDisplaySettings: "ПриИзмененииПараметровЭкрана",
    onWriteAtServer: "ПриЗаписиНаСервере",
    onClose: "ПриЗакрытии",
    onMainServerAvailabilityChange: "ПриИзмененииДоступностиОсновногоСервера",
    uRLProcessing: "ОбработкаНавигационнойСсылки",
    fillCheckProcessingAtServer: "ОбработкаПроверкиЗаполненияНаСервере",
    beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    addInDetachmentOnError: "ОтключениеВнешнейКомпонентыПриОшибке",
  },
  childItems: [
    {
      itemType: "InputField",
      name: "Номер",
      dataPath: "Объект.Number",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      contextMenu: numberContextMenu,
      extendedTooltip: numberExtendedTooltip,
    },
    {
      itemType: "Button",
      name: "Команда1",
      type: "UsualButton",
      commandName: "Form.Command.Команда1",
      extendedTooltip: commandExtendedTooltip,
    },
  ],
  attributes: [
    {
      itemType: "FormAttribute",
      name: "Объект",
      type: { type: ["DocumentObject.ДокументВсеСвойства"] },
      mainAttribute: true,
      storedData: true,
      fieldsList: ["Объект.RegisterRecords"],
      title: { items: { ru: "" } },
      columns: [],
    },
  ],
  attributesConditionalAppearance: {
    itemType: "ConditionalAppearance",
    conditionalAppearanceItems: [
      {
        itemType: "ConditionalAppearanceItem",
        filter: {
          itemType: "Filter",
          items: [
            {
              itemType: "FilterItemComparison",
              leftValue: { type: "Field", value: "Объект.Номер" },
              comparisonType: "Equal",
              rightValue: { type: "decimal", value: 34567 },
            },
          ],
        },
        appearance: {
          itemType: "AppearanceFields",
          Отображать: {
            parameter: "Отображать",
            value: { type: "boolean", value: false },
          },
        },
      },
    ],
  },
  commands: [
    {
      itemType: "FormCommand",
      name: "Команда1",
      title: { items: { ru: "" } },
    },
  ],
}

export const documentFullClientApplicationForm: ClientApplicationForm = documentFullClientApplicationFormData
