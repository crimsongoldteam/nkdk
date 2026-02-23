import {
  CheckBoxField,
  CheckBoxFieldPartialYAML,
  CheckBoxFieldTypedYAML,
} from "~/metadata/forms/elements/checkBoxField/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullCheckBoxField: RequiredFieldsElement<CheckBoxField> = {
  itemType: CollectionFormElementType.CheckBoxField,
  name: "Флажок",
  autoCellHeight: true,
  cellHyperlink: true,
  dataPath: "Объект.Реквизит",
  defaultItem: true,
  displayImportance: "High",
  editMode: "EnterOnInput",
  enabled: true,
  fixingInTable: "None",
  footerBackColor: { type: "WebColor", value: "White" },
  footerDataPath: "Объект.РеквизитПодвала",
  footerFont: { kind: "StyleItem", ref: "NormalTextFont" },
  footerHorizontalAlign: "Left",
  footerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  footerText: {
    items: { ru: "Текст подвала" },
  },
  footerTextColor: { type: "WebColor", value: "Black" },
  headerHorizontalAlign: "Left",
  headerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  horizontalAlign: "Left",
  horizontalAlignInGroup: "Left",
  readOnly: false,
  shortcut: "Ctrl+S",
  showInFooter: true,
  showInHeader: true,
  skipOnInput: false,
  titleBackColor: { type: "WebColor", value: "Blue" },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleHeight: 20,
  titleLocation: "Left",
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "InputField",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlign: "Top",
  verticalAlignInGroup: "Top",
  visible: true,
  warningOnEdit: {
    items: { ru: "Предупреждение" },
  },
  warningOnEditRepresentation: "DontShow",
  contextMenu: {
    itemType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  table: "Таблица",
  typeRestriction: { type: ["string"] },
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  title: {
    items: { ru: "Флажок формы" },
  },
  backColor: { type: "WebColor", value: "Blue" },
  borderColor: { type: "WebColor", value: "Green" },
  checkBoxType: "Switch",
  editFormat: { items: { ru: "Формат редактирования" } },
  equalItemsWidth: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  itemHeight: 20,
  itemTitleHeight: 15,
  itemWidth: 100,
  textColor: { type: "WebColor", value: "Yellow" },
  threeState: true,
}

export const fullCheckBoxFieldPartialYAML: CheckBoxFieldPartialYAML = {
  АвтоВысотаЯчейки: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ПолеВвода",
  Видимость: "Истина",
  ВысотаЗаголовка: 20,
  ГиперссылкаЯчейки: "Истина",
  ГоризонтальноеПоложение: "Лево",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальноеПоложениеВПодвале: "Лево",
  ГоризонтальноеПоложениеВШапке: "Лево",
  Доступность: "Истина",
  КартинкаПодвала: "Печать",
  КартинкаШапки: "Печать",
  ОтображатьВПодвале: "Истина",
  ОтображатьВШапке: "Истина",
  ОтображениеПодсказки: "Нет",
  ОтображениеПредупрежденияПриРедактировании: "НеОтображать",
  Подсказка: "Подсказка",
  ПоложениеЗаголовка: "Лево",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПредупреждениеПриРедактировании: "Предупреждение",
  ПропускатьПриВводе: "Ложь",
  ПутьКДанным: "Объект.Реквизит",
  ПутьКДаннымПодвала: "Объект.РеквизитПодвала",
  РежимРедактирования: "ВходПриВводе",
  СочетаниеКлавиш: "Ctrl+S",
  ТекстПодвала: "Текст подвала",
  ТолькоПросмотр: "Ложь",
  ФиксацияВТаблице: "Нет",
  ЦветТекстаЗаголовка: "Черный",
  ЦветТекстаПодвала: "Черный",
  ЦветФонаЗаголовка: "Синий",
  ЦветФонаПодвала: "Белый",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ШрифтПодвала: "ОбычныйШрифтТекста",
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  Таблица: "Таблица",
  ОграничениеТипа: "Строка",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
  ВидФлажка: "Выключатель",
  ВысотаЗаголовкаЭлемента: 15,
  ВысотаЭлемента: 20,
  ОдинаковаяШиринаЭлементов: "Истина",
  ТриСостояния: "Истина",
  ФорматРедактирования: "Формат редактирования",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  ШиринаЭлемента: 100,
  Шрифт: "ОбычныйШрифтТекста",
}

export const fullCheckBoxFieldTypedYAML: CheckBoxFieldTypedYAML = {
  ...fullCheckBoxFieldPartialYAML,
  Тип: "ПолеФлажок",
  Заголовок: "Флажок формы",
}

