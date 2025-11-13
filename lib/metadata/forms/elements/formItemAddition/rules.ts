import * as z from "zod"
import { TElementRules } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"


export const ZFormItemAdditionRules: TElementRules = {
  "contextMenu": {
    get type() { return ZCommandBar },
    nameXML: "ContextMenu",
    get typeXML() { return ZCommandBarXML },
    nameEnterprise: "КонтекстноеМеню",
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
  "enabled": {
    get type() { return z.boolean() },
    nameXML: "Enabled",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Доступность",
    format: undefined,
    isProperties: ()=> true,
  },
  "extendedToolTip": {
    get type() { return ZFormDecoration },
    nameXML: "ExtendedToolTip",
    get typeXML() { return ZFormDecorationXML },
    nameEnterprise: "РасширеннаяПодсказка",
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
  "title": {
    get type() { return ZI8nText },
    nameXML: "Title",
    get typeXML() { return ZI8nTextXML },
    nameEnterprise: "Заголовок",
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
    get type() { return SE.ZFormItemAdditionType },
    nameXML: "Type",
    get typeXML() { return SE.ZFormItemAdditionType },
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
  "visible": {
    get type() { return z.boolean() },
    nameXML: "Visible",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Видимость",
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
}
