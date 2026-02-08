import { TableChildItemsPartialEnterprise } from "~/metadata/forms/collections/childItems/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { Table, TablePartialEnterprise } from "~/metadata/forms/elements/table/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { RequiredFieldsElement } from "~/tests/types"

export interface TableFixture {
  name: string
  table: Table
  tableEnterprise: TablePartialEnterprise
  xml: string
}

export interface TableExportToStructureFixture {
  name: string
  table: Table
  structure: string
}

export const sourceTable: Table = {
  elementType: FormElementType.Table,
  name: "Таблица",
  autoCommandBar: {
    elementType: "AutoCommandBar",
    autofill: false,
    childItems: [],
  },
  childItems: [
    {
      elementType: "ColumnGroup",
      name: "ТаблицаГруппа1",
      title: { items: { ru: "Группа 1" } },
      childItems: [],
    },
    {
      elementType: "CheckBoxField",
      name: "ТаблицаПолеФлажка",
      title: { items: { ru: "Поле флажка" } },
    },
    {
      elementType: "PictureField",
      name: "ТаблицаПолеКартинки",
    },
    {
      elementType: "LabelField",
      name: "ТаблицаПолеНадписи",
      title: { items: { ru: "Поле надписи" } },
    },
  ],
}

export const fullTable: RequiredFieldsElement<Table> = {
  elementType: FormElementType.Table,
  name: "Таблица",
  allowGettingCurrentRowURL: true,
  allowRootChoice: true,
  autoRefresh: true,
  autoRefreshPeriod: 30,
  autoAddIncomplete: true,
  autoCommandBar: {
    elementType: "AutoCommandBar",
    autofill: false,
    childItems: [],
  },
  autoInsertNewRow: true,
  autoMarkIncomplete: true,
  autoMaxHeightInTableRows: false,
  autoMaxHeight: false,
  autoMaxWidth: false,
  backColor: {
    type: "WebColor",
    value: "Red",
  },
  behaviorOnHorizontalCompression: "HideItemsByImportance",
  borderColor: {
    type: "WebColor",
    value: "Green",
  },
  changeRowOrder: false,
  changeRowSet: false,
  choiceFoldersAndItems: "FoldersAndItems",
  restoreCurrentRow: true,
  childItems: [
    {
      dataPath: "Таблица.Надпись",
      editMode: "EnterOnInput",
      elementType: "LabelField",
      name: "ТаблицаНадпись",
    },
    {
      checkBoxType: "Auto",
      dataPath: "Таблица.Флажок",
      editMode: "EnterOnInput",
      elementType: "CheckBoxField",
      name: "ТаблицаФлажок",
    },
    {
      dataPath: "Таблица.Картинка",
      editMode: "EnterOnInput",
      elementType: "PictureField",
      name: "ТаблицаКартинка",
    },
  ],
  choiceMode: true,
  commandBarLocation: "Top",
  commandSet: ["Add"],
  contextMenu: {
    elementType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  currentRowUse: "SelectionPresentationAndChoice",
  dataPath: "Таблица",
  defaultItem: true,
  displayImportance: "VeryHigh",
  enableDrag: true,
  enableStartDrag: true,
  enabled: false,
  events: {
    afterDeleteRow: "ТаблицаПослеУдаления",
    beforeAddRow: "ТаблицаПередНачаломДобавления",
    beforeCollapse: "ТаблицаПередСворачиванием",
    beforeDeleteRow: "ТаблицаПередУдалением",
    beforeEditEnd: "ТаблицаПередОкончаниемРедактирования",
    beforeExpand: "ТаблицаПередРазворачиванием",
    beforeRowChange: "ТаблицаПередНачаломИзменения",
    choiceProcessing: "ТаблицаОбработкаВыбора",
    drag: "ТаблицаПеретаскивание",
    dragCheck: "ТаблицаПроверкаПеретаскивания",
    dragEnd: "ТаблицаОкончаниеПеретаскивания",
    dragStart: "ТаблицаНачалоПеретаскивания",
    newWriteProcessing: "ТаблицаОбработкаЗаписиНового",
    onActivateCell: "ТаблицаПриАктивизацииЯчейки",
    onActivateField: "ТаблицаПриАктивизацииПоля",
    onActivateRow: "ТаблицаПриАктивизацииСтроки",
    onChange: "ТаблицаПриИзменении",
    onCurrentParentChange: "ТаблицаПриСменеТекущегоРодителя",
    onEditEnd: "ТаблицаПриОкончанииРедактирования",
    onStartEdit: "ТаблицаПриНачалеРедактирования",
    refreshRequestProcessing: "ТаблицаОбработкаЗапросаОбновления",
    selection: "ТаблицаВыбор",
    valueChoice: "ТаблицаВыборЗначения",
  },
  extendedTooltip: {
    elementType: "ExtendedTooltip",
    title: {
      formatted: false,
      items: {
        ru: "Расширенная подсказка таблицы",
      },
    },
  },
  fileDragMode: "AsFile",
  font: {
    kind: "StyleItem",
    ref: "LargeTextFont",
  },
  footer: true,
  footerHeight: 9,
  header: false,
  headerHeight: 8,
  height: 4,
  heightControlVariant: "UseContentHeight",
  heightInTableRows: 6,
  horizontalAlignInGroup: "Left",
  horizontalLines: false,
  horizontalScrollBar: "UseAlways",
  horizontalStretch: false,
  initialListView: "Beginning",
  initialTreeView: "ExpandTopLevel",
  maxHeight: 5,
  maxHeightInTableRows: 7,
  maxWidth: 3,
  multipleChoice: true,
  output: "Enable",
  onMainServerUnavalableBehavior: "DontChangeBehavior",
  representation: "Tree",
  readOnly: true,
  refreshRequest: "PullFromTop",
  rowInputMode: "AfterCurrentRow",
  rowPictureDataPath: "Таблица.Картинка",
  rowSelectionMode: "Row",
  rowsPicture: {
    loadTransparent: true,
    ref: "Print",
    transparentPixel: undefined,
    type: "StandardPicture",
  },
  searchControl: {
    childItems: [],
    elementType: "SearchControlAddition",
    title: {
      items: {
        ru: "Управление поиском",
      },
    },
  },
  searchControlLocation: "CommandBar",
  searchOnInput: "Use",
  searchStringAddition: {
    elementType: "SearchStringAddition",
    title: {
      items: {
        ru: "Строка поиска",
      },
    },
  },
  searchStringLocation: "Top",
  selectionMode: "SingleRow",
  shortcut: "Cmd+F",
  showRoot: true,
  skipOnInput: false,
  textColor: {
    type: "WebColor",
    value: "Blue",
  },
  title: {
    items: {
      ru: "Заголовок таблицы",
    },
  },
  titleFont: {
    kind: "StyleItem",
    ref: "SmallTextFont",
  },
  titleHeight: 10,
  titleLocation: "Top",
  titleTextColor: {
    type: "WebColor",
    value: "Yellow",
  },
  toolTip: {
    items: {
      ru: "Текст подсказки",
    },
  },
  toolTipRepresentation: "Balloon",
  useAlternationRowColor: true,
  updateOnDataChange: "DontUpdate",
  userSettingsGroup: "ГруппаПользовательскихНастроек",
  userVisible: {
    common: true,
    values: [
      {
        name: "Администратор",
        value: true,
      },
    ],
  },
  verticalAlignInGroup: "Center",
  verticalLines: false,
  verticalScrollBar: "UseAlways",
  verticalStretch: false,
  viewStatusAddition: {
    elementType: "ViewStatusAddition",
    title: {
      items: {
        ru: "Состояние просмотра",
      },
    },
  },
  viewStatusLocation: "Top",
  visible: false,
  width: 1,
}

export const fullTableEnterprise: TablePartialEnterprise = {
  АвтоВводНезаполненного: "Истина",
  АвтоВводНовойСтроки: "Истина",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяВысотаВСтрокахТаблицы: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  АвтоОтметкаНезаполненного: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВариантУправленияВысотой: "Авто",
  ВертикальнаяПолосаПрокрутки: "ИспользоватьАвтоматически",
  ВертикальноеПоложениеВГруппе: "Верх",
  ВертикальныеЛинии: "Истина",
  Видимость: "Истина",
  Вывод: "Авто",
  Высота: 400,
  ВысотаВСтрокахТаблицы: 10,
  ВысотаЗаголовка: 25,
  ВысотаПодвала: 30,
  ВысотаШапки: 30,
  ГоризонтальнаяПолосаПрокрутки: "ИспользоватьАвтоматически",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальныеЛинии: "Истина",
  Доступность: "Истина",
  Заголовок: "Таблица",
  ЗапросОбновления: "Нет",
  ИзменятьПорядокСтрок: "Истина",
  ИзменятьСоставСтрок: "Истина",
  ИспользованиеТекущейСтроки: "Авто",
  КартинкаСтрок: "Печать",
  Команда: ["WriteAndClose", "Copy", "Delete"],
  КоманднаяПанель: {
    ГоризонтальноеПоложение: "Центр",
  },
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  МаксимальнаяВысота: 600,
  МаксимальнаяВысотаВСтрокахТаблицы: 20,
  МаксимальнаяШирина: 800,
  МножественныйВыбор: "Истина",
  НачальноеОтображениеДерева: "НеРаскрывать",
  НачальноеОтображениеСписка: "Авто",
  ОтметкаНезаполненного: "Истина",
  Отображение: "Список",
  ОтображениеПодсказки: "Авто",
  ОтображениеСостоянияПросмотра: {
    Заголовок: "Отображение состояния просмотра",
    ВажностьПриОтображении: "Высокая",
    Доступность: "Истина",
    ОтображениеПодсказки: "Нет",
    Подсказка: "Подсказка",
  },
  ОтображениеСтрокиПоиска: {
    Заголовок: "Отображение строки поиска",
    ВажностьПриОтображении: "Высокая",
    ВертикальноеПоложениеВГруппе: "Верх",
    Видимость: "Истина",
    ГоризонтальноеПоложениеВГруппе: "Лево",
    Доступность: "Истина",
    ОтображениеПодсказки: "Нет",
    Подсказка: "Подсказка",
    РазрешитьИспользование: { Администратор: "Истина" },
  },
  ПоведениеПриСжатииПоГоризонтали: "Авто",
  Подвал: "Истина",
  Подсказка: "Подсказка для таблицы",
  ПоискПриВводе: "Авто",
  ПоложениеЗаголовка: "Лево",
  ПоложениеКоманднойПанели: "Верх",
  ПоложениеСостоянияПросмотра: "Авто",
  ПоложениеСтрокиПоиска: "Авто",
  ПоложениеУправленияПоиском: "Авто",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Ложь",
  ПутьКДанным: "Объект.ТабличнаяЧасть",
  ПутьКДаннымКартинкиСтроки: "Объект.Картинка",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка",
  },
  РежимВводаСтрок: "ВКонецОкна",
  РежимВыбора: "Истина",
  РежимВыделения: "Одиночный",
  РежимВыделенияСтроки: "Строка",
  СочетаниеКлавиш: "Ctrl+T",
  СпособПеретаскиванияФайлов: "КакФайл",
  ТолькоПросмотр: "Ложь",
  УправлениеПоиском: {
    Заголовок: "Управление поиском",
    ВажностьПриОтображении: "Высокая",
    ВертикальноеПоложениеВГруппе: "Верх",
    Видимость: "Истина",
    ГоризонтальноеПоложениеВГруппе: "Лево",
    Доступность: "Истина",
    ОтображениеПодсказки: "Нет",
    Подсказка: "Подсказка",
    РазрешитьИспользование: { Администратор: "Истина" },
  },
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветТекстаЗаголовка: "Черный",
  ЦветФона: "Белый",
  ЧередованиеЦветовСтрок: "Истина",
  Шапка: "Истина",
  Ширина: 600,
  Шрифт: "ОбычныйШрифтТекста",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  АвтоОбновление: "Истина",
  ВосстанавливатьТекущуюСтроку: "Истина",
  ВыборГруппИЭлементов: "ГруппыИЭлементы",
  // ДополнительныеПараметрыСоздания: "Истина",
  ОбновлениеПриИзмененииДанных: "Авто",
  ОтображатьКорень: "Истина",
  ПериодАвтоОбновления: 60,
  РазрешитьВыборКорня: "Истина",
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: "Истина",
  ГруппаПользовательскихНастроек: "СписокКомпоновщикНастроекПользовательскиеНастройки",
  События: {
    Выбор: "ПроцедураВыбора",
    ВыборЗначения: "ПроцедураВыбораЗначения",
    НачалоПеретаскивания: "ПроцедураНачалаПеретаскивания",
    ОбработкаВыбора: "ПроцедураОбработкиВыбора",
    ОбработкаЗаписиНового: "ПроцедураОбработкиЗаписиНового",
    ОбработкаЗапросаОбновления: "ПроцедураОбработкиЗапросаОбновления",
    ОкончаниеПеретаскивания: "ПроцедураОкончанияПеретаскивания",
    ПередНачаломДобавления: "ПроцедураПередНачаломДобавления",
    ПередНачаломИзменения: "ПроцедураПередНачаломИзменения",
    ПередОкончаниемРедактирования: "ПроцедураПередОкончаниемРедактирования",
    ПередРазворачиванием: "ПроцедураПередРазворачиванием",
    ПередСворачиванием: "ПроцедураПередСворачиванием",
    ПередУдалением: "ПроцедураПередУдалением",
    Перетаскивание: "ПроцедураПеретаскивания",
    ПослеУдаления: "ПроцедураПослеУдаления",
    ПриАктивизацииПоля: "ПроцедураПриАктивизацииПоля",
    ПриАктивизацииСтроки: "ПроцедураПриАктивизацииСтроки",
    ПриАктивизацииЯчейки: "ПроцедураПриАктивизацииЯчейки",
    ПриИзменении: "ПроцедураПриИзменении",
    ПриНачалеРедактирования: "ПроцедураПриНачалеРедактирования",
    ПриОкончанииРедактирования: "ПроцедураПриОкончанииРедактирования",
    ПриСменеТекущегоРодителя: "ПроцедураПриСменеТекущегоРодителя",
    ПроверкаПеретаскивания: "ПроцедураПроверкиПеретаскивания",
  },
}

