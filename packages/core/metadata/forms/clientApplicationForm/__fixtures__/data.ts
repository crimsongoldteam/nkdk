import { ClientApplicationForm, ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import { CommandInterface } from "~/metadata/forms/commonObjects/commandInterface/types"
import { explicitYAMLString } from "~/yaml/explicitString"

type ClientApplicationFormWithCustomSettingsFolder = ClientApplicationForm & {
  customSettingsFolder: string
}

type ClientApplicationFormYAMLWithCustomSettingsFolder = ClientApplicationFormYAML & {
  ГруппаПользовательскихНастроек: string
}

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

type ReportFormClientApplicationFormYAML = ClientApplicationFormYAML & {
  РезультатОтчета: string
  ДанныеРасшифровки: string
  ТипФормыОтчета: "Основная"
  ПредставлениеВарианта: string
  ГруппаПользовательскихНастроек: string
}

const fullCommandInterface: CommandInterface = {
  NavigationPanel: [],
  CommandBar: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      type: "Auto",
      index: 0,
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
  itemType: "CommandInterface",
}

export const fullClientApplicationForm: Omit<
  Required<ClientApplicationForm>,
  | "uuid"
  | "formType"
  | "name"
  | "attributesConditionalAppearance"
  | "mobileDeviceCommandBarContent"
  | "settingsStorage"
  | "scalingMode"
  | "customSettingsFolder"
  | "autoTime"
  | "usePostingMode"
  | "repostOnWrite"
  | "extendedPresentation"
  | "reportResult"
  | "detailsData"
  | "reportFormType"
  | "variantAppearance"
  | "autoShowState"
  | "reportResultViewMode"
  | "viewModeApplicationOnSetReportResult"
> = {
  parameters: [
    {
      name: "Параметр1",
      type: { type: ["boolean"] },
    },
  ],
  commands: [
    {
      name: "Команда1",
      title: { items: { ru: "Команда1" } },
      itemType: "FormCommand",
    },
  ],
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: false,
    horizontalAlign: "Left",
    childItems: [],
  },
  commandInterface: fullCommandInterface,
  attributes: [
    {
      name: "Объект",
      type: { type: ["CatalogRef.ТестоваяОбработка"] },
      mainAttribute: true,
      title: { items: { ru: "" } },
      itemType: "FormAttribute",
      columns: [],
    },
  ],
  autoTitle: true,
  autoSaveDataInSettings: "Use",
  autoURL: true,
  customizable: false,
  verticalScroll: "useIfNecessary",
  childItemsVerticalAlign: "Top",
  verticalSpacing: "Single",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  height: 600,
  childItemsHorizontalAlign: "Left",
  horizontalSpacing: "Double",
  group: "Horizontal",
  groupList: "Дерево",
  enabled: true,
  title: { items: { ru: "Полная форма приложения" } },
  closeOnChoice: true,
  closeOnOwnerClose: false,
  usedFormServer: "Main",
  purposeUseKey: "PurposeKey",
  windowOptionsKey: "WindowOptionsKey",
  scale: 100,
  modalMode: false,
  modified: false,
  showTitle: true,
  showCloseButton: true,
  conversationsRepresentation: "Show",
  enterKeyBehavior: "DefaultButton",
  commandBarLocation: "Top",
  commandSet: ["WriteAndClose"],
  autoFillCheck: true,
  formWindowOpeningMode: "LockOwnerWindow",
  collapseItemsByImportance: "Use",
  saveDataInSettings: "UseList",
  savedInSettingsDataModified: true,
  readOnly: false,
  width: 800,
  slaveItemsWidth: "Auto",
  saveWindowSettings: true,
  childItems: [
    {
      name: "ПолеВвода1",
      itemType: "InputField",
      width: 10,
    },
  ],

  // #region Catalog
  choiceAvailable: true,
  useForFoldersAndItems: "Folders",
  choiceParameters: [
    {
      name: "Отбор.Параметр",
      value: {
        type: "string",
        value: "Значение",
      },
    },
  ],
  choiceMode: "QuickChoice",
  // #endregion

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
    onReopen: "ПриПовторномОткрытии",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
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
  } satisfies Required<ClientApplicationForm["events"]>,
  synonym: { items: { ru: "Синоним формы" } },
  comment: "Комментарий к форме",
  includeHelpInContents: true,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
  itemType: "ClientApplicationForm",
}

