// import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
// import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
// import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
// import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
// import { ConfigurationContext } from "~/metadata/context/types"
// import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
// import { ExportToEnterpriseFn } from "~/metadata/metadataFactory/types"
// import { exportSystemEnumerationDeprecatedToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
// import { getAttributeName } from "../../preview/getAttributeName"
// import { PropertyRule } from "../calendarField/rules"
// import { InputField, InputFieldEnterprise } from "./types"

// export const exportInputFieldToEnterprise = (
//   context: ConfigurationContext,
//   _rule: PropertyRule<any>,
//   element: InputField
// ): InputFieldEnterprise => {
//   const result: InputFieldEnterprise = {
//     itemType: "FormField",
//     Name: element.name,
//     Type: exportSystemEnumerationDeprecatedToEnterprise(context, undefined, "InputField", "FormFieldType")!,
//   }

//   if (element.allowInputEmptyMultipleValues !== undefined)
//     result.AllowInputEmptyMultipleValues = element.allowInputEmptyMultipleValues

//   if (element.allowMultipleValuesDuplicates !== undefined)
//     result.AllowMultipleValuesDuplicates = element.allowMultipleValuesDuplicates

//   const autoCapitalizationOnTextInput = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.autoCapitalizationOnTextInput,
//     "AutoCapitalizationOnTextInput"
//   )
//   if (autoCapitalizationOnTextInput !== undefined) result.AutoCapitalizationOnTextInput = autoCapitalizationOnTextInput

//   if (element.autoChoiceIncomplete !== undefined) result.AutoChoiceIncomplete = element.autoChoiceIncomplete

//   const autoCorrectionOnTextInput = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.autoCorrectionOnTextInput,
//     "AutoCorrectionOnTextInput"
//   )
//   if (autoCorrectionOnTextInput !== undefined) result.AutoCorrectionOnTextInput = autoCorrectionOnTextInput

//   const autoFillHint = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.autoFillHint,
//     "InputFieldAutofillHint"
//   )
//   if (autoFillHint !== undefined) result.AutoFillHint = autoFillHint

//   if (element.autoMarkIncomplete !== undefined) result.AutoMarkIncomplete = element.autoMarkIncomplete

//   if (element.autoMaxHeight !== undefined) result.AutoMaxHeight = element.autoMaxHeight

//   if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

//   const autoShowClearButton = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.autoShowClearButton,
//     "AutoShowClearButtonMode"
//   )
//   if (autoShowClearButton !== undefined) result.AutoShowClearButton = autoShowClearButton

//   const autoShowOpenButton = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.autoShowOpenButton,
//     "AutoShowOpenButtonMode"
//   )
//   if (autoShowOpenButton !== undefined) result.AutoShowOpenButton = autoShowOpenButton

//   const backColor = exportColorToEnterprise(context, undefined, element.backColor)
//   if (backColor !== undefined) result.BackColor = backColor

//   const borderColor = exportColorToEnterprise(context, undefined, element.borderColor)
//   if (borderColor !== undefined) result.BorderColor = borderColor

//   if (element.choiceButton !== undefined) result.ChoiceButton = element.choiceButton

//   const choiceButtonPicture = exportPictureToEnterprise(context, undefined, element.choiceButtonPicture)
//   if (choiceButtonPicture !== undefined) result.ChoiceButtonPicture = choiceButtonPicture

//   const choiceButtonRepresentation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.choiceButtonRepresentation,
//     "ChoiceButtonRepresentation"
//   )
//   if (choiceButtonRepresentation !== undefined) result.ChoiceButtonRepresentation = choiceButtonRepresentation

//   const choiceFoldersAndItems = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.choiceFoldersAndItems,
//     "FoldersAndItems"
//   )
//   if (choiceFoldersAndItems !== undefined) result.ChoiceFoldersAndItems = choiceFoldersAndItems

//   // if (element.choiceForm !== undefined) result.ChoiceForm = element.choiceForm

//   const choiceHistoryOnInput = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.choiceHistoryOnInput,
//     "ChoiceHistoryOnInput"
//   )
//   if (choiceHistoryOnInput !== undefined) result.ChoiceHistoryOnInput = choiceHistoryOnInput

