import { TableChildItemsPartialYAML } from "~/metadata/forms/commonObjects/childItems/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { Table, TablePartialYAML } from "~/metadata/forms/elements/table/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { RequiredFieldsElement } from "~/tests/types"

export interface TableFixture {
  name: string
  table: Table
  tableYAML: TablePartialYAML
  xml: string
}

export interface TableExportToStructureFixture {
  name: string
  table: Table
  structure: ToNKDKResult
}

export const sourceTable: Table = {
  itemType: CollectionFormElementType.Table,
  name: "Таблица",
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: false,
    childItems: [],
  },
  childItems: [
    {
      itemType: "ColumnGroup",
      name: "ТаблицаГруппа1",
      title: { items: { ru: "Группа 1" } },
      childItems: [],
    },
    {
      itemType: "CheckBoxField",
      name: "ТаблицаПолеФлажка",
      title: { items: { ru: "Поле флажка" } },
    },
    {
      itemType: "PictureField",
      name: "ТаблицаПолеКартинки",
    },
    {
      itemType: "LabelField",
      name: "ТаблицаПолеНадписи",
      title: { items: { ru: "Поле надписи" } },
    },
  ],
}

export const fullTable: RequiredFieldsElement<Table> = {
  itemType: CollectionFormElementType.Table,
  name: "Таблица",
  allowGettingCurrentRowURL: true,
  allowRootChoice: true,
  autoRefresh: true,
  autoRefreshPeriod: 30,
  autoAddIncomplete: true,
  autoCommandBar: {
    itemType: "AutoCommandBar",
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
      dataPath: "Таблица.Ввод",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      itemType: "InputField",
      name: "ТаблицаВвод",
    },
    {
      dataPath: "Таблица.Надпись",
      editMode: "EnterOnInput",
      itemType: "LabelField",
      name: "ТаблицаНадпись",
    },
    {
      checkBoxType: "Auto",
      dataPath: "Таблица.Флажок",
      editMode: "EnterOnInput",
      itemType: "CheckBoxField",
      name: "ТаблицаФлажок",
      title: { items: { ru: "Поле флажка" } },
    },
    {
      dataPath: "Таблица.Картинка",
      editMode: "EnterOnInput",
      itemType: "PictureField",
      name: "ТаблицаКартинка",
    },
  ],
  choiceMode: true,
  commandBarLocation: "Top",
  commandSet: ["Add"],
  contextMenu: {
    itemType: "ContextMenu",
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
    beforeLoadUserSettingsAtServer: "ТаблицаПередЗагрузкойПользовательскихНастроекНаСервере",
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
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
    itemType: "SingleSearchControlAddition",
    title: {
      items: {
        ru: "Управление поиском",
      },
    },
  },
  searchControlLocation: "CommandBar",
  searchOnInput: "Use",
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
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
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
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

