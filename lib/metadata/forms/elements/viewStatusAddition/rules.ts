import * as z from "zod"
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatBoolean } from "~/lib/format/formatBool"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "contextMenu": {
    get type() { return ZCommandBar },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZDisplayImportanceEnterprise },
    inProperties: ()=> true,
  },
  "enabled": {
    get type() { return z.boolean() },
    nameEnterprise: "Доступность",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "extendedToolTip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemHorizontalLocationEnterprise },
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
    inProperties: ()=> true,
  },
  "toolTip": {
    get type() { return ZI8nText },
    nameEnterprise: "Подсказка",
    formatProperties: formatI8nText,
    inProperties: ()=> true,
  },
  "toolTipRepresentation": {
    get type() { return SE.ZToolTipRepresentation },
    nameEnterprise: "ОтображениеПодсказки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZToolTipRepresentationEnterprise },
    inProperties: ()=> true,
  },
  "type": {
    get type() { return SE.ZFormItemAdditionType },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormItemAdditionTypeEnterprise },
    inProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameEnterprise: "ПользовательскаяВидимость",
    formatProperties: formatUserVisible,
    inProperties: ()=> true,
  },
  "verticalAlignInGroup": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemVerticalAlignEnterprise },
    inProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "childItems": {
    get type() { return ZЭлементыФормы },
    nameEnterprise: "ПодчиненныеЭлементы",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "autoMaxWidth": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "backColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФона",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "border": {
    get type() { return ZBorder },
    nameEnterprise: "Рамка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "buttonsBackColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФонаКнопок",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemHorizontalLocationEnterprise },
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "textColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "titleFont": {
    get type() { return ZFont },
    nameEnterprise: "ШрифтЗаголовка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "titleTextColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекстаЗаголовка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "width": {
    get type() { return z.number() },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.ViewStatusAddition, rules)