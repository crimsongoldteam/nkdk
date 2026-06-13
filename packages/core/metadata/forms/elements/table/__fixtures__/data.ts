import { FormElementTreeYAML } from "~/metadata/forms/commonObjects/childItems/types"
import { TableInputField } from "~/metadata/forms/elements/inputField/types"
import { Table, TableEnterprise, TablePartialYAML } from "~/metadata/forms/elements/table/types"
import { StructureResult } from "~/tests/types"
import { RequiredFieldsElement } from "~/tests/types"

export interface TableFixture {
  name: string
  table: Table
  tableYAML: TablePartialYAML
  xml: string
}

export interface TableFixtures {
  name: string
  table: Table
  structure: StructureResult
  structureExport?: StructureResult
}

export const sourceTable: Table = {
  itemType: "Table",
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
      group: "Vertical",
    },
    {
      itemType: "TableCheckBoxField",
      name: "ТаблицаПолеФлажка",
      title: { items: { ru: "Поле флажка" } },
    },
    {
      itemType: "TablePictureField",
      name: "ТаблицаПолеКартинки",
    },
    {
      itemType: "TableLabelField",
      name: "ТаблицаПолеНадписи",
      title: { items: { ru: "Поле надписи" } },
    },
  ],
}

export const fullTable = {
  itemType: "Table",
  name: "Таблица",
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
  childItems: [
    {
      dataPath: "Таблица.Ввод",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      itemType: "TableInputField",
      name: "ТаблицаВвод",
    },
    {
      dataPath: "Таблица.Надпись",
      editMode: "EnterOnInput",
      itemType: "TableLabelField",
      name: "ТаблицаНадпись",
    },
    {
      checkBoxType: "Auto",
      dataPath: "Таблица.Флажок",
      editMode: "EnterOnInput",
      itemType: "TableCheckBoxField",
      name: "ТаблицаФлажок123",
    },
    {
      dataPath: "Таблица.Картинка",
      editMode: "EnterOnInput",
      itemType: "TablePictureField",
      name: "ТаблицаКартинка",
    },
    {
      childItems: [],
      group: "Vertical",
      itemType: "ColumnGroup",
      name: "ТаблицаГруппаКолонок",
      title: { items: { ru: "Группа колонок" } },
      toolTip: { items: { ru: "Таблица группа колонок" } },
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
  userVisible: {
    common: true,
    values: [
      {
        name: "Role.Администратор",
        value: true,
      },
    ],
  },
  verticalAlignInGroup: "Center",
  verticalLines: false,
  verticalScrollBar: "UseAlways",
  verticalStretch: false,
  viewStatusRepresentation: {
    itemType: "SingleViewStatusAddition",
    title: {
      items: {
        ru: "Состояние просмотра",
      },
    },
  },
  viewStatusLocation: "Top",
  visible: false,
  width: 1,
} satisfies Omit<
  RequiredFieldsElement<Table>,
  | "allowGettingCurrentRowURL"
  | "allowRootChoice"
  | "autoRefresh"
  | "autoRefreshPeriod"
  | "autofill"
  | "choiceFoldersAndItems"
  | "enableStartDrag"
  | "period"
  | "restoreCurrentRow"
  | "rowFilter"
  | "settingsNamedItemDetailedRepresentation"
  | "showRoot"
  | "topLevelParent"
  | "updateOnDataChange"
  | "userSettingsGroup"
  | "viewMode"
>

const fullTreeBase = (({
  autoInsertNewRow: _autoInsertNewRow,
  contextMenu: _contextMenu,
  defaultItem: _defaultItem,
  enableDrag: _enableDrag,
  extendedTooltip: _extendedTooltip,
  searchControl: _searchControl,
  searchStringRepresentation: _searchStringRepresentation,
  viewStatusRepresentation: _viewStatusRepresentation,
  ...base
}) => base)(fullTable)

export const fullTree = {
  ...fullTreeBase,
  name: "Дерево",
  dataPath: "Дерево",
  title: { items: { ru: "Заголовок дерева" } },
  rowPictureDataPath: "Дерево.Картинка",
  childItems: [
    {
      dataPath: "Дерево.Ввод",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      itemType: "TableInputField",
      name: "ДеревоВвод",
    },
    {
      dataPath: "Дерево.Надпись",
      editMode: "EnterOnInput",
      itemType: "TableLabelField",
      name: "ДеревоНадпись",
    },
    {
      checkBoxType: "Auto",
      dataPath: "Дерево.Флажок",
      editMode: "EnterOnInput",
      itemType: "TableCheckBoxField",
      name: "ДеревоФлажок",
    },
    {
      dataPath: "Дерево.Картинка",
      editMode: "EnterOnInput",
      itemType: "TablePictureField",
      name: "ДеревоКартинка",
    },
  ],
} satisfies Table

export const fullTableYAML: TablePartialYAML = {
  АвтоВводНезаполненного: "Истина",
  АвтоВводНовойСтроки: "Истина",
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяВысотаВСтрокахТаблицы: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  АвтоОтметкаНезаполненного: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "ОченьВысокая",
  ВариантУправленияВысотой: "ПоСодержимому",
  ВертикальнаяПолосаПрокрутки: "ИспользоватьВсегда",
  ВертикальноеПоложениеВГруппе: "Центр",
  ВертикальныеЛинии: "Ложь",
  Видимость: "Ложь",
  Вывод: "Разрешить",
  Высота: 4,
  ВысотаВСтрокахТаблицы: 6,
  ВысотаЗаголовка: 10,
  ВысотаПодвала: 9,
  ВысотаШапки: 8,
  ГоризонтальнаяПолосаПрокрутки: "ИспользоватьВсегда",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальныеЛинии: "Ложь",
  Доступность: "Ложь",
  Заголовок: "Заголовок таблицы",
  ЗапросОбновления: "ПотянутьСверху",
  ИзменятьПорядокСтрок: "Ложь",
  ИзменятьСоставСтрок: "Ложь",
  ИспользованиеТекущейСтроки: "ОтображениеВыделенияИВыбор",
  КартинкаСтрок: "Печать",
  Команда: ["Add"],
  КоманднаяПанель: {
    Автозаполнение: "Ложь",
  },
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  МаксимальнаяВысота: 5,
  МаксимальнаяВысотаВСтрокахТаблицы: 7,
  МаксимальнаяШирина: 3,
  МножественныйВыбор: "Истина",
  НачальноеОтображениеДерева: "РаскрыватьВерхнийУровень",
  НачальноеОтображениеСписка: "Начало",
  Отображение: "Дерево",
  ОтображениеПодсказки: "Всплывающая",
  ОтображениеСостоянияПросмотра: {
    Заголовок: "Состояние просмотра",
  },
  ОтображениеСтрокиПоиска: {
    Заголовок: "Строка поиска",
  },
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
  Использование: {
    Роли: {
      "Role.Администратор": "Истина",
    },
  },
  РазрешитьПеретаскивание: "Истина",
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
  Шрифт: { Вид: "КрупныйШрифтТекста" },
  ШрифтЗаголовка: { Вид: "МелкийШрифтТекста" },
  Элементы: {
    ТаблицаВвод: {
      Вид: "ПолеВвода",
      ПутьКДанным: "Таблица.Ввод",
      РасширенноеРедактированиеМножественныхЗначений: "Истина",
      РежимРедактирования: "ВходПриВводе",
    },
    ТаблицаНадпись: {
      Вид: "ПолеНадписи",
      ПутьКДанным: "Таблица.Надпись",
      РежимРедактирования: "ВходПриВводе",
    },
    ТаблицаФлажок123: {
      Вид: "ПолеФлажок",
      ПутьКДанным: "Таблица.Флажок",
      РежимРедактирования: "ВходПриВводе",
    },
    ТаблицаКартинка: {
      Вид: "ПолеРисунка",
      ПутьКДанным: "Таблица.Картинка",
      РежимРедактирования: "ВходПриВводе",
    },
    ТаблицаГруппаКолонок: {
      Вид: "ГруппаКолонок",
      Заголовок: "Группа колонок",
      Подсказка: "Таблица группа колонок",
    },
  },
}

const fullTreeYAMLBase = (({
  АвтоВводНовойСтроки: _autoInsertNewRow,
  АктивизироватьПоУмолчанию: _defaultItem,
  КонтекстноеМеню: _contextMenu,
  ОтображениеСостоянияПросмотра: _viewStatusRepresentation,
  ОтображениеСтрокиПоиска: _searchStringRepresentation,
  РазрешитьПеретаскивание: _enableDrag,
  РасширеннаяПодсказка: _extendedTooltip,
  УправлениеПоиском: _searchControl,
  ...base
}) => base)(fullTableYAML)

export const fullTreeYAML: TablePartialYAML = {
  ...fullTreeYAMLBase,
  Заголовок: "Заголовок дерева",
  ПутьКДанным: "Дерево",
  ПутьКДаннымКартинкиСтроки: "Дерево.Картинка",
  Элементы: {
    ДеревоВвод: {
      Вид: "ПолеВвода",
      ПутьКДанным: "Дерево.Ввод",
      РасширенноеРедактированиеМножественныхЗначений: "Истина",
      РежимРедактирования: "ВходПриВводе",
    },
    ДеревоНадпись: {
      Вид: "ПолеНадписи",
      ПутьКДанным: "Дерево.Надпись",
      РежимРедактирования: "ВходПриВводе",
    },
    ДеревоФлажок: {
      Вид: "ПолеФлажок",
      ПутьКДанным: "Дерево.Флажок",
      РежимРедактирования: "ВходПриВводе",
    },
    ДеревоКартинка: {
      Вид: "ПолеРисунка",
      ПутьКДанным: "Дерево.Картинка",
      РежимРедактирования: "ВходПриВводе",
    },
  },
}

export const fullTableEnterprise = {
  ElementType: "FormTable",
  Name: "prefix_Таблица",
  AutoAddIncomplete: true,
  AutoInsertNewRow: true,
  AutoMarkIncomplete: true,
  AutoMaxHeight: false,
  AutoMaxHeightInTableRows: false,
  AutoMaxWidth: false,
  BackColor: { Type: "Color", Value: "WebColors.Red" },
  BehaviorOnHorizontalCompression: {
    Type: "SystemEnumeration",
    Value: "TableBehaviorOnHorizontalCompression.HideItemsByImportance",
  },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  ChangeRowOrder: false,
  ChangeRowSet: false,
  ChildItems: [
    {
      MultipleValuesExtendedEdit: true,
      DataPath: "prefix_Таблица.Ввод",
      EditMode: { Type: "SystemEnumeration", Value: "ColumnEditMode.EnterOnInput" },
      ElementType: "FormField",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.InputField" },
      Name: "prefix_ТаблицаВвод",
    },
    {
      DataPath: "prefix_Таблица.Надпись",
      EditMode: { Type: "SystemEnumeration", Value: "ColumnEditMode.EnterOnInput" },
      ElementType: "FormField",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.LabelField" },
      Name: "prefix_ТаблицаНадпись",
    },
    {
      CheckBoxType: { Type: "SystemEnumeration", Value: "CheckBoxType.Auto" },
      DataPath: "prefix_Таблица.Флажок",
      EditMode: { Type: "SystemEnumeration", Value: "ColumnEditMode.EnterOnInput" },
      ElementType: "FormField",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.CheckBoxField" },
      Name: "prefix_ТаблицаФлажок123",
    },
    {
      DataPath: "prefix_Таблица.Картинка",
      EditMode: { Type: "SystemEnumeration", Value: "ColumnEditMode.EnterOnInput" },
      ElementType: "FormField",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.PictureField" },
      Name: "prefix_ТаблицаКартинка",
    },
    {
      ElementType: "FormGroup",
      Name: "prefix_ТаблицаГруппаКолонок",
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.ColumnGroup" },
      ChildItems: [],
      Group: { Type: "SystemEnumeration", Value: "ColumnsGroup.Vertical" },
      Title: "Группа колонок",
      ToolTip: "Таблица группа колонок",
    },
  ],
  ChoiceMode: true,
  CommandBarLocation: {
    Type: "SystemEnumeration",
    Value: "FormItemCommandBarLabelLocation.Top",
  },
  CurrentRowUse: {
    Type: "SystemEnumeration",
    Value: "TableCurrentRowUse.SelectionPresentationAndChoice",
  },
  DataPath: "prefix_Таблица",
  DefaultItem: true,
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  Enabled: false,
  EnableDrag: true,
  FileDragMode: {
    Type: "SystemEnumeration",
    Value: "FileDragMode.AsFile",
  },
  Font: { Type: "Font", Value: "StyleFonts.LargeTextFont" },
  Footer: true,
  FooterHeight: 9,
  Header: false,
  HeaderHeight: 8,
  Height: 4,
  HeightControlVariant: {
    Type: "SystemEnumeration",
    Value: "TableHeightControlVariant.UseContentHeight",
  },
  HeightInTableRows: 6,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalLines: false,
  HorizontalScrollBar: {
    Type: "SystemEnumeration",
    Value: "ScrollBarUse.UseAlways",
  },
  HorizontalStretch: false,
  InitialListView: {
    Type: "SystemEnumeration",
    Value: "InitialListView.Beginning",
  },
  InitialTreeView: {
    Type: "SystemEnumeration",
    Value: "InitialTreeView.ExpandTopLevel",
  },
  MaxHeight: 5,
  MaxHeightInTableRows: 7,
  MaxWidth: 3,
  MultipleChoice: true,
  OnMainServerUnavalableBehavior: {
    Type: "SystemEnumeration",
    Value: "OnMainServerUnavalableBehavior.DontChangeBehavior",
  },
  Output: { Type: "SystemEnumeration", Value: "UseOutput.Enable" },
  ReadOnly: true,
  RefreshRequest: {
    Type: "SystemEnumeration",
    Value: "RefreshRequestMethod.PullFromTop",
  },
  Representation: {
    Type: "SystemEnumeration",
    Value: "TableRepresentation.Tree",
  },
  RowInputMode: {
    Type: "SystemEnumeration",
    Value: "TableRowInputMode.AfterCurrentRow",
  },
  RowPictureDataPath: "prefix_Таблица.Картинка1",
  RowSelectionMode: {
    Type: "SystemEnumeration",
    Value: "TableRowSelectionMode.Row",
  },
  SearchControlLocation: {
    Type: "SystemEnumeration",
    Value: "SearchControlLocation.CommandBar",
  },
  SearchOnInput: {
    Type: "SystemEnumeration",
    Value: "SearchInTableOnInput.Use",
  },
  SearchStringLocation: {
    Type: "SystemEnumeration",
    Value: "SearchStringLocation.Top",
  },
  SelectionMode: {
    Type: "SystemEnumeration",
    Value: "TableSelectionMode.SingleRow",
  },
  SkipOnInput: false,
  TextColor: { Type: "Color", Value: "WebColors.Blue" },
  Title: "Заголовок таблицы",
  TitleFont: { Type: "Font", Value: "StyleFonts.SmallTextFont" },
  TitleHeight: 10,
  TitleLocation: {
    Type: "SystemEnumeration",
    Value: "FormItemTitleLocation.Top",
  },
  TitleTextColor: { Type: "Color", Value: "WebColors.Yellow" },
  ToolTip: "Текст подсказки",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.Balloon",
  },
  UseAlternationRowColor: true,
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Center",
  },
  VerticalLines: false,
  VerticalScrollBar: {
    Type: "SystemEnumeration",
    Value: "ScrollBarUse.UseAlways",
  },
  VerticalStretch: false,
  ViewStatusLocation: {
    Type: "SystemEnumeration",
    Value: "ViewStatusLocation.Top",
  },
  Visible: false,
  Width: 1,
  RowsPicture: { Type: "Picture", Value: "PictureLib.Print" },
} satisfies Omit<
  Required<TableEnterprise>,
  | "AllowGettingCurrentRowURL"
  | "AllowRootChoice"
  | "AutoRefresh"
  | "AutoRefreshPeriod"
  | "Autofill"
  | "ChoiceFoldersAndItems"
  | "EnableStartDrag"
  | "Period"
  | "RestoreCurrentRow"
  | "RowFilter"
  | "SettingsNamedItemDetailedRepresentation"
  | "ShowRoot"
  | "TopLevelParent"
  | "UpdateOnDataChange"
  | "UserSettingsGroup"
  | "ViewMode"