export const fullTableYAML: TablePartialYAML = {
  АвтоВводНезаполненного: "Истина",
  АвтоВводНовойСтроки: "Истина",
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяВысотаВСтрокахТаблицы: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  АвтоОбновление: "Истина",
  АвтоОтметкаНезаполненного: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "ОченьВысокая",
  ВариантУправленияВысотой: "ПоСодержимому",
  ВертикальнаяПолосаПрокрутки: "ИспользоватьВсегда",
  ВертикальноеПоложениеВГруппе: "Центр",
  ВертикальныеЛинии: "Ложь",
  Видимость: "Ложь",
  ВосстанавливатьТекущуюСтроку: "Истина",
  ВыборГруппИЭлементов: "ГруппыИЭлементы",
  Вывод: "Разрешить",
  Высота: 4,
  ВысотаВСтрокахТаблицы: 6,
  ВысотаЗаголовка: 10,
  ВысотаПодвала: 9,
  ВысотаШапки: 8,
  ГоризонтальнаяПолосаПрокрутки: "ИспользоватьВсегда",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальныеЛинии: "Ложь",
  ГруппаПользовательскихНастроек: "ГруппаПользовательскихНастроек",
  Доступность: "Ложь",
  ЗапросОбновления: "ПотянутьСверху",
  ИзменятьПорядокСтрок: "Ложь",
  ИзменятьСоставСтрок: "Ложь",
  ИспользованиеТекущейСтроки: "ОтображениеВыделенияИВыбор",
  КартинкаСтрок: "Печать",
  Команда: ["Add"],
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  МаксимальнаяВысота: 5,
  МаксимальнаяВысотаВСтрокахТаблицы: 7,
  МаксимальнаяШирина: 3,
  МножественныйВыбор: "Истина",
  НачальноеОтображениеДерева: "РаскрыватьВерхнийУровень",
  НачальноеОтображениеСписка: "Начало",
  ОбновлениеПриИзмененииДанных: "НеОбновлять",
  ОтображатьКорень: "Истина",
  Отображение: "Дерево",
  ОтображениеПодсказки: "Всплывающая",
  ОтображениеСостоянияПросмотра: {
    Заголовок: "Состояние просмотра",
  },
  ОтображениеСтрокиПоиска: {
    Заголовок: "Строка поиска",
  },
  ПериодАвтоОбновления: 30,
  ПоведениеПриНедоступностиОсновногоСервера: "НеИзменятьПоведение",
  ПоведениеПриСжатииПоГоризонтали: "СкрыватьЭлементыПоВажности",
  Подвал: "Истина",
  Подсказка: "Текст подсказки",
  ПоискПриВводе: "Использовать",
  ПоложениеЗаголовка: "Верх",
  ПоложениеКоманднойПанели: "Верх",
  ПоложениеСостоянияПросмотра: "Верх",
  ПоложениеСтрокиПоиска: "Верх",
  ПоложениеУправленияПоиском: "КоманднаяПанель",
  ПропускатьПриВводе: "Ложь",
  ПутьКДанным: "Таблица",
  ПутьКДаннымКартинкиСтроки: "Таблица.Картинка",
  РазрешитьВыборКорня: "Истина",
  РазрешитьИспользование: {
    Администратор: "Истина",
  },
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: "Истина",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка таблицы",
  },
  РежимВводаСтрок: "ПослеТекущейСтроки",
  РежимВыбора: "Истина",
  РежимВыделения: "Одиночный",
  РежимВыделенияСтроки: "Строка",
  События: {
    Выбор: "ТаблицаВыбор",
    ВыборЗначения: "ТаблицаВыборЗначения",
    НачалоПеретаскивания: "ТаблицаНачалоПеретаскивания",
    ОбработкаВыбора: "ТаблицаОбработкаВыбора",
    ОбработкаЗаписиНового: "ТаблицаОбработкаЗаписиНового",
    ОбработкаЗапросаОбновления: "ТаблицаОбработкаЗапросаОбновления",
    ОкончаниеПеретаскивания: "ТаблицаОкончаниеПеретаскивания",
    ПередЗагрузкойПользовательскихНастроекНаСервере: "ТаблицаПередЗагрузкойПользовательскихНастроекНаСервере",
    ПередНачаломДобавления: "ТаблицаПередНачаломДобавления",
    ПередНачаломИзменения: "ТаблицаПередНачаломИзменения",
    ПередОкончаниемРедактирования: "ТаблицаПередОкончаниемРедактирования",
    ПередРазворачиванием: "ТаблицаПередРазворачиванием",
    ПередСворачиванием: "ТаблицаПередСворачиванием",
    ПередУдалением: "ТаблицаПередУдалением",
    Перетаскивание: "ТаблицаПеретаскивание",
    ПослеУдаления: "ТаблицаПослеУдаления",
    ПриАктивизацииПоля: "ТаблицаПриАктивизацииПоля",
    ПриАктивизацииСтроки: "ТаблицаПриАктивизацииСтроки",
    ПриАктивизацииЯчейки: "ТаблицаПриАктивизацииЯчейки",
    ПриИзменении: "ТаблицаПриИзменении",
    ПриНачалеРедактирования: "ТаблицаПриНачалеРедактирования",
    ПриОкончанииРедактирования: "ТаблицаПриОкончанииРедактирования",
    ПриСменеТекущегоРодителя: "ТаблицаПриСменеТекущегоРодителя",
    ПроверкаПеретаскивания: "ТаблицаПроверкаПеретаскивания",
  },
  СочетаниеКлавиш: "Cmd+F",
  СпособПеретаскиванияФайлов: "КакФайл",
  ТолькоПросмотр: "Истина",
  УправлениеПоиском: {
    Заголовок: "Управление поиском",
  },
  ЦветРамки: "Зеленый",
  ЦветТекста: "Синий",
  ЦветТекстаЗаголовка: "Желтый",
  ЦветФона: "Красный",
  ЧередованиеЦветовСтрок: "Истина",
  Шапка: "Ложь",
  Ширина: 1,
  Шрифт: "КрупныйШрифтТекста",
  ШрифтЗаголовка: "МелкийШрифтТекста",
}

