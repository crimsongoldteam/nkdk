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
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "enableContentChange": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьИзменениеСостава",
    format: undefined,
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
  "readOnly": {
    get type() { return z.boolean() },
    nameEnterprise: "ТолькоПросмотр",
    format: undefined,
    inProperties: ()=> true,
  },
  "shortcut": {
    get type() { return z.string() },
    nameEnterprise: "СочетаниеКлавиш",
    format: undefined,
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleFont": {
    get type() { return ZFont },
    nameEnterprise: "ШрифтЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleTextColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекстаЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "toolTip": {
    get type() { return ZI8nText },
    nameEnterprise: "Подсказка",
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
    get type() { return SE.ZFormGroupType },
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
  "childItems": {
    get type() { return ZЭлементыФормы },
    nameEnterprise: "ПодчиненныеЭлементы",
    format: undefined,
    inProperties: ()=> true,
  },
  "backColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФона",
    format: undefined,
    inProperties: ()=> true,
  },
  "childItemsHorizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеПодчиненных",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "childItemsVerticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеПодчиненных",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "displayImportance": {
    get type() { return SE.ZDisplayImportance },
    nameEnterprise: "ВажностьПриОтображении",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "format": {
    get type() { return ZI8nText },
    nameEnterprise: "Формат",
    format: undefined,
    inProperties: ()=> true,
  },
  "group": {
    get type() { return SE.ZChildFormItemsGroup },
    nameEnterprise: "Группировка",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "horizontalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameEnterprise: "ГоризонтальныйИнтервал",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "itemsAndTitlesAlign": {
    get type() { return SE.ZItemsAndTitlesAlignVariant },
    nameEnterprise: "ВыравниваниеЭлементовИЗаголовков",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "picture": {
    get type() { return ZPicture },
    nameEnterprise: "Картинка",
    format: undefined,
    inProperties: ()=> true,
  },
  "scrollOnCompress": {
    get type() { return z.boolean() },
    nameEnterprise: "СкроллПриСжатии",
    format: undefined,
    inProperties: ()=> true,
  },
  "showTitle": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтображатьЗаголовок",
    format: undefined,
    inProperties: ()=> true,
  },
  "slaveItemsWidth": {
    get type() { return SE.ZChildFormItemsWidth },
    nameEnterprise: "ШиринаПодчиненныхЭлементов",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "titleDataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДаннымЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "verticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложение",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "verticalScrollOnReduceSize": {
    get type() { return z.boolean() },
    nameEnterprise: "ВертикальнаяПрокруткаПриСжатии",
    format: undefined,
    inProperties: ()=> true,
  },
  "verticalSpacing": {
    get type() { return SE.ZFormItemSpacing },
    nameEnterprise: "ВертикальныйИнтервал",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.Page, rules)