import * as z from "zod"
import { TElementRules } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"


export const ZPictureDecorationRules: TElementRules = {
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameXML: "AutoMaxHeight",
    get typeXML() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    format: undefined,
    isProperties: ()=> true,
  },
  "autoMaxWidth": {
    get type() { return z.boolean() },
    nameXML: "AutoMaxWidth",
    get typeXML() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    format: undefined,
    isProperties: ()=> true,
  },
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
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameXML: "ExtendedTooltip",
    get typeXML() { return ZFormDecorationXML },
    nameEnterprise: "РасширеннаяПодсказка",
    format: undefined,
    isProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameXML: "Font",
    get typeXML() { return ZFontXML },
    nameEnterprise: "Шрифт",
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
  "maxHeight": {
    get type() { return z.number() },
    nameXML: "MaxHeight",
    get typeXML() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    format: undefined,
    isProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameXML: "MaxWidth",
    get typeXML() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
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
  "skipOnInput": {
    get type() { return z.boolean() },
    nameXML: "SkipOnInput",
    get typeXML() { return z.boolean() },
    nameEnterprise: "ПропускатьПриВводе",
    format: undefined,
    isProperties: ()=> true,
  },
  "textColor": {
    get type() { return ZColor },
    nameXML: "TextColor",
    get typeXML() { return ZColorXML },
    nameEnterprise: "ЦветТекста",
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
    get type() { return SE.ZFormDecorationType },
    nameXML: "Type",
    get typeXML() { return SE.ZFormDecorationType },
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
  "border": {
    get type() { return ZBorder },
    nameXML: "Border",
    get typeXML() { return ZBorderXML },
    nameEnterprise: "Рамка",
    format: undefined,
    isProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameXML: "BorderColor",
    get typeXML() { return ZColorXML },
    nameEnterprise: "ЦветРамки",
    format: undefined,
    isProperties: ()=> true,
  },
  "enableDrag": {
    get type() { return z.boolean() },
    nameXML: "EnableDrag",
    get typeXML() { return z.boolean() },
    nameEnterprise: "РазрешитьПеретаскивание",
    format: undefined,
    isProperties: ()=> true,
  },
  "enableStartDrag": {
    get type() { return z.boolean() },
    nameXML: "EnableStartDrag",
    get typeXML() { return z.boolean() },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    format: undefined,
    isProperties: ()=> true,
  },
  "fileDragMode": {
    get type() { return SE.ZFileDragMode },
    nameXML: "FileDragMode",
    get typeXML() { return SE.ZFileDragMode },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    format: undefined,
    isProperties: ()=> true,
  },
  "hyperlink": {
    get type() { return z.boolean() },
    nameXML: "Hyperlink",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Гиперссылка",
    format: undefined,
    isProperties: ()=> true,
  },
  "nonselectedPictureText": {
    get type() { return z.string() },
    nameXML: "NonselectedPictureText",
    get typeXML() { return z.string() },
    nameEnterprise: "ТекстНевыбраннойКартинки",
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
  "pictureSize": {
    get type() { return SE.ZPictureSize },
    nameXML: "PictureSize",
    get typeXML() { return SE.ZPictureSize },
    nameEnterprise: "РазмерКартинки",
    format: undefined,
    isProperties: ()=> true,
  },
  "scale": {
    get type() { return z.number() },
    nameXML: "Scale",
    get typeXML() { return z.number() },
    nameEnterprise: "Масштаб",
    format: undefined,
    isProperties: ()=> true,
  },
  "zoomable": {
    get type() { return z.boolean() },
    nameXML: "Zoomable",
    get typeXML() { return z.boolean() },
    nameEnterprise: "Масштабировать",
    format: undefined,
    isProperties: ()=> true,
  },
}
