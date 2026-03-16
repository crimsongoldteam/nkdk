import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/formattedDocumentField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullFormattedDocumentField: RequiredFieldsElement<FormattedDocumentField> = {
  itemType: "FormattedDocumentField",
  name: "ПолеФорматированногоДокумента",
  title: {
    items: { ru: "Поле форматированного документа" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Black" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  selectedText: "Выделенный текст",
  textColor: { type: "WebColor", value: "Blue" },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldCommonFixture,
  ...fullFormFieldTableRelatedFixture,
}

export const fullFormattedDocumentFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеФорматированногоДокумента",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.FormattedDocumentField",
  },
  Title: "Поле форматированного документа",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BackColor: {
    Type: "Color",
    Value: "WebColors.White",
  },
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Black",
  },
  Font: {
    Type: "Font",
    Value: "StyleFonts.NormalTextFont",
  },
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  SelectedText: "Выделенный текст",
  TextColor: {
    Type: "Color",
    Value: "WebColors.Blue",
  },
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<FormattedDocumentFieldEnterprise>

export const fullFormattedDocumentFieldPartialYAML: FormattedDocumentFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  ВыделенныйТекст: "Выделенный текст",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Синий",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<FormattedDocumentFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalFormattedDocumentField: FormattedDocumentField = {
  itemType: "FormattedDocumentField",
  name: "ПолеФорматированногоДокумента",
}

export const minimalFormattedDocumentFieldPartialYAML: FormattedDocumentFieldPartialYAML = {}
