import * as z from "zod";
import { formatBoolean } from "~/lib/format/formatBool";
import { ZBorder } from "~/lib/metadata/commonObjects/border/types";
import { ZColor } from "~/lib/metadata/commonObjects/color/types";
import { ZFont } from "~/lib/metadata/commonObjects/font/types";
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format";
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types";
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types";
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format";
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types";
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { registerElementRules } from "~/lib/rulesManager/rulesManager";
import { TElementRules } from "~/lib/rulesManager/types";
import { ZCommandBar } from "../commandBar/types";
import { ZFormDecoration } from "../formDecoration/types";
import { ZElementType } from "../types";

const rules: TElementRules = {
  autoMaxHeight: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoMaxWidth: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  contextMenu: {
    get type() {
      return ZCommandBar;
    },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    inProperties: () => true,
  },
  displayImportance: {
    get type() {
      return SE.ZDisplayImportance;
    },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZDisplayImportanceEnterprise;
    },
    inProperties: () => true,
  },
  enabled: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "Доступность",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  extendedTooltip: {
    get type() {
      return ZFormDecoration;
    },
    nameEnterprise: "РасширеннаяПодсказка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  font: {
    get type() {
      return ZFont;
    },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    inProperties: () => true,
  },
  height: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Высота",
    formatProperties: undefined,
    inProperties: () => true,
  },
  horizontalAlignInGroup: {
    get type() {
      return SE.ZItemHorizontalLocation;
    },
    nameEnterprise: "ГоризонтальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise;
    },
    inProperties: () => true,
  },
  horizontalStretch: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "РастягиватьПоГоризонтали",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  maxHeight: {
    get type() {
      return z.number();
    },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    inProperties: () => true,
  },
  maxWidth: {
    get type() {
      return z.number();
    },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    inProperties: () => true,
  },
  shortcut: {
    get type() {
      return z.string();
    },
    nameEnterprise: "СочетаниеКлавиш",
    formatProperties: undefined,
    inProperties: () => true,
  },
  skipOnInput: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "ПропускатьПриВводе",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  textColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
    inProperties: () => true,
  },
  title: {
    get type() {
      return ZI8nText;
    },
    nameEnterprise: "Заголовок",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  toolTip: {
    get type() {
      return ZI8nText;
    },
    nameEnterprise: "Подсказка",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  toolTipRepresentation: {
    get type() {
      return SE.ZToolTipRepresentation;
    },
    nameEnterprise: "ОтображениеПодсказки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZToolTipRepresentationEnterprise;
    },
    inProperties: () => true,
  },
  type: {
    get type() {
      return SE.ZFormDecorationType;
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormDecorationTypeEnterprise;
    },
    inProperties: () => true,
  },
  userVisible: {
    get type() {
      return ZUserVisible;
    },
    nameEnterprise: "ПользовательскаяВидимость",
    formatProperties: formatUserVisible,
    inProperties: () => true,
  },
  verticalAlignInGroup: {
    get type() {
      return SE.ZItemVerticalAlign;
    },
    nameEnterprise: "ВертикальноеПоложениеВГруппе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise;
    },
    inProperties: () => true,
  },
  verticalStretch: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "РастягиватьПоВертикали",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  visible: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  width: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    inProperties: () => true,
  },
  border: {
    get type() {
      return ZBorder;
    },
    nameEnterprise: "Рамка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  borderColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветРамки",
    formatProperties: undefined,
    inProperties: () => true,
  },
  enableDrag: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "РазрешитьПеретаскивание",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  enableStartDrag: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "РазрешитьНачалоПеретаскивания",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  fileDragMode: {
    get type() {
      return SE.ZFileDragMode;
    },
    nameEnterprise: "СпособПеретаскиванияФайлов",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFileDragModeEnterprise;
    },
    inProperties: () => true,
  },
  hyperlink: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "Гиперссылка",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  nonselectedPictureText: {
    get type() {
      return z.string();
    },
    nameEnterprise: "ТекстНевыбраннойКартинки",
    formatProperties: undefined,
    inProperties: () => true,
  },
  picture: {
    get type() {
      return ZPicture;
    },
    nameEnterprise: "Картинка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  pictureSize: {
    get type() {
      return SE.ZPictureSize;
    },
    nameEnterprise: "РазмерКартинки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZPictureSizeEnterprise;
    },
    inProperties: () => true,
  },
  scale: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Масштаб",
    formatProperties: undefined,
    inProperties: () => true,
  },
  zoomable: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "Масштабировать",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
};

registerElementRules(ZElementType.enum.PictureDecoration, rules);
