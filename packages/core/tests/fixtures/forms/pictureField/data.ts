import {
  PictureField,
  PictureFieldEnterprise,
  PictureFieldPartialYAML,
  PictureFieldTypedYAML,
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
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Black" },
  enableDrag: false,
  enableStartDrag: false,
  fileDragMode: "AsFile",
  height: 200,
  horizontalStretch: false,
  hyperlink: false,
  maxHeight: 500,
  maxWidth: 400,
  nonselectedPictureText: {
    items: { ru: "Текст невыбранной картинки" },
  },
  pictureSize: "AutoSize",
  scale: 1,
  textColor: { type: "WebColor", value: "Black" },
  valuesPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  verticalStretch: false,
  width: 300,
  zoomable: false,
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
  ...fullFormFieldTableRelatedFixture,
} satisfies RequiredFieldsElement<PictureField>

export const fullPictureFieldEnterprise = {
  ElementType: "FormField",
  Name: "prefix_ПолеКартинки",
  Type: { Type: "SystemEnumeration", Value: "FormFieldType.PictureField" },
  Title: "Поле картинки",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BorderColor: { Type: "Color", Value: "WebColors.Black" },
  EnableDrag: false,
  EnableStartDrag: false,
  FileDragMode: {
    Type: "SystemEnumeration",
    Value: "FileDragMode.AsFile",
  },
  Height: 200,
  HorizontalStretch: false,
  Hyperlink: false,
  MaxHeight: 500,
  MaxWidth: 400,
  NonselectedPictureText: "Текст невыбранной картинки",
  PictureSize: { Type: "SystemEnumeration", Value: "PictureSize.AutoSize" },
  Scale: 1,
  TextColor: { Type: "Color", Value: "WebColors.Black" },
  VerticalStretch: false,
  Width: 300,
  Zoomable: false,
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Border: { Type: "Border", Value: "ControlBorderType.Single" },
  ValuesPicture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormFieldEnterpriseCommonFixture,
  ...fullFormFieldEnterpriseTableRelatedFixture,
} satisfies Required<PictureFieldEnterprise>

export const fullPictureFieldPartialYAML: PictureFieldPartialYAML = {
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  Масштаб: 1,
  Масштабировать: "Ложь",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  РазмерКартинки: "АвтоРазмер",
  РазрешитьНачалоПеретаскивания: "Ложь",
  РазрешитьПеретаскивание: "Ложь",
  Рамка: { Имя: undefined, ТипРамки: "Одинарная", Ширина: undefined },
  СпособПеретаскиванияФайлов: "КакФайл",
  ТекстНевыбраннойКартинки: "Текст невыбранной картинки",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  Гиперссылка: "Ложь",
  КартинкаЗначений: "Печать",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Нажатие: "ПроцедураНажатие",
    НачалоПеретаскивания: "ПроцедураНачалоПеретаскивания",
    ОкончаниеПеретаскивания: "ПроцедураОкончаниеПеретаскивания",
    Перетаскивание: "ПроцедураПеретаскивание",
    ПроверкаПеретаскивания: "ПроцедураПроверкаПеретаскивания",
  },
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ...fullFormFieldPartialYAMLCommonFixture,
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<PictureFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const fullPictureFieldTypedYAML: PictureFieldTypedYAML = {
  ...fullPictureFieldPartialYAML,
  Тип: "ПолеРисунка",
  Заголовок: "Поле картинки",
}

export const minimalPictureField: PictureField = {
  itemType: "PictureField",
  name: "ПолеКартинки",
}

export const minimalPictureFieldPartialYAML: PictureFieldPartialYAML = {}

export const minimalPictureFieldTypedYAML: PictureFieldTypedYAML = {
  Тип: "ПолеРисунка",
}
