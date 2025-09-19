import { IFormElement, ITypeDescription } from "@/elements/interfaces"
import { IFormAttributeable, IFormAttributeableProperties } from "../../helpers/interfaces"
import {
  IColor,
  IFont,
  IFormHorizontalAlignableProperties,
  IFormHorizontalStretchableProperties,
  IPicture,
} from "../../interfaces"
import { IFormFieldProperties } from "../formField/interfaces"
import * as SystemEnumeration from "@/meta/systemEnumerations"

export interface IInputField extends IFormElement, IFormAttributeable {
  properties: IInputFieldProperties

  value: string | boolean | number | Date
}

export interface IInputFieldProperties
  extends IFormFieldProperties,
    IFormAttributeableProperties,
    IFormHorizontalAlignableProperties,
    IFormHorizontalStretchableProperties {
  autoChoiceIncomplete: boolean | undefined
  autoCapitalizationOnTextInput: SystemEnumeration.AutoCapitalizationOnTextInput
  autoCorrectionOnTextInput: SystemEnumeration.AutoCorrectionOnTextInput
  autoMaxHeight: boolean
  autoMaxWidth: boolean
  autoMarkIncomplete: boolean | undefined
  autoShowOpenButton: SystemEnumeration.AutoShowOpenButtonMode
  autoShowClearButton: SystemEnumeration.AutoShowClearButtonMode
  wrap: boolean
  quickChoice: boolean | undefined
  heightControlVariant: SystemEnumeration.ItemHeightControlVariant
  chooseType: boolean
  choiceFoldersAndItems: SystemEnumeration.FoldersAndItems
  selectedText: string
  markNegatives: boolean | undefined
  height: number
  choiceListHeight: number
  multipleValuesHyperlink: boolean | undefined
  availableTypes: ITypeDescription | undefined
  choiceHistoryOnInput: SystemEnumeration.ChoiceHistoryOnInput
  choiceButtonPicture: IPicture
  multipleValuesPicture: IPicture
  choiceButton: boolean | undefined
  dropListButton: boolean | undefined
  openButton: boolean | undefined
  clearButton: boolean | undefined
  spinButton: boolean | undefined
  createButton: boolean | undefined
  choiceListButton: boolean | undefined
  maxHeight: number
  maxWidth: number
  maxValue: number
  mask: string
  minValue: number
  multiLine: boolean
  editTextUpdate: SystemEnumeration.EditTextUpdate
  markIncomplete: boolean
  showCheckBoxesInDropListWhenInputMultipleValues: boolean | undefined
  choiceButtonRepresentation: SystemEnumeration.ChoiceButtonRepresentation
  // choiceParameters: boolean
  autoFillHint: SystemEnumeration.InputFieldAutofillHint
  inputHint: string
  spellCheckingOnTextInput: SystemEnumeration.SpellCheckingOnTextInput
  multipleValueValueDataPath: string
  multipleValuePictureDataPath: string
  multipleValuePresentationDataPath: string
  multipleValuePictureSize: SystemEnumeration.InputFieldMultipleValuePictureSize
  allowInputEmptyMultipleValues: boolean
  allowMultipleValuesDuplicates: boolean
  typeDomainEnabled: boolean
  verticalStretch: boolean
  horizontalStretch: boolean | undefined
  extendedEdit: boolean
  multipleValuesExtendedEdit: boolean
  textEdit: boolean
  listChoiceMode: boolean
  incompleteChoiceMode: boolean
  passwordMode: boolean
  choiceParameterLinks: boolean
  // typeLink: boolean
  specialTextInputMode: SystemEnumeration.SpecialTextInputMode
  choiceList: boolean
  onScreenKeyboardReturnKeyText: string
  editText: boolean
  multipleValuePictureShape: SystemEnumeration.InputFieldMultipleValuePictureShape
  choiceForm: string
  format: boolean
  editFormat: string
  borderColor: IColor
  textColor: IColor
  multipleValuesTextColor: IColor
  backColor: IColor
  multipleValuesBackColor: IColor
  dropListWidth: number
  font: IFont
  multipleValuesFont: IFont
}

export interface IInputFieldPropertiesPartial extends Partial<IInputFieldProperties> {}
