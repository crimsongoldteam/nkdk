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
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
export function importInputFieldTypedFromEnterprise<To extends InputField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importInputFieldPropsFromEnterprise(context, undefined, data)

  const result: InputField = {
    ...props,
    elementType: FormElementType.InputField,
    name,
  }

  const title = importI8nTextFromEnterprise(context, undefined, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importInputFieldPartialFromEnterprise<To extends InputField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importInputFieldPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    elementType: FormElementType.InputField,
    name: source.name,
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importInputFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: InputFieldTypedEnterprise | InputFieldPartialEnterprise | undefined
): Omit<Partial<InputField>, "elementType" | "name"> => {
  const result: Omit<Partial<InputField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoCellHeight = importBooleanFromEnterprise(context, undefined, data.АвтоВысотаЯчейки)
  if (autoCellHeight !== undefined) result.autoCellHeight = autoCellHeight

  const defaultItem = importBooleanFromEnterprise(context, undefined, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    undefined,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromYAML<SE.FormFieldType>(
    context,
    undefined,
    data.Вид,
    SE.FormFieldTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const cellHyperlink = importBooleanFromEnterprise(context, undefined, data.ГиперссылкаЯчейки)
  if (cellHyperlink !== undefined) result.cellHyperlink = cellHyperlink

  const horizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const footerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВПодвале,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.footerHorizontalAlign = footerHorizontalAlign

  const headerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const footerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаПодвала)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const headerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const typeRestriction = importTypeDescriptionFromEnterprise(context, undefined, data.ОграничениеТипа)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const showInFooter = importBooleanFromEnterprise(context, undefined, data.ОтображатьВПодвале)
  if (showInFooter !== undefined) result.showInFooter = showInFooter

  const showInHeader = importBooleanFromEnterprise(context, undefined, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const warningOnEditRepresentation = importSystemEnumerationFromYAML<SE.WarningOnEditRepresentation>(
    context,
    undefined,
    data.ОтображениеПредупрежденияПриРедактировании,
    SE.WarningOnEditRepresentationFromEnterprise
  )
  if (warningOnEditRepresentation !== undefined) result.warningOnEditRepresentation = warningOnEditRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const titleLocation = importSystemEnumerationFromYAML<SE.FormItemTitleLocation>(
    context,
    undefined,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const warningOnEdit = importI8nTextFromEnterprise(context, undefined, data.ПредупреждениеПриРедактировании)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымПодвала !== undefined) result.footerDataPath = data.ПутьКДаннымПодвала

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const editMode = importSystemEnumerationFromYAML<SE.ColumnEditMode>(
    context,
    undefined,
    data.РежимРедактирования,
    SE.ColumnEditModeFromEnterprise
  )
  if (editMode !== undefined) result.editMode = editMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Таблица !== undefined) result.table = data.Таблица

  const footerText = importI8nTextFromEnterprise(context, undefined, data.ТекстПодвала)
  if (footerText !== undefined) result.footerText = footerText

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const fixingInTable = importSystemEnumerationFromYAML<SE.FixingInTable>(
    context,
    undefined,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const footerTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаПодвала)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  const titleBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const footerBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаПодвала)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const footerFont = importFontFromEnterprise(context, undefined, data.ШрифтПодвала)
  if (footerFont !== undefined) result.footerFont = footerFont

  const autoChoiceIncomplete = importBooleanFromEnterprise(context, undefined, data.АвтоВыборНезаполненного)
  if (autoChoiceIncomplete !== undefined) result.autoChoiceIncomplete = autoChoiceIncomplete

  const autoCapitalizationOnTextInput = importSystemEnumerationFromYAML<SE.AutoCapitalizationOnTextInput>(
    context,
    undefined,
    data.АвтоИзменениеРегистраПриВводеТекста,
    SE.AutoCapitalizationOnTextInputFromEnterprise
  )
  if (autoCapitalizationOnTextInput !== undefined) result.autoCapitalizationOnTextInput = autoCapitalizationOnTextInput

  const autoCorrectionOnTextInput = importSystemEnumerationFromYAML<SE.AutoCorrectionOnTextInput>(
    context,
    undefined,
    data.АвтоИсправлениеПриВводеТекста,
    SE.AutoCorrectionOnTextInputFromEnterprise
  )
  if (autoCorrectionOnTextInput !== undefined) result.autoCorrectionOnTextInput = autoCorrectionOnTextInput

  const autoMaxHeight = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, undefined, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const autoMarkIncomplete = importBooleanFromEnterprise(context, undefined, data.АвтоОтметкаНезаполненного)
  if (autoMarkIncomplete !== undefined) result.autoMarkIncomplete = autoMarkIncomplete

  const autoShowOpenButton = importSystemEnumerationFromYAML<SE.AutoShowOpenButtonMode>(
    context,
    undefined,
    data.АвтоОтображениеКнопкиОткрытия,
    SE.AutoShowOpenButtonModeFromEnterprise
  )
  if (autoShowOpenButton !== undefined) result.autoShowOpenButton = autoShowOpenButton

  const autoShowClearButton = importSystemEnumerationFromYAML<SE.AutoShowClearButtonMode>(
    context,
    undefined,
    data.АвтоОтображениеКнопкиОчистки,
    SE.AutoShowClearButtonModeFromEnterprise
  )
  if (autoShowClearButton !== undefined) result.autoShowClearButton = autoShowClearButton

  const wrap = importBooleanFromEnterprise(context, undefined, data.АвтоПереносСтрок)
  if (wrap !== undefined) result.wrap = wrap

  const quickChoice = importBooleanFromEnterprise(context, undefined, data.БыстрыйВыбор)
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const heightControlVariant = importSystemEnumerationFromYAML<SE.ItemHeightControlVariant>(
    context,
    undefined,
    data.ВариантУправленияВысотой,
    SE.ItemHeightControlVariantFromEnterprise
  )
  if (heightControlVariant !== undefined) result.heightControlVariant = heightControlVariant

  const chooseType = importBooleanFromEnterprise(context, undefined, data.ВыбиратьТип)
  if (chooseType !== undefined) result.chooseType = chooseType

  const choiceFoldersAndItems = importSystemEnumerationFromYAML<SE.FoldersAndItems>(
    context,
    undefined,
    data.ВыборГруппИЭлементов,
    SE.FoldersAndItemsFromEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = choiceFoldersAndItems

  // if (data.ВыделенныйТекст !== undefined) result.selectedText = data.ВыделенныйТекст

  const markNegatives = importBooleanFromEnterprise(context, undefined, data.ВыделятьОтрицательные)
  if (markNegatives !== undefined) result.markNegatives = markNegatives

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ВысотаСпискаВыбора !== undefined) result.choiceListHeight = data.ВысотаСпискаВыбора

  const multipleValuesHyperlink = importBooleanFromEnterprise(context, undefined, data.ГиперссылкаМножественныхЗначений)
  if (multipleValuesHyperlink !== undefined) result.multipleValuesHyperlink = multipleValuesHyperlink

  const availableTypes = importTypeDescriptionFromEnterprise(context, undefined, data.ДоступныеТипы)
  if (availableTypes !== undefined) result.availableTypes = availableTypes

  const choiceHistoryOnInput = importSystemEnumerationFromYAML<SE.ChoiceHistoryOnInput>(
    context,
    undefined,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const choiceButtonPicture = importPictureFromEnterprise(context, undefined, data.КартинкаКнопкиВыбора)
  if (choiceButtonPicture !== undefined) result.choiceButtonPicture = choiceButtonPicture

  const multipleValuesPicture = importPictureFromEnterprise(context, undefined, data.КартинкаМножественныхЗначений)
  if (multipleValuesPicture !== undefined) result.multipleValuesPicture = multipleValuesPicture

  const choiceButton = importBooleanFromEnterprise(context, undefined, data.КнопкаВыбора)
  if (choiceButton !== undefined) result.choiceButton = choiceButton

  const dropListButton = importBooleanFromEnterprise(context, undefined, data.КнопкаВыпадающегоСписка)
  if (dropListButton !== undefined) result.dropListButton = dropListButton

  const openButton = importBooleanFromEnterprise(context, undefined, data.КнопкаОткрытия)
  if (openButton !== undefined) result.openButton = openButton

  const clearButton = importBooleanFromEnterprise(context, undefined, data.КнопкаОчистки)
  if (clearButton !== undefined) result.clearButton = clearButton

  const spinButton = importBooleanFromEnterprise(context, undefined, data.КнопкаРегулирования)
  if (spinButton !== undefined) result.spinButton = spinButton

  const createButton = importBooleanFromEnterprise(context, undefined, data.КнопкаСоздания)
  if (createButton !== undefined) result.createButton = createButton

  const choiceListButton = importBooleanFromEnterprise(context, undefined, data.КнопкаСпискаВыбора)
  if (choiceListButton !== undefined) result.choiceListButton = choiceListButton

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.МаксимальноеЗначение !== undefined) result.maxValue = data.МаксимальноеЗначение

  if (data.Маска !== undefined) result.mask = data.Маска

  if (data.МинимальноеЗначение !== undefined) result.minValue = data.МинимальноеЗначение

  const multiLine = importBooleanFromEnterprise(context, undefined, data.МногострочныйРежим)
  if (multiLine !== undefined) result.multiLine = multiLine

  const editTextUpdate = importSystemEnumerationFromYAML<SE.EditTextUpdate>(
    context,
    undefined,
    data.ОбновлениеТекстаРедактирования,
    SE.EditTextUpdateFromEnterprise
  )
  if (editTextUpdate !== undefined) result.editTextUpdate = editTextUpdate

  const markIncomplete = importBooleanFromEnterprise(context, undefined, data.ОтметкаНезаполненного)
  if (markIncomplete !== undefined) result.markIncomplete = markIncomplete

  const showCheckBoxesInDropListWhenInputMultipleValues = importBooleanFromEnterprise(
    context,
    undefined,
    data.ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений
  )
  if (showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.showCheckBoxesInDropListWhenInputMultipleValues = showCheckBoxesInDropListWhenInputMultipleValues

  const choiceButtonRepresentation = importSystemEnumerationFromYAML<SE.ChoiceButtonRepresentation>(
    context,
    undefined,
    data.ОтображениеКнопкиВыбора,
    SE.ChoiceButtonRepresentationFromEnterprise
  )
  if (choiceButtonRepresentation !== undefined) result.choiceButtonRepresentation = choiceButtonRepresentation

  const choiceParameters = importChoiceParametersFromEnterprise(context, undefined, data.ПараметрыВыбора)
  if (choiceParameters !== undefined) result.choiceParameters = choiceParameters

  const autoFillHint = importSystemEnumerationFromYAML<SE.InputFieldAutofillHint>(
    context,
    undefined,
    data.ПодсказкаАвтозаполнения,
    SE.InputFieldAutofillHintFromEnterprise
  )
  if (autoFillHint !== undefined) result.autoFillHint = autoFillHint

  const inputHint = importI8nTextFromEnterprise(context, undefined, data.ПодсказкаВвода)
  if (inputHint !== undefined) result.inputHint = inputHint

  const spellCheckingOnTextInput = importSystemEnumerationFromYAML<SE.SpellCheckingOnTextInput>(
    context,
    undefined,
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

  const multipleValuePictureSize = importSystemEnumerationFromYAML<SE.InputFieldMultipleValuePictureSize>(
    context,
    undefined,
    data.РазмерКартинкиМножественногоЗначения,
    SE.InputFieldMultipleValuePictureSizeFromEnterprise
  )
  if (multipleValuePictureSize !== undefined) result.multipleValuePictureSize = multipleValuePictureSize

  const allowInputEmptyMultipleValues = importBooleanFromEnterprise(
    context,
    undefined,
    data.РазрешитьВводПустыхМножественныхЗначений
  )
  if (allowInputEmptyMultipleValues !== undefined) result.allowInputEmptyMultipleValues = allowInputEmptyMultipleValues

  const allowMultipleValuesDuplicates = importBooleanFromEnterprise(
    context,
    undefined,
    data.РазрешитьДублированиеМножественныхЗначений
  )
  if (allowMultipleValuesDuplicates !== undefined) result.allowMultipleValuesDuplicates = allowMultipleValuesDuplicates

  const typeDomainEnabled = importBooleanFromEnterprise(context, undefined, data.РазрешитьСоставнойТип)
  if (typeDomainEnabled !== undefined) result.typeDomainEnabled = typeDomainEnabled

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedEdit = importBooleanFromEnterprise(context, undefined, data.РасширенноеРедактирование)
  if (extendedEdit !== undefined) result.extendedEdit = extendedEdit

  const multipleValuesExtendedEdit = importBooleanFromEnterprise(
    context,
    undefined,
    data.РасширенноеРедактированиеМножественныхЗначений
  )
  if (multipleValuesExtendedEdit !== undefined) result.multipleValuesExtendedEdit = multipleValuesExtendedEdit

  const textEdit = importBooleanFromEnterprise(context, undefined, data.РедактированиеТекста)
  if (textEdit !== undefined) result.textEdit = textEdit

  const listChoiceMode = importBooleanFromEnterprise(context, undefined, data.РежимВыбораИзСписка)
  if (listChoiceMode !== undefined) result.listChoiceMode = listChoiceMode

  const incompleteChoiceMode = importSystemEnumerationFromYAML<SE.IncompleteChoiceMode>(
    context,
    undefined,
    data.РежимВыбораНезаполненного,
    SE.IncompleteChoiceModeFromEnterprise
  )
  if (incompleteChoiceMode !== undefined) result.incompleteChoiceMode = incompleteChoiceMode

  const passwordMode = importBooleanFromEnterprise(context, undefined, data.РежимПароля)
  if (passwordMode !== undefined) result.passwordMode = passwordMode

  const choiceParameterLinks = importChoiceParameterLinksFromEnterprise(context, undefined, data.СвязиПараметровВыбора)
  if (choiceParameterLinks !== undefined) result.choiceParameterLinks = choiceParameterLinks

  const typeLink = importTypeLinkFromEnterprise(context, undefined, data.СвязьПоТипу)
  if (typeLink !== undefined) result.typeLink = typeLink

  const specialTextInputMode = importSystemEnumerationFromYAML<SE.SpecialTextInputMode>(
    context,
    undefined,
    data.СпециальныйРежимВводаТекста,
    SE.SpecialTextInputModeFromEnterprise
  )
  if (specialTextInputMode !== undefined) result.specialTextInputMode = specialTextInputMode

  const choiceList = importChoiceListFromEnterprise(context, undefined, data.СписокВыбора)
  if (choiceList !== undefined) result.choiceList = choiceList

  const onScreenKeyboardReturnKeyText = importSystemEnumerationFromYAML<SE.OnScreenKeyboardReturnKeyText>(
    context,
    undefined,
    data.ТекстКнопкиВводаЭкраннойКлавиатуры,
    SE.OnScreenKeyboardReturnKeyTextFromEnterprise
  )
  if (onScreenKeyboardReturnKeyText !== undefined) result.onScreenKeyboardReturnKeyText = onScreenKeyboardReturnKeyText

  if (data.ТекстРедактирования !== undefined) result.editText = data.ТекстРедактирования

  const multipleValuePictureShape = importSystemEnumerationFromYAML<SE.InputFieldMultipleValuePictureShape>(
    context,
    undefined,
    data.ФигураКартинкиМножественногоЗначения,
    SE.InputFieldMultipleValuePictureShapeFromEnterprise
  )
  if (multipleValuePictureShape !== undefined) result.multipleValuePictureShape = multipleValuePictureShape

  if (data.ФормаВыбора !== undefined) result.choiceForm = data.ФормаВыбора

  const format = importI8nTextFromEnterprise(context, undefined, data.Формат)
  if (format !== undefined) result.format = format

  const editFormat = importI8nTextFromEnterprise(context, undefined, data.ФорматРедактирования)
  if (editFormat !== undefined) result.editFormat = editFormat

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const multipleValuesTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаМножественныхЗначений)
  if (multipleValuesTextColor !== undefined) result.multipleValuesTextColor = multipleValuesTextColor

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const multipleValuesBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаМножественныхЗначений)
  if (multipleValuesBackColor !== undefined) result.multipleValuesBackColor = multipleValuesBackColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  if (data.ШиринаВыпадающегоСписка !== undefined) result.dropListWidth = data.ШиринаВыпадающегоСписка

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  const multipleValuesFont = importFontFromEnterprise(context, undefined, data.ШрифтМножественныхЗначений)
  if (multipleValuesFont !== undefined) result.multipleValuesFont = multipleValuesFont

  const events = importEventsFromEnterprise(context, undefined, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "InputField",
  importInputFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)

registerMetadata(
  "ImportTypedFromEnterprise",
  "InputField",
  importInputFieldTypedFromEnterprise as ImportTypedFromEnterpriseFn
)
