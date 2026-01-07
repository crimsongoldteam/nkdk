import { HtmlDocumentField, HtmlDocumentFieldEnterprise } from "~/metadata/forms/elements/htmlDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullHtmlDocumentField: HtmlDocumentField = {
  elementType: FormElementType.HtmlDocumentField,
  name: "ПолеHTMLДокумента",
  id: "1",
  title: {
    items: { ru: "Поле HTML документа" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
}

export const fullHtmlDocumentFieldEnterprise: HtmlDocumentFieldEnterprise = {
  Заголовок: "Поле HTML документа",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Ширина: 300,
}

export const minimalHtmlDocumentField: HtmlDocumentField = {
  elementType: FormElementType.HtmlDocumentField,
  name: "ПолеHTMLДокумента",
  id: "1",
}

export const minimalHtmlDocumentFieldEnterprise: HtmlDocumentFieldEnterprise = {}

