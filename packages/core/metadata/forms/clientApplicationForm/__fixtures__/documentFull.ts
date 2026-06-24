import { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"

type DocumentClientApplicationForm = ClientApplicationForm & {
  autoTime: "Last"
  usePostingMode: "Regular"
  repostOnWrite: false
}

const numberInputField = {
  itemType: "InputField",
  name: "Номер",
  dataPath: "Объект.Number",
  editMode: "EnterOnInput",
  multipleValuesExtendedEdit: true,
} satisfies InputField

const commandButton = {
  itemType: "Button",
  name: "Команда1",
  type: "UsualButton",
  commandName: "Form.Command.Команда1",
} satisfies Button

const requiredFixtureValue = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} fixture is missing`)
  return value
}

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
  groupList: "2:02023637-7868-4a5f-8576-835a76e0c9ba",
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
  childItems: [numberInputField, commandButton],
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
    viewMode: "QuickAccess",
    conditionalAppearanceItems: [
      {
        itemType: "ConditionalAppearanceItem",
        filter: {
          itemType: "Filter",
          items: [
            {
              itemType: "FilterItemComparison",
              leftValue: { type: "Field", value: "Объект.Номер" },
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

const numberInputFieldFromYAML = {
  itemType: "InputField",
  name: "Номер",
  dataPath: "Объект.Number",
  editMode: "EnterOnInput",
  multipleValuesExtendedEdit: true,
} satisfies InputField

export const documentFullClientApplicationForm: ClientApplicationForm = documentFullClientApplicationFormData

const documentFullAttributesConditionalAppearance = requiredFixtureValue(
  documentFullClientApplicationFormData.attributesConditionalAppearance,
  "attributesConditionalAppearance"
)
const documentFullConditionalAppearanceItems = requiredFixtureValue(
  documentFullAttributesConditionalAppearance.conditionalAppearanceItems,
  "attributesConditionalAppearance.conditionalAppearanceItems"
)
const documentFullFirstConditionalAppearanceItem = requiredFixtureValue(
  documentFullConditionalAppearanceItems[0],
  "attributesConditionalAppearance.conditionalAppearanceItems[0]"
)

export const documentFullClientApplicationFormFromYAML: ClientApplicationForm = {
  ...documentFullClientApplicationFormData,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [],
  },
  childItems: [numberInputFieldFromYAML, commandButton],
  attributesConditionalAppearance: {
    ...documentFullAttributesConditionalAppearance,
    conditionalAppearanceItems: [
      {
        ...documentFullFirstConditionalAppearanceItem,
        filter: {
          ...documentFullFirstConditionalAppearanceItem.filter,
          itemType: "Filter",
          items: [
            {
              itemType: "FilterItemComparison",
              leftValue: { type: "Field", value: "Объект.Номер" },
              rightValue: { type: "decimal", value: 34567 },
            },
          ],
        },
      },
    ],
  },
}
