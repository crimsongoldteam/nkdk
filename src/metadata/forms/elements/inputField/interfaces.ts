import { IColor, IFont, IFormElement, IPicture, ITypeDescription } from "../../interfaces"
import * as SystemEnumeration from "@/metadata/systemEnumerations"
import { IFormFieldProperties } from "../formField/interfaces"

export interface IInputField extends IFormElement {
  readonly properties: IInputFieldProperties

  value: string | boolean | number | Date

  isMultiline(): boolean
}

export interface IInputFieldProperties extends IFormFieldProperties {
  autoChoiceIncomplete?: boolean
  autoCapitalizationOnTextInput?: SystemEnumeration.AutoCapitalizationOnTextInput
  autoCorrectionOnTextInput?: SystemEnumeration.AutoCorrectionOnTextInput
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  autoMarkIncomplete?: boolean
  autoShowOpenButton?: SystemEnumeration.AutoShowOpenButtonMode
  autoShowClearButton?: SystemEnumeration.AutoShowClearButtonMode
  wrap?: boolean
  quickChoice?: boolean
  heightControlVariant?: SystemEnumeration.ItemHeightControlVariant
  chooseType?: boolean
  choiceFoldersAndItems?: SystemEnumeration.FoldersAndItems
  selectedText?: string
  markNegatives?: boolean
  height?: number
  choiceListHeight?: number
  multipleValuesHyperlink?: boolean
  availableTypes?: ITypeDescription
  choiceHistoryOnInput?: SystemEnumeration.ChoiceHistoryOnInput
  choiceButtonPicture?: IPicture
  multipleValuesPicture?: IPicture
  choiceButton?: boolean
  dropListButton?: boolean
  openButton?: boolean
  clearButton?: boolean
  spinButton?: boolean
  createButton?: boolean
  choiceListButton?: boolean
  maxHeight?: number
  maxWidth?: number
  maxValue?: number
  mask?: string
  minValue?: number
  multiLine?: boolean
  editTextUpdate?: SystemEnumeration.EditTextUpdate
  markIncomplete?: boolean
  showCheckBoxesInDropListWhenInputMultipleValues?: boolean
  choiceButtonRepresentation?: SystemEnumeration.ChoiceButtonRepresentation
  // choiceParameters: boolean
  autoFillHint?: SystemEnumeration.InputFieldAutofillHint
  inputHint?: string
  spellCheckingOnTextInput?: SystemEnumeration.SpellCheckingOnTextInput
  multipleValueValueDataPath?: string
  multipleValuePictureDataPath?: string
  multipleValuePresentationDataPath?: string
  multipleValuePictureSize?: SystemEnumeration.InputFieldMultipleValuePictureSize
  allowInputEmptyMultipleValues?: boolean
  allowMultipleValuesDuplicates?: boolean
  typeDomainEnabled?: boolean
  verticalStretch?: boolean
  horizontalStretch?: boolean
  extendedEdit?: boolean
  multipleValuesExtendedEdit?: boolean
  textEdit?: boolean
  listChoiceMode?: boolean
  incompleteChoiceMode?: boolean
  passwordMode?: boolean
  choiceParameterLinks?: boolean
  // typeLink: boolean
  specialTextInputMode?: SystemEnumeration.SpecialTextInputMode
  choiceList?: boolean
  onScreenKeyboardReturnKeyText?: string
  editText?: boolean
  multipleValuePictureShape?: SystemEnumeration.InputFieldMultipleValuePictureShape
  choiceForm?: string
  format?: boolean
  editFormat?: string
  borderColor?: IColor
  textColor?: IColor
  multipleValuesTextColor?: IColor
  backColor?: IColor
  multipleValuesBackColor?: IColor
  dropListWidth?: number
  font?: IFont
  multipleValuesFont?: IFont
}
