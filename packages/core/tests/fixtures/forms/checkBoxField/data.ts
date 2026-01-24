import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "~/metadata/forms/elements/checkBoxField/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullCheckBoxField: RequiredFieldsElement<CheckBoxField> = {
  elementType: FormElementType.CheckBoxField,
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
  contextMenu: { autofill: false, childItems: [] },
  extendedTooltip: { title: { items: { ru: "Расширенная подсказка" }, formatted: false } },
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

export const fullCheckBoxFieldPartialEnterprise: CheckBoxFieldPartialEnterprise = {
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
  Заголовок: "Флажок формы",
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

export const fullCheckBoxFieldTypedEnterprise: CheckBoxFieldTypedEnterprise = {
  ...fullCheckBoxFieldPartialEnterprise,
  Тип: "ПолеФлажок",
}

export const minimalCheckBoxField: CheckBoxField = {
  elementType: FormElementType.CheckBoxField,
  name: "Флажок",
}

export const minimalCheckBoxFieldPartialEnterprise: CheckBoxFieldPartialEnterprise = {}

export const minimalCheckBoxFieldTypedEnterprise: CheckBoxFieldTypedEnterprise = {
  Тип: "ПолеФлажок",
}

export interface CheckBoxFieldStructureFixture {
  name: string
  element: CheckBoxField
  structured: IFormatElementResult
}

export const checkBoxFieldStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  {
    name: "left titled",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      title: { items: { ru: "Заголовок флажка" } },
    },
    structured: {
      strings: ["Заголовок флажка [ ] {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "left titled without title",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
    },
    structured: {
      strings: ["{Флажок} [ ]"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      title: { items: { ru: "Заголовок флажка" } },
    },
    structured: {
      strings: ["[ ] Заголовок флажка {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled without title",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
    },
    structured: {
      strings: ["{Флажок} [ ]"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "left titled switch",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
    },
    structured: {
      strings: ["Заголовок флажка [ |1] {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "left titled switch without title",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      checkBoxType: "Switch",
    },
    structured: {
      strings: ["[ |1] {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled switch",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
    },
    structured: {
      strings: ["[ |1] Заголовок флажка {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled switch without title",
    element: {
      name: "Флажок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      checkBoxType: "Switch",
    },
    structured: {
      strings: ["[ |1] {Флажок}"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
