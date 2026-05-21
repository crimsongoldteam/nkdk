import {
  LabelDecoration,
  LabelDecorationEnterprise,
  LabelDecorationPartialYAML,
} from "~/metadata/forms/elements/labelDecoration/types"

import { StructureResult } from "~/tests/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormDecorationCommonFixture,
  fullFormDecorationEnterpriseCommonFixture,
  fullFormDecorationPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formDecoration/__fixtures__/data"

export const fullLabelDecoration: RequiredFieldsElement<LabelDecoration> = {
  itemType: "LabelDecoration",
  name: "ДекорацияНадпись",
  title: {
    items: { ru: "<b>Заголовок</>" },
    formatted: true,
  },
  ...fullFormDecorationCommonFixture,
  backColor: { type: "WebColor", value: "MediumOrchid" },
  border: {
    width: 2,
    controlBorderType: "Double",
  },
  borderColor: { type: "WebColor", value: "Azure" },
  horizontalAlign: "Center",
  hyperlink: true,
  titleHeight: 30,
  verticalAlign: "Bottom",
  events: {
    click: "ДекорацияНадписьНажатие",
    uRLProcessing: "ДекорацияНадписьОбработкаНавигационнойСсылки",
  },
}

export const fullLabelDecorationEnterprise = {
  ElementType: "FormDecoration",
  Name: "prefix_ДекорацияНадпись",
  Type: { Type: "SystemEnumeration", Value: "FormDecorationType.Label" },
  ...fullFormDecorationEnterpriseCommonFixture,
  BackColor: { Type: "Color", Value: "WebColors.MediumOrchid" },
  BorderColor: { Type: "Color", Value: "WebColors.Azure" },
  HorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Center",
  },
  Hyperlink: true,
  TitleHeight: 30,
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Bottom",
  },
  Title: "<b>Заголовок</>",
  Border: { Type: "Border", Value: "ControlBorderType.Double", Width: 2 },
} satisfies Required<LabelDecorationEnterprise>

export const fullLabelDecorationPartialYAML: LabelDecorationPartialYAML = {
  ...fullFormDecorationPartialYAMLCommonFixture,
  ВертикальноеПоложение: "Низ",
  ВысотаЗаголовка: 30,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложение: "Центр",
  ЦветРамки: "Лазурный",
  ЦветФона: "ОрхидеяНейтральный",
  Рамка: {
    Имя: undefined,
    Ширина: 2,
    ТипРамки: "Двойная",
  },
  ФорматированныйЗаголовок: "<b>Заголовок</>",
  События: {
    Нажатие: "ДекорацияНадписьНажатие",
    ОбработкаНавигационнойСсылки: "ДекорацияНадписьОбработкаНавигационнойСсылки",
  },
}

export const minimalLabelDecoration: LabelDecoration = {
  itemType: "LabelDecoration",
  name: "Заголовок",
}

export const minimalLabelDecorationPartialYAML: LabelDecorationPartialYAML = {}

// Для обратной совместимости
export const fullLabelDecorationYAML: LabelDecorationPartialYAML = fullLabelDecorationPartialYAML
export const minimalLabelDecorationYAML: LabelDecorationPartialYAML = minimalLabelDecorationPartialYAML

export interface LabelDecorationStructureFixture {
  name: string
  element: LabelDecoration
  structured: StructureResult
}

export const labelDecorationStructureFixturesTable: LabelDecorationStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ИмяПоля",
      itemType: "LabelDecoration",
      title: { items: { ru: "Заголовок" }, formatted: false },
    },
    structured: {
      strings: ['"Заголовок" ИмяПоля'],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "ИмяПоля",
      title: { items: { ru: "" }, formatted: false },
      itemType: "LabelDecoration",
    },
    structured: {
      strings: ["ИмяПоля"],
      toOneLineGroup: true,
    },
  },

  {
    name: "with escaped title",
    element: {
      name: "ИмяПоля",
      itemType: "LabelDecoration",
      title: { items: { ru: 'Заголовок "формы"' }, formatted: false },
    },
    structured: {
      strings: ["'Заголовок \"формы\"' ИмяПоля"],
      toOneLineGroup: true,
    },
  },
]