export const fullTableChildItems: TableChildItemsPartialEnterprise = {
  ТаблицаГруппа1: {
    ПодчиненныеЭлементы: {
      ТаблицаПолеВвода: {
        Тип: "ПолеВвода",
        ПутьКДанным: "Таблица.ПолеВвода",
        РежимРедактирования: "ВходПриВводе",
      },
    },
  },
  ТаблицаПолеФлажка: {
    ПутьКДанным: "Таблица.ПолеФлажка",
    РежимРедактирования: "ВходПриВводе",
    ВидФлажка: "Авто",
  },
  ТаблицаПолеКартинки: {
    ПутьКДанным: "Таблица.ПолеКартинки",
    РежимРедактирования: "ВходПриВводе",
  },
  ТаблицаПолеНадписи: {
    ПутьКДанным: "Таблица.ПолеНадписи",
    РежимРедактирования: "ВходПриВводе",
  },
}

export const minimalTable: Table = {
  elementType: FormElementType.Table,
  name: "Таблица",
  childItems: [],
}

export const minimalTableEnterprise: TablePartialEnterprise = {}

export const oneColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      elementType: FormElementType.InputField,
    } as InputField,
  ],
}

export const twoColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      elementType: FormElementType.InputField,
    } as InputField,
    {
      name: "Колонка2",
      title: { items: { ru: "Колонка 2" } },
      elementType: FormElementType.InputField,
    } as InputField,
  ],
}

