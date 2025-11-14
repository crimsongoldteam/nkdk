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
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { formatBoolean } from "~/lib/format/formatBool"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "autoAddIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоВводНезаполненного",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "autoCommandBar": {
    get type() { return ZCommandBar },
    nameEnterprise: "АвтоКоманднаяПанель",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "autoInsertNewRow": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоВводНовойСтроки",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "autoMarkIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоОтметкаНезаполненного",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "autoMaxHeight": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "autoMaxHeightInTableRows": {
    get type() { return z.boolean() },
    nameEnterprise: "АвтоМаксимальнаяВысотаВСтрокахТаблицы",
    formatProperties: formatBoolean,
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
  "behaviorOnHorizontalCompression": {
    get type() { return SE.ZTableBehaviorOnHorizontalCompression },
    nameEnterprise: "ПоведениеПриСжатииПоГоризонтали",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableBehaviorOnHorizontalCompressionEnterprise },
    inProperties: ()=> true,
  },
  "borderColor": {
    get type() { return ZColor },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "changeRowOrder": {
    get type() { return z.boolean() },
    nameEnterprise: "ИзменятьПорядокСтрок",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "changeRowSet": {
    get type() { return z.boolean() },
    nameEnterprise: "ИзменятьСоставСтрок",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "choiceMode": {
    get type() { return z.boolean() },
    nameEnterprise: "РежимВыбора",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "commandBar": {
    get type() { return ZCommandBar },
    nameEnterprise: "КоманднаяПанель",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "commandBarLocation": {
    get type() { return SE.ZFormItemCommandBarLabelLocation },
    nameEnterprise: "ПоложениеКоманднойПанели",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormItemCommandBarLabelLocationEnterprise },
    inProperties: ()=> true,
  },
  "commandSet": {
    get type() { return ZCommandSet },
    nameEnterprise: "Команда",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "contextMenu": {
    get type() { return ZCommandBar },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "currentRowUse": {
    get type() { return SE.ZTableCurrentRowUse },
    nameEnterprise: "ИспользованиеТекущейСтроки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableCurrentRowUseEnterprise },
    inProperties: ()=> true,
  },
  "dataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДанным",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "defaultItem": {
    get type() { return z.boolean() },
    nameEnterprise: "АктивизироватьПоУмолчанию",
    formatProperties: formatBoolean,
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
  "enableDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьПеретаскивание",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "enableStartDrag": {
    get type() { return z.boolean() },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "extendedTooltip": {
    get type() { return ZFormDecoration },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "fileDragMode": {
    get type() { return SE.ZFileDragMode },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFileDragModeEnterprise },
    inProperties: ()=> true,
  },
  "font": {
    get type() { return ZFont },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "footer": {
    get type() { return z.boolean() },
    nameEnterprise: "Подвал",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "footerHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаПодвала",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "header": {
    get type() { return z.boolean() },
    nameEnterprise: "Шапка",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "headerHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаШапки",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "height": {
    get type() { return z.number() },
    nameEnterprise: "Высота",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "heightControlVariant": {
    get type() { return SE.ZTableHeightControlVariant },
    nameEnterprise: "ВариантУправленияВысотой",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableHeightControlVariantEnterprise },
    inProperties: ()=> true,
  },
  "heightInTableRows": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаВСтрокахТаблицы",
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
  "horizontalLines": {
    get type() { return z.boolean() },
    nameEnterprise: "ГоризонтальныеЛинии",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "horizontalScrollBar": {
    get type() { return SE.ZScrollBarUse },
    nameEnterprise: "ГоризонтальнаяПолосаПрокрутки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZScrollBarUseEnterprise },
    inProperties: ()=> true,
  },
  "horizontalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "initialListView": {
    get type() { return SE.ZInitialListView },
    nameEnterprise: "НачальноеОтображениеСписка",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZInitialListViewEnterprise },
    inProperties: ()=> true,
  },
  "initialTreeView": {
    get type() { return SE.ZInitialTreeView },
    nameEnterprise: "НачальноеОтображениеДерева",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZInitialTreeViewEnterprise },
    inProperties: ()=> true,
  },
  "markIncomplete": {
    get type() { return z.boolean() },
    nameEnterprise: "ОтметкаНезаполненного",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "maxHeight": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "maxHeightInTableRows": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяВысотаВСтрокахТаблицы",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "maxWidth": {
    get type() { return z.number() },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "multipleChoice": {
    get type() { return z.boolean() },
    nameEnterprise: "МножественныйВыбор",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "output": {
    get type() { return SE.ZUseOutput },
    nameEnterprise: "Вывод",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZUseOutputEnterprise },
    inProperties: ()=> true,
  },
  "readOnly": {
    get type() { return z.boolean() },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "refreshRequest": {
    get type() { return SE.ZRefreshRequestMethod },
    nameEnterprise: "ЗапросОбновления",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZRefreshRequestMethodEnterprise },
    inProperties: ()=> true,
  },
  "representation": {
    get type() { return SE.ZTableRepresentation },
    nameEnterprise: "Отображение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableRepresentationEnterprise },
    inProperties: ()=> true,
  },
  "rowInputMode": {
    get type() { return SE.ZTableRowInputMode },
    nameEnterprise: "РежимВводаСтрок",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableRowInputModeEnterprise },
    inProperties: ()=> true,
  },
  "rowPictureDataPath": {
    get type() { return z.string() },
    nameEnterprise: "ПутьКДаннымКартинкиСтроки",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "rowSelectionMode": {
    get type() { return SE.ZTableRowSelectionMode },
    nameEnterprise: "РежимВыделенияСтроки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableRowSelectionModeEnterprise },
    inProperties: ()=> true,
  },
  "rowsPicture": {
    get type() { return z.boolean() },
    nameEnterprise: "КартинкаСтрок",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "searchControl": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "УправлениеПоиском",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "searchControlAddition": {
    get type() { return ZSearchControlAddition },
    nameEnterprise: "УправлениеПоиском",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "searchControlLocation": {
    get type() { return SE.ZSearchControlLocation },
    nameEnterprise: "ПоложениеУправленияПоиском",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZSearchControlLocationEnterprise },
    inProperties: ()=> true,
  },
  "searchOnInput": {
    get type() { return SE.ZSearchInTableOnInput },
    nameEnterprise: "ПоискПриВводе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZSearchInTableOnInputEnterprise },
    inProperties: ()=> true,
  },
  "searchStringAddition": {
    get type() { return ZSearchStringAddition },
    nameEnterprise: "ПоложениеПоисковогоСтроки",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "searchStringLocation": {
    get type() { return SE.ZSearchStringLocation },
    nameEnterprise: "ПоложениеСтрокиПоиска",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZSearchStringLocationEnterprise },
    inProperties: ()=> true,
  },
  "searchStringRepresentation": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "ОтображениеСтрокиПоиска",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "selectionMode": {
    get type() { return SE.ZTableSelectionMode },
    nameEnterprise: "РежимВыделения",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZTableSelectionModeEnterprise },
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
  "titleFont": {
    get type() { return ZFont },
    nameEnterprise: "ШрифтЗаголовка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "titleHeight": {
    get type() { return z.number() },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "titleLocation": {
    get type() { return SE.ZFormItemTitleLocation },
    nameEnterprise: "ПоложениеЗаголовка",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZFormItemTitleLocationEnterprise },
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
  "useAlternationRowColor": {
    get type() { return z.boolean() },
    nameEnterprise: "ЧередованиеЦветовСтрок",
    formatProperties: formatBoolean,
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
  "verticalLines": {
    get type() { return z.boolean() },
    nameEnterprise: "ВертикальныеЛинии",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "verticalScrollBar": {
    get type() { return SE.ZScrollBarUse },
    nameEnterprise: "ВертикальнаяПолосаПрокрутки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZScrollBarUseEnterprise },
    inProperties: ()=> true,
  },
  "verticalStretch": {
    get type() { return z.boolean() },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    inProperties: ()=> true,
  },
  "viewStatusAddition": {
    get type() { return ZViewStatusAddition },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    formatProperties: undefined,
    inProperties: ()=> true,
  },
  "viewStatusLocation": {
    get type() { return SE.ZViewStatusLocation },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() { return SE.ZViewStatusLocationEnterprise },
    inProperties: ()=> true,
  },
  "viewStatusRepresentation": {
    get type() { return ZFormItemAddition },
    nameEnterprise: "ОтображениеСостоянияПросмотра",
    formatProperties: undefined,
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
}

registerElementRules(ZElementType.enum.Table, rules)