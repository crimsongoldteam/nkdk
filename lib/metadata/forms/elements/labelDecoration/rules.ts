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
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatBoolean } from "~/lib/format/formatBool"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "autoMaxWidth": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
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
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
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
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "maxHeight": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "skipOnInput": {
    get type() { return z.boolean() },
    nameEnterprise: "ПропускатьПриВводе",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "textColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
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
    get type() { return SE.ZFormDecorationType },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormDecorationTypeEnterprise },
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
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "width": {
    get type() { return z.number() },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
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
  "groupVerticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеВыравниваниеГруппы",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemVerticalAlignEnterprise },
    inProperties: ()=> true,
  },
  "horizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemHorizontalLocationEnterprise },
    inProperties: ()=> true,
  },
  "hyperlink": {
    get type() { return z.boolean() },
    nameEnterprise: "Гиперссылка",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "titleHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "verticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemVerticalAlignEnterprise },
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.LabelDecoration, rules)