import {
  PictureField,
  PictureFieldEnterprise,
  PictureFieldPartialYAML,
  TablePictureField,
  TablePictureFieldEnterprise,
  TablePictureFieldPartialYAML,
  TablePictureFieldTypedYAML,
} from "~/metadata/forms/elements/pictureField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPictureField: RequiredFieldsElement<PictureField> = {
  itemType: "PictureField",
  name: "ПолеКартинки",
  title: {
    items: { ru: "Поле картинки" },
  },
  border: {
    controlBorderType: "Single",
    width: 0,
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  enableDrag: true,
  enableStartDrag: true,
  fileDragMode: "AsFile",
  height: 200,
  horizontalStretch: false,
  hyperlink: true,
  maxHeight: 500,
  maxWidth: 400,
  nonselectedPictureText: {
    items: { ru: "Текст невыбранной картинки" },
  },
  pictureSize: "AutoSize",
  scale: 95,
  textColor: { type: "WebColor", value: "Black" },
  valuesPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  verticalStretch: false,
  width: 300,
  zoomable: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  events: {
    onChange: "ПроцедураПриИзменении",
    click: "ПроцедураНажатие",
    dragStart: "ПроцедураНачалоПеретаскивания",
    dragEnd: "ПроцедураОкончаниеПеретаскивания",
    drag: "ПроцедураПеретаскивание",
    dragCheck: "ПроцедураПроверкаПеретаскивания",
  },
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<PictureField>

export const fullTablePictureField: RequiredFieldsElement<TablePictureField> = {
  ...fullPictureField,
  itemType: "TablePictureField",
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<TablePictureField>

export const fullPictureFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеКартинки",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.PictureField" },
  Title: "Поле картинки",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BorderColor: { Type: "Color", Value: "WebColors.Black" },
  EnableDrag: true,
  EnableStartDrag: true,
  FileDragMode: {
    Type: "SystemEnumeration",
    Value: "FileDragMode.AsFile",
  },
  Height: 200,
  HorizontalStretch: false,
  Hyperlink: true,
  MaxHeight: 500,
  MaxWidth: 400,
  NonselectedPictureText: "Текст невыбранной картинки",
  PictureSize: { Type: "SystemEnumeration", Value: "PictureSize.AutoSize" },
  Scale: 95,
  TextColor: { Type: "Color", Value: "WebColors.Black" },
  VerticalStretch: false,
  Width: 300,
  Zoomable: true,
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Border: { Type: "Border", Value: "ControlBorderType.Single", Width: 0 },
  ValuesPicture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<PictureFieldEnterprise>

export const fullTablePictureFieldEnterprise = {
  ...fullPictureFieldEnterprise,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<TablePictureFieldEnterprise>

export const fullPictureFieldPartialYAML: PictureFieldPartialYAML = {
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  Масштаб: 95,
  Масштабировать: "Истина",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  РазмерКартинки: "АвтоРазмер",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  Рамка: { Имя: undefined, ТипРамки: "Одинарная", Ширина: 0 },
  СпособПеретаскиванияФайлов: "КакФайл",
  ТекстНевыбраннойКартинки: "Текст невыбранной картинки",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  Гиперссылка: "Истина",
  КартинкаЗначений: "Печать",
  Ширина: 300,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Нажатие: "ПроцедураНажатие",
    НачалоПеретаскивания: "ПроцедураНачалоПеретаскивания",
    ОкончаниеПеретаскивания: "ПроцедураОкончаниеПеретаскивания",
    Перетаскивание: "ПроцедураПеретаскивание",
    ПроверкаПеретаскивания: "ПроцедураПроверкаПеретаскивания",
  },
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  ПутьКДанным: "Реквизит",
  Заголовок: "Поле картинки",
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<PictureFieldPartialYAML>, "Использование">

export const fullTablePictureFieldPartialYAML: TablePictureFieldPartialYAML = {
  ...fullPictureFieldPartialYAML,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
}

export const fullTablePictureFieldTypedYAML: TablePictureFieldTypedYAML = {
  ...fullTablePictureFieldPartialYAML,
  ПутьКДанным: "Реквизит",
  Тип: "ПолеРисунка",
  Заголовок: "Поле картинки",
}

export const minimalPictureField: PictureField = {
  itemType: "PictureField",
  name: "ПолеКартинки",
}

export const minimalPictureFieldPartialYAML: PictureFieldPartialYAML = {}

export const minimalTablePictureField: TablePictureField = {
  itemType: "TablePictureField",
  name: "ПолеКартинки",
}

export const minimalTablePictureFieldPartialYAML: TablePictureFieldPartialYAML = {}

export const minimalTablePictureFieldTypedYAML: TablePictureFieldTypedYAML = {
  Тип: "ПолеРисунка",
}
