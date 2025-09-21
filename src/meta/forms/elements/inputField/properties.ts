import { inject, injectable } from "tsyringe"
import type { IColor, IFont, IPicture } from "../../interfaces"
import type { IInputFieldProperties } from "./interfaces"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormFieldProperties } from "../clientApplicationForm/formFieldProperties"
import { ITypeDescription } from "@/elements/interfaces"
import {
  AutoCapitalizationOnTextInput,
  AutoCorrectionOnTextInput,
  AutoShowOpenButtonMode,
  AutoShowClearButtonMode,
  ItemHeightControlVariant,
  FoldersAndItems,
  ChoiceHistoryOnInput,
  EditTextUpdate,
  ChoiceButtonRepresentation,
  InputFieldAutofillHint,
  SpellCheckingOnTextInput,
  InputFieldMultipleValuePictureSize,
  SpecialTextInputMode,
  InputFieldMultipleValuePictureShape,
} from "@/meta/systemEnumerations"

// FormNameablePropertiesMixin(FormAttributeablePropertiesMixin(
@injectable({ token: TYPES.IInputFieldProperties })
export class InputFieldProperties extends FormFieldProperties implements IInputFieldProperties {
  constructor(
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
  autoChoiceIncomplete?: boolean
  autoCapitalizationOnTextInput?: AutoCapitalizationOnTextInput
  autoCorrectionOnTextInput?: AutoCorrectionOnTextInput
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  autoMarkIncomplete?: boolean
  autoShowOpenButton?: AutoShowOpenButtonMode
  autoShowClearButton?: AutoShowClearButtonMode
  wrap?: boolean
  quickChoice?: boolean
  heightControlVariant?: ItemHeightControlVariant
  chooseType?: boolean
  choiceFoldersAndItems?: FoldersAndItems
  selectedText?: string
  markNegatives?: boolean
  height?: number
  choiceListHeight?: number
  multipleValuesHyperlink?: boolean
  availableTypes?: ITypeDescription
  choiceHistoryOnInput?: ChoiceHistoryOnInput
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
  editTextUpdate?: EditTextUpdate
  markIncomplete?: boolean
  showCheckBoxesInDropListWhenInputMultipleValues?: boolean
  choiceButtonRepresentation?: ChoiceButtonRepresentation
  autoFillHint?: InputFieldAutofillHint
  inputHint?: string
  spellCheckingOnTextInput?: SpellCheckingOnTextInput
  multipleValueValueDataPath?: string
  multipleValuePictureDataPath?: string
  multipleValuePresentationDataPath?: string
  multipleValuePictureSize?: InputFieldMultipleValuePictureSize
  allowInputEmptyMultipleValues?: boolean
  allowMultipleValuesDuplicates?: boolean
  typeDomainEnabled?: boolean
  verticalStretch?: boolean
  extendedEdit?: boolean
  multipleValuesExtendedEdit?: boolean
  textEdit?: boolean
  listChoiceMode?: boolean
  incompleteChoiceMode?: boolean
  passwordMode?: boolean
  choiceParameterLinks?: boolean
  specialTextInputMode?: SpecialTextInputMode
  choiceList?: boolean
  onScreenKeyboardReturnKeyText?: string
  editText?: boolean
  multipleValuePictureShape?: InputFieldMultipleValuePictureShape
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
