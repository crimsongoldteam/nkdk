import * as z from "zod"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZCommandSet } from "~/lib/metadata/forms/commandSet/types"
import { ZSearchControlAddition } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { ZSearchStringAddition } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ZViewStatusAddition } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRules } from "~/lib/rulesManager/types"
import { ZCommandBar } from "../commandBar/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZFormItemAddition } from "../formItemAddition/types"
import { ZElementType } from "../types"
import "./registration"

const rules: TElementRules = {
  autoAddIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоВводНезаполненного",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  autoCommandBar: {
    get type() {
      return ZCommandBar
    },
    nameEnterprise: "АвтоКоманднаяПанель",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  autoInsertNewRow: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоВводНовойСтроки",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  autoMarkIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоОтметкаНезаполненного",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  autoMaxHeight: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  autoMaxHeightInTableRows: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяВысотаВСтрокахТаблицы",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  autoMaxWidth: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  backColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФона",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  behaviorOnHorizontalCompression: {
    get type() {
      return SE.ZTableBehaviorOnHorizontalCompression
    },
    nameEnterprise: "ПоведениеПриСжатииПоГоризонтали",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableBehaviorOnHorizontalCompressionEnterprise
    },
    inProperties: () => true,
  },
  borderColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  changeRowOrder: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ИзменятьПорядокСтрок",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  changeRowSet: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ИзменятьСоставСтрок",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  choiceMode: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РежимВыбора",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  commandBar: {
    get type() {
      return ZCommandBar
    },
    nameEnterprise: "КоманднаяПанель",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  commandBarLocation: {
    get type() {
      return SE.ZFormItemCommandBarLabelLocation
    },
    nameEnterprise: "ПоложениеКоманднойПанели",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemCommandBarLabelLocationEnterprise
    },
    inProperties: () => true,
  },
  commandSet: {
    get type() {
      return ZCommandSet
    },
    nameEnterprise: "Команда",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  contextMenu: {
    get type() {
      return ZCommandBar
    },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  currentRowUse: {
    get type() {
      return SE.ZTableCurrentRowUse
    },
    nameEnterprise: "ИспользованиеТекущейСтроки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableCurrentRowUseEnterprise
    },
    inProperties: () => true,
  },
  dataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДанным",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  defaultItem: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АктивизироватьПоУмолчанию",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  displayImportance: {
    get type() {
      return SE.ZDisplayImportance
    },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZDisplayImportanceEnterprise
    },
    inProperties: () => true,
  },
  enabled: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Доступность",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  enableDrag: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьПеретаскивание",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  enableStartDrag: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  extendedTooltip: {
    get type() {
      return ZFormDecoration
    },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  fileDragMode: {
    get type() {
      return SE.ZFileDragMode
    },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFileDragModeEnterprise
    },
    inProperties: () => true,
  },
  font: {
    get type() {
      return ZFont
    },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  footer: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Подвал",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  footerHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  header: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Шапка",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  headerHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаШапки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  height: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Высота",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  heightControlVariant: {
    get type() {
      return SE.ZTableHeightControlVariant
    },
    nameEnterprise: "ВариантУправленияВысотой",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableHeightControlVariantEnterprise
    },
    inProperties: () => true,
  },
  heightInTableRows: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаВСтрокахТаблицы",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  horizontalAlignInGroup: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
    inProperties: () => true,
  },
  horizontalLines: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ГоризонтальныеЛинии",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  horizontalScrollBar: {
    get type() {
      return SE.ZScrollBarUse
    },
    nameEnterprise: "ГоризонтальнаяПолосаПрокрутки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZScrollBarUseEnterprise
    },
    inProperties: () => true,
  },
  horizontalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  initialListView: {
    get type() {
      return SE.ZInitialListView
    },
    nameEnterprise: "НачальноеОтображениеСписка",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZInitialListViewEnterprise
    },
    inProperties: () => true,
  },
  initialTreeView: {
    get type() {
      return SE.ZInitialTreeView
    },
    nameEnterprise: "НачальноеОтображениеДерева",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZInitialTreeViewEnterprise
    },
    inProperties: () => true,
  },
  markIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтметкаНезаполненного",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  maxHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  maxHeightInTableRows: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяВысотаВСтрокахТаблицы",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  maxWidth: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  multipleChoice: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "МножественныйВыбор",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  output: {
    get type() {
      return SE.ZUseOutput
    },
    nameEnterprise: "Вывод",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZUseOutputEnterprise
    },
    inProperties: () => true,
  },
  readOnly: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  refreshRequest: {
    get type() {
      return SE.ZRefreshRequestMethod
    },
    nameEnterprise: "ЗапросОбновления",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZRefreshRequestMethodEnterprise
    },
    inProperties: () => true,
  },
  representation: {
    get type() {
      return SE.ZTableRepresentation
    },
    nameEnterprise: "Отображение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableRepresentationEnterprise
    },
    inProperties: () => true,
  },
  rowInputMode: {
    get type() {
      return SE.ZTableRowInputMode
    },
    nameEnterprise: "РежимВводаСтрок",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableRowInputModeEnterprise
    },
    inProperties: () => true,
  },
  rowPictureDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымКартинкиСтроки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  rowSelectionMode: {
    get type() {
      return SE.ZTableRowSelectionMode
    },
    nameEnterprise: "РежимВыделенияСтроки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableRowSelectionModeEnterprise
    },
    inProperties: () => true,
  },
  rowsPicture: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КартинкаСтрок",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  searchControl: {
    get type() {
      return ZFormItemAddition
    },
    nameEnterprise: "УправлениеПоиском",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  searchControlAddition: {
    get type() {
      return ZSearchControlAddition
    },
    nameEnterprise: "УправлениеПоиском",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  searchControlLocation: {
    get type() {
      return SE.ZSearchControlLocation
    },
    nameEnterprise: "ПоложениеУправленияПоиском",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZSearchControlLocationEnterprise
    },
    inProperties: () => true,
  },
  searchOnInput: {
    get type() {
      return SE.ZSearchInTableOnInput
    },
    nameEnterprise: "ПоискПриВводе",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZSearchInTableOnInputEnterprise
    },
    inProperties: () => true,
  },
  searchStringAddition: {
    get type() {
      return ZSearchStringAddition
    },
    nameEnterprise: "ПоложениеПоисковогоСтроки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  searchStringLocation: {
    get type() {
      return SE.ZSearchStringLocation
    },
    nameEnterprise: "ПоложениеСтрокиПоиска",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZSearchStringLocationEnterprise
    },
    inProperties: () => true,
  },
  searchStringRepresentation: {
    get type() {
      return ZFormItemAddition
    },
    nameEnterprise: "ОтображениеСтрокиПоиска",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  selectionMode: {
    get type() {
      return SE.ZTableSelectionMode
    },
    nameEnterprise: "РежимВыделения",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTableSelectionModeEnterprise
    },
    inProperties: () => true,
  },
  shortcut: {
    get type() {
      return z.string()
    },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  skipOnInput: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ПропускатьПриВводе",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  textColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  title: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: () => true,
  },
  titleFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  titleHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  titleLocation: {
    get type() {
      return SE.ZFormItemTitleLocation
    },
    nameEnterprise: "ПоложениеЗаголовка",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemTitleLocationEnterprise
    },
    inProperties: () => true,
  },
  titleTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  toolTip: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Подсказка",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: () => true,
  },
  toolTipRepresentation: {
    get type() {
      return SE.ZToolTipRepresentation
    },
    nameEnterprise: "ОтображениеПодсказки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZToolTipRepresentationEnterprise
    },
    inProperties: () => true,
  },
  useAlternationRowColor: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ЧередованиеЦветовСтрок",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  userVisible: {
    get type() {
      return ZUserVisible
    },
    nameEnterprise: "ПользовательскаяВидимость",
    formatProperties: formatUserVisible,
    parseProperties: parseUserVisible,
    inProperties: () => true,
  },
  verticalAlignInGroup: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise
    },
    inProperties: () => true,
  },
  verticalLines: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ВертикальныеЛинии",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  verticalScrollBar: {
    get type() {
      return SE.ZScrollBarUse
    },
    nameEnterprise: "ВертикальнаяПолосаПрокрутки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZScrollBarUseEnterprise
    },
    inProperties: () => true,
  },
  verticalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  viewStatusAddition: {
    get type() {
      return ZViewStatusAddition
    },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  viewStatusLocation: {
    get type() {
      return SE.ZViewStatusLocation
    },
    nameEnterprise: "ПоложениеСостоянияПросмотра",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZViewStatusLocationEnterprise
    },
    inProperties: () => true,
  },
  viewStatusRepresentation: {
    get type() {
      return ZFormItemAddition
    },
    nameEnterprise: "ОтображениеСостоянияПросмотра",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  visible: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  width: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  childItems: {
    get type() {
      return ZЭлементыФормы
    },
    nameEnterprise: "ПодчиненныеЭлементы",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.Table, rules)
