import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ChoiceList, ChoiceListEnterprise, ChoiceListXML } from "~/metadata/commonObjects/choiceList/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { Font, FontEnterprise, FontXML } from "~/metadata/commonObjects/font/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { Picture, PictureEnterprise, PictureXML } from "~/metadata/commonObjects/picture/types"
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
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface InputField extends FormField {
  elementType: "InputField"
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
  multipleValuesExtendedEdit?: boolean
  multipleValuesFont?: Font
  multipleValuesHyperlink?: boolean
  multipleValuesPicture?: Picture
  multipleValuesTextColor?: Color
  multipleValueValueDataPath?: string
  onScreenKeyboardReturnKeyText?: SE.OnScreenKeyboardReturnKeyText
  openButton?: boolean
  passwordMode?: boolean
  quickChoice?: boolean
  selectedText?: string
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

export interface InputFieldXML extends FormFieldXML {
  AllowInputEmptyMultipleValues?: boolean
  AllowMultipleValuesDuplicates?: boolean
  AutoCapitalizationOnTextInput?: SE.AutoCapitalizationOnTextInput
  AutoChoiceIncomplete?: boolean
  AutoCorrectionOnTextInput?: SE.AutoCorrectionOnTextInput
  AutoFillHint?: SE.InputFieldAutofillHint
  AutoMarkIncomplete?: boolean
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  AutoShowClearButton?: SE.AutoShowClearButtonMode
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
  MultipleValuesExtendedEdit?: boolean
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
  Events?: EventsXML
}

export interface InputFieldPartialEnterprise extends FormFieldEnterprise {
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
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
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

// Для обратной совместимости
export type InputFieldEnterprise = InputFieldPartialEnterprise