export const fullTableChildItems: TableChildItemsPartialYAML = {
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
  itemType: CollectionFormElementType.Table,
  name: "Таблица",
  childItems: [],
}

export const minimalTableYAML: TablePartialYAML = {}

export const oneColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      itemType: CollectionFormElementType.InputField,
    } as InputField,
  ],
}

export const twoColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      itemType: CollectionFormElementType.InputField,
    } as InputField,
    {
      name: "Колонка2",
      title: { items: { ru: "Колонка 2" } },
      itemType: CollectionFormElementType.InputField,
    } as InputField,
  ],
}

export const tableWithAutoCommandBar: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [
      {
        name: "КнопкаТаблицы",
        itemType: "Button",
        title: { items: { ru: "Кнопка 1" } },
      },
    ],
  },
  childItems: [
    {
      name: "Колонка1",
      itemType: "InputField",
      title: { items: { ru: "Колонка таблицы 1" } },
    },
  ],
}

export const inputColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      itemType: CollectionFormElementType.InputField,
    } as InputField,
  ],
}

export const checkboxColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Флажок" } },
      itemType: "CheckBoxField",
    },
  ],
}

export const labelColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      itemType: "LabelField",
    },
  ],
}

export const pictureColumnTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      itemType: "PictureField",
    },
  ],
}

export const columnGroupTable: Table = {
  name: "Таблица1",
  itemType: CollectionFormElementType.Table,
  childItems: [
    {
      name: "Колонка1",
      itemType: "ColumnGroup",
      childItems: [],
    },
  ],
}

export const tableStructureFixtures: TableExportToStructureFixture[] = [
  {
    name: "table with input field",
    table: inputColumnTable,
    structure: {
      strings: ["| Колонка 1 %Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with checkbox field",
    table: checkboxColumnTable,
    structure: {
      strings: ["| [ ] Флажок %Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with label field",
    table: labelColumnTable,
    structure: {
      strings: ["| ~%Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with picture field",
    table: pictureColumnTable,
    structure: {
      strings: ["| !%Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with horizontal group",
    table: columnGroupTable,
    structure: {
      strings: ["| -%Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with vertical group",
    table: columnGroupTable,
    structure: {
      strings: ["| +%Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with in cell group",
    table: columnGroupTable,
    structure: {
      strings: ["| =%Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "two-column table",
    table: twoColumnTable,
    structure: {
      strings: ["| Колонка 1 %Колонка1 | Колонка 2 %Колонка2 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with auto command bar",
    table: tableWithAutoCommandBar,
    structure: {
      strings: ["<<... | Кнопка 1 %КнопкаТаблицы>>", "| Колонка таблицы 1 %Колонка1 | %Таблица1"],
      toOneLineGroup: false,
    },
  },
]
