import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importChoiceListFromEnterprise } from "~/metadata/commonObjects/choiceList/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importTypeLinkFromEnterprise } from "~/metadata/commonObjects/typeLink/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { importChoiceParameterLinksFromEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/importFromEnterprise"
import { importChoiceParametersFromEnterprise } from "~/metadata/commonObjects/сhoiceParameters/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
} from "~/metadata/forms/elements/inputField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
export function importInputFieldTypedFromEnterprise<To extends InputField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importInputFieldPropsFromEnterprise(context, data)

  const result: InputField = {
    ...props,
    elementType: "InputField",
    name,
  }

  const title = importI8nTextFromEnterprise(context, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importInputFieldPartialFromEnterprise<To extends InputField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importInputFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    elementType: "InputField",
    name: source.name,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importInputFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: InputFieldTypedEnterprise | InputFieldPartialEnterprise | undefined
): Omit<Partial<InputField>, "elementType" | "name"> => {
  const result: Omit<Partial<InputField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoCellHeight = importBooleanFromEnterprise(context, data.АвтоВысотаЯчейки)
  if (autoCellHeight !== undefined) result.autoCellHeight = autoCellHeight

  const defaultItem = importBooleanFromEnterprise(context, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormFieldType>(
    context,
    data.Вид,
    SE.FormFieldTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const cellHyperlink = importBooleanFromEnterprise(context, data.ГиперссылкаЯчейки)
  if (cellHyperlink !== undefined) result.cellHyperlink = cellHyperlink

  const horizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const footerHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВПодвале,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.footerHorizontalAlign = footerHorizontalAlign

  const headerHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const footerPicture = importPictureFromEnterprise(context, data.КартинкаПодвала)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const headerPicture = importPictureFromEnterprise(context, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const contextMenu = importContextMenuFromEnterprise(context, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const typeRestriction = importTypeDescriptionFromEnterprise(context, data.ОграничениеТипа)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const showInFooter = importBooleanFromEnterprise(context, data.ОтображатьВПодвале)
  if (showInFooter !== undefined) result.showInFooter = showInFooter

  const showInHeader = importBooleanFromEnterprise(context, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const warningOnEditRepresentation = importSystemEnumerationFromEnterprise<SE.WarningOnEditRepresentation>(
    context,
    data.ОтображениеПредупрежденияПриРедактировании,
    SE.WarningOnEditRepresentationFromEnterprise
  )
  if (warningOnEditRepresentation !== undefined) result.warningOnEditRepresentation = warningOnEditRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const titleLocation = importSystemEnumerationFromEnterprise<SE.FormItemTitleLocation>(
    context,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const warningOnEdit = importI8nTextFromEnterprise(context, data.ПредупреждениеПриРедактировании)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  const skipOnInput = importBooleanFromEnterprise(context, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымПодвала !== undefined) result.footerDataPath = data.ПутьКДаннымПодвала

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const editMode = importSystemEnumerationFromEnterprise<SE.ColumnEditMode>(
    context,
    data.РежимРедактирования,
    SE.ColumnEditModeFromEnterprise
  )
  if (editMode !== undefined) result.editMode = editMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const footerText = importI8nTextFromEnterprise(context, data.ТекстПодвала)
  if (footerText !== undefined) result.footerText = footerText

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const fixingInTable = importSystemEnumerationFromEnterprise<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const footerTextColor = importColorFromEnterprise(context, data.ЦветТекстаПодвала)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  const titleBackColor = importColorFromEnterprise(context, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const footerBackColor = importColorFromEnterprise(context, data.ЦветФонаПодвала)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const footerFont = importFontFromEnterprise(context, data.ШрифтПодвала)
  if (footerFont !== undefined) result.footerFont = footerFont

  const autoChoiceIncomplete = importBooleanFromEnterprise(context, data.АвтоВыборНезаполненного)
  if (autoChoiceIncomplete !== undefined) result.autoChoiceIncomplete = autoChoiceIncomplete

  const autoCapitalizationOnTextInput = importSystemEnumerationFromEnterprise<SE.AutoCapitalizationOnTextInput>(
    context,
    data.АвтоИзменениеРегистраПриВводеТекста,
    SE.AutoCapitalizationOnTextInputFromEnterprise
  )
  if (autoCapitalizationOnTextInput !== undefined) result.autoCapitalizationOnTextInput = autoCapitalizationOnTextInput

  const autoCorrectionOnTextInput = importSystemEnumerationFromEnterprise<SE.AutoCorrectionOnTextInput>(
    context,
    data.АвтоИсправлениеПриВводеТекста,
    SE.AutoCorrectionOnTextInputFromEnterprise
  )
  if (autoCorrectionOnTextInput !== undefined) result.autoCorrectionOnTextInput = autoCorrectionOnTextInput

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const autoMarkIncomplete = importBooleanFromEnterprise(context, data.АвтоОтметкаНезаполненного)
  if (autoMarkIncomplete !== undefined) result.autoMarkIncomplete = autoMarkIncomplete

  const autoShowOpenButton = importSystemEnumerationFromEnterprise<SE.AutoShowOpenButtonMode>(
    context,
    data.АвтоОтображениеКнопкиОткрытия,
    SE.AutoShowOpenButtonModeFromEnterprise
  )
  if (autoShowOpenButton !== undefined) result.autoShowOpenButton = autoShowOpenButton

  const autoShowClearButton = importSystemEnumerationFromEnterprise<SE.AutoShowClearButtonMode>(
    context,
    data.АвтоОтображениеКнопкиОчистки,
    SE.AutoShowClearButtonModeFromEnterprise
  )
  if (autoShowClearButton !== undefined) result.autoShowClearButton = autoShowClearButton

  const wrap = importBooleanFromEnterprise(context, data.АвтоПереносСтрок)
  if (wrap !== undefined) result.wrap = wrap

  const quickChoice = importBooleanFromEnterprise(context, data.БыстрыйВыбор)
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const heightControlVariant = importSystemEnumerationFromEnterprise<SE.ItemHeightControlVariant>(
    context,
    data.ВариантУправленияВысотой,
    SE.ItemHeightControlVariantFromEnterprise
  )
  if (heightControlVariant !== undefined) result.heightControlVariant = heightControlVariant

  const chooseType = importBooleanFromEnterprise(context, data.ВыбиратьТип)
  if (chooseType !== undefined) result.chooseType = chooseType

  const choiceFoldersAndItems = importSystemEnumerationFromEnterprise<SE.FoldersAndItems>(
    context,
    data.ВыборГруппИЭлементов,
    SE.FoldersAndItemsFromEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = choiceFoldersAndItems

  if (data.ВыделенныйТекст !== undefined) result.selectedText = data.ВыделенныйТекст

  const markNegatives = importBooleanFromEnterprise(context, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ВысотаСпискаВыбора !== undefined) result.choiceListHeight = data.ВысотаСпискаВыбора

  const multipleValuesHyperlink = importBooleanFromEnterprise(context, data.ГиперссылкаМножественныхЗначений)
  if (multipleValuesHyperlink !== undefined) result.multipleValuesHyperlink = multipleValuesHyperlink

  const availableTypes = importTypeDescriptionFromEnterprise(context, data.ДоступныеТипы)
  if (availableTypes !== undefined) result.availableTypes = availableTypes

  const choiceHistoryOnInput = importSystemEnumerationFromEnterprise<SE.ChoiceHistoryOnInput>(
    context,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const choiceButtonPicture = importPictureFromEnterprise(context, data.КартинкаКнопкиВыбора)
  if (choiceButtonPicture !== undefined) result.choiceButtonPicture = choiceButtonPicture

  const multipleValuesPicture = importPictureFromEnterprise(context, data.КартинкаМножественныхЗначений)
  if (multipleValuesPicture !== undefined) result.multipleValuesPicture = multipleValuesPicture

  const choiceButton = importBooleanFromEnterprise(context, data.КнопкаВыбора)
  if (choiceButton !== undefined) result.choiceButton = choiceButton

  const dropListButton = importBooleanFromEnterprise(context, data.КнопкаВыпадающегоСписка)
  if (dropListButton !== undefined) result.dropListButton = dropListButton

  const openButton = importBooleanFromEnterprise(context, data.КнопкаОткрытия)
  if (openButton !== undefined) result.openButton = openButton

  const clearButton = importBooleanFromEnterprise(context, data.КнопкаОчистки)
  if (clearButton !== undefined) result.clearButton = clearButton

  const spinButton = importBooleanFromEnterprise(context, data.КнопкаРегулирования)
  if (spinButton !== undefined) result.spinButton = spinButton

  const createButton = importBooleanFromEnterprise(context, data.КнопкаСоздания)
  if (createButton !== undefined) result.createButton = createButton

  const choiceListButton = importBooleanFromEnterprise(context, data.КнопкаСпискаВыбора)
  if (choiceListButton !== undefined) result.choiceListButton = choiceListButton

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.Маска !== undefined) result.mask = data.Маска

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromEnterprise(context, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const editTextUpdate = importSystemEnumerationFromEnterprise<SE.EditTextUpdate>(
    context,
    data.ОбновлениеТекстаРедактирования,
    SE.EditTextUpdateFromEnterprise
  )
  if (editTextUpdate !== undefined) result.editTextUpdate = editTextUpdate

  const markIncomplete = importBooleanFromEnterprise(context, data.ОтметкаНезаполненного)
  if (markIncomplete !== undefined) result.markIncomplete = markIncomplete

  const showCheckBoxesInDropListWhenInputMultipleValues = importBooleanFromEnterprise(
    context,
    data.ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений
  )
  if (showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.showCheckBoxesInDropListWhenInputMultipleValues = showCheckBoxesInDropListWhenInputMultipleValues

  const choiceButtonRepresentation = importSystemEnumerationFromEnterprise<SE.ChoiceButtonRepresentation>(
    context,
    data.ОтображениеКнопкиВыбора,
    SE.ChoiceButtonRepresentationFromEnterprise
  )
  if (choiceButtonRepresentation !== undefined) result.choiceButtonRepresentation = choiceButtonRepresentation

  const choiceParameters = importChoiceParametersFromEnterprise(context, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const autoFillHint = importSystemEnumerationFromEnterprise<SE.InputFieldAutofillHint>(
    context,
    data.ПодсказкаАвтозаполнения,
    SE.InputFieldAutofillHintFromEnterprise
  )
  if (autoFillHint !== undefined) result.autoFillHint = autoFillHint

  const inputHint = importI8nTextFromEnterprise(context, data.ПодсказкаВвода)
  if (inputHint !== undefined) result.inputHint = inputHint

  const spellCheckingOnTextInput = importSystemEnumerationFromEnterprise<SE.SpellCheckingOnTextInput>(
    context,
    data.ПроверкаПравописанияПриВводеТекста,
    SE.SpellCheckingOnTextInputFromEnterprise
  )
  if (spellCheckingOnTextInput !== undefined) result.spellCheckingOnTextInput = spellCheckingOnTextInput

  if (data.ПутьКДаннымЗначенияМножественногоЗначения !== undefined)
    result.multipleValueValueDataPath = data.ПутьКДаннымЗначенияМножественногоЗначения

  if (data.ПутьКДаннымКартинкиМножественногоЗначения !== undefined)
    result.multipleValuePictureDataPath = data.ПутьКДаннымКартинкиМножественногоЗначения

  if (data.ПутьКДаннымПредставленияМножественногоЗначения !== undefined)
    result.multipleValuePresentationDataPath = data.ПутьКДаннымПредставленияМножественногоЗначения

  const multipleValuePictureSize = importSystemEnumerationFromEnterprise<SE.InputFieldMultipleValuePictureSize>(
    context,
    data.РазмерКартинкиМножественногоЗначения,
    SE.InputFieldMultipleValuePictureSizeFromEnterprise
  )
  if (multipleValuePictureSize !== undefined) result.multipleValuePictureSize = multipleValuePictureSize

  const allowInputEmptyMultipleValues = importBooleanFromEnterprise(
    context,
    data.РазрешитьВводПустыхМножественныхЗначений
  )
  if (allowInputEmptyMultipleValues !== undefined) result.allowInputEmptyMultipleValues = allowInputEmptyMultipleValues

  const allowMultipleValuesDuplicates = importBooleanFromEnterprise(
    context,
    data.РазрешитьДублированиеМножественныхЗначений
  )
  if (allowMultipleValuesDuplicates !== undefined) result.allowMultipleValuesDuplicates = allowMultipleValuesDuplicates

  const typeDomainEnabled = importBooleanFromEnterprise(context, data.РазрешитьСоставнойТип)
  if (typeDomainEnabled !== undefined) result.typeDomainEnabled = typeDomainEnabled

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedEdit = importBooleanFromEnterprise(context, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const multipleValuesExtendedEdit = importBooleanFromEnterprise(
    context,
    data.РасширенноеРедактированиеМножественныхЗначений
  )
  if (multipleValuesExtendedEdit !== undefined) result.multipleValuesExtendedEdit = multipleValuesExtendedEdit

  const textEdit = importBooleanFromEnterprise(context, data.РедактированиеТекста)
  if (textEdit !== undefined) result.textEdit = textEdit

  const listChoiceMode = importBooleanFromEnterprise(context, data.РежимВыбораИзСписка)
  if (listChoiceMode !== undefined) result.listChoiceMode = listChoiceMode

  const incompleteChoiceMode = importSystemEnumerationFromEnterprise<SE.IncompleteChoiceMode>(
    context,
    data.РежимВыбораНезаполненного,
    SE.IncompleteChoiceModeFromEnterprise
  )
  if (incompleteChoiceMode !== undefined) result.incompleteChoiceMode = incompleteChoiceMode

  const passwordMode = importBooleanFromEnterprise(context, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const choiceParameterLinks = importChoiceParameterLinksFromEnterprise(context, data.СвязиПараметровВыбора)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const typeLink = importTypeLinkFromEnterprise(context, data.СвязьПоТипу)
  if (typeLink !== undefined) result.typeLink = typeLink

  const specialTextInputMode = importSystemEnumerationFromEnterprise<SE.SpecialTextInputMode>(
    context,
    data.СпециальныйРежимВводаТекста,
    SE.SpecialTextInputModeFromEnterprise
  )
  if (specialTextInputMode !== undefined) result.specialTextInputMode = specialTextInputMode

  const choiceList = importChoiceListFromEnterprise(context, data.СписокВыбора)
  if (choiceList !== undefined) result.choiceList = choiceList

  const onScreenKeyboardReturnKeyText = importSystemEnumerationFromEnterprise<SE.OnScreenKeyboardReturnKeyText>(
    context,
    data.ТекстКнопкиВводаЭкраннойКлавиатуры,
    SE.OnScreenKeyboardReturnKeyTextFromEnterprise
  )
  if (onScreenKeyboardReturnKeyText !== undefined) result.onScreenKeyboardReturnKeyText = onScreenKeyboardReturnKeyText

  if (data.ТекстРедактирования !== undefined) result.editText = data.ТекстРедактирования

  const multipleValuePictureShape = importSystemEnumerationFromEnterprise<SE.InputFieldMultipleValuePictureShape>(
    context,
    data.ФигураКартинкиМножественногоЗначения,
    SE.InputFieldMultipleValuePictureShapeFromEnterprise
  )
  if (multipleValuePictureShape !== undefined) result.multipleValuePictureShape = multipleValuePictureShape

  if (data.ФормаВыбора !== undefined) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromEnterprise(context, data.Формат)
  if (format !== undefined) result.format = format

  const editFormat = importI8nTextFromEnterprise(context, data.ФорматРедактирования)
  if (editFormat !== undefined) result.editFormat = editFormat

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const multipleValuesTextColor = importColorFromEnterprise(context, data.ЦветТекстаМножественныхЗначений)
  if (multipleValuesTextColor !== undefined) result.multipleValuesTextColor = multipleValuesTextColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const multipleValuesBackColor = importColorFromEnterprise(context, data.ЦветФонаМножественныхЗначений)
  if (multipleValuesBackColor !== undefined) result.multipleValuesBackColor = multipleValuesBackColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  if (data.ШиринаВыпадающегоСписка !== undefined) result.dropListWidth = data.ШиринаВыпадающегоСписка

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const multipleValuesFont = importFontFromEnterprise(context, data.ШрифтМножественныхЗначений)
  if (multipleValuesFont !== undefined) result.multipleValuesFont = multipleValuesFont

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "InputField", importInputFieldPropsFromEnterprise)
