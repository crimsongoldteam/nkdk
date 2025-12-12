
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZBorder, ZBorderXML } from "~/lib/metadata/commonObjects/border/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "autoMaxWidth": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "contextMenu": {
    get type() { return ZCommandBar },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZDisplayImportanceEnterprise },
    inProperties: ()=> true,
  },
  "enabled": {
    get type() { return z.boolean() },
    nameEnterprise: "Доступность",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZItemHorizontalLocationEnterprise },
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "maxHeight": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "skipOnInput": {
    get type() { return z.boolean() },
    nameEnterprise: "ПропускатьПриВводе",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "textColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: ()=> true,
  },
  "toolTip": {
    get type() { return ZI8nText },
    nameEnterprise: "Подсказка",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: ()=> true,
  },
  "toolTipRepresentation": {
    get type() { return SE.ZToolTipRepresentation },
    nameEnterprise: "ОтображениеПодсказки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZToolTipRepresentationEnterprise },
    inProperties: ()=> true,
  },
  "type": {
    get type() { return SE.ZFormDecorationType },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZFormDecorationTypeEnterprise },
    inProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameEnterprise: "ПользовательскаяВидимость",
    formatProperties: formatUserVisible,
    parseProperties: parseUserVisible,
    inProperties: ()=> true,
  },
  "verticalAlignInGroup": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZItemVerticalAlignEnterprise },
    inProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "width": {
    get type() { return z.number() },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "border": {
    get type() { return ZBorder },
    nameEnterprise: "Рамка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "enableDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьПеретаскивание",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "enableStartDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "fileDragMode": {
    get type() { return SE.ZFileDragMode },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZFileDragModeEnterprise },
    inProperties: ()=> true,
  },
  "hyperlink": {
    get type() { return z.boolean() },
    nameEnterprise: "Гиперссылка",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
  "nonselectedPictureText": {
    get type() { return z.string() },
    nameEnterprise: "ТекстНевыбраннойКартинки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "picture": {
    get type() { return ZPicture },
    nameEnterprise: "Картинка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "pictureSize": {
    get type() { return SE.ZPictureSize },
    nameEnterprise: "РазмерКартинки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() { return SE.ZPictureSizeEnterprise },
    inProperties: ()=> true,
  },
  "scale": {
    get type() { return z.number() },
    nameEnterprise: "Масштаб",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "zoomable": {
    get type() { return z.boolean() },
    nameEnterprise: "Масштабировать",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.PictureDecoration, rules)