import * as z from "zod"
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import { ZChildItems } from "../childItems/types"

const rules: TElementRules = {
  enableContentChange: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьИзменениеСостава",
    format: undefined,
    inProperties: () => true,
  },
  enabled: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Доступность",
    format: undefined,
    inProperties: () => true,
  },
  extendedTooltip: {
    get type() {
      return ZFormDecoration
    },
    nameEnterprise: "РасширеннаяПодсказка",
    format: undefined,
    inProperties: () => true,
  },
  height: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Высота",
    format: undefined,
    inProperties: () => true,
  },
  horizontalAlignInGroup: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  horizontalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоГоризонтали",
    format: undefined,
    inProperties: () => true,
  },
  readOnly: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ТолькоПросмотр",
    format: undefined,
    inProperties: () => true,
  },
  shortcut: {
    get type() {
      return z.string()
    },
    nameEnterprise: "СочетаниеКлавиш",
    format: undefined,
    inProperties: () => true,
  },
  title: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Заголовок",
    format: undefined,
    inProperties: () => true,
  },
  titleFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтЗаголовка",
    format: undefined,
    inProperties: () => true,
  },
  titleTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаЗаголовка",
    format: undefined,
    inProperties: () => true,
  },
  toolTip: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Подсказка",
    format: undefined,
    inProperties: () => true,
  },
  toolTipRepresentation: {
    get type() {
      return SE.ZToolTipRepresentation
    },
    nameEnterprise: "ОтображениеПодсказки",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  type: {
    get type() {
      return SE.ZFormGroupType
    },
    nameEnterprise: "Вид",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  userVisible: {
    get type() {
      return ZUserVisible
    },
    nameEnterprise: "ПользовательскаяВидимость",
    format: undefined,
    inProperties: () => true,
  },
  verticalAlignInGroup: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  verticalStretch: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РастягиватьПоВертикали",
    format: undefined,
    inProperties: () => true,
  },
  visible: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Видимость",
    format: undefined,
    inProperties: () => true,
  },
  width: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Ширина",
    format: undefined,
    inProperties: () => true,
  },
  childItems: {
    get type() {
      return ZChildItems
    },
    nameEnterprise: "ПодчиненныеЭлементы",
    format: undefined,
    inProperties: () => true,
  },
  fixingInTable: {
    get type() {
      return SE.ZFixingInTable
    },
    nameEnterprise: "ФиксацияВТаблице",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  group: {
    get type() {
      return SE.ZColumnsGroup
    },
    nameEnterprise: "Группировка",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  headerDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымШапки",
    format: undefined,
    inProperties: () => true,
  },
  headerFormat: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ФорматШапки",
    format: undefined,
    inProperties: () => true,
  },
  headerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВШапке",
    format: formatSystemEnumeration,
    inProperties: () => true,
  },
  headerPicture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "КартинкаШапки",
    format: undefined,
    inProperties: () => true,
  },
  showInHeader: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьВШапке",
    format: undefined,
    inProperties: () => true,
  },
  showTitle: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьЗаголовок",
    format: undefined,
    inProperties: () => true,
  },
  titleBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаЗаголовка",
    format: undefined,
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.ColumnGroup, rules)
