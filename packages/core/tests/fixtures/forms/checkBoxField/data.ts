import { IFormatElementResult } from "~/format/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/metadata/forms/elements/checkBoxField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullCheckBoxField: CheckBoxField = {
  elementType: FormElementType.CheckBoxField,
  name: "Флажок",
  id: "1",
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  events: {
    onChange: "ПроцедураПриИзменении",
  },
}

export const fullCheckBoxFieldEnterprise: CheckBoxFieldEnterprise = {
  Заголовок: "Флажок формы",
  ВидФлажка: "Выключатель",
  ВысотаЗаголовкаЭлемента: 15,
  ВысотаЭлемента: 20,
  ОдинаковаяШиринаЭлементов: "Истина",
  РазрешитьИспользование: { Администратор: "Истина" },
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
  id: "1",
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
      id: undefined,
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
      id: undefined,
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
      id: undefined,
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
      id: undefined,
    },
    structured: {
      strings: ["[|1]Заголовок"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
