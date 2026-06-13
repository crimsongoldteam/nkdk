import {
  CheckBoxField,
  CheckBoxFieldEnterprise,
  CheckBoxFieldPartialYAML,
  TableCheckBoxField,
  TableCheckBoxFieldEnterprise,
  TableCheckBoxFieldPartialYAML,
  TableCheckBoxFieldTypedYAML,
} from "~/metadata/forms/elements/checkBoxField/types"

import { StructureResult } from "~/tests/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

const fullCheckBoxFieldCommon: Omit<RequiredFieldsElement<CheckBoxField>, "itemType"> = {
  name: "Флажок",
  title: {
    items: { ru: "Флажок формы" },
  },
  events: {
    onChange: "ПроцедураПриИзменении",
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
  ...fullFormFieldCommonFixture,
}

export const fullCheckBoxField: RequiredFieldsElement<CheckBoxField> = {
  itemType: "CheckBoxField",
  ...fullCheckBoxFieldCommon,
} satisfies RequiredFieldsElement<CheckBoxField>

export const fullTableCheckBoxField: RequiredFieldsElement<TableCheckBoxField> = {
  ...fullCheckBoxFieldCommon,
  itemType: "TableCheckBoxField",
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<TableCheckBoxField>

export const fullCheckBoxFieldPartialYAML: CheckBoxFieldPartialYAML = {
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
  Заголовок: "Флажок формы",
  ШиринаЭлемента: 100,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  ПутьКДанным: "Реквизит",
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<CheckBoxFieldPartialYAML>, "Использование">

export const fullTableCheckBoxFieldPartialYAML: TableCheckBoxFieldPartialYAML = {
  ...fullCheckBoxFieldPartialYAML,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
}

export const fullTableCheckBoxFieldTypedYAML: TableCheckBoxFieldTypedYAML = {
  ...fullTableCheckBoxFieldPartialYAML,
  Тип: "ПолеФлажок",
  Заголовок: "Флажок формы",
  ПутьКДанным: "Реквизит",
}

export const minimalCheckBoxField: CheckBoxField = {
  itemType: "CheckBoxField",
  name: "Флажок",
}

export const minimalCheckBoxFieldPartialYAML: CheckBoxFieldPartialYAML = {}

export const minimalTableCheckBoxField: TableCheckBoxField = {
  itemType: "TableCheckBoxField",
  name: "Флажок",
}

export const minimalTableCheckBoxFieldPartialYAML: TableCheckBoxFieldPartialYAML = {}

export const minimalTableCheckBoxFieldTypedYAML: TableCheckBoxFieldTypedYAML = {
  Тип: "ПолеФлажок",
}

export interface CheckBoxFieldStructureFixture {
  description: string
  element: CheckBoxField
  structure: StructureResult
  xml?: string
}

// НЕДЕЙСТВИТЕЛЬНО
// Если заголовок (pascalCase) равен имени, title = undefined, не выводится в structure
// Если заголовок не равен имени, заголовок на основном языке выводится в structure, на остальных в YAML
// Если заголовок пустой, на форму выводится ''
// Если ПоложениеЗаголовка = Нет, пока непонятно

// ДЕЙСТВИТЕЛЬНО
// Если заголовок, есть заголовок выводим его
// Если заголовок пустой, title = undefined, не выводится в structure
export const checkBoxFieldStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  // #region checkbox
  {
    description: "left titled",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: { strings: ['"Заголовок флажка" [ ] Флажок'], toOneLineGroup: true },
  },
  {
    description: "left titled without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      dataPath: "Флажок",
    },
    structure: { strings: ["Флажок [ ]"], toOneLineGroup: true },
  },
  // {
  //   description: "left titled with empty title",
  //   element: {
  //     name: "Флажок",
  //     itemType: "CheckBoxField",
  //     title: { items: { ru: "" } },
  //   },
  //   structure: { strings: ["'' [ ] Флажок"], toOneLineGroup: true },
  // },
  {
    description: "right titled",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: { strings: ['[ ] "Заголовок флажка" Флажок'], toOneLineGroup: true },
  },
  {
    description: "right titled without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      dataPath: "Флажок",
    },
    structure: { strings: ["[ ] Флажок"], toOneLineGroup: true },
  },
  // #endregion

  // #region switch
  {
    description: "left titled switch",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: { strings: ['"Заголовок флажка" [ | ] Флажок'], toOneLineGroup: true },
  },
  {
    description: "left titled switch without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      checkBoxType: "Switch",
      dataPath: "Флажок",
    },
    structure: { strings: ["Флажок [ | ]"], toOneLineGroup: true },
  },
  {
    description: "right titled switch",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      checkBoxType: "Switch",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: { strings: ['[ | ] "Заголовок флажка" Флажок'], toOneLineGroup: true },
  },
  {
    description: "right titled switch without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      checkBoxType: "Switch",
      dataPath: "Флажок",
    },
    structure: { strings: ["[ | ] Флажок"], toOneLineGroup: true },
  },
  // #endregion
  // #region tumbler
  {
    description: "left titled tumbler",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      checkBoxType: "Tumbler",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: {
      strings: ['"Заголовок флажка" < | > Флажок'],
      toOneLineGroup: true,
    },
  },
  {
    description: "left titled tumbler without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      checkBoxType: "Tumbler",
      dataPath: "Флажок",
    },
    structure: {
      strings: ["Флажок < | >"],
      toOneLineGroup: true,
    },
  },
  {
    description: "right titled tumbler",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      checkBoxType: "Tumbler",
      title: { items: { ru: "Заголовок флажка" } },
      dataPath: "Флажок",
    },
    structure: {
      strings: ['< | > "Заголовок флажка" Флажок'],
      toOneLineGroup: true,
    },
  },
  {
    description: "right titled tumbler without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      titleLocation: "Right",
      checkBoxType: "Tumbler",
      dataPath: "Флажок",
    },
    structure: { strings: ["< | > Флажок"], toOneLineGroup: true },
  },
  // #endregion
]

export const checkBoxFieldContentStructureFixturesTable: CheckBoxFieldStructureFixture[] = [
  {
    description: "left titled",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
      title: { items: { ru: "Заголовок флажка" } },
    },
    structure: { strings: ['[ ] "Заголовок флажка" Флажок'], toOneLineGroup: true },
  },
  {
    description: "left titled without title",
    element: {
      name: "Флажок",
      itemType: "CheckBoxField",
    },
    structure: { strings: ["[ ] Флажок"], toOneLineGroup: true },
  },
]

export const fullCheckBoxFieldEnterprise = {
  Name: "prefix_Флажок",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.CheckBoxField" },
  ElementType: "FormField",
  Title: "Флажок формы",
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  CheckBoxType: { Type: "SystemEnumeration", Value: "CheckBoxType.Switch" },
  EditFormat: "Формат редактирования",
  EqualItemsWidth: true,
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  ItemHeight: 20,
  ItemTitleHeight: 15,
  ItemWidth: 100,
  TextColor: { Type: "Color", Value: "WebColors.Yellow" },
  ThreeState: true,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<CheckBoxFieldEnterprise>

export const fullTableCheckBoxFieldEnterprise = {
  ...fullCheckBoxFieldEnterprise,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<TableCheckBoxFieldEnterprise>
