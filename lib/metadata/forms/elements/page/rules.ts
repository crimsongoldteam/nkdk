import * as z from "zod"
import { TElementRules } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"


export const ZPageRules: TElementRules = {
  "enableContentChange": {
    get type() { return z.boolean() },
    nameXML: "EnableContentChange",
    get typeXML() { return z.boolean() },
    nameEnterprise: "РазрешитьИзменениеСостава",
    format: undefined,
    isProperties: ()=> true,
  },
  "enabled": {
    get type() { return z.boolean() },
    nameXML: "Enabled",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Доступность",
    format: undefined,
    isProperties: ()=> true,
  },
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameXML: "ExtendedTooltip",
    get typeXML() { return ZFormDecorationXML },
    nameEnterprise: "РасширеннаяПодсказка",
    format: undefined,
    isProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameXML: "Height",
    get typeXML() { return z.number() },
    nameEnterprise: "Высота",
    format: undefined,
    isProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameXML: "HorizontalAlignInGroup",
    get typeXML() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    format: undefined,
    isProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameXML: "HorizontalStretch",
    get typeXML() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    format: undefined,
    isProperties: ()=> true,
  },
  "readOnly": {
    get type() { return z.boolean() },
    nameXML: "ReadOnly",
    get typeXML() { return z.boolean() },
    nameEnterprise: "ТолькоПросмотр",
    format: undefined,
    isProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameXML: "Shortcut",
    get typeXML() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    format: undefined,
    isProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameXML: "Title",
    get typeXML() { return ZI8nTextXML },
    nameEnterprise: "Заголовок",
    format: undefined,
    isProperties: ()=> true,
  },
  "titleFont": {
    get type() { return ZFont },
    nameXML: "TitleFont",
    get typeXML() { return ZFontXML },
    nameEnterprise: "ШрифтЗаголовка",
    format: undefined,
    isProperties: ()=> true,
  },
  "titleTextColor": {
    get type() { return ZColor },
    nameXML: "TitleTextColor",
    get typeXML() { return ZColorXML },
    nameEnterprise: "ЦветТекстаЗаголовка",
    format: undefined,
    isProperties: ()=> true,
  },
  "toolTip": {
    get type() { return ZI8nText },
    nameXML: "ToolTip",
    get typeXML() { return ZI8nTextXML },
    nameEnterprise: "Подсказка",
    format: undefined,
    isProperties: ()=> true,
  },
  "toolTipRepresentation": {
    get type() { return SE.ZToolTipRepresentation },
    nameXML: "ToolTipRepresentation",
    get typeXML() { return SE.ZToolTipRepresentation },
    nameEnterprise: "ОтображениеПодсказки",
    format: undefined,
    isProperties: ()=> true,
  },
  "type": {
    get type() { return SE.ZFormGroupType },
    nameXML: "Type",
    get typeXML() { return SE.ZFormGroupType },
    nameEnterprise: "Вид",
    format: undefined,
    isProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameXML: "UserVisible",
    get typeXML() { return ZUserVisibleXML },
    nameEnterprise: "ПользовательскаяВидимость",
    format: undefined,
    isProperties: ()=> true,
  },
  "verticalAlignInGroup": {
    get type() { return SE.ZItemVerticalAlign },
    nameXML: "VerticalAlignInGroup",
    get typeXML() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    format: undefined,
    isProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameXML: "VerticalStretch",
    get typeXML() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    format: undefined,
    isProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameXML: "Visible",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Видимость",
    format: undefined,
    isProperties: ()=> true,
  },
  "width": {
    get type() { return z.number() },
    nameXML: "Width",
    get typeXML() { return z.number() },
    nameEnterprise: "Ширина",
    format: undefined,
    isProperties: ()=> true,
  },
  "childItems": {
    get type() { return ZЭлементыФормы },
    nameXML: "ChildItems",
    get typeXML() { return ZЭлементыФормыXML },
    nameEnterprise: "ПодчиненныеЭлементы",
    format: undefined,
    isProperties: ()=> true,
  },
  "backColor": {
    get type() { return ZColor },
    nameXML: "BackColor",
    get typeXML() { return ZColorXML },
    nameEnterprise: "ЦветФона",
    format: undefined,
    isProperties: ()=> true,
  },
  "childItemsHorizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameXML: "ChildItemsHorizontalAlign",
    get typeXML() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеПодчиненных",
    format: undefined,
    isProperties: ()=> true,
  },
  "childItemsVerticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameXML: "ChildItemsVerticalAlign",
    get typeXML() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеПодчиненных",
    format: undefined,
    isProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameXML: "_DisplayImportance",
    get typeXML() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    format: undefined,
    isProperties: ()=> true,
  },
  "format": {
    get type() { return ZI8nText },
    nameXML: "Format",
    get typeXML() { return ZI8nTextXML },
    nameEnterprise: "Формат",
    format: undefined,
    isProperties: ()=> true,
  },
  "group": {
    get type() { return SE.ZChildFormItemsGroup },
    nameXML: "Group",
    get typeXML() { return SE.ZChildFormItemsGroup },
    nameEnterprise: "Группировка",
    format: undefined,
    isProperties: ()=> true,
  },
  "horizontalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameXML: "HorizontalSpacing",
    get typeXML() { return SE.ZFormItemSpacing },
    nameEnterprise: "ГоризонтальныйИнтервал",
    format: undefined,
    isProperties: ()=> true,
  },
  "itemsAndTitlesAlign": {
    get type() { return SE.ZItemsAndTitlesAlignVariant },
    nameXML: "ItemsAndTitlesAlign",
    get typeXML() { return SE.ZItemsAndTitlesAlignVariant },
    nameEnterprise: "ВыравниваниеЭлементовИЗаголовков",
    format: undefined,
    isProperties: ()=> true,
  },
  "picture": {
    get type() { return ZPicture },
    nameXML: "Picture",
    get typeXML() { return ZPictureXML },
    nameEnterprise: "Картинка",
    format: undefined,
    isProperties: ()=> true,
  },
  "scrollOnCompress": {
    get type() { return z.boolean() },
    nameXML: "ScrollOnCompress",
    get typeXML() { return z.boolean() },
    nameEnterprise: "СкроллПриСжатии",
    format: undefined,
    isProperties: ()=> true,
  },
  "showTitle": {
    get type() { return z.boolean() },
    nameXML: "ShowTitle",
    get typeXML() { return z.boolean() },
    nameEnterprise: "ОтображатьЗаголовок",
    format: undefined,
    isProperties: ()=> true,
  },
  "slaveItemsWidth": {
    get type() { return SE.ZChildFormItemsWidth },
    nameXML: "SlaveItemsWidth",
    get typeXML() { return SE.ZChildFormItemsWidth },
    nameEnterprise: "ШиринаПодчиненныхЭлементов",
    format: undefined,
    isProperties: ()=> true,
  },
  "titleDataPath": {
    get type() { return z.string() },
    nameXML: "TitleDataPath",
    get typeXML() { return z.string() },
    nameEnterprise: "ПутьКДаннымЗаголовка",
    format: undefined,
    isProperties: ()=> true,
  },
  "verticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameXML: "VerticalAlign",
    get typeXML() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложение",
    format: undefined,
    isProperties: ()=> true,
  },
  "verticalScrollOnReduceSize": {
    get type() { return z.boolean() },
    nameXML: "VerticalScrollOnReduceSize",
    get typeXML() { return z.boolean() },
    nameEnterprise: "ВертикальнаяПрокруткаПриСжатии",
    format: undefined,
    isProperties: ()=> true,
  },
  "verticalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameXML: "VerticalSpacing",
    get typeXML() { return SE.ZFormItemSpacing },
    nameEnterprise: "ВертикальныйИнтервал",
    format: undefined,
    isProperties: ()=> true,
  },
}
