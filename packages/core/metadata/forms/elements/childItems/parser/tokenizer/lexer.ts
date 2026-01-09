import { createToken, IMultiModeLexerDefinition, IToken, Lexer, TokenType } from "chevrotain"

// #region combineTokens

export const GroupHeaderText = createToken({
  name: "GroupHeaderText",
  pattern: Lexer.NA,
})
export const PageHeaderText = createToken({
  name: "PageHeaderText",
  pattern: Lexer.NA,
})
export const InlineText = createToken({
  name: "InlineText",
  pattern: Lexer.NA,
})

export const LabelContent = createToken({
  name: "LabelContent",
  pattern: Lexer.NA,
})

export const InputHeader = createToken({
  name: "InputHeader",
  pattern: Lexer.NA,
})
export const InputValue = createToken({
  name: "InputValue",
  pattern: Lexer.NA,
})
export const InputModifiers = createToken({
  name: "InputModifiers",
  pattern: Lexer.NA,
})

export const CheckboxHeader = createToken({
  name: "CheckboxHeader",
  pattern: Lexer.NA,
})

export const RadioButtonHeader = createToken({
  name: "RadioButtonHeader",
  pattern: Lexer.NA,
})

export const RadioButtonValueDescription = createToken({
  name: "RadioButtonValueDescription",
  pattern: Lexer.NA,
})

export const ElementName = createToken({
  name: "ElementName",
  pattern: Lexer.NA,
})

export const Button = createToken({ name: "Button", pattern: Lexer.NA })

export const TableCell = createToken({ name: "TableCell", pattern: Lexer.NA })
export const TableCellContinue = createToken({
  name: "TableCellContinue",
  pattern: Lexer.NA,
})

export const FormHeaderText = createToken({
  name: "HeaderText",
  pattern: Lexer.NA,
})

export const PropertiesNameText = createToken({
  name: "PropertiesNameText",
  pattern: Lexer.NA,
})

export const PropertiesValueText = createToken({
  name: "PropertiesValueText",
  pattern: Lexer.NA,
})

export const PropertiesValueOptionText = createToken({
  name: "PropertiesValueOptionText",
  pattern: Lexer.NA,
})

export const OneLineGroupElementsHeader = createToken({
  name: "OneLineGroupElementsHeader",
  pattern: Lexer.NA,
})
export const OneLineGroupElementsContent = createToken({
  name: "OneLineGroupElementsContent",
  pattern: Lexer.NA,
})

export const combineTokens = [
  InlineText,
  FormHeaderText,
  PageHeaderText,
  GroupHeaderText,
  PropertiesNameText,
  PropertiesValueText,
  PropertiesValueOptionText,
  LabelContent,
  InputHeader,
  InputValue,
  InputModifiers,
  CheckboxHeader,
  RadioButtonHeader,
  Button,
  TableCell,
  TableCellContinue,
  RadioButtonValueDescription,
  ElementName,
  OneLineGroupElementsHeader,
  OneLineGroupElementsContent,
]

// #endregion

// #region utils

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape all special characters
}

// empty matcher
// @ts-ignore
function matchType(_text: any, _offset: any, _matchedTokens: any, _groups: any): RegExpExecArray | null {
  return null
}

const matchIndent = (text: string, offset: number, matchedTokens: IToken[], _groups: any) => {
  const lastToken = matchedTokens[matchedTokens.length - 1]

  const isStartOfLine = !lastToken || lastToken.tokenType === NewLine

  if (!isStartOfLine) return null

  const wsRegExp = /[ \t]+/y
  wsRegExp.lastIndex = offset
  return wsRegExp.exec(text)
}

const excludeTokens = (...valuesToExclude: TokenType[]): TokenType[] => {
  return combineTokens.filter((item) => !valuesToExclude.includes(item))
}

const keyword = (name: string, keyword: string, ...valuesToExclude: TokenType[]) => {
  const keywordEscaped = escapeRegExp(keyword)
  return createToken({
    name: name,
    pattern: new RegExp(keywordEscaped + "[ \\t]*"),
    label: keyword,
    categories: excludeTokens(...valuesToExclude),
  })
}

// #endregion

// #region keywords

