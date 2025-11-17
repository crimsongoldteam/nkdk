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
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatBoolean } from "~/lib/format/formatBool"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "enableContentChange": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьИзменениеСостава",
    formatProperties: formatBoolean,
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
  "readOnly": {
    get type() { return z.boolean() },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
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
    get type() { return SE.ZFormGroupType },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormGroupTypeEnterprise },
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
  "childItems": {
    get type() { return ZЭлементыФормы },
    nameEnterprise: "ПодчиненныеЭлементы",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "backColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФона",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "childItemsHorizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеПодчиненных",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemHorizontalLocationEnterprise },
    inProperties: ()=> true,
  },
  "childItemsVerticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеПодчиненных",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemVerticalAlignEnterprise },
    inProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZDisplayImportanceEnterprise },
    inProperties: ()=> true,
  },
  "format": {
    get type() { return ZI8nText },
    nameEnterprise: "Формат",
    formatProperties: formatI8nText,
    inProperties: ()=> true,
  },
  "group": {
    get type() { return SE.ZChildFormItemsGroup },
    nameEnterprise: "Группировка",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZChildFormItemsGroupEnterprise },
    inProperties: ()=> true,
  },
  "horizontalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameEnterprise: "ГоризонтальныйИнтервал",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormItemSpacingEnterprise },
    inProperties: ()=> true,
  },
  "itemsAndTitlesAlign": {
    get type() { return SE.ZItemsAndTitlesAlignVariant },
    nameEnterprise: "ВыравниваниеЭлементовИЗаголовков",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZItemsAndTitlesAlignVariantEnterprise },
    inProperties: ()=> true,
  },
  "picture": {
    get type() { return ZPicture },
    nameEnterprise: "Картинка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "scrollOnCompress": {
    get type() { return z.boolean() },
    nameEnterprise: "СкроллПриСжатии",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "showTitle": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтображатьЗаголовок",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "slaveItemsWidth": {
    get type() { return SE.ZChildFormItemsWidth },
    nameEnterprise: "ШиринаПодчиненныхЭлементов",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZChildFormItemsWidthEnterprise },
    inProperties: ()=> true,
  },
  "titleDataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДаннымЗаголовка",
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
  "verticalScrollOnReduceSize": {
    get type() { return z.boolean() },
    nameEnterprise: "ВертикальнаяПрокруткаПриСжатии",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "verticalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameEnterprise: "ВертикальныйИнтервал",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormItemSpacingEnterprise },
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.Page, rules)