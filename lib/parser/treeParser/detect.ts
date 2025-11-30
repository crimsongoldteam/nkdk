import type { IToken } from "chevrotain"
import { ParseElementType } from "../types"
import {
  CheckboxChecked,
  CheckboxUnchecked,
  Colon,
  Hash,
  LAngle,
  LArrow,
  LCurly,
  Picture,
  RArrow,
  RadioButtonChecked,
  RadioButtonUnchecked,
  RCurly,
  Slash,
  SwitchChecked,
  SwitchUnchecked,
  VBar,
  Whitespace,
} from "./lexer"

export const detectElementType = (tokens: IToken[]): ParseElementType => {
  // Фильтруем пробелы для анализа
  const significantTokens = tokens.filter((token) => token.tokenType !== Whitespace)

  // Пустая строка или только пробелы
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

  // начинается с // - страницы (два Slash подряд)
  if (
    firstTokenType === Slash &&
    significantTokens.length >= 2 &&
    significantTokens[1].tokenType === Slash
  ) {
    return ParseElementType.Pages
  }

  // начинается с # - вертикальная группа
  if (firstTokenType === Hash) {
    return ParseElementType.UsualGroup
  }

  // начинается с / - страница
  if (firstTokenType === Slash) {
    return ParseElementType.Page
  }

  // начинается с % - горизонтальная группа (проверяем первый символ Text токена)
  if (firstTokenType.name === "Text" && firstToken.image.trim().startsWith("%")) {
    return ParseElementType.UsualGroup
  }

  const {
    hasColon,
    hasRightCheckbox,
    hasRightRadioButton,
    hasRadioButton,
    hasTextBeforeLastRadioButton,
  } = analyzeTokens(significantTokens, checkboxTokens, radioButtonTokens)

  return determineFieldType(
    hasVBar,
    hasColon,
    hasRightCheckbox,
    hasRightRadioButton,
    hasRadioButton,
    hasTextBeforeLastRadioButton,
    hasLeftArrow,
    firstTokenType,
    checkboxTokens,
    radioButtonTokens
  )
}

export const processFirstToken = (
  tokens: IToken[]
): { firstToken: IToken; hasLeftArrow: boolean } => {
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
  hasRightRadioButton: boolean
  hasRadioButton: boolean
  hasTextBeforeLastRadioButton: boolean
} => {
  let hasColon = false
  let hasRightCheckbox = false
  let hasRightRadioButton = false
  let hasRadioButton = false
  let hasTextBeforeLastRadioButton = false
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

  if (lastToken && radioButtonTokens.includes(lastToken.tokenType)) {
    hasRightRadioButton = true
    // Проверяем, есть ли текст перед последней радиокнопкой
    hasTextBeforeLastRadioButton = tokensBeforeLast.some((token) => token.tokenType.name === "Text")
  }

  return {
    hasColon,
    hasRightCheckbox,
    hasRightRadioButton,
    hasRadioButton,
    hasTextBeforeLastRadioButton,
  }
}

export const determineFieldType = (
  hasVBar: boolean,
  hasColon: boolean,
  hasRightCheckbox: boolean,
  hasRightRadioButton: boolean,
  hasRadioButton: boolean,
  hasTextBeforeLastRadioButton: boolean,
  hasLeftArrow: boolean,
  firstTokenType: IToken["tokenType"],
  checkboxTokens: (typeof CheckboxChecked)[],
  radioButtonTokens: (typeof RadioButtonChecked)[]
): ParseElementType => {
  if (hasVBar && !hasLeftArrow) {
    return ParseElementType.Table
  }

  if (hasRightRadioButton) {
    if (hasTextBeforeLastRadioButton) {
      return ParseElementType.LeftTitledRadioButtonField
    }
    return ParseElementType.RadioButtonField
  }

  if (hasRadioButton) {
    if (radioButtonTokens.includes(firstTokenType as typeof RadioButtonChecked)) {
      return ParseElementType.RightTitledRadioButtonField
    }
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