export const minimalCheckBoxField: CheckBoxField = {
  itemType: CollectionFormElementType.CheckBoxField,
  name: "Флажок",
}

export const minimalCheckBoxFieldPartialYAML: CheckBoxFieldPartialYAML = {}

export const minimalCheckBoxFieldTypedYAML: CheckBoxFieldTypedYAML = {
  Тип: "ПолеФлажок",
}

export interface CheckBoxFieldStructureFixture {
  description: string
  element: CheckBoxField
  nkdk: ToNKDKResult
  xml?: string
}

// НЕДЕЙСТВИТЕЛЬНО
// Если заголовок (pascalCase) равен имени, title = undefined, не выводится в NKDK
// Если заголовок не равен имени, заголовок на основном языке выводится в NKDK, на остальных в YAML
// Если заголовок пустой, на форму выводится ''
// Если ПоложениеЗаголовка = Нет, пока непонятно

// ДЕЙСТВИТЕЛЬНО
// Если заголовок, есть заголовок выводим его
// Если заголовок пустой, title = undefined, не выводится в NKDK
export const checkBoxFieldStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  // #region checkbox
  {
    description: "left titled",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: { strings: ["Заголовок флажка [ ] %Флажок"], toOneLineGroup: true },
  },
  {
    description: "left titled without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
    },
    nkdk: { strings: ["%Флажок [ ]"], toOneLineGroup: true },
  },
  // {
  //   description: "left titled with empty title",
  //   element: {
  //     name: "Флажок",
  //     itemType: CollectionFormElementType.CheckBoxField,
  //     title: { items: { ru: "" } },
  //   },
  //   nkdk: { strings: ["'' [ ] %Флажок"], toOneLineGroup: true },
  // },
  {
    description: "right titled",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: { strings: ["[ ] Заголовок флажка %Флажок"], toOneLineGroup: true },
  },
  {
    description: "right titled without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
    },
    nkdk: { strings: ["[ ] %Флажок"], toOneLineGroup: true },
  },
  // {
  //   description: "right titled with empty title",
  //   element: {
  //     name: "Флажок",
  //     itemType: CollectionFormElementType.CheckBoxField,
  //     titleLocation: "Right",
  //     title: { items: { ru: "" } },
  //   },
  //   nkdk: { strings: ["[ ] '' %Флажок"], toOneLineGroup: true },
  // },

  // #endregion

  // #region switch
  {
    description: "left titled switch",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: { strings: ["Заголовок флажка [ | ] %Флажок"], toOneLineGroup: true },
  },
  {
    description: "left titled switch without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      checkBoxType: "Switch",
    },
    nkdk: { strings: ["%Флажок [ | ]"], toOneLineGroup: true },
  },
  {
    description: "right titled switch",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: { strings: ["[ | ] Заголовок флажка %Флажок"], toOneLineGroup: true },
  },
  {
    description: "right titled switch without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
      checkBoxType: "Switch",
    },
    nkdk: { strings: ["[ | ] %Флажок"], toOneLineGroup: true },
  },
  // #endregion
  // #region tumbler
  {
    description: "left titled tumbler",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      checkBoxType: "Tumbler",
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: {
      strings: ["Заголовок флажка < | > %Флажок"],
      toOneLineGroup: true,
    },
  },
  {
    description: "left titled tumbler without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      checkBoxType: "Tumbler",
    },
    nkdk: {
      strings: ["%Флажок < | >"],
      toOneLineGroup: true,
    },
  },
  {
    description: "right titled tumbler",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
      checkBoxType: "Tumbler",
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: {
      strings: ["< | > Заголовок флажка %Флажок"],
      toOneLineGroup: true,
    },
  },
  {
    description: "right titled tumbler without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      titleLocation: "Right",
      checkBoxType: "Tumbler",
    },
    nkdk: { strings: ["< | > %Флажок"], toOneLineGroup: true },
  },
  // #endregion
]

export const checkBoxFieldContentStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  {
    description: "left titled",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
      title: { items: { ru: "Заголовок флажка" } },
    },
    nkdk: { strings: ["[ ] Заголовок флажка %Флажок"], toOneLineGroup: true },
  },
  {
    description: "left titled without title",
    element: {
      name: "Флажок",
      itemType: CollectionFormElementType.CheckBoxField,
    },
    nkdk: { strings: ["[ ] %Флажок"], toOneLineGroup: true },
  },
]
