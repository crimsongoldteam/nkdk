import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "~/metadata/forms/elements/checkBoxField/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullCheckBoxField: CheckBoxField = {
  ...fullFormField,
  elementType: FormElementType.CheckBoxField,
  name: "Флажок",
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
  ...fullFormFieldEnterprise,
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