//   if (element.choiceListButton !== undefined) result.ChoiceListButton = element.choiceListButton

//   if (element.choiceListHeight !== undefined) result.ChoiceListHeight = element.choiceListHeight

//   if (element.chooseType !== undefined) result.ChooseType = element.chooseType

//   if (element.clearButton !== undefined) result.ClearButton = element.clearButton

//   if (element.createButton !== undefined) result.CreateButton = element.createButton

//   if (element.dropListButton !== undefined) result.DropListButton = element.dropListButton

//   if (element.dropListWidth !== undefined) result.DropListWidth = element.dropListWidth

//   const editFormat = exportI8nTextToEnterprise(context, undefined, element.editFormat)
//   if (editFormat !== undefined) result.EditFormat = editFormat

//   // if (element.editText !== undefined) result.EditText = element.editText

//   const editTextUpdate = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.editTextUpdate,
//     "EditTextUpdate"
//   )
//   if (editTextUpdate !== undefined) result.EditTextUpdate = editTextUpdate

//   if (element.extendedEdit !== undefined) result.ExtendedEdit = element.extendedEdit

//   const font = exportFontToEnterprise(context, undefined, element.font)
//   if (font !== undefined) result.Font = font

//   const format = exportI8nTextToEnterprise(context, undefined, element.format)
//   if (format !== undefined) result.Format = format

//   if (element.height !== undefined) result.Height = element.height

//   const heightControlVariant = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.heightControlVariant,
//     "ItemHeightControlVariant"
//   )
//   if (heightControlVariant !== undefined) result.HeightControlVariant = heightControlVariant

//   if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

//   const incompleteChoiceMode = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.incompleteChoiceMode,
//     "IncompleteChoiceMode"
//   )
//   if (incompleteChoiceMode !== undefined) result.IncompleteChoiceMode = incompleteChoiceMode

//   const inputHint = exportI8nTextToEnterprise(context, undefined, element.inputHint)
//   if (inputHint !== undefined) result.InputHint = inputHint

//   if (element.listChoiceMode !== undefined) result.ListChoiceMode = element.listChoiceMode

//   if (element.markIncomplete !== undefined) result.MarkIncomplete = element.markIncomplete

//   if (element.markNegatives !== undefined) result.MarkNegatives = element.markNegatives

//   if (element.mask !== undefined) result.Mask = element.mask

//   if (element.maxHeight !== undefined) result.MaxHeight = element.maxHeight

//   if (element.maxValue !== undefined) result.MaxValue = element.maxValue

//   if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

//   if (element.minValue !== undefined) result.MinValue = element.minValue

//   if (element.multiLine !== undefined) result.MultiLine = element.multiLine

//   const multipleValuePictureDataPath = getAttributeName(context, element.multipleValuePictureDataPath)
//   if (multipleValuePictureDataPath !== undefined) result.MultipleValuePictureDataPath = multipleValuePictureDataPath

//   const multipleValuePictureShape = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.multipleValuePictureShape,
//     "InputFieldMultipleValuePictureShape"
//   )
//   if (multipleValuePictureShape !== undefined) result.MultipleValuePictureShape = multipleValuePictureShape

//   const multipleValuePictureSize = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.multipleValuePictureSize,
//     "InputFieldMultipleValuePictureSize"
//   )
//   if (multipleValuePictureSize !== undefined) result.MultipleValuePictureSize = multipleValuePictureSize

//   const multipleValuePresentationDataPath = getAttributeName(context, element.multipleValuePresentationDataPath)
//   if (multipleValuePresentationDataPath !== undefined)
//     result.MultipleValuePresentationDataPath = multipleValuePresentationDataPath

//   const multipleValuesBackColor = exportColorToEnterprise(context, undefined, element.multipleValuesBackColor)
//   if (multipleValuesBackColor !== undefined) result.MultipleValuesBackColor = multipleValuesBackColor

//   if (element.multipleValuesExtendedEdit !== undefined)
//     result.MultipleValuesExtendedEdit = element.multipleValuesExtendedEdit

