import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ChoiceList, ChoiceListYAML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontPreview, FontYAML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureYAML } from "~/metadata/commonObjects/picture/types"
import { TypeDescription, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import { UserVisible, UserVisibleYAML } from "~/metadata/commonObjects/userVisible/types"
import { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { ChoiceParameters, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { EnterpriseType } from "~/metadata/metadataFactory/types/enterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationEnterprise } from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuYAML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../extendedTooltip/types"
import { InputFieldRules } from "./rules"

export interface InputField {
  itemType: "InputField"
  name: string
  allowInputEmptyMultipleValues?: boolean
  allowMultipleValuesDuplicates?: boolean
  autoCapitalizationOnTextInput?: SE.AutoCapitalizationOnTextInput
  autoChoiceIncomplete?: boolean
  autoCorrectionOnTextInput?: SE.AutoCorrectionOnTextInput
  autoFillHint?: SE.InputFieldAutofillHint
  autoMarkIncomplete?: boolean
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  autoShowClearButton?: SE.AutoShowClearButtonMode
  autoShowOpenButton?: SE.AutoShowOpenButtonMode
  availableTypes?: TypeDescription
  backColor?: Color
  borderColor?: Color
  choiceButton?: boolean
  choiceButtonPicture?: Picture
  choiceButtonRepresentation?: SE.ChoiceButtonRepresentation
  choiceFoldersAndItems?: SE.FoldersAndItems
  choiceForm?: string
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceList?: ChoiceList
  choiceListButton?: boolean
  choiceListHeight?: number
  choiceParameterLinks?: ChoiceParameterLinks
  choiceParameters?: ChoiceParameters
  chooseType?: boolean
  clearButton?: boolean
  createButton?: boolean
  dropListButton?: boolean
  dropListWidth?: number
  editFormat?: I8nText
  editText?: string
  editTextUpdate?: SE.EditTextUpdate
  extendedEdit?: boolean
  font?: Font
  format?: I8nText
  height?: number
  heightControlVariant?: SE.ItemHeightControlVariant
  horizontalStretch?: boolean
  incompleteChoiceMode?: SE.IncompleteChoiceMode
  inputHint?: I8nText
  listChoiceMode?: boolean
  markIncomplete?: boolean
  markNegatives?: boolean
  mask?: string
  maxHeight?: number
  maxValue?: number
  maxWidth?: number
  minValue?: number
  multiLine?: boolean
  multipleValuePictureDataPath?: string
  multipleValuePictureShape?: SE.InputFieldMultipleValuePictureShape
  multipleValuePictureSize?: SE.InputFieldMultipleValuePictureSize
  multipleValuePresentationDataPath?: string
  multipleValuesBackColor?: Color
  multipleValuesExtendedEdit?: boolean // ExtendedEditMultipleValues in XML
  multipleValuesFont?: Font
  multipleValuesHyperlink?: boolean
  multipleValuesPicture?: Picture
  multipleValuesTextColor?: Color
  multipleValueValueDataPath?: string
  onScreenKeyboardReturnKeyText?: SE.OnScreenKeyboardReturnKeyText
  openButton?: boolean
  passwordMode?: boolean
  quickChoice?: boolean
  // selectedText?: string
  showCheckBoxesInDropListWhenInputMultipleValues?: boolean
  specialTextInputMode?: SE.SpecialTextInputMode
  spellCheckingOnTextInput?: SE.SpellCheckingOnTextInput
  spinButton?: boolean
  textColor?: Color
  textEdit?: boolean
  typeDomainEnabled?: boolean
  typeLink?: TypeLink
  userVisible?: UserVisible
  verticalStretch?: boolean
  width?: number
  wrap?: boolean
  autoCellHeight?: boolean
  cellHyperlink?: boolean
  contextMenu?: ContextMenu
  dataPath?: string
  defaultItem?: boolean
  displayImportance?: SE.DisplayImportance
  editMode?: SE.ColumnEditMode
  enabled?: boolean
  extendedTooltip?: ExtendedTooltip
  fixingInTable?: SE.FixingInTable
  footerBackColor?: Color
  footerDataPath?: string
  footerFont?: Font
  footerHorizontalAlign?: SE.ItemHorizontalLocation
  footerPicture?: Picture
  footerText?: I8nText
  footerTextColor?: Color
  headerHorizontalAlign?: SE.ItemHorizontalLocation
  headerPicture?: Picture
  horizontalAlign?: SE.ItemHorizontalLocation
  horizontalAlignInGroup?: SE.ItemHorizontalLocation
  readOnly?: boolean
  shortcut?: string
  showInFooter?: boolean
  showInHeader?: boolean
  skipOnInput?: boolean
  table?: string
  title?: I8nText
  titleBackColor?: Color
  titleFont?: Font
  titleHeight?: number
  titleLocation?: SE.FormItemTitleLocation
  titleTextColor?: Color
  toolTip?: I8nText
  toolTipRepresentation?: SE.ToolTipRepresentation
  type?: SE.FormFieldType
  typeRestriction?: TypeDescription
  verticalAlign?: SE.ItemVerticalAlign
  verticalAlignInGroup?: SE.ItemVerticalAlign
  visible?: boolean
  warningOnEdit?: I8nText
  warningOnEditRepresentation?: SE.WarningOnEditRepresentation
  events?: {
    onChange?: string
    autoComplete?: string
    multipleValuesAdd?: string
    editTextChange?: string
    startChoice?: string
    startListChoice?: string
    choiceProcessing?: string
    multipleValueURLProcessing?: string
    commandGenerateProcessing?: string
    textEditEnd?: string
    opening?: string
    multipleValueOpening?: string
    clearing?: string
    tuning?: string
    creating?: string
    multipleValuesDelete?: string
  }
}

export type InputFieldEnterprise = EnterpriseType<typeof InputFieldRules>

export interface InputFieldPartialYAML {
  АвтоВыборНезаполненного?: StringboolYAML
  АвтоИзменениеРегистраПриВводеТекста?: SE.AutoCapitalizationOnTextInputYAML
  АвтоИсправлениеПриВводеТекста?: SE.AutoCorrectionOnTextInputYAML
  АвтоМаксимальнаяВысота?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  АвтоОтметкаНезаполненного?: StringboolYAML
  АвтоОтображениеКнопкиОткрытия?: SE.AutoShowOpenButtonModeYAML
  АвтоОтображениеКнопкиОчистки?: SE.AutoShowClearButtonModeYAML
  АвтоПереносСтрок?: StringboolYAML
  БыстрыйВыбор?: StringboolYAML
  ВариантУправленияВысотой?: SE.ItemHeightControlVariantYAML
  ВыбиратьТип?: StringboolYAML
  ВыборГруппИЭлементов?: SE.FoldersAndItemsYAML
  ВыделятьОтрицательные?: StringboolYAML
  Высота?: number
  ВысотаСпискаВыбора?: number
  ГиперссылкаМножественныхЗначений?: StringboolYAML
  ДоступныеТипы?: TypeDescriptionYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  КартинкаКнопкиВыбора?: PictureYAML
  КартинкаМножественныхЗначений?: PictureYAML
  КнопкаВыбора?: StringboolYAML
  КнопкаВыпадающегоСписка?: StringboolYAML
  КнопкаОткрытия?: StringboolYAML
  КнопкаОчистки?: StringboolYAML
  КнопкаРегулирования?: StringboolYAML
  КнопкаСоздания?: StringboolYAML
  КнопкаСпискаВыбора?: StringboolYAML
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolYAML
  ОбновлениеТекстаРедактирования?: SE.EditTextUpdateYAML
  ОтметкаНезаполненного?: StringboolYAML
  ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений?: StringboolYAML
  ОтображениеКнопкиВыбора?: SE.ChoiceButtonRepresentationYAML
  ПараметрыВыбора?: ChoiceParametersYAML
  ПодсказкаАвтозаполнения?: SE.InputFieldAutofillHintYAML
  ПодсказкаВвода?: I8nTextYAML
  ПроверкаПравописанияПриВводеТекста?: SE.SpellCheckingOnTextInputYAML
  ПутьКДаннымЗначенияМножественногоЗначения?: string
  ПутьКДаннымКартинкиМножественногоЗначения?: string
  ПутьКДаннымПредставленияМножественногоЗначения?: string
  РазмерКартинкиМножественногоЗначения?: SE.InputFieldMultipleValuePictureSizeYAML
  РазрешитьВводПустыхМножественныхЗначений?: StringboolYAML
  РазрешитьДублированиеМножественныхЗначений?: StringboolYAML
  РазрешитьСоставнойТип?: StringboolYAML
  РастягиватьПоВертикали?: StringboolYAML
  РастягиватьПоГоризонтали?: StringboolYAML
  РасширенноеРедактирование?: StringboolYAML
  РасширенноеРедактированиеМножественныхЗначений?: StringboolYAML
  РедактированиеТекста?: StringboolYAML
  РежимВыбораИзСписка?: StringboolYAML
  РежимВыбораНезаполненного?: SE.IncompleteChoiceModeYAML
  РежимПароля?: StringboolYAML
  СвязиПараметровВыбора?: ChoiceParameterLinksYAML
  СвязьПоТипу?: TypeLinkYAML
  СпециальныйРежимВводаТекста?: SE.SpecialTextInputModeYAML
  СписокВыбора?: ChoiceListYAML
  ТекстКнопкиВводаЭкраннойКлавиатуры?: SE.OnScreenKeyboardReturnKeyTextYAML
  ТекстРедактирования?: string
  ФигураКартинкиМножественногоЗначения?: SE.InputFieldMultipleValuePictureShapeYAML
  ФормаВыбора?: string
  Формат?: I8nTextYAML
  ФорматРедактирования?: I8nTextYAML
  ЦветРамки?: ColorYAML
  ЦветТекста?: ColorYAML
  ЦветТекстаМножественныхЗначений?: ColorYAML
  ЦветФона?: ColorYAML
  ЦветФонаМножественныхЗначений?: ColorYAML
  Ширина?: number
  ШиринаВыпадающегоСписка?: number
  Шрифт?: FontYAML
  ШрифтМножественныхЗначений?: FontYAML
  АвтоВысотаЯчейки?: StringboolYAML
  АктивизироватьПоУмолчанию?: StringboolYAML
  ВажностьПриОтображении?: SE.DisplayImportanceYAML
  ВертикальноеПоложение?: SE.ItemVerticalAlignYAML
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignYAML
  Вид?: SE.FormFieldTypeYAML
  Видимость?: StringboolYAML
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolYAML
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationYAML
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationYAML
  Доступность?: StringboolYAML
  Заголовок?: I8nTextYAML
  КартинкаПодвала?: PictureYAML
  КартинкаШапки?: PictureYAML
  КонтекстноеМеню?: ContextMenuYAML
  ОграничениеТипа?: TypeDescriptionYAML
  ОтображатьВПодвале?: StringboolYAML
  ОтображатьВШапке?: StringboolYAML
  ОтображениеПодсказки?: SE.ToolTipRepresentationYAML
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationYAML
  Подсказка?: I8nTextYAML
  ПоложениеЗаголовка?: SE.FormItemTitleLocationYAML
  РазрешитьИспользование?: UserVisibleYAML
  ЗапретитьИспользование?: UserVisibleYAML
  ПредупреждениеПриРедактировании?: I8nTextYAML
  ПропускатьПриВводе?: StringboolYAML
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipYAML
  РежимРедактирования?: SE.ColumnEditModeYAML
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextYAML
  ТолькоПросмотр?: StringboolYAML
  ФиксацияВТаблице?: SE.FixingInTableYAML
  ЦветТекстаЗаголовка?: ColorYAML
  ЦветТекстаПодвала?: ColorYAML
  ЦветФонаЗаголовка?: ColorYAML
  ЦветФонаПодвала?: ColorYAML
  ШрифтЗаголовка?: FontYAML
  ШрифтПодвала?: FontYAML
  События?: {
    ПриИзменении?: string
    АвтоПодбор?: string
    ДобавлениеМножественныхЗначений?: string
    ИзменениеТекстаРедактирования?: string
    НачалоВыбора?: string
    НачалоВыбораИзСписка?: string
    ОбработкаВыбора?: string
    ОбработкаНавигационнойСсылкиМножественногоЗначения?: string
    ОбработкаФормированияКоманд?: string
    ОкончаниеВводаТекста?: string
    Открытие?: string
    ОткрытиеМножественногоЗначения?: string
    Очистка?: string
    Регулирование?: string
    Создание?: string
    УдалениеМножественныхЗначений?: string
  }
}

export interface InputFieldTypedYAML extends InputFieldPartialYAML {
  Тип: "ПолеВвода"
}

export interface InputFieldPreview {
  itemType: "FormField"
  Name: string
  Type: SystemEnumerationEnterprise
  AllowInputEmptyMultipleValues?: boolean
  AllowMultipleValuesDuplicates?: boolean
  AutoCapitalizationOnTextInput?: SystemEnumerationEnterprise
  AutoChoiceIncomplete?: boolean
  AutoCorrectionOnTextInput?: SystemEnumerationEnterprise
  AutoFillHint?: SystemEnumerationEnterprise
  AutoMarkIncomplete?: boolean
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  AutoShowClearButton?: SystemEnumerationEnterprise
  AutoShowOpenButton?: SystemEnumerationEnterprise
  // AvailableTypes?: TypeDescription
  BackColor?: ColorEnterprise
  BorderColor?: ColorEnterprise
  ChoiceButton?: boolean
  ChoiceButtonPicture?: PictureEnterprise
  ChoiceButtonRepresentation?: SystemEnumerationEnterprise
  ChoiceFoldersAndItems?: SystemEnumerationEnterprise
  // ChoiceForm?: string
  ChoiceHistoryOnInput?: SystemEnumerationEnterprise
  // ChoiceList?: ChoiceList
  ChoiceListButton?: boolean
  ChoiceListHeight?: number
  // ChoiceParameterLinks?: ChoiceParameterLinks
  // ChoiceParameters?: ChoiceParameters
  ChooseType?: boolean
  ClearButton?: boolean
  CreateButton?: boolean
  DropListButton?: boolean
  DropListWidth?: number
  EditFormat?: string
  // EditText?: string
  EditTextUpdate?: SystemEnumerationEnterprise
  ExtendedEdit?: boolean
  Font?: FontPreview
  Format?: string
  Height?: number
  HeightControlVariant?: SystemEnumerationEnterprise
  HorizontalStretch?: boolean
  IncompleteChoiceMode?: SystemEnumerationEnterprise
  InputHint?: string
  ListChoiceMode?: boolean
  MarkIncomplete?: boolean
  MarkNegatives?: boolean
  Mask?: string
  MaxHeight?: number
  MaxValue?: number
  MaxWidth?: number
  MinValue?: number
  MultiLine?: boolean
  MultipleValuePictureDataPath?: string
  MultipleValuePictureShape?: SystemEnumerationEnterprise
  MultipleValuePictureSize?: SystemEnumerationEnterprise
  MultipleValuePresentationDataPath?: string
  MultipleValuesBackColor?: ColorEnterprise
  MultipleValuesExtendedEdit?: boolean
  MultipleValuesFont?: FontPreview
  MultipleValuesHyperlink?: boolean
  MultipleValuesPicture?: PictureEnterprise
  MultipleValuesTextColor?: ColorEnterprise
  MultipleValueValueDataPath?: string
  OnScreenKeyboardReturnKeyText?: SystemEnumerationEnterprise
  OpenButton?: boolean
  PasswordMode?: boolean
  QuickChoice?: boolean
  // SelectedText?: string
  ShowCheckBoxesInDropListWhenInputMultipleValues?: boolean
  SpecialTextInputMode?: SystemEnumerationEnterprise
  SpellCheckingOnTextInput?: SystemEnumerationEnterprise
  SpinButton?: boolean
  TextColor?: ColorEnterprise
  TextEdit?: boolean
  TypeDomainEnabled?: boolean
  // TypeLink?: TypeLink
  VerticalStretch?: boolean
  Width?: number
  Wrap?: boolean
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  // ContextMenu?: ContextMenu
  DataPath?: string
  DefaultItem?: boolean
  DisplayImportance?: SystemEnumerationEnterprise
  EditMode?: SystemEnumerationEnterprise
  Enabled?: boolean
  // ExtendedTooltip?: ExtendedTooltip
  FixingInTable?: SystemEnumerationEnterprise
  FooterBackColor?: ColorEnterprise
  FooterDataPath?: string
  FooterFont?: FontPreview
  FooterHorizontalAlign?: SystemEnumerationEnterprise
  FooterPicture?: PictureEnterprise
  FooterText?: string
  FooterTextColor?: ColorEnterprise
  HeaderHorizontalAlign?: SystemEnumerationEnterprise
  HeaderPicture?: PictureEnterprise
  HorizontalAlign?: SystemEnumerationEnterprise
  HorizontalAlignInGroup?: SystemEnumerationEnterprise
  ReadOnly?: boolean
  // Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  // Table?: string
  Title?: string
  TitleBackColor?: ColorEnterprise
  TitleFont?: FontPreview
  TitleHeight?: number
  TitleLocation?: SystemEnumerationEnterprise
  TitleTextColor?: ColorEnterprise
  ToolTip?: string
  ToolTipRepresentation?: SystemEnumerationEnterprise
  // TypeRestriction?: TypeDescription
  VerticalAlign?: SystemEnumerationEnterprise
  VerticalAlignInGroup?: SystemEnumerationEnterprise
  Visible?: boolean
  WarningOnEdit?: string
  WarningOnEditRepresentation?: SystemEnumerationEnterprise
}
