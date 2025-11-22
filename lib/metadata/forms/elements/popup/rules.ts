import * as z from "zod"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRules } from "~/lib/rulesManager/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZElementType } from "../types"

const rules: TElementRules = {
  enableContentChange: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьИзменениеСостава",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  enabled: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Доступность",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  extendedTooltip: {
    get type() {
      return ZFormDecoration
    },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  height: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Высота",
    formatProperties: undefined,
    inProperties: () => true,
  },
  horizontalAlignInGroup: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  readOnly: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  shortcut: {
    get type() {
      return z.string()
    },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    inProperties: () => true,
  },
  title: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  titleFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  titleTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  toolTip: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Подсказка",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  toolTipRepresentation: {
    get type() {
      return SE.ZToolTipRepresentation
    },
    nameEnterprise: "ОтображениеПодсказки",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  verticalAlignInGroup: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  visible: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  width: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    inProperties: () => true,
  },
  childItems: {
    get type() {
      return ZЭлементыФормы
    },
    nameEnterprise: "ПодчиненныеЭлементы",
    formatProperties: undefined,
    inProperties: () => true,
  },
  backColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФона",
    formatProperties: undefined,
    inProperties: () => true,
  },
  borderColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    inProperties: () => true,
  },
  picture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "Картинка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  representation: {
    get type() {
      return SE.ZButtonRepresentation
    },
    nameEnterprise: "Отображение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZButtonRepresentationEnterprise
    },
    inProperties: () => true,
  },
  shape: {
    get type() {
      return SE.ZButtonShape
    },
    nameEnterprise: "Фигура",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZButtonShapeEnterprise
    },
    inProperties: () => true,
  },
  shapeRepresentation: {
    get type() {
      return SE.ZButtonShapeRepresentation
    },
    nameEnterprise: "ОтображениеФигуры",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZButtonShapeRepresentationEnterprise
    },
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.Popup, rules)
