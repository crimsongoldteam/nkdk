import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "~/metadata/forms/elements/labelDecoration/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullLabelDecoration: RequiredFieldsElement<LabelDecoration> = {
  elementType: FormElementType.LabelDecoration,
  name: "Заголовок",
  title: {
    items: { ru: "Заголовок формы" },
    formatted: false,
  },
  backColor: { type: "WebColor", value: "Blue" },
  border: {
    ref: "style:ControlBorder",
    width: 1,
    controlBorderType: "Indented",
  },
  borderColor: { type: "WebColor", value: "Green" },
  groupVerticalAlign: "Top",
  horizontalAlign: "Left",
  hyperlink: true,
  titleHeight: 20,
  verticalAlign: "Top",
  autoMaxHeight: true,
  autoMaxWidth: true,
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  shortcut: "Ctrl+S",
  skipOnInput: false,
  textColor: { type: "WebColor", value: "Blue" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "Label",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
  contextMenu: { autofill: false, childItems: [] },
  extendedTooltip: { title: { items: { ru: "Расширенная подсказка" }, formatted: false } },
  events: {
    click: "ПроцедураНажатия",
    uRLProcessing: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const fullLabelDecorationPartialEnterprise: LabelDecorationPartialEnterprise = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "Надпись",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Ложь",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ЦветТекста: "Синий",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  ВертикальноеВыравниваниеГруппы: "Верх",
  ВертикальноеПоложение: "Верх",
  ВысотаЗаголовка: 20,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложение: "Лево",
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  Рамка: {
    Имя: "style:ControlBorder",
    Ширина: 1,
    ТипРамки: "Вдавленная",
  },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  ЦветРамки: "Зеленый",
  ЦветФона: "Синий",
  События: {
    Нажатие: "ПроцедураНажатия",
    ОбработкаНавигационнойСсылки: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const fullLabelDecorationTypedEnterprise: LabelDecorationTypedEnterprise = {
  ...fullLabelDecorationPartialEnterprise,
  Тип: "Надпись",
  Заголовок: "Заголовок формы",
}

export const minimalLabelDecoration: LabelDecoration = {
  elementType: FormElementType.LabelDecoration,
  name: "Заголовок",
}

export const minimalLabelDecorationPartialEnterprise: LabelDecorationPartialEnterprise = {}

export const minimalLabelDecorationTypedEnterprise: LabelDecorationTypedEnterprise = {
  Тип: "Надпись",
}

// Для обратной совместимости
export const fullLabelDecorationEnterprise: LabelDecorationPartialEnterprise = fullLabelDecorationPartialEnterprise
export const minimalLabelDecorationEnterprise: LabelDecorationPartialEnterprise =
  minimalLabelDecorationPartialEnterprise

export interface LabelDecorationStructureFixture {
  name: string
  element: LabelDecoration
  structured: IFormatElementResult
}

export const labelDecorationStructureFixturesTable: LabelDecorationStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ИмяПоля",
      elementType: FormElementType.LabelDecoration,
      title: { items: { ru: "Заголовок" }, formatted: false },
    },
    structured: {
      strings: ["Заголовок {ИмяПоля}"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without title",
    element: {
      name: "ИмяПоля",
      title: { items: { ru: "" }, formatted: false },
      elementType: FormElementType.LabelDecoration,
    },
    structured: {
      strings: ["{ИмяПоля}"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
