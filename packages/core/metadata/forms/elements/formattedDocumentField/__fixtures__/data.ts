import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/formattedDocumentField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullFormattedDocumentField: RequiredFieldsElement<FormattedDocumentField> = {
  itemType: "FormattedDocumentField",
  name: "ПолеФорматированногоДокумента",
  title: {
    items: { ru: "Поле форматированного документа" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Black" },
  commandSet: ["Bold"],
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: false,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  textColor: { type: "WebColor", value: "Blue" },
  verticalStretch: false,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldCommonFixture,
}

export const fullFormattedDocumentFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеФорматированногоДокумента",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.FormattedDocumentField",
  },
  Title: "Поле форматированного документа",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
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
  HorizontalStretch: false,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  TextColor: {
    Type: "Color",
    Value: "WebColors.Blue",
  },
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<FormattedDocumentFieldEnterprise>

export const fullFormattedDocumentFieldPartialYAML: FormattedDocumentFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 200,
  Команда: ["Bold"],
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Черный",
  ЦветТекста: "Синий",
  ЦветФона: "Белый",
  Заголовок: "Поле форматированного документа",
  Ширина: 300,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<
  Required<FormattedDocumentFieldPartialYAML>,
  "ЗапретитьИспользование" | "РазрешитьИспользование"
>

export const minimalFormattedDocumentField: FormattedDocumentField = {
  itemType: "FormattedDocumentField",
  name: "ПолеФорматированногоДокумента",
}

export const minimalFormattedDocumentFieldPartialYAML: FormattedDocumentFieldPartialYAML = {}
