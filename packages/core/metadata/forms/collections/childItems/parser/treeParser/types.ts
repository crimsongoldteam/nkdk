import { IToken } from "chevrotain"

export interface TreeNode {
  tokens: IToken[]
  type: ParseElementType
  childItems: TreeNode[]
  autoCommandBar?: TreeNode
}

export interface BuilderTreeNode {
  tokens: IToken[]
  childItems: BuilderTreeNode[]
}
export enum ParseElementType {
  LabelDecoration = "LabelDecoration",
  LabelField = "LabelField",
  InputField = "InputField",
  Button = "Button",
  RightTitledCheckboxField = "RightTitledCheckboxField",
  LeftTitledCheckboxField = "LeftTitledCheckboxField",
  CommandBar = "CommandBar",
  PotentialAutoCommandBar = "PotentialAutoCommandBar",
  AutoCommandBar = "AutoCommandBar",
  Table = "Table",
  RadioButtonField = "RadioButtonField",
  PictureDecoration = "PictureDecoration",
  Page = "Page",
  Pages = "Pages",
  VerticalGroup = "VerticalGroup",
  HorizontalGroup = "HorizontalGroup",
  OneLineHorizontalGroup = "OneLineHorizontalGroup",
  OtherField = "OtherField",
}

export const ElementWithChildItems = [
  ParseElementType.VerticalGroup,
  ParseElementType.HorizontalGroup,
  ParseElementType.OneLineHorizontalGroup,
  ParseElementType.Page,
  ParseElementType.Pages,
]