export const tableWithAutoCommandBar: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  autoCommandBar: {
    elementType: "AutoCommandBar",
    autofill: true,
    childItems: [
      {
        name: "КнопкаТаблицы",
        elementType: "Button",
        title: { items: { ru: "Кнопка 1" } },
      },
    ],
  },
  childItems: [
    {
      name: "Колонка1",
      elementType: "InputField",
      title: { items: { ru: "Колонка таблицы 1" } },
    },
  ],
}

export const inputColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      elementType: FormElementType.InputField,
    } as InputField,
  ],
}

export const checkboxColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Флажок" } },
      elementType: "CheckBoxField",
    },
  ],
}

export const labelColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      elementType: "LabelField",
    },
  ],
}

export const pictureColumnTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      elementType: "PictureField",
    },
  ],
}

export const columnGroupTable: Table = {
  name: "Таблица1",
  elementType: FormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      elementType: "ColumnGroup",
      childItems: [],
    },
  ],
}

export const tableStructureFixtures: TableExportToStructureFixture[] = [
  {
    name: "table with input field",
    table: inputColumnTable,
    structure: `| Колонка 1 {Колонка1} | {Таблица1}`,
  },
  {
    name: "table with checkbox field",
    table: checkboxColumnTable,
    structure: `| [ ] Флажок {Колонка1} | {Таблица1}`,
  },
  {
    name: "table with label field",
    table: labelColumnTable,
    structure: `| ~{Колонка1} | {Таблица1}`,
  },
  {
    name: "table with picture field",
    table: pictureColumnTable,
    structure: `| @{Колонка1} | {Таблица1}`,
  },
  {
    name: "table with group",
    table: columnGroupTable,
    structure: `| #{Колонка1} | {Таблица1}`,
  },
  {
    name: "two-column table",
    table: twoColumnTable,
    structure: `| Колонка 1 {Колонка1} | Колонка 2 {Колонка2} | {Таблица1}`,
  },
  {
    name: "table with auto command bar",
    table: tableWithAutoCommandBar,
    structure: `<... | Кнопка 1 {КнопкаТаблицы}>
| Колонка таблицы 1 {Колонка1} | {Таблица1}`,
  },
]
