import { IFormatElementResult } from "~/format/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/metadata/forms/elements/checkBoxField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullCheckBoxField: CheckBoxField = {
  elementType: FormElementType.CheckBoxField,
  name: "Флажок",
  autoCellHeight: true,
  cellHyperlink: true,
  contextMenu: undefined,
  dataPath: "Объект.Реквизит",
  defaultItem: true,
  displayImportance: "High",
  editMode: "EnterOnInput",
  enabled: true,
  extendedTooltip: undefined,
  fixingInTable: "None",
  footerBackColor: { type: "WebColor", value: "White" },
  footerDataPath: "Объект.РеквизитПодвала",
  footerFont: { kind: "StyleItem", ref: "NormalTextFont" },
  footerHorizontalAlign: "Left",
  footerPicture: undefined,
  footerText: {
    items: { ru: "Текст подвала" },
  },
  footerTextColor: { type: "WebColor", value: "Black" },
  headerHorizontalAlign: "Left",
  headerPicture: undefined,
  horizontalAlign: "Left",
  horizontalAlignInGroup: "Left",
  readOnly: false,
  shortcut: "Ctrl+S",
  showInFooter: true,
  showInHeader: true,
  skipOnInput: false,
  table: undefined,
  title: {
    items: { ru: "Флажок формы" },
  },
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
  typeRestriction: undefined,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlign: "Top",
  verticalAlignInGroup: "Top",
  visible: true,
  warningOnEdit: undefined,
  warningOnEditRepresentation: undefined,
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
  events: {
    onChange: "ПроцедураПриИзменении",
  },
}

export const fullCheckBoxFieldEnterprise: CheckBoxFieldEnterprise = {
  Заголовок: "Флажок формы",
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
  ОтображатьВПодвале: "Истина",
  ОтображатьВШапке: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  ПоложениеЗаголовка: "Лево",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Ложь",
  ПутьКДанным: "Объект.Реквизит",
  ПутьКДаннымПодвала: "Объект.РеквизитПодвала",
  РежимРедактирования: "Непосредственно",
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
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
}

export const minimalCheckBoxField: CheckBoxField = {
  elementType: FormElementType.CheckBoxField,
  name: "Флажок",
}

export const minimalCheckBoxFieldEnterprise: CheckBoxFieldEnterprise = {}

export interface CheckBoxFieldStructureFixture {
  name: string
  element: CheckBoxField
  structured: IFormatElementResult
}

export const checkBoxFieldStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  {
    name: "left titled",
    element: {
      name: "Заголовок",
      elementType: FormElementType.CheckBoxField,
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["Заголовок[]"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled",
    element: {
      name: "Заголовок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["[]Заголовок"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "left titled switch",
    element: {
      name: "Заголовок",
      elementType: FormElementType.CheckBoxField,
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["Заголовок[|1]"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "right titled switch",
    element: {
      name: "Заголовок",
      elementType: FormElementType.CheckBoxField,
      headerHorizontalAlign: "Right",
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["[|1]Заголовок"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