//   const multipleValuesFont = exportFontToEnterprise(context, undefined, element.multipleValuesFont)
//   if (multipleValuesFont !== undefined) result.MultipleValuesFont = multipleValuesFont

//   if (element.multipleValuesHyperlink !== undefined) result.MultipleValuesHyperlink = element.multipleValuesHyperlink

//   const multipleValuesPicture = exportPictureToEnterprise(context, undefined, element.multipleValuesPicture)
//   if (multipleValuesPicture !== undefined) result.MultipleValuesPicture = multipleValuesPicture

//   const multipleValuesTextColor = exportColorToEnterprise(context, undefined, element.multipleValuesTextColor)
//   if (multipleValuesTextColor !== undefined) result.MultipleValuesTextColor = multipleValuesTextColor

//   const multipleValueValueDataPath = getAttributeName(context, element.multipleValueValueDataPath)
//   if (multipleValueValueDataPath !== undefined) result.MultipleValueValueDataPath = multipleValueValueDataPath

//   const onScreenKeyboardReturnKeyText = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.onScreenKeyboardReturnKeyText,
//     "OnScreenKeyboardReturnKeyText"
//   )
//   if (onScreenKeyboardReturnKeyText !== undefined) result.OnScreenKeyboardReturnKeyText = onScreenKeyboardReturnKeyText

//   if (element.openButton !== undefined) result.OpenButton = element.openButton

//   if (element.passwordMode !== undefined) result.PasswordMode = element.passwordMode

//   if (element.quickChoice !== undefined) result.QuickChoice = element.quickChoice

//   // if (element.selectedText !== undefined) result.SelectedText = element.selectedText

//   if (element.showCheckBoxesInDropListWhenInputMultipleValues !== undefined)
//     result.ShowCheckBoxesInDropListWhenInputMultipleValues = element.showCheckBoxesInDropListWhenInputMultipleValues

//   const specialTextInputMode = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.specialTextInputMode,
//     "SpecialTextInputMode"
//   )
//   if (specialTextInputMode !== undefined) result.SpecialTextInputMode = specialTextInputMode

//   const spellCheckingOnTextInput = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.spellCheckingOnTextInput,
//     "SpellCheckingOnTextInput"
//   )
//   if (spellCheckingOnTextInput !== undefined) result.SpellCheckingOnTextInput = spellCheckingOnTextInput

//   if (element.spinButton !== undefined) result.SpinButton = element.spinButton

//   const textColor = exportColorToEnterprise(context, undefined, element.textColor)
//   if (textColor !== undefined) result.TextColor = textColor

//   if (element.textEdit !== undefined) result.TextEdit = element.textEdit

//   if (element.typeDomainEnabled !== undefined) result.TypeDomainEnabled = element.typeDomainEnabled

//   if (element.verticalStretch !== undefined) result.VerticalStretch = element.verticalStretch

//   if (element.width !== undefined) result.Width = element.width

//   if (element.wrap !== undefined) result.Wrap = element.wrap

//   if (element.autoCellHeight !== undefined) result.AutoCellHeight = element.autoCellHeight

//   if (element.cellHyperlink !== undefined) result.CellHyperlink = element.cellHyperlink

//   const dataPath = getAttributeName(context, element.dataPath)
//   if (dataPath !== undefined) result.DataPath = dataPath

//   if (element.defaultItem !== undefined) result.DefaultItem = element.defaultItem

//   const displayImportance = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.displayImportance,
//     "DisplayImportance"
//   )
//   if (displayImportance !== undefined) result.DisplayImportance = displayImportance

//   const editMode = exportSystemEnumerationDeprecatedToEnterprise(context, undefined, element.editMode, "ColumnEditMode")
//   if (editMode !== undefined) result.EditMode = editMode

//   if (element.enabled !== undefined) result.Enabled = element.enabled

//   const fixingInTable = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.fixingInTable,
//     "FixingInTable"
//   )
//   if (fixingInTable !== undefined) result.FixingInTable = fixingInTable

//   const footerBackColor = exportColorToEnterprise(context, undefined, element.footerBackColor)
//   if (footerBackColor !== undefined) result.FooterBackColor = footerBackColor

