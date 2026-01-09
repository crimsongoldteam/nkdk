import { PdfDocumentField, PdfDocumentFieldEnterprise } from "~/metadata/forms/elements/pdfDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPdfDocumentField: PdfDocumentField = {
  elementType: FormElementType.PdfDocumentField,
  name: "ПолеPDFДокумента",
  title: {
    items: { ru: "Поле PDF документа" },
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

export const fullPdfDocumentFieldEnterprise: PdfDocumentFieldEnterprise = {
  Заголовок: "Поле PDF документа",
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

export const minimalPdfDocumentField: PdfDocumentField = {
  elementType: FormElementType.PdfDocumentField,
  name: "ПолеPDFДокумента",
}

export const minimalPdfDocumentFieldEnterprise: PdfDocumentFieldEnterprise = {}
