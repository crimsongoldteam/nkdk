import * as z from "zod"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRules } from "~/lib/rulesManager/types"
import { ZFormDecoration } from "../formDecoration/types"
import { ZElementType } from "../types"
import "./registration"

const rules: TElementRules = {
  autoMaxHeight: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяВысота",
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
  borderColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  commandName: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ИмяКоманды",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  commandUniqueness: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "УникальностьКоманды",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  defaultButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаПоУмолчанию",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
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
  extendedTooltip: {
    get type() {
      return ZFormDecoration
    },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    parseProperties: undefined,
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
  locationInCommandBar: {
    get type() {
      return SE.ZButtonLocationInCommandBar
    },
    nameEnterprise: "ПоложениеВКоманднойПанели",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZButtonLocationInCommandBarEnterprise
    },
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
  maxWidth: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  onlyInAllActions: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ТолькоВоВсехДействиях",
    formatProperties: formatBoolean,
    parseProperties: parseBoolean,
    inProperties: () => true,
  },
  picture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "Картинка",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: () => true,
  },
  pictureLocation: {
    get type() {
      return SE.ZFormButtonPictureLocation
    },
    nameEnterprise: "ПоложениеКартинки",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormButtonPictureLocationEnterprise
    },
    inProperties: () => true,
  },
  representation: {
    get type() {
      return SE.ZButtonRepresentation
    },
    nameEnterprise: "Отображение",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
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
    parseProperties: parseSystemEnumeration,
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
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZButtonShapeRepresentationEnterprise
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
  titleHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    parseProperties: undefined,
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
      return SE.ZFormButtonType
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    parseProperties: parseSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormButtonTypeEnterprise
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
}

registerElementRules(ZElementType.enum.Button, rules)
