import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { exportChoiceParametersToEnterprise } from "~/metadata/commonObjects/сhoiceParameters/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"
import { exportTableToEnterprise } from "../table/exportToEnterprise"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
} from "~/metadata/forms/elements/inputField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"


export function exportInputFieldTypedToEnterprise<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportInputFieldPropsToEnterprise(context, data)

  const result: InputFieldTypedEnterprise = {
    Тип: "ПолеВвода",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportInputFieldPartialToEnterprise<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportInputFieldPropsToEnterprise(context, data)

  const result: InputFieldPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportInputFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: InputField
): InputFieldPartialEnterprise => {
  const result: InputFieldPartialEnterprise = {}

  const autoCellHeight = exportBooleanToEnterprise(context, data.autoCellHeight)
  if (autoCellHeight !== undefined) result.АвтоВысотаЯчейки = autoCellHeight

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormFieldTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const cellHyperlink = exportBooleanToEnterprise(context, data.cellHyperlink)
  if (cellHyperlink !== undefined) result.ГиперссылкаЯчейки = cellHyperlink

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const footerHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.footerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВПодвале = footerHorizontalAlign

  const headerHorizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.headerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВШапке = headerHorizontalAlign

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const footerPicture = exportPictureToEnterprise(context, data.footerPicture)
  if (footerPicture !== undefined) result.КартинкаПодвала = footerPicture

  const headerPicture = exportPictureToEnterprise(context, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const typeRestriction = exportTypeDescriptionToEnterprise(context, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const showInFooter = exportBooleanToEnterprise(context, data.showInFooter)
  if (showInFooter !== undefined) result.ОтображатьВПодвале = showInFooter

  const showInHeader = exportBooleanToEnterprise(context, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.warningOnEditRepresentation,
    SE.WarningOnEditRepresentationToEnterprise
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const titleLocation = exportSystemEnumerationToEnterprise(
    context,
    data.titleLocation,
    SE.FormItemTitleLocationToEnterprise
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const userVisibleFormField = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisibleFormField !== undefined) {
    Object.assign(result, userVisibleFormField)
  }

  const warningOnEdit = exportI8nTextToEnterprise(context, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.footerDataPath !== undefined) result.ПутьКДаннымПодвала = data.footerDataPath

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const editMode = exportSystemEnumerationToEnterprise(context, data.editMode, SE.ColumnEditModeToEnterprise)
  if (editMode !== undefined) result.РежимРедактирования = editMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const table = exportTableToEnterprise(context, data.table)
  if (table !== undefined) result.Таблица = table

  const footerText = exportI8nTextToEnterprise(context, data.footerText)
  if (footerText !== undefined) result.ТекстПодвала = footerText

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const fixingInTable = exportSystemEnumerationToEnterprise(context, data.fixingInTable, SE.FixingInTableToEnterprise)
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const footerTextColor = exportColorToEnterprise(context, data.footerTextColor)
  if (footerTextColor !== undefined) result.ЦветТекстаПодвала = footerTextColor

  const titleBackColor = exportColorToEnterprise(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const footerBackColor = exportColorToEnterprise(context, data.footerBackColor)
  if (footerBackColor !== undefined) result.ЦветФонаПодвала = footerBackColor

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const footerFont = exportFontToEnterprise(context, data.footerFont)
  if (footerFont !== undefined) result.ШрифтПодвала = footerFont

  const autoChoiceIncomplete = exportBooleanToEnterprise(context, data.autoChoiceIncomplete)
  if (autoChoiceIncomplete !== undefined) result.АвтоВыборНезаполненного = autoChoiceIncomplete

  const autoCapitalizationOnTextInput = exportSystemEnumerationToEnterprise(
    context,
    data.autoCapitalizationOnTextInput,
    SE.AutoCapitalizationOnTextInputToEnterprise
  )
  if (autoCapitalizationOnTextInput !== undefined)
    result.АвтоИзменениеРегистраПриВводеТекста = autoCapitalizationOnTextInput

  const autoCorrectionOnTextInput = exportSystemEnumerationToEnterprise(
    context,
    data.autoCorrectionOnTextInput,
    SE.AutoCorrectionOnTextInputToEnterprise
  )
  if (autoCorrectionOnTextInput !== undefined) result.АвтоИсправлениеПриВводеТекста = autoCorrectionOnTextInput

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const autoMarkIncomplete = exportBooleanToEnterprise(context, data.autoMarkIncomplete)
  if (autoMarkIncomplete !== undefined) result.АвтоОтметкаНезаполненного = autoMarkIncomplete

  const autoShowOpenButton = exportSystemEnumerationToEnterprise(
    context,
    data.autoShowOpenButton,
    SE.AutoShowOpenButtonModeToEnterprise
  )
  if (autoShowOpenButton !== undefined) result.АвтоОтображениеКнопкиОткрытия = autoShowOpenButton

  const autoShowClearButton = exportSystemEnumerationToEnterprise(
    context,
    data.autoShowClearButton,
    SE.AutoShowClearButtonModeToEnterprise
  )
  if (autoShowClearButton !== undefined) result.АвтоОтображениеКнопкиОчистки = autoShowClearButton

  const wrap = exportBooleanToEnterprise(context, data.wrap)
  if (wrap !== undefined) result.АвтоПереносСтрок = wrap

  const quickChoice = exportBooleanToEnterprise(context, data.quickChoice)
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const heightControlVariant = exportSystemEnumerationToEnterprise(
    context,
    data.heightControlVariant,
    SE.ItemHeightControlVariantToEnterprise
  )
  if (heightControlVariant !== undefined) result.ВариантУправленияВысотой = heightControlVariant

  const chooseType = exportBooleanToEnterprise(context, data.chooseType)
  if (chooseType !== undefined) result.ВыбиратьТип = chooseType

  const choiceFoldersAndItems = exportSystemEnumerationToEnterprise(
    context,
    data.choiceFoldersAndItems,
    SE.FoldersAndItemsToEnterprise
  )
  if (choiceFoldersAndItems !== undefined) result.ВыборГруппИЭлементов = choiceFoldersAndItems

  if (data.selectedText !== undefined) result.ВыделенныйТекст = data.selectedText

  const markNegatives = exportBooleanToEnterprise(context, data.markNegatives)
  if (markNegatives !== undefined) result.ВыделятьОтрицательные = markNegatives

  if (data.height !== undefined) result.Высота = data.height

  if (data.choiceListHeight !== undefined) result.ВысотаСпискаВыбора = data.choiceListHeight

  const multipleValuesHyperlink = exportBooleanToEnterprise(context, data.multipleValuesHyperlink)
  if (multipleValuesHyperlink !== undefined) result.ГиперссылкаМножественныхЗначений = multipleValuesHyperlink

  const availableTypes = exportTypeDescriptionToEnterprise(context, data.availableTypes)
  if (availableTypes !== undefined) result.ДоступныеТипы = availableTypes

  const choiceHistoryOnInput = exportSystemEnumerationToEnterprise(
    context,
    data.choiceHistoryOnInput,
    SE.ChoiceHistoryOnInputToEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const choiceButtonPicture = exportPictureToEnterprise(context, data.choiceButtonPicture)
  if (choiceButtonPicture !== undefined) result.КартинкаКнопкиВыбора = choiceButtonPicture

  const multipleValuesPicture = exportPictureToEnterprise(context, data.multipleValuesPicture)
  if (multipleValuesPicture !== undefined) result.КартинкаМножественныхЗначений = multipleValuesPicture

  const choiceButton = exportBooleanToEnterprise(context, data.choiceButton)
  if (choiceButton !== undefined) result.КнопкаВыбора = choiceButton

  const dropListButton = exportBooleanToEnterprise(context, data.dropListButton)
  if (dropListButton !== undefined) result.КнопкаВыпадающегоСписка = dropListButton

  const openButton = exportBooleanToEnterprise(context, data.openButton)
  if (openButton !== undefined) result.КнопкаОткрытия = openButton

  const clearButton = exportBooleanToEnterprise(context, data.clearButton)
  if (clearButton !== undefined) result.КнопкаОчистки = clearButton

  const spinButton = exportBooleanToEnterprise(context, data.spinButton)
  if (spinButton !== undefined) result.КнопкаРегулирования = spinButton

  const createButton = exportBooleanToEnterprise(context, data.createButton)
  if (createButton !== undefined) result.КнопкаСоздания = createButton

  const choiceListButton = exportBooleanToEnterprise(context, data.choiceListButton)
  if (choiceListButton !== undefined) result.КнопкаСпискаВыбора = choiceListButton

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.maxValue !== undefined) result.МаксимальноеЗначение = data.maxValue

  if (data.mask !== undefined) result.Маска = data.mask

  if (data.minValue !== undefined) result.МинимальноеЗначение = data.minValue

  const multiLine = exportBooleanToEnterprise(context, data.multiLine)
  if (multiLine !== undefined) result.МногострочныйРежим = multiLine

  const editTextUpdate = exportSystemEnumerationToEnterprise(
    context,
    data.editTextUpdate,
    SE.EditTextUpdateToEnterprise
  )
  if (editTextUpdate !== undefined) result.ОбновлениеТекстаРедактирования = editTextUpdate

  const markIncomplete = exportBooleanToEnterprise(context, data.markIncomplete)
  if (markIncomplete !== undefined) result.ОтметкаНезаполненного = markIncomplete

  const showCheckBoxesInDropListWhenInputMultipleValues = exportBooleanToEnterprise(
    context,
    data.showCheckBoxesInDropListWhenInputMultipleValues
  )
  if (showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.ОтображатьФлажкиВВыпадающемСпискеПриВводеМножественныхЗначений =
      showCheckBoxesInDropListWhenInputMultipleValues

  const choiceButtonRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.choiceButtonRepresentation,
    SE.ChoiceButtonRepresentationToEnterprise
  )
  if (choiceButtonRepresentation !== undefined) result.ОтображениеКнопкиВыбора = choiceButtonRepresentation

  const choiceParameters = exportChoiceParametersToEnterprise(context, data.choiceParameters)
  if (choiceParameters !== undefined) result.ПараметрыВыбора = choiceParameters

  const autoFillHint = exportSystemEnumerationToEnterprise(
    context,
    data.autoFillHint,
    SE.InputFieldAutofillHintToEnterprise
  )
  if (autoFillHint !== undefined) result.ПодсказкаАвтозаполнения = autoFillHint

  const inputHint = exportI8nTextToEnterprise(context, data.inputHint)
  if (inputHint !== undefined) result.ПодсказкаВвода = inputHint


  const spellCheckingOnTextInput = exportSystemEnumerationToEnterprise(
    context,
    data.spellCheckingOnTextInput,
    SE.SpellCheckingOnTextInputToEnterprise
  )
  if (spellCheckingOnTextInput !== undefined) result.ПроверкаПравописанияПриВводеТекста = spellCheckingOnTextInput

  if (data.multipleValueValueDataPath !== undefined)
    result.ПутьКДаннымЗначенияМножественногоЗначения = data.multipleValueValueDataPath

  if (data.multipleValuePictureDataPath !== undefined)
    result.ПутьКДаннымКартинкиМножественногоЗначения = data.multipleValuePictureDataPath

  if (data.multipleValuePresentationDataPath !== undefined)
    result.ПутьКДаннымПредставленияМножественногоЗначения = data.multipleValuePresentationDataPath

  const multipleValuePictureSize = exportSystemEnumerationToEnterprise(
    context,
    data.multipleValuePictureSize,
    SE.InputFieldMultipleValuePictureSizeToEnterprise
  )
  if (multipleValuePictureSize !== undefined) result.РазмерКартинкиМножественногоЗначения = multipleValuePictureSize

  const allowInputEmptyMultipleValues = exportBooleanToEnterprise(context, data.allowInputEmptyMultipleValues)
  if (allowInputEmptyMultipleValues !== undefined)
    result.РазрешитьВводПустыхМножественныхЗначений = allowInputEmptyMultipleValues

  const allowMultipleValuesDuplicates = exportBooleanToEnterprise(context, data.allowMultipleValuesDuplicates)
  if (allowMultipleValuesDuplicates !== undefined)
    result.РазрешитьДублированиеМножественныхЗначений = allowMultipleValuesDuplicates

  const typeDomainEnabled = exportBooleanToEnterprise(context, data.typeDomainEnabled)
  if (typeDomainEnabled !== undefined) result.РазрешитьСоставнойТип = typeDomainEnabled

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedEdit = exportBooleanToEnterprise(context, data.extendedEdit)
  if (extendedEdit !== undefined) result.РасширенноеРедактирование = extendedEdit

  const multipleValuesExtendedEdit = exportBooleanToEnterprise(context, data.multipleValuesExtendedEdit)
  if (multipleValuesExtendedEdit !== undefined)
    result.РасширенноеРедактированиеМножественныхЗначений = multipleValuesExtendedEdit

  const textEdit = exportBooleanToEnterprise(context, data.textEdit)
  if (textEdit !== undefined) result.РедактированиеТекста = textEdit

  const listChoiceMode = exportBooleanToEnterprise(context, data.listChoiceMode)
  if (listChoiceMode !== undefined) result.РежимВыбораИзСписка = listChoiceMode

  const incompleteChoiceMode = exportSystemEnumerationToEnterprise(
    context,
    data.incompleteChoiceMode,
    SE.IncompleteChoiceModeToEnterprise
  )
  if (incompleteChoiceMode !== undefined) result.РежимВыбораНезаполненного = incompleteChoiceMode

  const passwordMode = exportBooleanToEnterprise(context, data.passwordMode)
  if (passwordMode !== undefined) result.РежимПароля = passwordMode

  const choiceParameterLinks = exportChoiceParameterLinksToEnterprise(context, data.choiceParameterLinks)
  if (choiceParameterLinks !== undefined) result.СвязиПараметровВыбора = choiceParameterLinks

  const typeLink = exportTypeLinkToEnterprise(context, data.typeLink)
  if (typeLink !== undefined) result.СвязьПоТипу = typeLink

  const specialTextInputMode = exportSystemEnumerationToEnterprise(
    context,
    data.specialTextInputMode,
    SE.SpecialTextInputModeToEnterprise
  )
  if (specialTextInputMode !== undefined) result.СпециальныйРежимВводаТекста = specialTextInputMode

  const choiceList = exportChoiceListToEnterprise(context, data.choiceList)
  if (choiceList !== undefined) result.СписокВыбора = choiceList

  const onScreenKeyboardReturnKeyText = exportSystemEnumerationToEnterprise(
    context,
    data.onScreenKeyboardReturnKeyText,
    SE.OnScreenKeyboardReturnKeyTextToEnterprise
  )
  if (onScreenKeyboardReturnKeyText !== undefined)
    result.ТекстКнопкиВводаЭкраннойКлавиатуры = onScreenKeyboardReturnKeyText

  if (data.editText !== undefined) result.ТекстРедактирования = data.editText

  const multipleValuePictureShape = exportSystemEnumerationToEnterprise(
    context,
    data.multipleValuePictureShape,
    SE.InputFieldMultipleValuePictureShapeToEnterprise
  )
  if (multipleValuePictureShape !== undefined) result.ФигураКартинкиМножественногоЗначения = multipleValuePictureShape

  if (data.choiceForm !== undefined) result.ФормаВыбора = data.choiceForm

  const format = exportI8nTextToEnterprise(context, data.format)
  if (format !== undefined) result.Формат = format

  const editFormat = exportI8nTextToEnterprise(context, data.editFormat)
  if (editFormat !== undefined) result.ФорматРедактирования = editFormat

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const multipleValuesTextColor = exportColorToEnterprise(context, data.multipleValuesTextColor)
  if (multipleValuesTextColor !== undefined) result.ЦветТекстаМножественныхЗначений = multipleValuesTextColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const multipleValuesBackColor = exportColorToEnterprise(context, data.multipleValuesBackColor)
  if (multipleValuesBackColor !== undefined) result.ЦветФонаМножественныхЗначений = multipleValuesBackColor

  if (data.width !== undefined) result.Ширина = data.width

  if (data.dropListWidth !== undefined) result.ШиринаВыпадающегоСписка = data.dropListWidth

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const multipleValuesFont = exportFontToEnterprise(context, data.multipleValuesFont)
  if (multipleValuesFont !== undefined) result.ШрифтМножественныхЗначений = multipleValuesFont

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "InputField",
  exportInputFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "InputField",
  exportInputFieldTypedToEnterprise as ExportTypedToEnterpriseFn
)
