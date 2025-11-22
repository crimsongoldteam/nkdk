import * as z from "zod"
import { formatBoolean } from "~/lib/format/formatBool"
import { ZChoiceList } from "~/lib/metadata/commonObjects/choiceList/types"
import { ZColor } from "~/lib/metadata/commonObjects/color/types"
import { ZFont } from "~/lib/metadata/commonObjects/font/types"
import { formatI8nText } from "~/lib/metadata/commonObjects/i8nText/format"
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZPicture } from "~/lib/metadata/commonObjects/pictures/types"
import { ZTypeDescription } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZTypeLink } from "~/lib/metadata/commonObjects/typeLink/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { ZUserVisible } from "~/lib/metadata/commonObjects/userVisible/types"
import { ZChoiceParameterLinks } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { TElementRules } from "~/lib/rulesManager/types"
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
    inProperties: () => true,
  },
  cellHyperlink: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ГиперссылкаЯчейки",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  contextMenu: {
    get type() {
      return ZCommandBar
    },
    nameEnterprise: "КонтекстноеМеню",
    formatProperties: undefined,
    inProperties: () => true,
  },
  dataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДанным",
    formatProperties: undefined,
    inProperties: () => true,
  },
  defaultItem: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АктивизироватьПоУмолчанию",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  displayImportance: {
    get type() {
      return SE.ZDisplayImportance
    },
    nameEnterprise: "ВажностьПриОтображении",
    formatProperties: formatSystemEnumeration,
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
  fixingInTable: {
    get type() {
      return SE.ZFixingInTable
    },
    nameEnterprise: "ФиксацияВТаблице",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  footerDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  footerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВПодвале",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  footerText: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ТекстПодвала",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  footerTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаПодвала",
    formatProperties: undefined,
    inProperties: () => true,
  },
  headerHorizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложениеВШапке",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  horizontalAlign: {
    get type() {
      return SE.ZItemHorizontalLocation
    },
    nameEnterprise: "ГоризонтальноеПоложение",
    formatProperties: formatSystemEnumeration,
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
  showInFooter: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьВПодвале",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  showInHeader: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтображатьВШапке",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  skipOnInput: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ПропускатьПриВводе",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  table: {
    get type() {
      return ZTable
    },
    nameEnterprise: "Таблица",
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
  titleBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаЗаголовка",
    formatProperties: undefined,
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
  titleHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаЗаголовка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  titleLocation: {
    get type() {
      return SE.ZFormItemTitleLocation
    },
    nameEnterprise: "ПоложениеЗаголовка",
    formatProperties: formatSystemEnumeration,
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
      return SE.ZFormFieldType
    },
    nameEnterprise: "Вид",
    formatProperties: formatSystemEnumeration,
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
  verticalAlign: {
    get type() {
      return SE.ZItemVerticalAlign
    },
    nameEnterprise: "ВертикальноеПоложение",
    formatProperties: formatSystemEnumeration,
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
    inProperties: () => true,
  },
  warningOnEdit: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ПредупреждениеПриРедактировании",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  warningOnEditRepresentation: {
    get type() {
      return SE.ZWarningOnEditRepresentation
    },
    nameEnterprise: "ОтображениеПредупрежденияПриРедактировании",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZWarningOnEditRepresentationEnterprise
    },
    inProperties: () => true,
  },
  allowInputEmptyMultipleValues: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьВводПустыхМножественныхЗначений",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  allowMultipleValuesDuplicates: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьДублированиеМножественныхЗначений",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoCapitalizationOnTextInput: {
    get type() {
      return SE.ZAutoCapitalizationOnTextInput
    },
    nameEnterprise: "АвтоИзменениеРегистраПриВводеТекста",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZAutoCapitalizationOnTextInputEnterprise
    },
    inProperties: () => true,
  },
  autoChoiceIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоВыборНезаполненного",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoCorrectionOnTextInput: {
    get type() {
      return SE.ZAutoCorrectionOnTextInput
    },
    nameEnterprise: "АвтоИсправлениеПриВводеТекста",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZAutoCorrectionOnTextInputEnterprise
    },
    inProperties: () => true,
  },
  autoFillHint: {
    get type() {
      return SE.ZInputFieldAutofillHint
    },
    nameEnterprise: "ПодсказкаАвтозаполнения",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZInputFieldAutofillHintEnterprise
    },
    inProperties: () => true,
  },
  autoMarkIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоОтметкаНезаполненного",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoMaxHeight: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяВысота",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoMaxWidth: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоМаксимальнаяШирина",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  autoShowClearButton: {
    get type() {
      return SE.ZAutoShowClearButtonMode
    },
    nameEnterprise: "АвтоОтображениеКнопкиОчистки",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZAutoShowClearButtonModeEnterprise
    },
    inProperties: () => true,
  },
  autoShowOpenButton: {
    get type() {
      return SE.ZAutoShowOpenButtonMode
    },
    nameEnterprise: "АвтоОтображениеКнопкиОткрытия",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZAutoShowOpenButtonModeEnterprise
    },
    inProperties: () => true,
  },
  availableTypes: {
    get type() {
      return ZTypeDescription
    },
    nameEnterprise: "ДоступныеТипы",
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
  choiceButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаВыбора",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  choiceButtonPicture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "КартинкаКнопкиВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  choiceButtonRepresentation: {
    get type() {
      return SE.ZChoiceButtonRepresentation
    },
    nameEnterprise: "ОтображениеКнопкиВыбора",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZChoiceButtonRepresentationEnterprise
    },
    inProperties: () => true,
  },
  choiceFoldersAndItems: {
    get type() {
      return SE.ZFoldersAndItems
    },
    nameEnterprise: "ВыборГруппИЭлементов",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZFoldersAndItemsEnterprise
    },
    inProperties: () => true,
  },
  choiceForm: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ФормаВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  choiceHistoryOnInput: {
    get type() {
      return SE.ZChoiceHistoryOnInput
    },
    nameEnterprise: "ИсторияВыбораПриВводе",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZChoiceHistoryOnInputEnterprise
    },
    inProperties: () => true,
  },
  choiceList: {
    get type() {
      return ZChoiceList
    },
    nameEnterprise: "СписокВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  choiceListButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаСпискаВыбора",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  choiceListHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ВысотаСпискаВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  choiceParameterLinks: {
    get type() {
      return ZChoiceParameterLinks
    },
    nameEnterprise: "СвязиПараметровВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  choiceParameters: {
    get type() {
      return ZChoiceParameterLinks
    },
    nameEnterprise: "ПараметрыВыбора",
    formatProperties: undefined,
    inProperties: () => true,
  },
  chooseType: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ВыбиратьТип",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  clearButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаОчистки",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  createButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаСоздания",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  dropListButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаВыпадающегоСписка",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  dropListWidth: {
    get type() {
      return z.number()
    },
    nameEnterprise: "ШиринаВыпадающегоСписка",
    formatProperties: undefined,
    inProperties: () => true,
  },
  editFormat: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ФорматРедактирования",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  editText: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ТекстРедактирования",
    formatProperties: undefined,
    inProperties: () => true,
  },
  editTextUpdate: {
    get type() {
      return SE.ZEditTextUpdate
    },
    nameEnterprise: "ОбновлениеТекстаРедактирования",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZEditTextUpdateEnterprise
    },
    inProperties: () => true,
  },
  extendedEdit: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РасширенноеРедактирование",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  font: {
    get type() {
      return ZFont
    },
    nameEnterprise: "Шрифт",
    formatProperties: undefined,
    inProperties: () => true,
  },
  format: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "Формат",
    formatProperties: formatI8nText,
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
  heightControlVariant: {
    get type() {
      return SE.ZItemHeightControlVariant
    },
    nameEnterprise: "ВариантУправленияВысотой",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZItemHeightControlVariantEnterprise
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
  incompleteChoiceMode: {
    get type() {
      return SE.ZIncompleteChoiceMode
    },
    nameEnterprise: "РежимВыбораНезаполненного",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZIncompleteChoiceModeEnterprise
    },
    inProperties: () => true,
  },
  inputHint: {
    get type() {
      return ZI8nText
    },
    nameEnterprise: "ПодсказкаВвода",
    formatProperties: formatI8nText,
    inProperties: () => true,
  },
  listChoiceMode: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РежимВыбораИзСписка",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  markIncomplete: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ОтметкаНезаполненного",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  markNegatives: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ВыделятьОтрицательные",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  mask: {
    get type() {
      return z.string()
    },
    nameEnterprise: "Маска",
    formatProperties: undefined,
    inProperties: () => true,
  },
  maxHeight: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяВысота",
    formatProperties: undefined,
    inProperties: () => true,
  },
  maxValue: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальноеЗначение",
    formatProperties: undefined,
    inProperties: () => true,
  },
  maxWidth: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МаксимальнаяШирина",
    formatProperties: undefined,
    inProperties: () => true,
  },
  minValue: {
    get type() {
      return z.number()
    },
    nameEnterprise: "МинимальноеЗначение",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multiLine: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "МногострочныйРежим",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  multipleValuePictureDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымКартинкиМножественногоЗначения",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValuePictureShape: {
    get type() {
      return SE.ZInputFieldMultipleValuePictureShape
    },
    nameEnterprise: "ФигураКартинкиМножественногоЗначения",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZInputFieldMultipleValuePictureShapeEnterprise
    },
    inProperties: () => true,
  },
  multipleValuePictureSize: {
    get type() {
      return SE.ZInputFieldMultipleValuePictureSize
    },
    nameEnterprise: "РазмерКартинкиМножественногоЗначения",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZInputFieldMultipleValuePictureSizeEnterprise
    },
    inProperties: () => true,
  },
  multipleValuePresentationDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымПредставленияМножественногоЗначения",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValuesBackColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветФонаМножественныхЗначений",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValuesExtendedEdit: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РасширенноеРедактированиеМножественныхЗначений",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  multipleValuesFont: {
    get type() {
      return ZFont
    },
    nameEnterprise: "ШрифтМножественныхЗначений",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValuesHyperlink: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "ГиперссылкаМножественныхЗначений",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  multipleValuesPicture: {
    get type() {
      return ZPicture
    },
    nameEnterprise: "КартинкаМножественныхЗначений",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValuesTextColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекстаМножественныхЗначений",
    formatProperties: undefined,
    inProperties: () => true,
  },
  multipleValueValueDataPath: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ПутьКДаннымЗначенияМножественногоЗначения",
    formatProperties: undefined,
    inProperties: () => true,
  },
  onScreenKeyboardReturnKeyText: {
    get type() {
      return SE.ZOnScreenKeyboardReturnKeyText
    },
    nameEnterprise: "ТекстКнопкиВводаЭкраннойКлавиатуры",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZOnScreenKeyboardReturnKeyTextEnterprise
    },
    inProperties: () => true,
  },
  openButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаОткрытия",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  passwordMode: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РежимПароля",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  quickChoice: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "БыстрыйВыбор",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  selectedText: {
    get type() {
      return z.string()
    },
    nameEnterprise: "ВыделенныйТекст",
    formatProperties: undefined,
    inProperties: () => true,
  },
  showCheckBoxesInDropListWhenInputMultipleValues: {
    get type() {
      return z.boolean()
    },
    nameEnterprise:
      "ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  specialTextInputMode: {
    get type() {
      return SE.ZSpecialTextInputMode
    },
    nameEnterprise: "СпециальныйРежимВводаТекста",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZSpecialTextInputModeEnterprise
    },
    inProperties: () => true,
  },
  spellCheckingOnTextInput: {
    get type() {
      return SE.ZSpellCheckingOnTextInput
    },
    nameEnterprise: "ПроверкаПравописанияПриВводеТекста",
    formatProperties: formatSystemEnumeration,
    get typeEnterprise() {
      return SE.ZSpellCheckingOnTextInputEnterprise
    },
    inProperties: () => true,
  },
  spinButton: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "КнопкаРегулирования",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  textColor: {
    get type() {
      return ZColor
    },
    nameEnterprise: "ЦветТекста",
    formatProperties: undefined,
    inProperties: () => true,
  },
  textEdit: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РедактированиеТекста",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  typeDomainEnabled: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "РазрешитьСоставнойТип",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
  typeLink: {
    get type() {
      return ZTypeLink
    },
    nameEnterprise: "СвязьПоТипу",
    formatProperties: undefined,
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
  width: {
    get type() {
      return z.number()
    },
    nameEnterprise: "Ширина",
    formatProperties: undefined,
    inProperties: () => true,
  },
  wrap: {
    get type() {
      return z.boolean()
    },
    nameEnterprise: "АвтоПереносСтрок",
    formatProperties: formatBoolean,
    inProperties: () => true,
  },
}

registerElementRules(ZElementType.enum.InputField, rules)
