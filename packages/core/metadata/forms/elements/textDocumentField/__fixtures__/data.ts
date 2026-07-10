import { TextDocumentField, TextDocumentFieldEnterprise, TextDocumentFieldPartialYAML } from "../types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

export const fullTextDocumentField = {
  itemType: "TextDocumentField",
  name: "ПолеТекстовогоДокумента",
  title: {
    items: { ru: "Поле текстового документа" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  backColor: { type: "WebColor", value: "Blue" },
  borderColor: { type: "WebColor", value: "Green" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  textColor: { type: "WebColor", value: "Yellow" },
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<TextDocumentField>

export const fullTextDocumentFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеТекстовогоДокумента",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.TextDocumentField" },
  Title: "Поле текстового документа",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Height: 200,
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: { Type: "SystemEnumeration", Value: "UseOutput.Enable" },
  TextColor: { Type: "Color", Value: "WebColors.Yellow" },
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<TextDocumentFieldEnterprise>

export const fullTextDocumentFieldPartialYAML: TextDocumentFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Заголовок: "Поле текстового документа",
  Ширина: 300,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<TextDocumentFieldPartialYAML>, "Использование">

export const minimalTextDocumentField: TextDocumentField = {
  itemType: "TextDocumentField",
  name: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentFieldPartialYAML: TextDocumentFieldPartialYAML = {}
