import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/pdfDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullPdfDocumentField: PdfDocumentField = {
  ...fullFormField,
  elementType: FormElementType.PdfDocumentField,
  name: "ПолеPDFДокумента",
  title: {
    items: { ru: "Поле PDF документа" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  borderColor: { type: "WebColor", value: "Green" },
  currentPageNumber: 1,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  orientation: 0,
  output: "Enable",
  scale: 100,
  usedFileName: "Документ.pdf",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  viewStatusLocation: "Auto",
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    uRLClick: "ПроцедураНажатияНаНавигационнойСсылке",
  },
}

export const fullPdfDocumentFieldPartialEnterprise: PdfDocumentFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле PDF документа",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  Высота: 200,
  ИспользуемоеИмяФайла: "Документ.pdf",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  Масштаб: 100,
  НомерТекущейСтраницы: 1,
  Ориентация: 0,
  ПоложениеСостоянияПросмотра: "Авто",
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Зеленый",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    НажатиеНаНавигационнойСсылке: "ПроцедураНажатияНаНавигационнойСсылке",
  },
}

export const fullPdfDocumentFieldTypedEnterprise: PdfDocumentFieldTypedEnterprise = {
  ...fullPdfDocumentFieldPartialEnterprise,
  Тип: "ПолеPDFДокумента",
}

export const minimalPdfDocumentField: PdfDocumentField = {
  elementType: FormElementType.PdfDocumentField,
  name: "ПолеPDFДокумента",
}

export const minimalPdfDocumentFieldPartialEnterprise: PdfDocumentFieldPartialEnterprise = {}

export const minimalPdfDocumentFieldTypedEnterprise: PdfDocumentFieldTypedEnterprise = {
  Тип: "ПолеPDFДокумента",
}
