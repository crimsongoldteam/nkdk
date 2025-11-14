import * as z from "zod"
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZTable, ZTableXML } from "../table/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoCellHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоВысотаЯчейки",
    format: undefined,
    inProperties: ()=> true,
  },
  "cellHyperlink": {
    get type() { return z.boolean() },
    nameEnterprise: "ГиперссылкаЯчейки",
    format: undefined,
    inProperties: ()=> true,
  },
  "contextMenu": {
    get type() { return ZCommandBar },
    nameEnterprise: "КонтекстноеМеню",
    format: undefined,
    inProperties: ()=> true,
  },
  "dataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДанным",
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
  "editMode": {
    get type() { return SE.ZColumnEditMode },
    nameEnterprise: "РежимРедактирования",
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
  "fixingInTable": {
    get type() { return SE.ZFixingInTable },
    nameEnterprise: "ФиксацияВТаблице",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "footerBackColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФонаПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerDataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДаннымПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerFont": {
    get type() { return ZFont },
    nameEnterprise: "ШрифтПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerHorizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВПодвале",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "footerPicture": {
    get type() { return ZPicture },
    nameEnterprise: "КартинкаПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerText": {
    get type() { return ZI8nText },
    nameEnterprise: "ТекстПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerTextColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветТекстаПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "headerHorizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВШапке",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "headerPicture": {
    get type() { return ZPicture },
    nameEnterprise: "КартинкаШапки",
    format: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlign": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложение",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
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
  "showInFooter": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтображатьВПодвале",
    format: undefined,
    inProperties: ()=> true,
  },
  "showInHeader": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтображатьВШапке",
    format: undefined,
    inProperties: ()=> true,
  },
  "skipOnInput": {
    get type() { return z.boolean() },
    nameEnterprise: "ПропускатьПриВводе",
    format: undefined,
    inProperties: ()=> true,
  },
  "table": {
    get type() { return ZTable },
    nameEnterprise: "Таблица",
    format: undefined,
    inProperties: ()=> true,
  },
  "title": {
    get type() { return ZI8nText },
    nameEnterprise: "Заголовок",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleBackColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветФонаЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleFont": {
    get type() { return ZFont },
    nameEnterprise: "ШрифтЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаЗаголовка",
    format: undefined,
    inProperties: ()=> true,
  },
  "titleLocation": {
    get type() { return SE.ZFormItemTitleLocation },
    nameEnterprise: "ПоложениеЗаголовка",
    format: formatSystemEnumeration,
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
    get type() { return SE.ZFormFieldType },
    nameEnterprise: "Вид",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "typeRestriction": {
    get type() { return ZTypeDescription },
    nameEnterprise: "ОграничениеТипа",
    format: undefined,
    inProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameEnterprise: "ПользовательскаяВидимость",
    format: undefined,
    inProperties: ()=> true,
  },
  "verticalAlign": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложение",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "verticalAlignInGroup": {
    get type() { return SE.ZItemVerticalAlign },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "visible": {
    get type() { return z.boolean() },
    nameEnterprise: "Видимость",
    format: undefined,
    inProperties: ()=> true,
  },
  "warningOnEdit": {
    get type() { return ZI8nText },
    nameEnterprise: "ПредупреждениеПриРедактировании",
    format: undefined,
    inProperties: ()=> true,
  },
  "warningOnEditRepresentation": {
    get type() { return SE.ZWarningOnEditRepresentation },
    nameEnterprise: "ОтображениеПредупрежденияПриРедактировании",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
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
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    format: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
    format: undefined,
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    format: undefined,
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
  "output": {
    get type() { return SE.ZUseOutput },
    nameEnterprise: "Вывод",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
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

registerElementRules(ZElementType.enum.GeographicalSchemaField, rules)