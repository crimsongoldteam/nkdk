import {
  RadioButtonField,
  RadioButtonFieldEnterprise,
  RadioButtonFieldPartialYAML,
} from "~/metadata/forms/elements/radioButtonField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullRadioButtonField: RequiredFieldsElement<RadioButtonField> = {
  itemType: "RadioButtonField",
  name: "ПолеПереключателя",
  title: {
    items: { ru: "Поле переключателя" },
  },
  backColor: { type: "WebColor", value: "Blue" },
  borderColor: { type: "WebColor", value: "Green" },
  choiceList: [
    {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Пункт 1" } },
      value: { type: "string", value: "Пункт 1" },
    },
  ],
  columnsCount: 2,
  equalColumnsWidth: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  itemHeight: 20,
  itemTitleHeight: 15,
  itemWidth: 100,
  radioButtonType: "RadioButton",
  textColor: { type: "WebColor", value: "Yellow" },
  events: {
    onChange: "ПроцедураПриИзменении",
  },
  ...fullFormFieldCommonFixture,
}

export const fullRadioButtonFieldEnterprise = {
  Name: "prefix_ПолеПереключателя",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.RadioButtonField" },
  ElementType: "FormField",
  Title: "Поле переключателя",
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  ColumnsCount: 2,
  EqualColumnsWidth: true,
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  ItemHeight: 20,
  ItemTitleHeight: 15,
  ItemWidth: 100,
  RadioButtonType: {
    Type: "SystemEnumeration",
    Value: "RadioButtonType.RadioButton",
  },
  TextColor: { Type: "Color", Value: "WebColors.Yellow" },
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<RadioButtonFieldEnterprise>

export const fullRadioButtonFieldPartialYAML: RadioButtonFieldPartialYAML = {
  ВидПереключателя: "Переключатель",
  ВысотаЗаголовкаЭлемента: 15,
  ВысотаЭлемента: 20,
  КоличествоКолонок: 2,
  ОдинаковаяШиринаКолонок: "Истина",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Заголовок: "Поле переключателя",
  ШиринаЭлемента: 100,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  СписокВыбора: [
    {
      Представление: "Пункт 1",
      Значение: '"Пункт 1"',
    },
  ],
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<RadioButtonFieldPartialYAML>, "Использование">

export const minimalRadioButtonField: RadioButtonField = {
  itemType: "RadioButtonField",
  name: "ПолеПереключателя",
}

export const minimalRadioButtonFieldPartialYAML: RadioButtonFieldPartialYAML = {}