>

export const fullTableChildItems = {
  ТаблицаГруппа1: {
    Вид: "ГруппаКолонок",
    Элементы: {
      ТаблицаПолеВвода: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Таблица.Ввод",
        РежимРедактирования: "ВходПриВводе",
      },
    },
  },
  ТаблицаПолеФлажка: {
    Вид: "ПолеФлажок",
    РежимРедактирования: "ВходПриВводе",
  },
  ТаблицаПолеКартинки: {
    Вид: "ПолеРисунка",
    ПутьКДанным: "Таблица.Картинка",
    РежимРедактирования: "ВходПриВводе",
  },
  ТаблицаПолеНадписи: {
    Вид: "ПолеНадписи",
    РежимРедактирования: "ВходПриВводе",
  },
} as FormElementTreeYAML

export const minimalTable: Table = {
  itemType: "Table",
  name: "Таблица",
  childItems: [],
}

export const minimalTableYAML: TablePartialYAML = {}

export const oneColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      itemType: "TableInputField",
    } as TableInputField,
  ],
}

export const twoColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      dataPath: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      itemType: "TableInputField",
    } as TableInputField,
    {
      name: "Колонка2",
      dataPath: "Колонка2",
      title: { items: { ru: "Колонка 2" } },
      itemType: "TableInputField",
    } as TableInputField,
  ],
}

