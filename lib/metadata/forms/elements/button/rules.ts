import * as z from "zod"
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoMaxWidth": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    format: undefined,
    inProperties: ()=> true,
  },
  "backColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФона",
    format: undefined,
    inProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    format: undefined,
    inProperties: ()=> true,
  },
  "commandName": {
    get type() { return z.string() },
    nameEnterprise: "ИмяКоманды",
    format: undefined,
    inProperties: ()=> true,
  },
  "commandUniqueness": {
    get type() { return z.boolean() },
    nameEnterprise: "УникальностьКоманды",
    format: undefined,
    inProperties: ()=> true,
  },
  "dataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДанным",
    format: undefined,
    inProperties: ()=> true,
  },
  "defaultButton": {
    get type() { return z.boolean() },
    nameEnterprise: "КнопкаПоУмолчанию",
    format: undefined,
    inProperties: ()=> true,
  },
  "defaultItem": {
    get type() { return z.boolean() },
    nameEnterprise: "АктивизироватьПоУмолчанию",
    format: undefined,
    inProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "enabled": {
    get type() { return z.boolean() },
    nameEnterprise: "Доступность",
    format: undefined,
    inProperties: ()=> true,
  },
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    format: undefined,
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    format: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
    format: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    format: undefined,
    inProperties: ()=> true,
  },
  "locationInCommandBar": {
    get type() { return SE.ZButtonLocationInCommandBar },
    nameEnterprise: "ПоложениеВКоманднойПанели",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "maxHeight": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    format: undefined,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    format: undefined,
    inProperties: ()=> true,
  },
  "onlyInAllActions": {
    get type() { return z.boolean() },
    nameEnterprise: "ТолькоВоВсехДействиях",
    format: undefined,
    inProperties: ()=> true,
  },
  "picture": {
    get type() { return ZPicture },
    nameEnterprise: "Картинка",
    format: undefined,
    inProperties: ()=> true,
  },
  "pictureLocation": {
    get type() { return SE.ZFormButtonPictureLocation },
    nameEnterprise: "ПоложениеКартинки",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "representation": {
    get type() { return SE.ZButtonRepresentation },
    nameEnterprise: "Отображение",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "shape": {
    get type() { return SE.ZButtonShape },
    nameEnterprise: "Фигура",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "shapeRepresentation": {
    get type() { return SE.ZButtonShapeRepresentation },
    nameEnterprise: "ОтображениеФигуры",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    format: undefined,
    inProperties: ()=> true,
  },
  "skipOnInput": {
    get type() { return z.boolean() },
    nameEnterprise: "ПропускатьПриВводе",
    format: undefined,
    inProperties: ()=> true,
  },
  "textColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекста",
    format: undefined,
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "toolTipRepresentation": {
    get type() { return SE.ZToolTipRepresentation },
    nameEnterprise: "ОтображениеПодсказки",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "type": {
    get type() { return SE.ZFormButtonType },
    nameEnterprise: "Вид",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameEnterprise: "ПользовательскаяВидимость",
    format: undefined,
    inProperties: ()=> true,
  },
  "verticalAlignInGroup": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    format: undefined,
    inProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameEnterprise: "Видимость",
    format: undefined,
    inProperties: ()=> true,
  },
  "width": {
    get type() { return z.number() },
    nameEnterprise: "Ширина",
    format: undefined,
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.Button, rules)