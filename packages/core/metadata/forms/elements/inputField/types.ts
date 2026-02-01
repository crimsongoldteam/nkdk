import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ChoiceList, ChoiceListEnterprise, ChoiceListXML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorPreview, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontPreview, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { Picture, PictureEnterprise, PicturePreview, PictureXML } from "~/metadata/commonObjects/picture/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkEnterprise, TypeLinkXML } from "~/metadata/commonObjects/typeLink/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import {
  ChoiceParameterLinks,
  ChoiceParameterLinksEnterprise,
  ChoiceParameterLinksXML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import {
  ChoiceParameters,
  ChoiceParametersEnterprise,
  ChoiceParametersXML,
} from "~/metadata/commonObjects/сhoiceParameters/types"
import { BaseElementXML } from "~/metadata/forms/elements/baseElement/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPreview } from "~/metadata/systemEnumerations/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuXML } from "../contextMenu/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise, ExtendedTooltipXML } from "../extendedTooltip/types"

export interface InputField {
  elementType: "InputField"
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

export interface InputFieldXML extends BaseElementXML {
  AllowInputEmptyMultipleValues?: boolean
  AllowMultipleValuesDuplicates?: boolean
  AutoCapitalizationOnTextInput?: SE.AutoCapitalizationOnTextInput
  AutoChoiceIncomplete?: boolean
  AutoCorrectionOnTextInput?: SE.AutoCorrectionOnTextInput
  AutoFillHint?: SE.InputFieldAutofillHint
  AutoMarkIncomplete?: boolean
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  AutoShowClearButtonMode?: SE.AutoShowClearButtonMode
  AutoShowOpenButton?: SE.AutoShowOpenButtonMode
  AvailableTypes?: TypeDescriptionXML
  BackColor?: ColorXML
  BorderColor?: ColorXML
  ChoiceButton?: boolean
  ChoiceButtonPicture?: PictureXML
  ChoiceButtonRepresentation?: SE.ChoiceButtonRepresentation
  ChoiceFoldersAndItems?: SE.FoldersAndItems
  ChoiceForm?: string
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  ChoiceList?: ChoiceListXML
  ChoiceListButton?: boolean
  ChoiceListHeight?: number
  ChoiceParameterLinks?: ChoiceParameterLinksXML
  ChoiceParameters?: ChoiceParametersXML
  ChooseType?: boolean
  ClearButton?: boolean
  CreateButton?: boolean
  DropListButton?: boolean
  DropListWidth?: number
  EditFormat?: I8nTextXML
  EditText?: string
  EditTextUpdate?: SE.EditTextUpdate
  ExtendedEdit?: boolean
  ExtendedEditMultipleValues?: boolean
  Font?: FontXML
  Format?: I8nTextXML
  Height?: number
  HeightControlVariant?: SE.ItemHeightControlVariant
  HorizontalStretch?: boolean
  IncompleteChoiceMode?: SE.IncompleteChoiceMode
  InputHint?: I8nTextXML
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
  MultipleValuePictureShape?: SE.InputFieldMultipleValuePictureShape
  MultipleValuePictureSize?: SE.InputFieldMultipleValuePictureSize
  MultipleValuePresentationDataPath?: string
  MultipleValuesBackColor?: ColorXML
  // MultipleValuesExtendedEdit?: boolean // ExtendedEditMultipleValues in XML
  MultipleValuesFont?: FontXML
  MultipleValuesHyperlink?: boolean
  MultipleValuesPicture?: PictureXML
  MultipleValuesTextColor?: ColorXML
  MultipleValueValueDataPath?: string
  OnScreenKeyboardReturnKeyText?: SE.OnScreenKeyboardReturnKeyText
  OpenButton?: boolean
  PasswordMode?: boolean
  QuickChoice?: boolean
  SelectedText?: string
  ShowCheckBoxesInDropListWhenInputMultipleValues?: boolean
  SpecialTextInputMode?: SE.SpecialTextInputMode
  SpellCheckingOnTextInput?: SE.SpellCheckingOnTextInput
  SpinButton?: boolean
  TextColor?: ColorXML
  TextEdit?: boolean
  TypeDomainEnabled?: boolean
  TypeLink?: TypeLinkXML
  UserVisible?: UserVisibleXML
  VerticalStretch?: boolean
  Width?: number
  Wrap?: boolean
  AutoCellHeight?: boolean
  CellHyperlink?: boolean
  ContextMenu: ContextMenuXML
  DataPath?: string
  DefaultItem?: boolean
  _DisplayImportance?: SE.DisplayImportance
  EditMode?: SE.ColumnEditMode
  Enabled?: boolean
  ExtendedTooltip: ExtendedTooltipXML
  FixingInTable?: SE.FixingInTable
  FooterBackColor?: ColorXML
  FooterDataPath?: string
  FooterFont?: FontXML
  FooterHorizontalAlign?: SE.ItemHorizontalLocation
  FooterPicture?: PictureXML
  FooterText?: I8nTextXML
  FooterTextColor?: ColorXML
  HeaderHorizontalAlign?: SE.ItemHorizontalLocation
  HeaderPicture?: PictureXML
  HorizontalAlign?: SE.ItemHorizontalLocation
  GroupHorizontalAlign?: SE.ItemHorizontalLocation
  ReadOnly?: boolean
  Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  AssociatedTableElementId?: MetadataValueXML
  Title?: I8nTextXML
  TitleBackColor?: ColorXML
  TitleFont?: FontXML
  TitleHeight?: number
  TitleLocation?: SE.FormItemTitleLocation
  TitleTextColor?: ColorXML
  ToolTip?: I8nTextXML
  ToolTipRepresentation?: SE.ToolTipRepresentation
  Type?: SE.FormFieldType
  TypeRestriction?: TypeDescriptionXML
  VerticalAlign?: SE.ItemVerticalAlign
  GroupVerticalAlign?: SE.ItemVerticalAlign
  Visible?: boolean
  WarningOnEdit?: I8nTextXML
  WarningOnEditRepresentation?: SE.WarningOnEditRepresentation
  Events?: EventsXML
}

export interface InputFieldPartialEnterprise {
  АвтоВыборНезаполненного?: StringboolEnterprise
  АвтоИзменениеРегистраПриВводеТекста?: SE.AutoCapitalizationOnTextInputEnterprise
  АвтоИсправлениеПриВводеТекста?: SE.AutoCorrectionOnTextInputEnterprise
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  АвтоОтметкаНезаполненного?: StringboolEnterprise
  АвтоОтображениеКнопкиОткрытия?: SE.AutoShowOpenButtonModeEnterprise
  АвтоОтображениеКнопкиОчистки?: SE.AutoShowClearButtonModeEnterprise
  АвтоПереносСтрок?: StringboolEnterprise
  БыстрыйВыбор?: StringboolEnterprise
  ВариантУправленияВысотой?: SE.ItemHeightControlVariantEnterprise
  ВыбиратьТип?: StringboolEnterprise
  ВыборГруппИЭлементов?: SE.FoldersAndItemsEnterprise
  ВыделенныйТекст?: string
  ВыделятьОтрицательные?: StringboolEnterprise
  Высота?: number
  ВысотаСпискаВыбора?: number
  ГиперссылкаМножественныхЗначений?: StringboolEnterprise
  ДоступныеТипы?: TypeDescriptionEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  КартинкаКнопкиВыбора?: PictureEnterprise
  КартинкаМножественныхЗначений?: PictureEnterprise
  КнопкаВыбора?: StringboolEnterprise
  КнопкаВыпадающегоСписка?: StringboolEnterprise
  КнопкаОткрытия?: StringboolEnterprise
  КнопкаОчистки?: StringboolEnterprise
  КнопкаРегулирования?: StringboolEnterprise
  КнопкаСоздания?: StringboolEnterprise
  КнопкаСпискаВыбора?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolEnterprise
  ОбновлениеТекстаРедактирования?: SE.EditTextUpdateEnterprise
  ОтметкаНезаполненного?: StringboolEnterprise
  ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений?: StringboolEnterprise
  ОтображениеКнопкиВыбора?: SE.ChoiceButtonRepresentationEnterprise
  ПараметрыВыбора?: ChoiceParametersEnterprise
  ПодсказкаАвтозаполнения?: SE.InputFieldAutofillHintEnterprise
  ПодсказкаВвода?: I8nTextEnterprise
  ПроверкаПравописанияПриВводеТекста?: SE.SpellCheckingOnTextInputEnterprise
  ПутьКДаннымЗначенияМножественногоЗначения?: string
  ПутьКДаннымКартинкиМножественногоЗначения?: string
  ПутьКДаннымПредставленияМножественногоЗначения?: string
  РазмерКартинкиМножественногоЗначения?: SE.InputFieldMultipleValuePictureSizeEnterprise
  РазрешитьВводПустыхМножественныхЗначений?: StringboolEnterprise
  РазрешитьДублированиеМножественныхЗначений?: StringboolEnterprise
  РазрешитьСоставнойТип?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  РасширенноеРедактирование?: StringboolEnterprise
  РасширенноеРедактированиеМножественныхЗначений?: StringboolEnterprise
  РедактированиеТекста?: StringboolEnterprise
  РежимВыбораИзСписка?: StringboolEnterprise
  РежимВыбораНезаполненного?: SE.IncompleteChoiceModeEnterprise
  РежимПароля?: StringboolEnterprise
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise
  СвязьПоТипу?: TypeLinkEnterprise
  СпециальныйРежимВводаТекста?: SE.SpecialTextInputModeEnterprise
  СписокВыбора?: ChoiceListEnterprise
  ТекстКнопкиВводаЭкраннойКлавиатуры?: SE.OnScreenKeyboardReturnKeyTextEnterprise
  ТекстРедактирования?: string
  ФигураКартинкиМножественногоЗначения?: SE.InputFieldMultipleValuePictureShapeEnterprise
  ФормаВыбора?: string
  Формат?: I8nTextEnterprise
  ФорматРедактирования?: I8nTextEnterprise
  ЦветРамки?: ColorEnterprise
  ЦветТекста?: ColorEnterprise
  ЦветТекстаМножественныхЗначений?: ColorEnterprise
  ЦветФона?: ColorEnterprise
  ЦветФонаМножественныхЗначений?: ColorEnterprise
  Ширина?: number
  ШиринаВыпадающегоСписка?: number
  Шрифт?: FontEnterprise
  ШрифтМножественныхЗначений?: FontEnterprise
  АвтоВысотаЯчейки?: StringboolEnterprise
  АктивизироватьПоУмолчанию?: StringboolEnterprise
  ВажностьПриОтображении?: SE.DisplayImportanceEnterprise
  ВертикальноеПоложение?: SE.ItemVerticalAlignEnterprise
  ВертикальноеПоложениеВГруппе?: SE.ItemVerticalAlignEnterprise
  Вид?: SE.FormFieldTypeEnterprise
  Видимость?: StringboolEnterprise
  ВысотаЗаголовка?: number
  ГиперссылкаЯчейки?: StringboolEnterprise
  ГоризонтальноеПоложение?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВГруппе?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВПодвале?: SE.ItemHorizontalLocationEnterprise
  ГоризонтальноеПоложениеВШапке?: SE.ItemHorizontalLocationEnterprise
  Доступность?: StringboolEnterprise
  Заголовок?: I8nTextEnterprise
  КартинкаПодвала?: PictureEnterprise
  КартинкаШапки?: PictureEnterprise
  КонтекстноеМеню?: ContextMenuEnterprise
  ОграничениеТипа?: TypeDescriptionEnterprise
  ОтображатьВПодвале?: StringboolEnterprise
  ОтображатьВШапке?: StringboolEnterprise
  ОтображениеПодсказки?: SE.ToolTipRepresentationEnterprise
  ОтображениеПредупрежденияПриРедактировании?: SE.WarningOnEditRepresentationEnterprise
  Подсказка?: I8nTextEnterprise
  ПоложениеЗаголовка?: SE.FormItemTitleLocationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  ПредупреждениеПриРедактировании?: I8nTextEnterprise
  ПропускатьПриВводе?: StringboolEnterprise
  ПутьКДанным?: string
  ПутьКДаннымПодвала?: string
  РасширеннаяПодсказка?: ExtendedTooltipEnterprise
  РежимРедактирования?: SE.ColumnEditModeEnterprise
  СочетаниеКлавиш?: string
  Таблица?: string
  ТекстПодвала?: I8nTextEnterprise
  ТолькоПросмотр?: StringboolEnterprise
  ФиксацияВТаблице?: SE.FixingInTableEnterprise
  ЦветТекстаЗаголовка?: ColorEnterprise
  ЦветТекстаПодвала?: ColorEnterprise
  ЦветФонаЗаголовка?: ColorEnterprise
  ЦветФонаПодвала?: ColorEnterprise
  ШрифтЗаголовка?: FontEnterprise
  ШрифтПодвала?: FontEnterprise
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

export interface InputFieldTypedEnterprise extends InputFieldPartialEnterprise {
  Тип: "ПолеВвода"
}

export interface InputFieldPreview {
  ElementType: "InputField"
  Name: string
  AllowInputEmptyMultipleValues?: boolean
  AllowMultipleValuesDuplicates?: boolean
  AutoCapitalizationOnTextInput?: SystemEnumerationPreview
  AutoChoiceIncomplete?: boolean
  AutoCorrectionOnTextInput?: SystemEnumerationPreview
  AutoFillHint?: SystemEnumerationPreview
  AutoMarkIncomplete?: boolean
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  AutoShowClearButton?: SystemEnumerationPreview
  AutoShowOpenButton?: SystemEnumerationPreview
  // AvailableTypes?: TypeDescription
  BackColor?: ColorPreview
  BorderColor?: ColorPreview
  ChoiceButton?: boolean
  ChoiceButtonPicture?: PicturePreview
  ChoiceButtonRepresentation?: SystemEnumerationPreview
  ChoiceFoldersAndItems?: SystemEnumerationPreview
  // ChoiceForm?: string
  ChoiceHistoryOnInput?: SystemEnumerationPreview
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
  EditTextUpdate?: SystemEnumerationPreview
  ExtendedEdit?: boolean
  Font?: FontPreview
  Format?: string
  Height?: number
  HeightControlVariant?: SystemEnumerationPreview
  HorizontalStretch?: boolean
  IncompleteChoiceMode?: SystemEnumerationPreview
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
  MultipleValuePictureShape?: SystemEnumerationPreview
  MultipleValuePictureSize?: SystemEnumerationPreview
  MultipleValuePresentationDataPath?: string
  MultipleValuesBackColor?: ColorPreview
  MultipleValuesExtendedEdit?: boolean
  MultipleValuesFont?: FontPreview
  MultipleValuesHyperlink?: boolean
  MultipleValuesPicture?: PicturePreview
  MultipleValuesTextColor?: ColorPreview
  MultipleValueValueDataPath?: string
  OnScreenKeyboardReturnKeyText?: SystemEnumerationPreview
  OpenButton?: boolean
  PasswordMode?: boolean
  QuickChoice?: boolean
  SelectedText?: string
  ShowCheckBoxesInDropListWhenInputMultipleValues?: boolean
  SpecialTextInputMode?: SystemEnumerationPreview
  SpellCheckingOnTextInput?: SystemEnumerationPreview
  SpinButton?: boolean
  TextColor?: ColorPreview
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
  DisplayImportance?: SystemEnumerationPreview
  EditMode?: SystemEnumerationPreview
  Enabled?: boolean
  // ExtendedTooltip?: ExtendedTooltip
  FixingInTable?: SystemEnumerationPreview
  FooterBackColor?: ColorPreview
  FooterDataPath?: string
  FooterFont?: FontPreview
  FooterHorizontalAlign?: SystemEnumerationPreview
  FooterPicture?: PicturePreview
  FooterText?: string
  FooterTextColor?: ColorPreview
  HeaderHorizontalAlign?: SystemEnumerationPreview
  HeaderPicture?: PicturePreview
  HorizontalAlign?: SystemEnumerationPreview
  HorizontalAlignInGroup?: SystemEnumerationPreview
  ReadOnly?: boolean
  // Shortcut?: string
  ShowInFooter?: boolean
  ShowInHeader?: boolean
  SkipOnInput?: boolean
  // Table?: string
  Title?: string
  TitleBackColor?: ColorPreview
  TitleFont?: FontPreview
  TitleHeight?: number
  TitleLocation?: SystemEnumerationPreview
  TitleTextColor?: ColorPreview
  ToolTip?: string
  ToolTipRepresentation?: SystemEnumerationPreview
  // TypeRestriction?: TypeDescription
  VerticalAlign?: SystemEnumerationPreview
  VerticalAlignInGroup?: SystemEnumerationPreview
  Visible?: boolean
  WarningOnEdit?: string
  WarningOnEditRepresentation?: SystemEnumerationPreview
}