export const clientApplicationFormReference: ClientApplicationForm = {
  ...fullClientApplicationForm,
  uuid: "11111111-1111-4111-8111-111111111111",
}

export const catalogFullClientApplicationForm: ClientApplicationForm = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
  title: { items: { ru: "Заголовок" } },
  width: 5,
  height: 10,
  formWindowOpeningMode: "LockWholeInterface",
  enterKeyBehavior: "DefaultButton",
  autoSaveDataInSettings: "Use",
  saveDataInSettings: "UseList",
  saveWindowSettings: false,
  settingsStorage: "SettingsStorage.ХранилищеНастроек",
  autoTitle: false,
  autoURL: false,
  group: "AlwaysHorizontal",
  groupList: "Дерево",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  horizontalSpacing: "Single",
  verticalSpacing: "Double",
  childItemsHorizontalAlign: "Center",
  childItemsVerticalAlign: "Bottom",
  autoFillCheck: false,
  customizable: false,
  enabled: false,
  commandBarLocation: "Top",
  verticalScroll: "useIfNecessary",
  scalingMode: "Compact",
  scale: 90,
  conversationsRepresentation: "Show",
  mobileDeviceCommandBarContent: [{ type: "string", value: "ФормаКоманда1" }],
  commandSet: ["Write"],
  showTitle: false,
  showCloseButton: false,
  collapseItemsByImportance: "DontUse",
  useForFoldersAndItems: "Folders",
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [
      {
        itemType: "CommandBarButton",
        name: "ФормаКоманда2",
        type: "CommandBarButton",
        commandName: "Form.Command.Команда1",
      },
    ],
  },
  childItems: [
    {
      itemType: "Button",
      name: "ФормаКоманда1",
      type: "UsualButton",
      commandName: "Form.Command.Команда1",
    },
  ],
  attributes: [
    {
      itemType: "FormAttribute",
      name: "Объект",
      type: { type: ["CatalogObject.СправочникФормаВсеСвойства"] },
      mainAttribute: true,
      storedData: true,
      title: { items: { ru: "" } },
      columns: [],
    },
    {
      itemType: "FormAttribute",
      name: "Реквизит1",
      type: { type: ["string"] },
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
              leftValue: { type: "Field", value: "Объект.Наименование" },
              comparisonType: "Contains",
              rightValue: { type: "string", value: "вба" },
            },
          ],
        },
        appearance: {
          itemType: "AppearanceFields",
          Текст: {
            parameter: "Текст",
            value: {
              items: { ru: "абв" },
            },
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
  events: {
    ...fullClientApplicationForm.events,
    afterWrite: "ПослеЗаписи",
    beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
    valueChoice: "ВыборЗначения",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
    onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
    onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
    onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
  },
}

export const fullClientApplicationFormYAML: ClientApplicationFormYAML = {
  Синоним: "Синоним формы",
  Комментарий: "Комментарий к форме",
  ВключатьСправкуВСодержание: "Истина",
  НазначенияИспользования: "ПлатформаИМобильноеПриложение",
  АвтоЗаголовок: "Истина",
  АвтоматическоеСохранениеДанныхВНастройках: "Использовать",
  АвтоНавигационнаяСсылка: "Истина",
  ВертикальнаяПрокрутка: "ИспользоватьПриНеобходимости",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  Высота: 600,
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Двойной",
  СписокГрупп: "Дерево",
  РазрешитьИзменятьФорму: "Ложь",
  Доступность: "Истина",
  Заголовок: "Полная форма приложения",
  ЗакрыватьПриВыборе: "Истина",
  ЗакрыватьПриЗакрытииВладельца: "Ложь",
  ИнтерфейсКоманды: {
    КоманднаяПанель: [
      {
        Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
        Тип: "Auto",
        Индекс: 0,
        Автовидимость: "Ложь",
      },
    ],
  },
  КлючНазначенияИспользования: "PurposeKey",
  КлючСохраненияПоложенияОкна: "WindowOptionsKey",
  КоманднаяПанель: {
    Автозаполнение: "Ложь",
    ГоризонтальноеПоложение: "Лево",
  },
  Команды: {
    Команда1: {
      Заголовок: "Команда1",
    },
  },
  Масштаб: 100,
  МодальныйРежим: "Ложь",
  Модифицированность: "Ложь",
  ОтображатьЗаголовок: "Истина",
  ОтображатьКнопкуЗакрытия: "Истина",
  ОтображениеОбсуждений: "Отображать",
  ПоложениеКоманднойПанели: "Верх",
  ПроверятьЗаполнениеАвтоматически: "Истина",
  РежимОткрытияОкнаФормы: "БлокироватьОкноВладельца",
  СворачиваниеЭлементовПоВажности: "Использовать",
  СоставКоманд: ["WriteAndClose"],
  СохранениеДанныхВНастройках: "ИспользоватьСписок",
  СохраняемыеВНастройкахДанныеМодифицированы: "Истина",
  ТолькоПросмотр: "Ложь",
  Ширина: 800,
  СохранятьНастройкиОкна: "Истина",
  Реквизиты: {
    Объект: {
      Тип: "Справочник.ТестоваяОбработка",
      Заголовок: "",
      ОсновнойРеквизит: "Истина",
    },
  },
  События: {
    АвтоПодборПользователейСистемыВзаимодействия: "АвтоПодборПользователейСистемыВзаимодействия",
    ВнешнееСобытие: "ВнешнееСобытие",
    ОбработкаАктивизации: "ОбработкаАктивизации",
    ОбработкаВыбора: "ОбработкаВыбора",
    ОбработкаЗаписиНового: "ОбработкаЗаписиНового",
    ОбработкаНавигационнойСсылки: "ОбработкаНавигационнойСсылки",
    ОбработкаОповещения: "ОбработкаОповещения",
    ОбработкаПерехода: "ОбработкаПерехода",
    ОбработкаПолученияНавигационнойСсылки: "ОбработкаПолученияНавигационнойСсылки",
    ОбработкаПолученияСпискаНавигационныхСсылок: "ОбработкаПолученияСпискаНавигационныхСсылок",
    ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия:
      "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    ОбработкаПроверкиЗаполненияНаСервере: "ОбработкаПроверкиЗаполненияНаСервере",
    ОтключениеВнешнейКомпонентыПриОшибке: "ОтключениеВнешнейКомпонентыПриОшибке",
    ПередЗагрузкойДанныхИзНастроекНаСервере: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    ПередЗакрытием: "ПередЗакрытием",
    ПередПереоткрытиемСДругогоСервера: "ПередПереоткрытиемСДругогоСервера",
    ПриВставкеИзБуфераОбмена: "ПриВставкеИзБуфераОбмена",
    ПриЗагрузкеДанныхИзНастроекНаСервере: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    ПриЗакрытии: "ПриЗакрытии",
    ПриИзмененииДоступностиОсновногоСервера: "ПриИзмененииДоступностиОсновногоСервера",
    ПриИзмененииПараметровЭкрана: "ПриИзмененииПараметровЭкрана",
    ПриОткрытии: "ПриОткрытии",
    ПриПовторномОткрытии: "ПриПовторномОткрытии",
    ПриПереоткрытииСДругогоСервера: "ПриПереоткрытииСДругогоСервера",
    ПриСозданииНаСервере: "ПриСозданииНаСервере",
    ПриСохраненииДанныхВНастройкахНаСервере: "ПриСохраненииДанныхВНастройкахНаСервере",

    // #region Catalog
    ВыборЗначения: "ВыборЗначения",
    ПередЗаписью: "ПередЗаписью",
    ПередЗаписьюНаСервере: "ПередЗаписьюНаСервере",
    ПослеЗаписи: "ПослеЗаписи",
    ПослеЗаписиНаСервере: "ПослеЗаписиНаСервере",
    ПриЗаписиНаСервере: "ПриЗаписиНаСервере",
    ПриЧтенииНаСервере: "ПриЧтенииНаСервере",
    // #endregion
  } satisfies Required<ClientApplicationFormYAML["События"]>,
  Элементы: {
    ПолеВвода1: {
      Вид: "ПолеВвода",
      Ширина: 10,
    },
  },
  Параметры: {
    Параметр1: {
      Тип: "Булево",
    },
  },
  // #region Catalog
  ВыборДоступен: "Истина",
  ИспользованиеДляГруппИЭлементов: "Группы",
  ПараметрыВыбора: {
    "Отбор.Параметр": explicitYAMLString("Значение"),
  },
  РежимВыбора: "БыстрыйВыбор",
  // #endregion
} satisfies ClientApplicationFormYAML

export const catalogFullClientApplicationFormYAML: ClientApplicationFormYAML = {
  НазначенияИспользования: "ПлатформаИМобильноеПриложение",
  АвтоЗаголовок: "Ложь",
  АвтоматическоеСохранениеДанныхВНастройках: "Использовать",
  АвтоНавигационнаяСсылка: "Ложь",
  ВертикальнаяПрокрутка: "ИспользоватьПриНеобходимости",
  ВертикальноеПоложениеПодчиненных: "Низ",
  ВертикальныйИнтервал: "Двойной",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  Высота: 10,
  ГоризонтальноеПоложениеПодчиненных: "Центр",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "ГоризонтальнаяВсегда",
  СписокГрупп: "Дерево",
  РазрешитьИзменятьФорму: "Ложь",
  Доступность: "Ложь",
  Заголовок: "Заголовок",
  Команды: {
    Команда1: {
      Заголовок: "",
    },
  },
  Масштаб: 90,
  ОтображатьЗаголовок: "Ложь",
  ОтображатьКнопкуЗакрытия: "Ложь",
  ОтображениеОбсуждений: "Отображать",
  ПоложениеКоманднойПанели: "Верх",
  ПроверятьЗаполнениеАвтоматически: "Ложь",
  РежимОткрытияОкнаФормы: "БлокироватьВесьИнтерфейс",
  СворачиваниеЭлементовПоВажности: "НеИспользовать",
  СоставКоманд: ["Write"],
  СохранениеДанныхВНастройках: "ИспользоватьСписок",
  Ширина: 5,
  СохранятьНастройкиОкна: "Ложь",
  КоманднаяПанель: {
    Элементы: {
      ФормаКоманда2: {
        Вид: "КнопкаКоманднойПанели",
        ИмяКоманды: "Form.Command.Команда1",
        ТипКнопки: "КнопкаКоманднойПанели",
      },
    },
  },
  Реквизиты: {
    Объект: {
      Тип: "СправочникОбъект.СправочникФормаВсеСвойства",
      Заголовок: "",
      ОсновнойРеквизит: "Истина",
      СохраняемыеДанные: "Истина",
    },
    Реквизит1: {
      Заголовок: "",
      Тип: "Строка",
    },
  },
  События: {
    АвтоПодборПользователейСистемыВзаимодействия: "АвтоПодборПользователейСистемыВзаимодействия",
    ВнешнееСобытие: "ВнешнееСобытие",
    ОбработкаАктивизации: "ОбработкаАктивизации",
    ОбработкаВыбора: "ОбработкаВыбора",
    ОбработкаЗаписиНового: "ОбработкаЗаписиНового",
    ОбработкаНавигационнойСсылки: "ОбработкаНавигационнойСсылки",
    ОбработкаОповещения: "ОбработкаОповещения",
    ОбработкаПерехода: "ОбработкаПерехода",
    ОбработкаПолученияНавигационнойСсылки: "ОбработкаПолученияНавигационнойСсылки",
    ОбработкаПолученияСпискаНавигационныхСсылок: "ОбработкаПолученияСпискаНавигационныхСсылок",
    ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия:
      "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    ОбработкаПроверкиЗаполненияНаСервере: "ОбработкаПроверкиЗаполненияНаСервере",
    ОтключениеВнешнейКомпонентыПриОшибке: "ОтключениеВнешнейКомпонентыПриОшибке",
    ПередЗагрузкойДанныхИзНастроекНаСервере: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    ПередЗакрытием: "ПередЗакрытием",
    ПередПереоткрытиемСДругогоСервера: "ПередПереоткрытиемСДругогоСервера",
    ПриВставкеИзБуфераОбмена: "ПриВставкеИзБуфераОбмена",
    ПриЗагрузкеДанныхИзНастроекНаСервере: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    ПриЗакрытии: "ПриЗакрытии",
    ПриИзмененииДоступностиОсновногоСервера: "ПриИзмененииДоступностиОсновногоСервера",
    ПриИзмененииПараметровЭкрана: "ПриИзмененииПараметровЭкрана",
    ПриОткрытии: "ПриОткрытии",
    ПриПереоткрытииСДругогоСервера: "ПриПереоткрытииСДругогоСервера",
    ПриПовторномОткрытии: "ПриПовторномОткрытии",
    ПриСозданииНаСервере: "ПриСозданииНаСервере",
    ПриСохраненииДанныхВНастройкахНаСервере: "ПриСохраненииДанныхВНастройкахНаСервере",
    ПриЗасыпанииКлиентскогоПриложения: "ПриЗасыпанииКлиентскогоПриложения",
    ПриПробужденииКлиентскогоПриложения: "ПриПробужденииКлиентскогоПриложения",
    ВыборЗначения: "ВыборЗначения",
    ПередЗаписью: "ПередЗаписью",
    ПередЗаписьюНаСервере: "ПередЗаписьюНаСервере",
    ПослеЗаписи: "ПослеЗаписи",
    ПослеЗаписиНаСервере: "ПослеЗаписиНаСервере",
    ПриЗаписиНаСервере: "ПриЗаписиНаСервере",
    ПриЧтенииНаСервере: "ПриЧтенииНаСервере",
  },
  Элементы: {
    ФормаКоманда1: {
      Вид: "Кнопка",
      ИмяКоманды: "Form.Command.Команда1",
    },
  },
  УсловноеОформлениеРеквизитов: {
    Элементы: [
      {
        Отбор: {
          Элементы: [
            {
              ЛевоеЗначение: ".Объект.Наименование",
              ВидСравнения: "Содержит",
              ПравоеЗначение: "'вба'",
            },
          ],
        },
        Оформление: {
          Текст: "абв",
        },
      },
    ],
    РежимОтображения: "БыстрыйДоступ",
  },
  ХранилищеНастроек: "ХранилищеНастроек.ХранилищеНастроек",
  ВариантМасштаба: "Компактный",
  СоставКоманднойПанелиНаМобильномУстройстве: ["ФормаКоманда1"],
  ИспользованиеДляГруппИЭлементов: "Группы",
}

export const minimalClientApplicationForm: ClientApplicationForm = {
  childItems: [],
  commands: [],
  itemType: "ClientApplicationForm",
  attributes: [],
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
}

export const childItemsWidthClientApplicationForm: ClientApplicationForm = {
  ...minimalClientApplicationForm,
  slaveItemsWidth: "LeftWide",
}

export const conditionalAppearanceWithoutAttributesClientApplicationForm: ClientApplicationForm & {
  attributesConditionalAppearance: {
    itemType: "ConditionalAppearance"
    viewMode: "Normal"
  }
} = {
  ...minimalClientApplicationForm,
  attributesConditionalAppearance: {
    itemType: "ConditionalAppearance",
    viewMode: "Normal",
  },
}

export const minimalClientApplicationFormReference: ClientApplicationForm = {
  ...minimalClientApplicationForm,
  uuid: "11111111-1111-4111-8111-111111111111",
}

export const minimalClientApplicationFormMetadataReference: ClientApplicationForm & { uuid: string } = {
  ...minimalClientApplicationForm,
  uuid: "11111111-1111-4111-8111-111111111111",
}
export const minimalClientApplicationFormYAML: ClientApplicationFormYAML = {
  НазначенияИспользования: "ПлатформаИМобильноеПриложение",
}

export const customSettingsFolderClientApplicationForm: ClientApplicationFormWithCustomSettingsFolder = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    horizontalAlign: "Right",
    childItems: [],
  },
  childItems: [
    {
      itemType: "UsualGroup",
      name: "ГруппаПользовательскихНастроек",
      title: { items: { ru: "Пользовательские настройки" } },
      group: "HorizontalIfPossible",
      showTitle: true,
      childItems: [],
    },
  ],
  attributes: [],
  commands: [],
  commandSet: ["EndEdit"],
  customSettingsFolder: "ГруппаПользовательскихНастроек",
}