export const CheckboxChecked = createToken({
  name: "CheckboxChecked",
  pattern: /\[[ \t]*\S[ \t]*\][ \t]*/,
  label: "[X]",
  categories: excludeTokens(CheckboxHeader),
})
export const CheckboxUnchecked = createToken({
  name: "CheckboxUnchecked",
  pattern: /\[[ \t]*\][ \t]*/,
  label: "[ ]",
  categories: excludeTokens(CheckboxHeader),
})

export const SwitchChecked = createToken({
  name: "SwitchChecked",
  pattern: /\[[ \t]*\|[ \t]*\S[ \t]*\][ \t]*/,
  label: "[|1]",
  categories: excludeTokens(CheckboxHeader),
})

export const SwitchUnchecked = createToken({
  name: "SwitchUnchecked",
  pattern: /\[[ \t]*\S[ \t]*\|[ \t]*\][ \t]*/,
  label: "[0|]",
  categories: excludeTokens(CheckboxHeader),
})

export const RadioButtonChecked = createToken({
  name: "RadioButtonChecked",
  pattern: /\([ \t]*\S[ \t]*\)[ \t]*/,
  label: "(X)",
  categories: excludeTokens(RadioButtonHeader, RadioButtonValueDescription),
})

export const RadioButtonUnchecked = createToken({
  name: "RadioButtonUnchecked",
  pattern: /\([ \t]*\)[ \t]*/,
  label: "( )",
  categories: excludeTokens(RadioButtonHeader, RadioButtonValueDescription),
})

export const Underscore = keyword("Underscore", "_", InputValue)

export const Picture = createToken({
  name: "Picture",
  pattern: /@[a-zA-Zа-яА-ЯёЁ0-9]*[ \t]*/,
  label: "@Picture",
  categories: excludeTokens(Button),
})

export const Dots = createToken({
  name: "Dots",
  pattern: /\.+[ \t]*/,
  label: ".",
  categories: excludeTokens(TableCell),
})

export const ButtonGroup = createToken({
  name: "ButtonGroup",
  pattern: /\|[ \t]*-[ \t]*\|[ \t]*/,
  label: "|-|",
  categories: excludeTokens(Button),
})

export const LArrow = keyword(
  "LArrow",
  "<-",
  LabelContent,
  InputValue,
  InputModifiers,
  CheckboxHeader,
  RadioButtonHeader,
  RadioButtonValueDescription
)

export const RArrow = keyword(
  "RArrow",
  "->",
  LabelContent,
  InputValue,
  InputModifiers,
  CheckboxHeader,
  RadioButtonHeader,
  RadioButtonValueDescription
)

export const LCurly = createToken({
  name: "LCurly",
  pattern: /\{[ \t]*/,
  label: "{",
  push_mode: "properties_mode",
  categories: excludeTokens(
    PageHeaderText,
    LabelContent,
    InputHeader,
    InputValue,
    InputModifiers,
    CheckboxHeader,
    Button,
    Picture,
    TableCell,
    TableCellContinue,
    RadioButtonHeader,
    RadioButtonValueDescription
  ),
})

export const RCurly = createToken({
  name: "RCurly",
  pattern: /}[ \t]*/,
  label: "}",
  pop_mode: true,
  categories: excludeTokens(PropertiesValueText, PropertiesNameText, InputHeader),
})

export const LSquare = keyword("LSquare", "[", CheckboxHeader)
export const RSquare = keyword("RSquare", "]", CheckboxHeader)

export const LRound = keyword("LRound", "(", RadioButtonValueDescription, PropertiesValueText)
export const RRound = keyword("RRound", ")", RadioButtonValueDescription, PropertiesValueOptionText)

export const Comma = keyword("Comma", ",", PropertiesValueText, PropertiesValueOptionText)

export const LAngle = keyword("LAngle", "<")
export const RAngle = keyword("RAngle", ">", Button, Picture)

export const Semicolon = keyword(
  "Semicolon",
  ";",
  PropertiesValueText,
  PropertiesValueOptionText,
  OneLineGroupElementsContent
)
export const Colon = keyword("Colon", ":", InputHeader, TableCell, RadioButtonHeader)
export const VBar = keyword("VBar", "|", Button, Picture, TableCell, TableCellContinue)
export const Equals = keyword("Equals", "=", PropertiesNameText)

export const Plus = createToken({
  name: "Plus",
  pattern: /\+/,
  label: "+",
  categories: excludeTokens(GroupHeaderText, PageHeaderText, InlineText),
})

