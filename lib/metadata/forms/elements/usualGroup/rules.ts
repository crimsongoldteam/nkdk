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
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRules } from "~/lib/rulesManager/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZTable } from "../table/types"
import { ZElementType } from "../types"

const rules: TElementRules = {
  enableContentChange: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьИзменениеСостава",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  height: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Высота",
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
  horizontalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
      return SE.ZFormGroupType
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormGroupTypeEnterprise
    },
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
  verticalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  associatedTable: {
    get type() {
      return ZTable
    },
    nameEnterprise: "ИспользуемаяТаблица",
    formatProperties: undefined,
    parseProperties: undefined,
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
  behavior: {
    get type() {
      return SE.ZUsualGroupBehavior
    },
    nameEnterprise: "Поведение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZUsualGroupBehaviorEnterprise
    },
    inProperties: () => true,
  },
  childItemsHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеПодчиненных",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
    inProperties: () => true,
  },
  childItemsVerticalAlign: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложениеПодчиненных",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise
    },
    inProperties: () => true,
  },
  collapsedRepresentationTitle: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ЗаголовокСвернутогоОтображения",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  controlRepresentation: {
    get type() {
      return SE.ZUsualGroupControlRepresentation
    },
    nameEnterprise: "ОтображениеУправления",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZUsualGroupControlRepresentationEnterprise
    },
    inProperties: () => true,
  },
  currentRowUse: {
    get type() {
      return SE.ZCurrentRowUse
    },
    nameEnterprise: "ИспользованиеТекущейСтроки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZCurrentRowUseEnterprise
    },
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
  format: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Формат",
    formatProperties: formatI8nText,
    parseProperties: parseI8nText,
    inProperties: () => true,
  },
  group: {
    get type() {
      return SE.ZChildFormItemsGroup
    },
    nameEnterprise: "Группировка",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZChildFormItemsGroupEnterprise
    },
    inProperties: () => true,
  },
  groupHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеВыравниваниеГруппы",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise
    },
    inProperties: () => true,
  },
  groupVerticalAlign: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеВыравниваниеГруппы",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise
    },
    inProperties: () => true,
  },
  hiddenRepresentationTitleBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаЗаголовкаСкрытогоОтображения",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  horizontalSpacing: {
    get type() {
      return SE.ZFormItemSpacing
    },
    nameEnterprise: "ГоризонтальныйИнтервал",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemSpacingEnterprise
    },
    inProperties: () => true,
  },
  itemsAndTitlesAlign: {
    get type() {
      return SE.ZItemsAndTitlesAlignVariant
    },
    nameEnterprise: "ВыравниваниеЭлементовИЗаголовков",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemsAndTitlesAlignVariantEnterprise
    },
    inProperties: () => true,
  },
  representation: {
    get type() {
      return SE.ZUsualGroupRepresentation
    },
    nameEnterprise: "Отображение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZUsualGroupRepresentationEnterprise
    },
    inProperties: () => true,
  },
  showLeftMargin: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьОтступСлева",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  showTitle: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьЗаголовок",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  slaveItemsWidth: {
    get type() {
      return SE.ZChildFormItemsWidth
    },
    nameEnterprise: "ШиринаПодчиненныхЭлементов",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZChildFormItemsWidthEnterprise
    },
    inProperties: () => true,
  },
  throughAlign: {
    get type() {
      return SE.ZThroughAlign
    },
    nameEnterprise: "СквозноеВыравнивание",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZThroughAlignEnterprise
    },
    inProperties: () => true,
  },
  titleDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  united: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Объединенная",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  verticalSpacing: {
    get type() {
      return SE.ZFormItemSpacing
    },
    nameEnterprise: "ВертикальныйИнтервал",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemSpacingEnterprise
    },
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.UsualGroup, rules)
