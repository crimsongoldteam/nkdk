import { exportColorToPreview } from "~/metadata/commonObjects/color/exportToPreview"
import { exportFontToPreview } from "~/metadata/commonObjects/font/exportToPreview"
import { exportI8nTextToPreview } from "~/metadata/commonObjects/i8nText/exportToPreview"
import { exportPictureToPreview } from "~/metadata/commonObjects/picture/exportToPreview"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToPreviewFn } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToPreview } from "~/metadata/systemEnumerations/exportToPreview"
import { getAttributeName } from "../../preview/getAttributeName"
import { InputField, InputFieldPreview } from "./types"

export const exportInputFieldToPreview = (context: ConfigurationContext, element: InputField): InputFieldPreview => {
  const result: InputFieldPreview = {
    ElementType: "InputField",
    Name: element.name,
  }

  if (element.allowInputEmptyMultipleValues !== undefined)
    result.AllowInputEmptyMultipleValues = element.allowInputEmptyMultipleValues

  if (element.allowMultipleValuesDuplicates !== undefined)
    result.AllowMultipleValuesDuplicates = element.allowMultipleValuesDuplicates

  const autoCapitalizationOnTextInput = exportSystemEnumerationToPreview(
    context,
    element.autoCapitalizationOnTextInput,
    "AutoCapitalizationOnTextInput"
  )
  if (autoCapitalizationOnTextInput !== undefined) result.AutoCapitalizationOnTextInput = autoCapitalizationOnTextInput

  if (element.autoChoiceIncomplete !== undefined) result.AutoChoiceIncomplete = element.autoChoiceIncomplete

  const autoCorrectionOnTextInput = exportSystemEnumerationToPreview(
    context,
    element.autoCorrectionOnTextInput,
    "AutoCorrectionOnTextInput"
  )
  if (autoCorrectionOnTextInput !== undefined) result.AutoCorrectionOnTextInput = autoCorrectionOnTextInput

  const autoFillHint = exportSystemEnumerationToPreview(context, element.autoFillHint, "InputFieldAutofillHint")
  if (autoFillHint !== undefined) result.AutoFillHint = autoFillHint

  if (element.autoMarkIncomplete !== undefined) result.AutoMarkIncomplete = element.autoMarkIncomplete

  if (element.autoMaxHeight !== undefined) result.AutoMaxHeight = element.autoMaxHeight

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const autoShowClearButton = exportSystemEnumerationToPreview(
    context,
    element.autoShowClearButton,
    "AutoShowClearButtonMode"
  )
  if (autoShowClearButton !== undefined) result.AutoShowClearButton = autoShowClearButton

  const autoShowOpenButton = exportSystemEnumerationToPreview(
    context,
    element.autoShowOpenButton,
    "AutoShowOpenButtonMode"
  )
  if (autoShowOpenButton !== undefined) result.AutoShowOpenButton = autoShowOpenButton

  const backColor = exportColorToPreview(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToPreview(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (element.choiceButton !== undefined) result.ChoiceButton = element.choiceButton

  const choiceButtonPicture = exportPictureToPreview(context, element.choiceButtonPicture)
  if (choiceButtonPicture !== undefined) result.ChoiceButtonPicture = choiceButtonPicture

  const choiceButtonRepresentation = exportSystemEnumerationToPreview(
    context,
    element.choiceButtonRepresentation,
    "ChoiceButtonRepresentation"
  )
  if (choiceButtonRepresentation !== undefined) result.ChoiceButtonRepresentation = choiceButtonRepresentation

  const choiceFoldersAndItems = exportSystemEnumerationToPreview(
    context,
    element.choiceFoldersAndItems,
    "FoldersAndItems"
  )
  if (choiceFoldersAndItems !== undefined) result.ChoiceFoldersAndItems = choiceFoldersAndItems

  if (element.choiceForm !== undefined) result.ChoiceForm = element.choiceForm

  const choiceHistoryOnInput = exportSystemEnumerationToPreview(
    context,
    element.choiceHistoryOnInput,
    "ChoiceHistoryOnInput"
  )
  if (choiceHistoryOnInput !== undefined) result.ChoiceHistoryOnInput = choiceHistoryOnInput

  if (element.choiceListButton !== undefined) result.ChoiceListButton = element.choiceListButton

  if (element.choiceListHeight !== undefined) result.ChoiceListHeight = element.choiceListHeight

  if (element.chooseType !== undefined) result.ChooseType = element.chooseType

  if (element.clearButton !== undefined) result.ClearButton = element.clearButton

  if (element.createButton !== undefined) result.CreateButton = element.createButton

  if (element.dropListButton !== undefined) result.DropListButton = element.dropListButton

  if (element.dropListWidth !== undefined) result.DropListWidth = element.dropListWidth

  const editFormat = exportI8nTextToPreview(context, element.editFormat)
  if (editFormat !== undefined) result.EditFormat = editFormat

  if (element.editText !== undefined) result.EditText = element.editText

  const editTextUpdate = exportSystemEnumerationToPreview(context, element.editTextUpdate, "EditTextUpdate")
  if (editTextUpdate !== undefined) result.EditTextUpdate = editTextUpdate

  if (element.extendedEdit !== undefined) result.ExtendedEdit = element.extendedEdit

  const font = exportFontToPreview(context, element.font)
  if (font !== undefined) result.Font = font

  const format = exportI8nTextToPreview(context, element.format)
  if (format !== undefined) result.Format = format

  if (element.height !== undefined) result.Height = element.height

  const heightControlVariant = exportSystemEnumerationToPreview(
    context,
    element.heightControlVariant,
    "ItemHeightControlVariant"
  )
  if (heightControlVariant !== undefined) result.HeightControlVariant = heightControlVariant

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  const incompleteChoiceMode = exportSystemEnumerationToPreview(
    context,
    element.incompleteChoiceMode,
    "IncompleteChoiceMode"
  )
  if (incompleteChoiceMode !== undefined) result.IncompleteChoiceMode = incompleteChoiceMode

  const inputHint = exportI8nTextToPreview(context, element.inputHint)
  if (inputHint !== undefined) result.InputHint = inputHint

  if (element.listChoiceMode !== undefined) result.ListChoiceMode = element.listChoiceMode

  if (element.markIncomplete !== undefined) result.MarkIncomplete = element.markIncomplete

  if (element.markNegatives !== undefined) result.MarkNegatives = element.markNegatives

  if (element.mask !== undefined) result.Mask = element.mask

  if (element.maxHeight !== undefined) result.MaxHeight = element.maxHeight

  if (element.maxValue !== undefined) result.MaxValue = element.maxValue

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  if (element.minValue !== undefined) result.MinValue = element.minValue

  if (element.multiLine !== undefined) result.MultiLine = element.multiLine

  const multipleValuePictureDataPath = getAttributeName(context, element.multipleValuePictureDataPath)
  if (multipleValuePictureDataPath !== undefined) result.MultipleValuePictureDataPath = multipleValuePictureDataPath

  const multipleValuePictureShape = exportSystemEnumerationToPreview(
    context,
    element.multipleValuePictureShape,
    "InputFieldMultipleValuePictureShape"
  )
  if (multipleValuePictureShape !== undefined) result.MultipleValuePictureShape = multipleValuePictureShape

  const multipleValuePictureSize = exportSystemEnumerationToPreview(
    context,
    element.multipleValuePictureSize,
    "InputFieldMultipleValuePictureSize"
  )
  if (multipleValuePictureSize !== undefined) result.MultipleValuePictureSize = multipleValuePictureSize

  const multipleValuePresentationDataPath = getAttributeName(context, element.multipleValuePresentationDataPath)
  if (multipleValuePresentationDataPath !== undefined)
    result.MultipleValuePresentationDataPath = multipleValuePresentationDataPath

  const multipleValuesBackColor = exportColorToPreview(context, element.multipleValuesBackColor)
  if (multipleValuesBackColor !== undefined) result.MultipleValuesBackColor = multipleValuesBackColor

  if (element.multipleValuesExtendedEdit !== undefined)
    result.MultipleValuesExtendedEdit = element.multipleValuesExtendedEdit

  const multipleValuesFont = exportFontToPreview(context, element.multipleValuesFont)
  if (multipleValuesFont !== undefined) result.MultipleValuesFont = multipleValuesFont

  if (element.multipleValuesHyperlink !== undefined) result.MultipleValuesHyperlink = element.multipleValuesHyperlink

  const multipleValuesPicture = exportPictureToPreview(context, element.multipleValuesPicture)
  if (multipleValuesPicture !== undefined) result.MultipleValuesPicture = multipleValuesPicture

  const multipleValuesTextColor = exportColorToPreview(context, element.multipleValuesTextColor)
  if (multipleValuesTextColor !== undefined) result.MultipleValuesTextColor = multipleValuesTextColor

  const multipleValueValueDataPath = getAttributeName(context, element.multipleValueValueDataPath)
  if (multipleValueValueDataPath !== undefined) result.MultipleValueValueDataPath = multipleValueValueDataPath

  const onScreenKeyboardReturnKeyText = exportSystemEnumerationToPreview(
    context,
    element.onScreenKeyboardReturnKeyText,
    "OnScreenKeyboardReturnKeyText"
  )
  if (onScreenKeyboardReturnKeyText !== undefined) result.OnScreenKeyboardReturnKeyText = onScreenKeyboardReturnKeyText

  if (element.openButton !== undefined) result.OpenButton = element.openButton

  if (element.passwordMode !== undefined) result.PasswordMode = element.passwordMode

  if (element.quickChoice !== undefined) result.QuickChoice = element.quickChoice

  if (element.selectedText !== undefined) result.SelectedText = element.selectedText

  if (element.showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
    result.ShowCheckBoxesInDropListWhenInputMultipleValues = element.showCheckBoxesInDropListWhenInputMultipleValues

  const specialTextInputMode = exportSystemEnumerationToPreview(
    context,
    element.specialTextInputMode,
    "SpecialTextInputMode"
  )
  if (specialTextInputMode !== undefined) result.SpecialTextInputMode = specialTextInputMode

  const spellCheckingOnTextInput = exportSystemEnumerationToPreview(
    context,
    element.spellCheckingOnTextInput,
    "SpellCheckingOnTextInput"
  )
  if (spellCheckingOnTextInput !== undefined) result.SpellCheckingOnTextInput = spellCheckingOnTextInput

  if (element.spinButton !== undefined) result.SpinButton = element.spinButton

  const textColor = exportColorToPreview(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (element.textEdit !== undefined) result.TextEdit = element.textEdit

  if (element.typeDomainEnabled !== undefined) result.TypeDomainEnabled = element.typeDomainEnabled

  if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

  if (element.width !== undefined) result.Width = element.width

  if (element.wrap !== undefined) result.Wrap = element.wrap

  if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

  if (element.cellHyperlink !== undefined) result.CellHyperlink = element.cellHyperlink

  const dataPath = getAttributeName(context, element.dataPath)
  if (dataPath !== undefined) result.DataPath = dataPath

  if (element.defaultItem !== undefined) result.DefaultItem = element.defaultItem

  const displayImportance = exportSystemEnumerationToPreview(context, element.displayImportance, "DisplayImportance")
  if (displayImportance !== undefined) result.DisplayImportance = displayImportance

  const editMode = exportSystemEnumerationToPreview(context, element.editMode, "EditMode")
  if (editMode !== undefined) result.EditMode = editMode

  if (element.enabled !== undefined) result.Enabled = element.enabled

  const fixingInTable = exportSystemEnumerationToPreview(context, element.fixingInTable, "FixingInTable")
  if (fixingInTable !== undefined) result.FixingInTable = fixingInTable

  const footerBackColor = exportColorToPreview(context, element.footerBackColor)
  if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

  const footerDataPath = getAttributeName(context, element.footerDataPath)
  if (footerDataPath !== undefined) result.FooterDataPath = footerDataPath

  const footerFont = exportFontToPreview(context, element.footerFont)
  if (footerFont !== undefined) result.FooterFont = footerFont

  const footerHorizontalAlign = exportSystemEnumerationToPreview(
    context,
    element.footerHorizontalAlign,
    "HorizontalAlign"
  )
  if (footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = footerHorizontalAlign

  const footerPicture = exportPictureToPreview(context, element.footerPicture)
  if (footerPicture !== undefined) result.FooterPicture = footerPicture

  const footerText = exportI8nTextToPreview(context, element.footerText)
  if (footerText !== undefined) result.FooterText = footerText

  const footerTextColor = exportColorToPreview(context, element.footerTextColor)
  if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

  const headerHorizontalAlign = exportSystemEnumerationToPreview(
    context,
    element.headerHorizontalAlign,
    "HorizontalAlign"
  )
  if (headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = headerHorizontalAlign

  const headerPicture = exportPictureToPreview(context, element.headerPicture)
  if (headerPicture !== undefined) result.HeaderPicture = headerPicture

  const horizontalAlign = exportSystemEnumerationToPreview(context, element.horizontalAlign, "HorizontalAlign")
  if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToPreview(
    context,
    element.horizontalAlignInGroup,
    "HorizontalAlign"
  )
  if (horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = horizontalAlignInGroup

  if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

  if (element.showInFooter !== undefined) result.ShowInFooter = element.showInFooter

  if (element.showInHeader !== undefined) result.ShowInHeader = element.showInHeader

  if (element.skipOnInput !== undefined) result.SkipOnInput = element.skipOnInput

  const title = exportI8nTextToPreview(context, element.title)
  if (title !== undefined) result.Title = title

  const titleBackColor = exportColorToPreview(context, element.titleBackColor)
  if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

  const titleFont = exportFontToPreview(context, element.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (element.titleHeight !== undefined) result.TitleHeight = element.titleHeight

  const titleLocation = exportSystemEnumerationToPreview(context, element.titleLocation, "TitleLocation")
  if (titleLocation !== undefined) result.TitleLocation = titleLocation

  const titleTextColor = exportColorToPreview(context, element.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToPreview(context, element.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  const toolTipRepresentation = exportSystemEnumerationToPreview(
    context,
    element.toolTipRepresentation,
    "ToolTipRepresentation"
  )
  if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation

  const verticalAlign = exportSystemEnumerationToPreview(context, element.verticalAlign, "VerticalAlign")
  if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToPreview(context, element.verticalAlignInGroup, "VerticalAlign")
  if (verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = verticalAlignInGroup

  if (element.visible !== undefined) result.Visible = element.visible

  const warningOnEdit = exportI8nTextToPreview(context, element.warningOnEdit)
  if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

  const warningOnEditRepresentation = exportSystemEnumerationToPreview(
    context,
    element.warningOnEditRepresentation,
    "WarningOnEditRepresentation"
  )
  if (warningOnEditRepresentation !== undefined) result.WarningOnEditRepresentation = warningOnEditRepresentation

  return result
}

registerMetadata("ExportToPreview", "InputField", exportInputFieldToPreview as ExportToPreviewFn)