//   const footerDataPath = getAttributeName(context, element.footerDataPath)
//   if (footerDataPath !== undefined) result.FooterDataPath = footerDataPath

//   const footerFont = exportFontToEnterprise(context, undefined, element.footerFont)
//   if (footerFont !== undefined) result.FooterFont = footerFont

//   const footerHorizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.footerHorizontalAlign,
//     "HorizontalAlign"
//   )
//   if (footerHorizontalAlign !== undefined) result.FooterHorizontalAlign = footerHorizontalAlign

//   const footerPicture = exportPictureToEnterprise(context, undefined, element.footerPicture)
//   if (footerPicture !== undefined) result.FooterPicture = footerPicture

//   const footerText = exportI8nTextToEnterprise(context, undefined, element.footerText)
//   if (footerText !== undefined) result.FooterText = footerText

//   const footerTextColor = exportColorToEnterprise(context, undefined, element.footerTextColor)
//   if (footerTextColor !== undefined) result.FooterTextColor = footerTextColor

//   const headerHorizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.headerHorizontalAlign,
//     "HorizontalAlign"
//   )
//   if (headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = headerHorizontalAlign

//   const headerPicture = exportPictureToEnterprise(context, undefined, element.headerPicture)
//   if (headerPicture !== undefined) result.HeaderPicture = headerPicture

//   const horizontalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.horizontalAlign,
//     "HorizontalAlign"
//   )
//   if (horizontalAlign !== undefined) result.HorizontalAlign = horizontalAlign

//   const horizontalAlignInGroup = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.horizontalAlignInGroup,
//     "HorizontalAlign"
//   )
//   if (horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = horizontalAlignInGroup

//   if (element.readOnly !== undefined) result.ReadOnly = element.readOnly

//   if (element.showInFooter !== undefined) result.ShowInFooter = element.showInFooter

//   if (element.showInHeader !== undefined) result.ShowInHeader = element.showInHeader

//   if (element.skipOnInput !== undefined) result.SkipOnInput = element.skipOnInput

//   const title = exportI8nTextToEnterprise(context, undefined, element.title)
//   if (title !== undefined) result.Title = title

//   const titleBackColor = exportColorToEnterprise(context, undefined, element.titleBackColor)
//   if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

//   const titleFont = exportFontToEnterprise(context, undefined, element.titleFont)
//   if (titleFont !== undefined) result.TitleFont = titleFont

//   if (element.titleHeight !== undefined) result.TitleHeight = element.titleHeight

//   const titleLocation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.titleLocation,
//     "FormItemTitleLocation"
//   )
//   if (titleLocation !== undefined) result.TitleLocation = titleLocation

//   const titleTextColor = exportColorToEnterprise(context, undefined, element.titleTextColor)
//   if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

//   const toolTip = exportI8nTextToEnterprise(context, undefined, element.toolTip)
//   if (toolTip !== undefined) result.ToolTip = toolTip

//   const toolTipRepresentation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.toolTipRepresentation,
//     "ToolTipRepresentation"
//   )
//   if (toolTipRepresentation !== undefined) result.ToolTipRepresentation = toolTipRepresentation

//   const verticalAlign = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.verticalAlign,
//     "VerticalAlign"
//   )
//   if (verticalAlign !== undefined) result.VerticalAlign = verticalAlign

//   const verticalAlignInGroup = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.verticalAlignInGroup,
//     "VerticalAlign"
//   )
//   if (verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = verticalAlignInGroup

//   if (element.visible !== undefined) result.Visible = element.visible

//   const warningOnEdit = exportI8nTextToEnterprise(context, undefined, element.warningOnEdit)
//   if (warningOnEdit !== undefined) result.WarningOnEdit = warningOnEdit

//   const warningOnEditRepresentation = exportSystemEnumerationDeprecatedToEnterprise(
//     context,
//     undefined,
//     element.warningOnEditRepresentation,
//     "WarningOnEditRepresentation"
//   )
//   if (warningOnEditRepresentation !== undefined) result.WarningOnEditRepresentation = warningOnEditRepresentation

//   return result
// }

// registerMetadata("ExportToEnterprise", "InputField", exportInputFieldToEnterprise as ExportToEnterpriseFn)
