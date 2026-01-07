import { IFormatElementResult } from "~/format/types"
import { LabelDecoration, LabelDecorationEnterprise } from "~/metadata/forms/elements/labelDecoration/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullLabelDecoration: LabelDecoration = {
  elementType: FormElementType.LabelDecoration,
  name: "Заголовок",
  id: "1",
  title: {
    items: { ru: "Заголовок формы" },
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlign: "Top",
  events: {
    click: "ПроцедураНажатия",
    uRLProcessing: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const fullLabelDecorationEnterprise: LabelDecorationEnterprise = {
  ВертикальноеВыравниваниеГруппы: "Верх",
  ВертикальноеПоложение: "Верх",
  ВысотаЗаголовка: 20,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложение: "Лево",
  Заголовок: "Заголовок формы",
  РазрешитьИспользование: { Администратор: "Истина" },
  Рамка: {
    Имя: "style:ControlBorder",
    Ширина: 1,
    ТипРамки: "Вдавленная",
  },
  ЦветРамки: "Зеленый",
  ЦветФона: "Синий",
  События: {
    Нажатие: "ПроцедураНажатия",
    ОбработкаНавигационнойСсылки: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const minimalLabelDecoration: LabelDecoration = {
  elementType: FormElementType.LabelDecoration,
  name: "Заголовок",
  id: "1",
}

export const minimalLabelDecorationEnterprise: LabelDecorationEnterprise = {}

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
      title: { items: { ru: "Заголовок" } },
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
      elementType: FormElementType.LabelDecoration,
    },
    structured: {
      strings: ["{ИмяПоля}"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
