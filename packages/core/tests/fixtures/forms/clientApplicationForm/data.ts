import { ClientApplicationForm, ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/base/types"
import { CommandInterface } from "~/metadata/forms/commonObjects/commandInterface/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

const fullCommandInterface: CommandInterface = {
  NavigationPanel: [],
  CommandBar: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      type: "Auto",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
  itemType: "CommandInterface",
}

export const fullClientApplicationForm: Required<ClientApplicationForm> = {
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
      itemType: CollectionFormElementType.InputField,
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

export const fullClientApplicationFormYAML: Required<ClientApplicationFormYAML> = {
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
  Группировка: "Горизонтальная",
  РазрешитьИзменятьФорму: "Ложь",
  Доступность: "Истина",
  Заголовок: "Полная форма приложения",
  ЗакрыватьПриВыборе: "Истина",
  ЗакрыватьПриЗакрытииВладельца: "Ложь",
  ИспользуемыйСерверФормы: "Основной",
  ИнтерфейсКоманды: {
    КоманднаяПанель: [
      {
        Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
        Тип: "Auto",
        Автовидимость: "Ложь",
      },
    ],
  },
  КлючНазначенияИспользования: "PurposeKey",
  КлючСохраненияПоложенияОкна: "WindowOptionsKey",
  КоманднаяПанель: {
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
  ПоведениеКлавишиEnter: "КнопкаПоУмолчанию",
  ПоложениеКоманднойПанели: "Верх",
  ПроверятьЗаполнениеАвтоматически: "Истина",
  РежимОткрытияОкнаФормы: "БлокироватьОкноВладельца",
  СворачиваниеЭлементовПоВажности: "Использовать",
  СоставКоманд: ["WriteAndClose"],
  СохранениеДанныхВНастройках: "ИспользоватьСписок",
  СохраняемыеВНастройкахДанныеМодифицированы: "Истина",
  ТолькоПросмотр: "Ложь",
  Ширина: 800,
  ШиринаПодчиненныхЭлементов: "Авто",
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
  ПодчиненныеЭлементы: {
    ПолеВвода1: {
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
    "Отбор.Параметр": '"Значение"',
  },
  РежимВыбора: "БыстрыйВыбор",
  // #endregion
}

export const minimalClientApplicationForm: ClientApplicationForm = {
  childItems: [],
  commands: [],
  itemType: "ClientApplicationForm",
}

export const minimalClientApplicationFormYAML: ClientApplicationFormYAML = {}
