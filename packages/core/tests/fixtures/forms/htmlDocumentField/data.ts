import {
  HTMLDocumentField,
  HTMLDocumentFieldEnterprise,
  HTMLDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/htmlDocumentField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullHtmlDocumentField: RequiredFieldsElement<HTMLDocumentField> = {
  itemType: "HTMLDocumentField",
  name: "ПолеHTMLДокумента",
  title: {
    items: { ru: "Поле HTML документа" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Black" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  output: "Enable",
  userAgentInformation: "Информация программы просмотра",
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    documentComplete: "ПроцедураЗавершенияДокумента",
    beforeWrite: "ПроцедураПередЗаписью",
    beforePrint: "ПроцедураПередПечатью",
    afterWrite: "ПроцедураПослеЗаписи",
    onClick: "ПроцедураНажатия",
  },
  ...fullFormFieldCommonFixture,
  ...fullFormFieldTableRelatedFixture,
}

export const fullHtmlDocumentFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеHTMLДокумента",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.HTMLDocumentField",
  },
  Title: "Поле HTML документа",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Black",
  },
  Height: 200,
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  UserAgentInformation: "Информация программы просмотра",
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<HTMLDocumentFieldEnterprise>

export const fullHtmlDocumentFieldPartialYAML: HTMLDocumentFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Ширина: 300,
  ИнформацияПрограммыПросмотра: "Информация программы просмотра",
  ЦветРамки: "Черный",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    ПередЗаписью: "ПроцедураПередЗаписью",
    ПередПечатью: "ПроцедураПередПечатью",
    ПослеЗаписи: "ПроцедураПослеЗаписи",
    ДокументСформирован: "ПроцедураЗавершенияДокумента",
    ПриНажатии: "ПроцедураНажатия",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<HTMLDocumentFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalHtmlDocumentField: HTMLDocumentField = {
  itemType: "HTMLDocumentField",
  name: "ПолеHTMLДокумента",
}

export const minimalHtmlDocumentFieldPartialYAML: HTMLDocumentFieldPartialYAML = {}
