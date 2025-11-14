import * as z from "zod"
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZFormItemAddition, ZFormItemAdditionXML } from "../formItemAddition/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZCommandSet, ZCommandSetXML } from "~/lib/metadata/forms/commandSet/types"
import { ZSearchStringAddition, ZSearchStringAdditionXML } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ZViewStatusAddition, ZViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { ZSearchControlAddition, ZSearchControlAdditionXML } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoAddIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоВводНезаполненного",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoCommandBar": {
    get type() { return ZCommandBar },
    nameEnterprise: "АвтоКоманднаяПанель",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoInsertNewRow": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоВводНовойСтроки",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoMarkIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоОтметкаНезаполненного",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    format: undefined,
    inProperties: ()=> true,
  },
  "autoMaxHeightInTableRows": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысотаВСтрокахТаблицы",
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
  "behaviorOnHorizontalCompression": {
    get type() { return SE.ZTableBehaviorOnHorizontalCompression },
    nameEnterprise: "ПоведениеПриСжатииПоГоризонтали",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    format: undefined,
    inProperties: ()=> true,
  },
  "changeRowOrder": {
    get type() { return z.boolean() },
    nameEnterprise: "ИзменятьПорядокСтрок",
    format: undefined,
    inProperties: ()=> true,
  },
  "changeRowSet": {
    get type() { return z.boolean() },
    nameEnterprise: "ИзменятьСоставСтрок",
    format: undefined,
    inProperties: ()=> true,
  },
  "choiceMode": {
    get type() { return z.boolean() },
    nameEnterprise: "РежимВыбора",
    format: undefined,
    inProperties: ()=> true,
  },
  "commandBar": {
    get type() { return ZCommandBar },
    nameEnterprise: "КоманднаяПанель",
    format: undefined,
    inProperties: ()=> true,
  },
  "commandBarLocation": {
    get type() { return SE.ZFormItemCommandBarLabelLocation },
    nameEnterprise: "ПоложениеКоманднойПанели",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "commandSet": {
    get type() { return ZCommandSet },
    nameEnterprise: "Команда",
    format: undefined,
    inProperties: ()=> true,
  },
  "contextMenu": {
    get type() { return ZCommandBar },
    nameEnterprise: "КонтекстноеМеню",
    format: undefined,
    inProperties: ()=> true,
  },
  "currentRowUse": {
    get type() { return SE.ZTableCurrentRowUse },
    nameEnterprise: "ИспользованиеТекущейСтроки",
    format: formatSystemEnumeration,
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
  "enabled": {
    get type() { return z.boolean() },
    nameEnterprise: "Доступность",
    format: undefined,
    inProperties: ()=> true,
  },
  "enableDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьПеретаскивание",
    format: undefined,
    inProperties: ()=> true,
  },
  "enableStartDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    format: undefined,
    inProperties: ()=> true,
  },
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    format: undefined,
    inProperties: ()=> true,
  },
  "fileDragMode": {
    get type() { return SE.ZFileDragMode },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    format: undefined,
    inProperties: ()=> true,
  },
  "footer": {
    get type() { return z.boolean() },
    nameEnterprise: "Подвал",
    format: undefined,
    inProperties: ()=> true,
  },
  "footerHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаПодвала",
    format: undefined,
    inProperties: ()=> true,
  },
  "header": {
    get type() { return z.boolean() },
    nameEnterprise: "Шапка",
    format: undefined,
    inProperties: ()=> true,
  },
  "headerHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаШапки",
    format: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
    format: undefined,
    inProperties: ()=> true,
  },
  "heightControlVariant": {
    get type() { return SE.ZTableHeightControlVariant },
    nameEnterprise: "ВариантУправленияВысотой",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "heightInTableRows": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаВСтрокахТаблицы",
    format: undefined,
    inProperties: ()=> true,
  },
  "horizontalAlignInGroup": {
    get type() { return SE.ZItemHorizontalLocation },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "horizontalLines": {
    get type() { return z.boolean() },
    nameEnterprise: "ГоризонтальныеЛинии",
    format: undefined,
    inProperties: ()=> true,
  },
  "horizontalScrollBar": {
    get type() { return SE.ZScrollBarUse },
    nameEnterprise: "ГоризонтальнаяПолосаПрокрутки",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    format: undefined,
    inProperties: ()=> true,
  },
  "initialListView": {
    get type() { return SE.ZInitialListView },
    nameEnterprise: "НачальноеОтображениеСписка",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "initialTreeView": {
    get type() { return SE.ZInitialTreeView },
    nameEnterprise: "НачальноеОтображениеДерева",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "markIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтметкаНезаполненного",
    format: undefined,
    inProperties: ()=> true,
  },
  "maxHeight": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    format: undefined,
    inProperties: ()=> true,
  },
  "maxHeightInTableRows": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысотаВСтрокахТаблицы",
    format: undefined,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    format: undefined,
    inProperties: ()=> true,
  },
  "multipleChoice": {
    get type() { return z.boolean() },
    nameEnterprise: "МножественныйВыбор",
    format: undefined,
    inProperties: ()=> true,
  },
  "output": {
    get type() { return SE.ZUseOutput },
    nameEnterprise: "Вывод",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "readOnly": {
    get type() { return z.boolean() },
    nameEnterprise: "ТолькоПросмотр",
    format: undefined,
    inProperties: ()=> true,
  },
  "refreshRequest": {
    get type() { return SE.ZRefreshRequestMethod },
    nameEnterprise: "ЗапросОбновления",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "representation": {
    get type() { return SE.ZTableRepresentation },
    nameEnterprise: "Отображение",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "rowInputMode": {
    get type() { return SE.ZTableRowInputMode },
    nameEnterprise: "РежимВводаСтрок",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "rowPictureDataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДаннымКартинкиСтроки",
    format: undefined,
    inProperties: ()=> true,
  },
  "rowSelectionMode": {
    get type() { return SE.ZTableRowSelectionMode },
    nameEnterprise: "РежимВыделенияСтроки",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "rowsPicture": {
    get type() { return z.boolean() },
    nameEnterprise: "КартинкаСтрок",
    format: undefined,
    inProperties: ()=> true,
  },
  "searchControl": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "УправлениеПоиском",
    format: undefined,
    inProperties: ()=> true,
  },
  "searchControlAddition": {
    get type() { return ZSearchControlAddition },
    nameEnterprise: "УправлениеПоиском",
    format: undefined,
    inProperties: ()=> true,
  },
  "searchControlLocation": {
    get type() { return SE.ZSearchControlLocation },
    nameEnterprise: "ПоложениеУправленияПоиском",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "searchOnInput": {
    get type() { return SE.ZSearchInTableOnInput },
    nameEnterprise: "ПоискПриВводе",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "searchStringAddition": {
    get type() { return ZSearchStringAddition },
    nameEnterprise: "ПоложениеПоисковогоСтроки",
    format: undefined,
    inProperties: ()=> true,
  },
  "searchStringLocation": {
    get type() { return SE.ZSearchStringLocation },
    nameEnterprise: "ПоложениеСтрокиПоиска",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "searchStringRepresentation": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "ОтображениеСтрокиПоиска",
    format: undefined,
    inProperties: ()=> true,
  },
  "selectionMode": {
    get type() { return SE.ZTableSelectionMode },
    nameEnterprise: "РежимВыделения",
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
  "useAlternationRowColor": {
    get type() { return z.boolean() },
    nameEnterprise: "ЧередованиеЦветовСтрок",
    format: undefined,
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
  "verticalLines": {
    get type() { return z.boolean() },
    nameEnterprise: "ВертикальныеЛинии",
    format: undefined,
    inProperties: ()=> true,
  },
  "verticalScrollBar": {
    get type() { return SE.ZScrollBarUse },
    nameEnterprise: "ВертикальнаяПолосаПрокрутки",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    format: undefined,
    inProperties: ()=> true,
  },
  "viewStatusAddition": {
    get type() { return ZViewStatusAddition },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    format: undefined,
    inProperties: ()=> true,
  },
  "viewStatusLocation": {
    get type() { return SE.ZViewStatusLocation },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    format: formatSystemEnumeration,
    inProperties: ()=> true,
  },
  "viewStatusRepresentation": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "ОтображениеСостоянияПросмотра",
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
}

registerElementRules(ZElementType.enum.Table, rules)