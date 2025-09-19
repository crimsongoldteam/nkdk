import { inject, injectable } from "tsyringe"
import type { ExplicitUndefined, IColor, IFont, IPicture } from "../../interfaces"
import type { IInputFieldProperties } from "./interfaces"
import type { IDataPathStrategy, INameStrategy } from "../../helpers/interfaces"
import { TYPES } from "../../container/symbols"
import { FormAttributeablePropertiesMixin, FormNameablePropertiesMixin } from "../../helpers/mixins"
import { FormFieldProperties } from "../formField/formFieldProperties"
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
import { Expose } from "class-transformer"

// FormNameablePropertiesMixin(FormAttributeablePropertiesMixin(
@injectable({ token: TYPES.IInputFieldElementProperties })
export class InputFieldProperties extends FormFieldProperties implements IInputFieldProperties {
  constructor(
    @inject(TYPES.IDataPathStrategy) private readonly dataPathStrategy: IDataPathStrategy,
    @inject(TYPES.INameStrategy) private readonly nameStrategy: INameStrategy
  ) {
    super()
  }
  autoChoiceIncomplete: boolean | undefined = undefined
  autoCapitalizationOnTextInput: AutoCapitalizationOnTextInput = AutoCapitalizationOnTextInput.Auto
  autoCorrectionOnTextInput: AutoCorrectionOnTextInput = AutoCorrectionOnTextInput.Auto
  autoMaxHeight: boolean = false
  autoMaxWidth: boolean = false
  autoMarkIncomplete: boolean | undefined = undefined
  autoShowOpenButton: AutoShowOpenButtonMode = AutoShowOpenButtonMode.Auto
  autoShowClearButton: AutoShowClearButtonMode = AutoShowClearButtonMode.Auto
  wrap: boolean = false
  quickChoice: boolean | undefined = undefined
  heightControlVariant: ItemHeightControlVariant = ItemHeightControlVariant.Auto
  chooseType: boolean = false
  choiceFoldersAndItems: FoldersAndItems = FoldersAndItems.Auto
  selectedText: string = ""
  markNegatives: boolean | undefined = undefined
  height: number = 0
  choiceListHeight: number = 0
  multipleValuesHyperlink: boolean | undefined = undefined
  availableTypes: ITypeDescription | undefined = undefined
  choiceHistoryOnInput: ChoiceHistoryOnInput = ChoiceHistoryOnInput.Auto
  choiceButtonPicture: IPicture = {}
  multipleValuesPicture: IPicture = {}
  choiceButton: boolean | undefined = undefined
  dropListButton: boolean | undefined = undefined
  openButton: boolean | undefined
  clearButton: boolean | undefined
  spinButton: boolean | undefined
  createButton: boolean | undefined
  choiceListButton: boolean | undefined
  maxHeight: number = 0
  maxWidth: number = 0
  maxValue: number = 0
  mask: string = ""
  minValue: number = 0
  multiLine: boolean = false
  editTextUpdate: EditTextUpdate = EditTextUpdate.Auto
  markIncomplete: boolean = false
  showCheckBoxesInDropListWhenInputMultipleValues: boolean | undefined
  choiceButtonRepresentation: ChoiceButtonRepresentation = ChoiceButtonRepresentation.Auto
  autoFillHint: InputFieldAutofillHint = InputFieldAutofillHint.DontUse
  inputHint: string = ""
  spellCheckingOnTextInput: SpellCheckingOnTextInput = SpellCheckingOnTextInput.Auto
  multipleValueValueDataPath: string = ""
  multipleValuePictureDataPath: string = ""
  multipleValuePresentationDataPath: string = ""
  multipleValuePictureSize: InputFieldMultipleValuePictureSize = InputFieldMultipleValuePictureSize.Auto
  allowInputEmptyMultipleValues: boolean = false
  allowMultipleValuesDuplicates: boolean = false
  typeDomainEnabled: boolean = false
  verticalStretch: boolean = false
  extendedEdit: boolean = false
  multipleValuesExtendedEdit: boolean = false
  textEdit: boolean = false
  listChoiceMode: boolean = false
  incompleteChoiceMode: boolean = false
  passwordMode: boolean = false
  choiceParameterLinks: boolean = false
  specialTextInputMode: SpecialTextInputMode = SpecialTextInputMode.Auto
  choiceList: boolean = false
  onScreenKeyboardReturnKeyText: string = ""
  editText: boolean = false
  multipleValuePictureShape: InputFieldMultipleValuePictureShape = InputFieldMultipleValuePictureShape.Auto
  choiceForm: string = ""
  format: boolean = false
  editFormat: string = ""
  borderColor: IColor = {}
  textColor: IColor = {}
  multipleValuesTextColor: IColor = {}
  backColor: IColor = {}
  multipleValuesBackColor: IColor = {}
  dropListWidth: number = 0
  font: IFont = {}
  multipleValuesFont: IFont = {}
}