export const Slash = keyword("Slash", "/", GroupHeaderText, PageHeaderText, InlineText)
export const Ampersand = keyword("Ampersand", "&", InlineText)
export const Whitespace = createToken({ name: "Tab", pattern: /[ \t]+/ })

export const Hash = createToken({
  name: "Hash",
  pattern: /#+[ \t]*/,
  label: "#",
  categories: excludeTokens(GroupHeaderText, PageHeaderText, InlineText),
})

export const Percent = createToken({
  name: "Percent",
  pattern: /%+[ \t]*/,
  label: "%",
  categories: excludeTokens(GroupHeaderText, PageHeaderText, InlineText, OneLineGroupElementsHeader),
})

export const Dash = createToken({
  name: "Dash",
  pattern: /-[ \t]*/,
  label: "-",
  categories: excludeTokens(Button),
})

export const Dashes = createToken({
  name: "Dashes",
  pattern: /--+[ \t]*/,
  label: "-",
  categories: excludeTokens(FormHeaderText, TableCell),
})

export const EscapedText = createToken({
  name: "EscapedText",
  pattern: /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/,
  label: "\"...\" или '...'",
  categories: combineTokens,
})

export const Text = createToken({
  name: "Text",
  pattern: /[a-zA-Zа-яА-ЯёЁ№!0-9][a-zA-Zа-яА-ЯёЁ№!0-9\t ]*/,
  categories: combineTokens,
})

export const NewLine = createToken({
  name: "NewLine",
  pattern: /\n/,
})

export const Indent = createToken({
  name: "Indent",
  categories: combineTokens,
  pattern: matchIndent,
  line_breaks: false,
})

// #endregion

// #region fields

export const PropertyLineType = createToken({
  name: "PropertyLineType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const LabelFieldType = createToken({
  name: "LabelFieldType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const CheckboxRightFieldType = createToken({
  name: "CheckboxRightFieldType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const CheckboxLeftFieldType = createToken({
  name: "CheckboxLeftFieldType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const InputFieldType = createToken({
  name: "InputFieldType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const TableType = createToken({
  name: "TableType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})
export const CommandBarType = createToken({
  name: "CommandBarType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})

export const RadioButtonFieldType = createToken({
  name: "RadioButtonFieldType",
  pattern: matchType,
  group: Lexer.SKIPPED,
  line_breaks: true,
})

export const inlineTypesTokens = [
  PropertyLineType,
  LabelFieldType,
  CheckboxRightFieldType,
  CheckboxLeftFieldType,
  InputFieldType,
  TableType,
  CommandBarType,
  RadioButtonFieldType,
]

// #endregion

// #region allTokens

export const allTokens = [
  NewLine,
  Indent,
  EscapedText,
  Dashes,
  Underscore,
  SwitchChecked,
  SwitchUnchecked,
  CheckboxChecked,
  CheckboxUnchecked,
  RadioButtonChecked,
  RadioButtonUnchecked,
  ButtonGroup,
  Picture,
  LArrow,
  RArrow,
  Dots,
  Dash,
  Hash,
  Text,
  Percent,
  VBar,
  LCurly,
  RCurly,
  LRound,
  RRound,
  Comma,
  LAngle,
  RAngle,
  Semicolon,
  Colon,
  Equals,
  Ampersand,
  Plus,
  Slash,
  Whitespace,
  ...combineTokens,
  ...inlineTypesTokens,
]

export const propertiesTokens = [
  NewLine,
  Indent,
  EscapedText,
  Dashes,
  Underscore,
  SwitchChecked,
  SwitchUnchecked,
  CheckboxChecked,
  CheckboxUnchecked,
  ButtonGroup,
  Picture,
  LArrow,
  RArrow,
  Dots,
  Dash,
  Hash,
  Text,
  Percent,
  EscapedText,
  VBar,
  LCurly,
  RCurly,
  LRound,
  RRound,
  Comma,
  LAngle,
  RAngle,
  Semicolon,
  Colon,
  Equals,
  Ampersand,
  Plus,
  Slash,
  Whitespace,
  PropertiesNameText,
  PropertiesValueText,
  PropertiesValueOptionText,
  ElementName,
]

export const multiModeLexerDefinition: IMultiModeLexerDefinition = {
  modes: {
    properties_mode: propertiesTokens,
    default_mode: allTokens,
  },
  defaultMode: "default_mode",
}

export const lexer = new Lexer(multiModeLexerDefinition)

// #endregion
