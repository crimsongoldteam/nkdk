import * as z from "zod";
import { formatBoolean } from "~/lib/format/formatBool";
import { ZColor } from "~/lib/metadata/commonObjects/color/types";
import { ZFont } from "~/lib/metadata/commonObjects/font/types";
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format";
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types";
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types";
import { ZTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/types";
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format";
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types";
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { registerElementRules } from "~/lib/rulesManager/rulesManager";
import { TElementRules } from "~/lib/rulesManager/types";
import { ZCommandBar } from "../commandBar/types";
import { ZFormDecoration } from "../formDecoration/types";
import { ZTable } from "../table/types";
import { ZElementType } from "../types";

const rules: TElementRules = {
  autoCellHeight: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "АвтоВысотаЯчейки",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  cellHyperlink: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "ГиперссылкаЯчейки",
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
  dataPath: {
    get type() {
      return z.string();
    },
    nameEnterprise: "ПутьКДанным",
    formatProperties: undefined,
    inProperties: () => true,
  },
  defaultItem: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "АктивизироватьПоУмолчанию",
    formatProperties: formatBoolean,
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
  editMode: {
    get type() {
      return SE.ZColumnEditMode;
    },
    nameEnterprise: "РежимРедактирования",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZColumnEditModeEnterprise;
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
  fixingInTable: {
    get type() {
      return SE.ZFixingInTable;
    },
    nameEnterprise: "ФиксацияВТаблице",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFixingInTableEnterprise;
    },
    inProperties: () => true,
  },
  footerBackColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветФонаПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerDataPath: {
    get type() {
      return z.string();
    },
    nameEnterprise: "ПутьКДаннымПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerFont: {
    get type() {
      return ZFont;
    },
    nameEnterprise: "ШрифтПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation;
    },
    nameEnterprise: "ГоризонтальноеПоложениеВПодвале",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise;
    },
    inProperties: () => true,
  },
  footerPicture: {
    get type() {
      return ZPicture;
    },
    nameEnterprise: "КартинкаПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerText: {
    get type() {
      return ZI8nText;
    },
    nameEnterprise: "ТекстПодвала",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  footerTextColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветТекстаПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  headerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation;
    },
    nameEnterprise: "ГоризонтальноеПоложениеВШапке",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise;
    },
    inProperties: () => true,
  },
  headerPicture: {
    get type() {
      return ZPicture;
    },
    nameEnterprise: "КартинкаШапки",
    formatProperties: undefined,
    inProperties: () => true,
  },
  horizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation;
    },
    nameEnterprise: "ГоризонтальноеПоложение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHorizontalLocationEnterprise;
    },
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
  readOnly: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "ТолькоПросмотр",
    formatProperties: formatBoolean,
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
  showInFooter: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "ОтображатьВПодвале",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  showInHeader: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "ОтображатьВШапке",
    formatProperties: formatBoolean,
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
  table: {
    get type() {
      return ZTable;
    },
    nameEnterprise: "Таблица",
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
  titleBackColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветФонаЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  titleFont: {
    get type() {
      return ZFont;
    },
    nameEnterprise: "ШрифтЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  titleHeight: {
    get type() {
      return z.number();
    },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  titleLocation: {
    get type() {
      return SE.ZFormItemTitleLocation;
    },
    nameEnterprise: "ПоложениеЗаголовка",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemTitleLocationEnterprise;
    },
    inProperties: () => true,
  },
  titleTextColor: {
    get type() {
      return ZColor;
    },
    nameEnterprise: "ЦветТекстаЗаголовка",
    formatProperties: undefined,
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
      return SE.ZFormFieldType;
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormFieldTypeEnterprise;
    },
    inProperties: () => true,
  },
  typeRestriction: {
    get type() {
      return ZTypeDescription;
    },
    nameEnterprise: "ОграничениеТипа",
    formatProperties: undefined,
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
  verticalAlign: {
    get type() {
      return SE.ZItemVerticalAlign;
    },
    nameEnterprise: "ВертикальноеПоложение",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemVerticalAlignEnterprise;
    },
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
  visible: {
    get type() {
      return z.boolean();
    },
    nameEnterprise: "Видимость",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  warningOnEdit: {
    get type() {
      return ZI8nText;
    },
    nameEnterprise: "ПредупреждениеПриРедактировании",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  warningOnEditRepresentation: {
    get type() {
      return SE.ZWarningOnEditRepresentation;
    },
    nameEnterprise: "ОтображениеПредупрежденияПриРедактировании",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZWarningOnEditRepresentationEnterprise;
    },
    inProperties: () => true,
  },
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
  height: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Высота",
    formatProperties: undefined,
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
  largeStep: {
    get type() {
      return z.number();
    },
    nameEnterprise: "БольшойШаг",
    formatProperties: undefined,
    inProperties: () => true,
  },
  markingAppearance: {
    get type() {
      return SE.ZTrackBarMarkingAppearance;
    },
    nameEnterprise: "ОтображениеРазметки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZTrackBarMarkingAppearanceEnterprise;
    },
    inProperties: () => true,
  },
  markingStep: {
    get type() {
      return z.number();
    },
    nameEnterprise: "ШагРазметки",
    formatProperties: undefined,
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
  maxValue: {
    get type() {
      return z.number();
    },
    nameEnterprise: "МаксимальноеЗначение",
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
  minValue: {
    get type() {
      return z.number();
    },
    nameEnterprise: "МинимальноеЗначение",
    formatProperties: undefined,
    inProperties: () => true,
  },
  orientation: {
    get type() {
      return SE.ZFormItemOrientation;
    },
    nameEnterprise: "Ориентация",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFormItemOrientationEnterprise;
    },
    inProperties: () => true,
  },
  step: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Шаг",
    formatProperties: undefined,
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
  width: {
    get type() {
      return z.number();
    },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    inProperties: () => true,
  },
};

registerElementRules(ZElementType.enum.TrackBarField, rules);
