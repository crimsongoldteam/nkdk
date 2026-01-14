import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportTypeLinkToEnterprise } from "~/metadata/commonObjects/typeLink/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportChoiceParameterLinksToEnterprise } from "~/metadata/commonObjects/сhoiceParameterLinks/exportToEnterprise"
import { exportChoiceParametersToEnterprise } from "~/metadata/commonObjects/сhoiceParameters/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
} from "~/metadata/forms/elements/inputField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"


export function exportInputFieldTypedToEnterprise<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportInputFieldPropsToEnterprise(context, data)

  const result: InputFieldTypedEnterprise = {
    Тип: "ПолеВвода",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportInputFieldPartialToEnterprise<From extends InputField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportInputFieldPropsToEnterprise(context, data)

  const result: InputFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportInputFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: InputField
): InputFieldPartialEnterprise => {
  const result: InputFieldPartialEnterprise = {}

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

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

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

registerMetadata("ExportPartialToEnterprise", "InputField", exportInputFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "InputField", exportInputFieldTypedToEnterprise)