export const tableWithAutoCommandBar: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [
      {
        name: "КнопкаТаблицы",
        itemType: "CommandBarButton",
        title: { items: { ru: "Кнопка 1" } },
      },
    ],
  },
  childItems: [
    {
      name: "Колонка1",
      dataPath: "Колонка1",
      itemType: "TableInputField",
      title: { items: { ru: "Колонка таблицы 1" } },
    },
  ],
}

export const inputColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Колонка 1" } },
      dataPath: "Колонка1",
      itemType: "TableInputField",
    } as TableInputField,
  ],
}

export const checkboxColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      title: { items: { ru: "Флажок" } },
      dataPath: "Колонка1",
      itemType: "TableCheckBoxField",
    },
  ],
}

export const labelColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      dataPath: "Колонка1",
      itemType: "TableLabelField",
    },
  ],
}

export const pictureColumnTable: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      dataPath: "Колонка1",
      itemType: "TablePictureField",
    },
  ],
}

export const tableWithHorizontalColumnGroup: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      itemType: "ColumnGroup",
      childItems: [],
      group: "Horizontal",
    },
  ],
}

export const tableWithVerticalColumnGroup: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      itemType: "ColumnGroup",
      childItems: [],
      group: "Vertical",
    },
  ],
}

export const tableWithInCellColumnGroup: Table = {
  name: "Таблица1",
  dataPath: "Таблица1",
  itemType: "Table",
  childItems: [
    {
      name: "Колонка1",
      itemType: "ColumnGroup",
      childItems: [],
      group: "InCell",
    },
  ],
}

