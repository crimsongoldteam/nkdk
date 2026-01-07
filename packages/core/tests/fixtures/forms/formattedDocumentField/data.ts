import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
} from "~/metadata/forms/elements/formattedDocumentField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullFormattedDocumentField: FormattedDocumentField = {
  elementType: FormElementType.FormattedDocumentField,
  name: "ПолеФорматированногоДокумента",
  id: "1",
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    beforeWrite: "ПроцедураПередЗаписью",
  },
}

export const fullFormattedDocumentFieldEnterprise: FormattedDocumentFieldEnterprise = {
  Заголовок: "Поле форматированного документа",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Вывод: "Разрешить",
  ВыделенныйТекст: "Выделенный текст",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
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
  },
}

export const minimalFormattedDocumentField: FormattedDocumentField = {
  elementType: FormElementType.FormattedDocumentField,
  name: "ПолеФорматированногоДокумента",
  id: "1",
}

export const minimalFormattedDocumentFieldEnterprise: FormattedDocumentFieldEnterprise = {}
