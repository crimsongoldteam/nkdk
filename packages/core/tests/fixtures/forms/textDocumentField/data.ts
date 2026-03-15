import {
  TextDocumentField,
  TextDocumentFieldEnterprise,
  TextDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/textDocumentField/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"

export const fullTextDocumentField: RequiredFieldsElement<TextDocumentField> = {
  itemType: "TextDocumentField",
  name: "ПолеТекстовогоДокумента",
  title: {
    items: { ru: "Поле текстового документа" },
  },
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "Blue" },
  borderColor: { type: "WebColor", value: "Green" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Auto",
  selectedText: "Выделенный текст",
  textColor: { type: "WebColor", value: "Yellow" },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldCommonFixture,
}

export const fullTextDocumentFieldEnterprise = {
  Name: "prefix_ПолеТекстовогоДокумента",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.TextDocumentField" },
  Title: "Поле текстового документа",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: { Type: "SystemEnumeration", Value: "UseOutput.Auto" },
  SelectedText: "Выделенный текст",
  TextColor: { Type: "Color", Value: "WebColors.Yellow" },
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<TextDocumentFieldEnterprise>

export const fullTextDocumentFieldPartialYAML: TextDocumentFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Авто",
  ВыделенныйТекст: "Выделенный текст",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Желтый",
  ЦветФона: "Синий",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
}

export const minimalTextDocumentField: TextDocumentField = {
  itemType: "TextDocumentField",
  name: "ПолеТекстовогоДокумента",
}

export const minimalTextDocumentFieldPartialYAML: TextDocumentFieldPartialYAML = {}