export const tableStructureFixtures: TableFixtures[] = [
  {
    name: "table with input field",
    table: inputColumnTable,
    structure: {
      strings: ['| "Колонка 1" Колонка1 | Таблица1'],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with checkbox field",
    table: checkboxColumnTable,
    structure: {
      strings: ['| [ ] "Флажок" Колонка1 | Таблица1'],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with label field",
    table: labelColumnTable,
    structure: {
      strings: ["| ~Колонка1 | Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with picture field",
    table: pictureColumnTable,
    structure: {
      strings: ["| !Колонка1 | Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with horizontal group",
    table: tableWithHorizontalColumnGroup,
    structure: {
      strings: ["| -Колонка1 | Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with vertical group",
    table: tableWithVerticalColumnGroup,
    structure: {
      strings: ["| +Колонка1 | Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with in cell group",
    table: tableWithInCellColumnGroup,
    structure: {
      strings: ["| =Колонка1 | Таблица1"],
      toOneLineGroup: false,
    },
  },
  {
    name: "two-column table",
    table: twoColumnTable,
    structure: {
      strings: ['| "Колонка 1" Колонка1 | "Колонка 2" Колонка2 | Таблица1'],
      toOneLineGroup: false,
    },
  },
  {
    name: "table with auto command bar",
    table: tableWithAutoCommandBar,
    structure: {
      strings: ["<<...>>", '<<... | "Кнопка 1" КнопкаТаблицы>>', '| "Колонка таблицы 1" Колонка1 | Таблица1'],
      toOneLineGroup: false,
    },
    // Добавлена командная панель формы, которая не будет экспортироваться
    structureExport: {
      strings: ['<<... | "Кнопка 1" КнопкаТаблицы>>', '| "Колонка таблицы 1" Колонка1 | Таблица1'],
      toOneLineGroup: false,
    },
  },
]
