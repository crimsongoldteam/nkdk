import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { InputFieldRules } from "./rules"

export type InputField = FormTypeByRule<typeof InputFieldRules>
// export interface InputField {
//   itemType: "InputField"
//   name: string
//   allowInputEmptyMultipleValues?: boolean
//   allowMultipleValuesDuplicates?: boolean
//   autoCapitalizationOnTextInput?: SE.AutoCapitalizationOnTextInput
//   autoChoiceIncomplete?: boolean
//   autoCorrectionOnTextInput?: SE.AutoCorrectionOnTextInput
//   autoFillHint?: SE.InputFieldAutofillHint
//   autoMarkIncomplete?: boolean
//   autoMaxHeight?: boolean
//   autoMaxWidth?: boolean
//   autoShowClearButton?: SE.AutoShowClearButtonMode
//   autoShowOpenButton?: SE.AutoShowOpenButtonMode
//   availableTypes?: TypeDescription
//   backColor?: Color
//   borderColor?: Color
//   choiceButton?: boolean
//   choiceButtonPicture?: Picture
//   choiceButtonRepresentation?: SE.ChoiceButtonRepresentation
//   choiceFoldersAndItems?: SE.FoldersAndItems
//   choiceForm?: string
//   choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
//   choiceList?: ChoiceList
//   choiceListButton?: boolean
//   choiceListHeight?: number
//   choiceParameterLinks?: ChoiceParameterLinks
//   choiceParameters?: ChoiceParameters
//   chooseType?: boolean
//   clearButton?: boolean
//   createButton?: boolean
//   dropListButton?: boolean
//   dropListWidth?: number
//   editFormat?: I8nText
//   editText?: string
//   editTextUpdate?: SE.EditTextUpdate
//   extendedEdit?: boolean
//   font?: Font
//   format?: I8nText
//   height?: number
//   heightControlVariant?: SE.ItemHeightControlVariant
//   horizontalStretch?: boolean
//   incompleteChoiceMode?: SE.IncompleteChoiceMode
//   inputHint?: I8nText
//   listChoiceMode?: boolean
//   markIncomplete?: boolean
//   markNegatives?: boolean
//   mask?: string
//   maxHeight?: number
//   maxValue?: number
//   maxWidth?: number
//   minValue?: number
//   multiLine?: boolean
//   multipleValuePictureDataPath?: string
//   multipleValuePictureShape?: SE.InputFieldMultipleValuePictureShape
//   multipleValuePictureSize?: SE.InputFieldMultipleValuePictureSize
//   multipleValuePresentationDataPath?: string
//   multipleValuesBackColor?: Color
//   multipleValuesExtendedEdit?: boolean // ExtendedEditMultipleValues in XML
//   multipleValuesFont?: Font
//   multipleValuesHyperlink?: boolean
//   multipleValuesPicture?: Picture
//   multipleValuesTextColor?: Color
//   multipleValueValueDataPath?: string
//   onScreenKeyboardReturnKeyText?: SE.OnScreenKeyboardReturnKeyText
//   openButton?: boolean
//   passwordMode?: boolean
//   quickChoice?: boolean
//   // selectedText?: string
//   showCheckBoxesInDropListWhenInputMultipleValues?: boolean
//   specialTextInputMode?: SE.SpecialTextInputMode
//   spellCheckingOnTextInput?: SE.SpellCheckingOnTextInput
//   spinButton?: boolean
//   textColor?: Color
//   textEdit?: boolean
//   typeDomainEnabled?: boolean
//   typeLink?: TypeLink
//   userVisible?: UserVisible
//   verticalStretch?: boolean
//   width?: number
//   wrap?: boolean
//   autoCellHeight?: boolean
//   cellHyperlink?: boolean
//   contextMenu?: ContextMenu
//   dataPath?: string
//   defaultItem?: boolean
//   displayImportance?: SE.displayImportance
//   editMode?: SE.ColumnEditMode
//   enabled?: boolean
//   extendedTooltip?: ExtendedTooltip
//   fixingInTable?: SE.FixingInTable
//   footerBackColor?: Color
//   footerDataPath?: string
//   footerFont?: Font
//   footerHorizontalAlign?: SE.ItemHorizontalLocation
//   footerPicture?: Picture
//   footerText?: I8nText
//   footerTextColor?: Color
//   headerHorizontalAlign?: SE.ItemHorizontalLocation
//   headerPicture?: Picture
//   horizontalAlign?: SE.ItemHorizontalLocation
//   horizontalAlignInGroup?: SE.ItemHorizontalLocation
//   readOnly?: boolean
//   shortcut?: string
//   showInFooter?: boolean
//   showInHeader?: boolean
//   skipOnInput?: boolean
//   table?: string
//   title?: I8nText
//   titleBackColor?: Color
//   titleFont?: Font
//   titleHeight?: number
//   titleLocation?: SE.FormItemTitleLocation
//   titleTextColor?: Color
//   toolTip?: I8nText
//   toolTipRepresentation?: SE.ToolTipRepresentation
//   type?: SE.FormFieldType
//   typeRestriction?: TypeDescription
//   verticalAlign?: SE.ItemVerticalAlign
//   verticalAlignInGroup?: SE.ItemVerticalAlign
//   visible?: boolean
//   warningOnEdit?: I8nText
//   warningOnEditRepresentation?: SE.WarningOnEditRepresentation
//   events?: {
//     onChange?: string
//     autoComplete?: string
//     multipleValuesAdd?: string
//     editTextChange?: string
//     startChoice?: string
//     startListChoice?: string
//     choiceProcessing?: string
//     multipleValueURLProcessing?: string
//     commandGenerateProcessing?: string
//     textEditEnd?: string
//     opening?: string
//     multipleValueOpening?: string
//     clearing?: string
//     tuning?: string
//     creating?: string
//     multipleValuesDelete?: string
//   }
// }

export type InputFieldEnterprise = EnterpriseType<typeof InputFieldRules>

export type InputFieldPartialYAML = YAMLTypeByRule<typeof InputFieldRules>

export interface InputFieldTypedYAML extends InputFieldPartialYAML {
  Тип: "ПолеВвода"
}
