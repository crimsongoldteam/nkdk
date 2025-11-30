import * as z from "zod"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types"
import { ZTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import type { TElementRules } from "~/lib/rulesManager/types"
import { ZCommandBar } from "../commandBar/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZTable } from "../table/types"
import { ZElementType } from "../types"

const rules: TElementRules = {
  autoCellHeight: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоВысотаЯчейки",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  cellHyperlink: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ГиперссылкаЯчейки",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  editMode: {
    get type() {
      return SE.ZColumnEditMode
    },
    nameEnterprise: "РежимРедактирования",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZColumnEditModeEnterprise
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
  extendedTooltip: {
    get type() {
      return ZFormDecoration
    },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  fixingInTable: {
    get type() {
      return SE.ZFixingInTable
    },
    nameEnterprise: "ФиксацияВТаблице",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFixingInTableEnterprise
    },
    inProperties: () => true,
  },
  footerBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  footerDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  footerFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  footerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВПодвале",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
    inProperties: () => true,
  },
  footerPicture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "КартинкаПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  footerText: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ТекстПодвала",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: () => true,
  },
  footerTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаПодвала",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  headerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВШапке",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
    inProperties: () => true,
  },
  headerPicture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "КартинкаШапки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  horizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
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
  readOnly: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  showInFooter: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьВПодвале",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  showInHeader: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьВШапке",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  table: {
    get type() {
      return ZTable
    },
    nameEnterprise: "Таблица",
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
  titleBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
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
  type: {
    get type() {
      return SE.ZFormFieldType
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormFieldTypeEnterprise
    },
    inProperties: () => true,
  },
  typeRestriction: {
    get type() {
      return ZTypeDescription
    },
    nameEnterprise: "ОграничениеТипа",
    formatProperties: undefined,
    parseProperties: undefined,
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
  verticalAlign: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise
    },
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
  visible: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  warningOnEdit: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ПредупреждениеПриРедактировании",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: () => true,
  },
  warningOnEditRepresentation: {
    get type() {
      return SE.ZWarningOnEditRepresentation
    },
    nameEnterprise: "ОтображениеПредупрежденияПриРедактировании",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZWarningOnEditRepresentationEnterprise
    },
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.FormField, rules)
