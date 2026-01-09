import type { IToken } from "chevrotain"
import {
  CheckboxChecked,
  CheckboxUnchecked,
  Colon,
  Hash,
  LAngle,
  LArrow,
  LCurly,
  Percent,
  Picture,
  RadioButtonChecked,
  RadioButtonUnchecked,
  RArrow,
  RCurly,
  Slash,
  SwitchChecked,
  SwitchUnchecked,
  VBar,
  Whitespace,
} from "../tokenizer/lexer"
import { ParseElementType } from "./types"

export const detectElementType = (tokens: IToken[]): ParseElementType => {
  const significantTokens = tokens.filter((token) => token.tokenType !== Whitespace)

  if (significantTokens.length === 0) {
    return ParseElementType.LabelDecoration
  }

  const checkboxTokens = [CheckboxChecked, CheckboxUnchecked, SwitchChecked, SwitchUnchecked]
  const radioButtonTokens = [RadioButtonChecked, RadioButtonUnchecked]

  const { firstToken, hasLeftArrow } = processFirstToken(significantTokens)
  const firstTokenType = firstToken.tokenType

  // начинается с { - строка свойств
  if (firstTokenType === LCurly) {
    return ParseElementType.LabelDecoration
  }

  // начинается с < и содержит | - командная панель
  const hasVBar = significantTokens.some((token) => token.tokenType === VBar)
  if (firstTokenType === LAngle && hasVBar) {
    return ParseElementType.CommandBar
  }

  // начинается с < - кнопка
  if (firstTokenType === LAngle) {
    return ParseElementType.Button
  }

  // начинается с // - страницы
  if (firstTokenType === Slash && significantTokens.length >= 2 && significantTokens[1].tokenType === Slash) {
    return ParseElementType.Pages
  }

  // начинается с # - вертикальная группа
  if (firstTokenType === Hash) {
    return ParseElementType.VerticalGroup
  }

  // начинается с / - страница
  if (firstTokenType === Slash) {
    return ParseElementType.Page
  }

  // начинается с % - горизонтальная группа
  if (firstTokenType === Percent) {
    const percentTokenCount = significantTokens.filter((token) => token.tokenType === Percent).length
    if (percentTokenCount > 1) {
      return ParseElementType.OneLineGroup
    }
    return ParseElementType.HorizontalGroup
  }

  const { hasColon, hasRightCheckbox, hasRadioButton } = analyzeTokens(
    significantTokens,
    checkboxTokens,
    radioButtonTokens
  )

  return determineFieldType(
    hasVBar,
    hasColon,
    hasRightCheckbox,
    hasRadioButton,
    hasLeftArrow,
    firstTokenType,
    checkboxTokens
  )
}

export const processFirstToken = (tokens: IToken[]): { firstToken: IToken; hasLeftArrow: boolean } => {
  let firstToken = tokens[0]
  let hasLeftArrow = false

  if (firstToken.tokenType === LArrow || firstToken.tokenType === RArrow) {
    hasLeftArrow = true
    if (tokens.length > 1) {
      firstToken = tokens[1]
    }
  }

  return { firstToken, hasLeftArrow }
}

export const analyzeTokens = (
  tokens: IToken[],
  checkboxTokens: (typeof CheckboxChecked)[],
  radioButtonTokens: (typeof RadioButtonChecked)[]
): {
  hasColon: boolean
  hasRightCheckbox: boolean
  hasRadioButton: boolean
  hasTextBeforeLastRadioButton: boolean
} => {
  let hasColon = false
  let hasRightCheckbox = false
  let hasRadioButton = false
  const hasTextBeforeLastRadioButton = false
  let insideProperties = false
  let lastToken: IToken | undefined
  const tokensBeforeLast: IToken[] = []

  for (const token of tokens) {
    if (token.tokenType === LCurly) {
      insideProperties = true
      continue
    }
    if (token.tokenType === RCurly) {
      insideProperties = false
      continue
    }
    if (insideProperties) continue

    if (lastToken) {
      tokensBeforeLast.push(lastToken)
    }
    lastToken = token

    if (token.tokenType === Colon) {
      hasColon = true
      continue
    }

    if (radioButtonTokens.includes(token.tokenType)) {
      hasRadioButton = true
    }
  }

  if (lastToken && checkboxTokens.includes(lastToken.tokenType)) {
    hasRightCheckbox = true
  }

  return {
    hasColon,
    hasRightCheckbox,
    hasRadioButton,
    hasTextBeforeLastRadioButton,
  }
}

export const determineFieldType = (
  hasVBar: boolean,
  hasColon: boolean,
  hasRightCheckbox: boolean,
  hasRadioButton: boolean,
  hasLeftArrow: boolean,
  firstTokenType: IToken["tokenType"],
  checkboxTokens: (typeof CheckboxChecked)[]
): ParseElementType => {
  if (hasVBar && !hasLeftArrow) {
    return ParseElementType.Table
  }

  if (hasRadioButton) {
    return ParseElementType.RadioButtonField
  }

  if (hasColon) {
    return ParseElementType.InputField
  }

  if (hasRightCheckbox) {
    return ParseElementType.LeftTitledCheckboxField
  }

  if (checkboxTokens.includes(firstTokenType as typeof CheckboxChecked)) {
    return ParseElementType.RightTitledCheckboxField
  }

  // начинается с @ - картинка
  if (firstTokenType === Picture) {
    return ParseElementType.PictureDecoration
  }

  return ParseElementType.LabelDecoration
}