export const customSettingsFolderClientApplicationFormYAML: ClientApplicationFormYAMLWithCustomSettingsFolder = {
  КоманднаяПанель: {
    ГоризонтальноеПоложение: "Право",
  },
  СоставКоманд: ["EndEdit"],
  ГруппаПользовательскихНастроек: "ГруппаПользовательскихНастроек",
  Элементы: {
    ГруппаПользовательскихНастроек: {
      Вид: "Группа",
      Группировка: "ГоризонтальнаяЕслиВозможно",
      Заголовок: "Пользовательские настройки",
      ОтображатьЗаголовок: "Истина",
    },
  },
}

export const reportFormClientApplicationForm: ReportFormClientApplicationForm = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    horizontalAlign: "Right",
    childItems: [],
  },
  childItems: [
    {
      itemType: "UsualGroup",
      name: "КомпоновщикНастроекПользовательскиеНастройки",
      title: { items: { ru: "Пользовательские настройки" } },
      group: "HorizontalIfPossible",
      showTitle: true,
      childItems: [],
    },
  ],
  attributes: [],
  commands: [],
  reportResult: "Результат",
  detailsData: "ДанныеРасшифровки",
  reportFormType: "Main",
  variantAppearance: "ДанныеРасшифровки",
  autoShowState: "Auto",
  customSettingsFolder: "КомпоновщикНастроекПользовательскиеНастройки",
  reportResultViewMode: "Auto",
  viewModeApplicationOnSetReportResult: "Auto",
}

export const reportFormClientApplicationFormYAML: ReportFormClientApplicationFormYAML = {
  КоманднаяПанель: {
    ГоризонтальноеПоложение: "Право",
  },
  РезультатОтчета: "Результат",
  ДанныеРасшифровки: "ДанныеРасшифровки",
  ТипФормыОтчета: "Основная",
  ПредставлениеВарианта: "ДанныеРасшифровки",
  ГруппаПользовательскихНастроек: "КомпоновщикНастроекПользовательскиеНастройки",
  Элементы: {
    КомпоновщикНастроекПользовательскиеНастройки: {
      Вид: "Группа",
      Заголовок: "Пользовательские настройки",
    },
  },
}
