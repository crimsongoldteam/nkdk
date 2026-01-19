import { ChildItemsPartialEnterprise } from "~/metadata/forms/collections/childItems/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { Table, TablePartialEnterprise } from "~/metadata/forms/elements/table/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

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
    autofill: false,
    childItems: [],
  },
  childItems: [
    {
      elementType: "ColumnGroup",
      name: "ТаблицаГруппа1",
      title: { items: { ru: "Группа 1" } },
      childItems: [
        {
          elementType: FormElementType.InputField,
          name: "ТаблицаПолеВвода",
        },
      ],
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

export const fullTable: Table = {
  elementType: FormElementType.Table,
  name: "Таблица",
  autoAddIncomplete: true,
  autoCommandBar: {
    autofill: false,
    horizontalAlign: "Center",
    childItems: [],
  },
  autoInsertNewRow: true,
  autoMarkIncomplete: true,
  autoMaxHeight: true,
  autoMaxHeightInTableRows: true,
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "White" },
  behaviorOnHorizontalCompression: "Auto",
  borderColor: { type: "WebColor", value: "Black" },
  changeRowOrder: true,
  changeRowSet: true,
  childItems: [
    {
      elementType: "ColumnGroup",
      name: "ТаблицаГруппа1",
      title: { items: { ru: "Группа 1" } },
      childItems: [
        {
          elementType: FormElementType.InputField,
          name: "ТаблицаПолеВвода",
          dataPath: "Таблица.ПолеВвода",
          editMode: "EnterOnInput",
        },
      ],
    },
    {
      elementType: "CheckBoxField",
      name: "ТаблицаПолеФлажка",
      title: { items: { ru: "Поле флажка" } },
      checkBoxType: "Auto",
      dataPath: "Таблица.ПолеФлажка",
      editMode: "EnterOnInput",
    },
    {
      elementType: "PictureField",
      name: "ТаблицаПолеКартинки",
      dataPath: "Таблица.ПолеКартинки",
      editMode: "EnterOnInput",
    },
    {
      elementType: "LabelField",
      name: "ТаблицаПолеНадписи",
      title: { items: { ru: "Поле надписи" } },
      dataPath: "Таблица.ПолеНадписи",
      editMode: "EnterOnInput",
    },
  ],
  choiceMode: true,
  commandBarLocation: "Top",
  commandSet: ["WriteAndClose", "Copy", "Delete"],
  contextMenu: {
    childItems: [],
    autofill: false,
  },
  currentRowUse: "Auto",
  dataPath: "Объект.ТабличнаяЧасть",
  defaultItem: true,
  displayImportance: "High",
  enabled: true,
  enableDrag: true,
  enableStartDrag: true,
  extendedTooltip: {
    title: {
      items: { ru: "Расширенная подсказка" },
      formatted: false,
    },
  },
  fileDragMode: "AsFile",
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  footer: true,
  footerHeight: 30,
  header: true,
  headerHeight: 30,
  height: 400,
  heightControlVariant: "Auto",
  heightInTableRows: 10,
  horizontalAlignInGroup: "Left",
  horizontalLines: true,
  horizontalScrollBar: "AutoUse",
  horizontalStretch: true,
  initialListView: "Auto",
  initialTreeView: "NoExpand",
  markIncomplete: true,
  maxHeight: 600,
  maxHeightInTableRows: 20,
  maxWidth: 800,
  multipleChoice: true,
  output: "Auto",
  readOnly: false,
  refreshRequest: "None",
  representation: "List",
  rowInputMode: "EndOfWindow",
  rowPictureDataPath: "Объект.Картинка",
  rowSelectionMode: "Row",
  rowsPicture: true,
  searchControl: {
    childItems: [],
    displayImportance: "High",
    enabled: true,
    horizontalAlignInGroup: "Left",
    title: {
      items: { ru: "Управление поиском" },
    },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "None",
    userVisible: {
      common: true,
      values: [{ name: "Администратор", value: true }],
    },
    verticalAlignInGroup: "Top",
    visible: true,
  },
  searchControlLocation: "Auto",
  searchOnInput: "Auto",
  searchStringLocation: "Auto",
  searchStringAddition: {
    displayImportance: "High",
    enabled: true,
    horizontalAlignInGroup: "Left",
    title: {
      items: { ru: "Отображение строки поиска" },
    },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "None",
    userVisible: {
      common: true,
      values: [{ name: "Администратор", value: true }],
    },
    verticalAlignInGroup: "Top",
    visible: true,
  },
  selectionMode: "SingleRow",
  shortcut: "Ctrl+T",
  skipOnInput: false,
  textColor: { type: "WebColor", value: "Black" },
  title: {
    items: { ru: "Таблица" },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleHeight: 25,
  titleLocation: "Left",
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка для таблицы" },
  },
  toolTipRepresentation: "Auto",
  useAlternationRowColor: true,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalLines: true,
  verticalScrollBar: "AutoUse",
  verticalStretch: true,
  viewStatusLocation: "Auto",
  viewStatusAddition: {
    displayImportance: "High",
    enabled: true,
    title: {
      items: { ru: "Отображение состояния просмотра" },
    },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "None",
  },
  visible: true,
  width: 600,
  events: {
    selection: "ПроцедураВыбора",
    valueChoice: "ПроцедураВыбораЗначения",
    dragStart: "ПроцедураНачалаПеретаскивания",
    choiceProcessing: "ПроцедураОбработкиВыбора",
    newWriteProcessing: "ПроцедураОбработкиЗаписиНового",
    refreshRequestProcessing: "ПроцедураОбработкиЗапросаОбновления",
    dragEnd: "ПроцедураОкончанияПеретаскивания",
    beforeAddRow: "ПроцедураПередНачаломДобавления",
    beforeRowChange: "ПроцедураПередНачаломИзменения",
    beforeEditEnd: "ПроцедураПередОкончаниемРедактирования",
    beforeExpand: "ПроцедураПередРазворачиванием",
    beforeCollapse: "ПроцедураПередСворачиванием",
    beforeDeleteRow: "ПроцедураПередУдалением",
    drag: "ПроцедураПеретаскивания",
    afterDeleteRow: "ПроцедураПослеУдаления",
    onActivateField: "ПроцедураПриАктивизацииПоля",
    onActivateRow: "ПроцедураПриАктивизацииСтроки",
    onActivateCell: "ПроцедураПриАктивизацииЯчейки",
    onChange: "ПроцедураПриИзменении",
    onStartEdit: "ПроцедураПриНачалеРедактирования",
    onEditEnd: "ПроцедураПриОкончанииРедактирования",
    onCurrentParentChange: "ПроцедураПриСменеТекущегоРодителя",
    dragCheck: "ПроцедураПроверкиПеретаскивания",
  },
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
  КартинкаСтрок: "Истина",
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

export const fullTableChildItems: ChildItemsPartialEnterprise = {
  ТаблицаПолеВвода: {
    ПутьКДанным: "Таблица.ПолеВвода",
    РежимВыбора: "Истина",
    РежимРедактирования: "ВходПриВводе",
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
    structure: `<...|>
<... | Кнопка 1 {КнопкаТаблицы}>
| Колонка таблицы 1 {Колонка1} | {Таблица1}`,
  },
]
