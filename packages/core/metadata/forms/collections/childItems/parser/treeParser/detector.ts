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
  Question,
  RadioButtonChecked,
  RadioButtonUnchecked,
  RAngle,
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
  const checkboxTokens = [CheckboxChecked, CheckboxUnchecked, SwitchChecked, SwitchUnchecked]
  const radioButtonTokens = [RadioButtonChecked, RadioButtonUnchecked]

  let firstToken: IToken | undefined
  let firstTokenType: IToken["tokenType"] | undefined
  let hasLeftArrow = false
  let hasVBar = false
  let foundRAngle = false
  let hasCurlyBracesAfterRAngle = false
  let percentTokenCount = 0
  let hasColon = false
  let hasRightCheckbox = false
  let hasRadioButton = false
  let insideProperties = false
  let lastToken: IToken | undefined

  for (const token of tokens) {
    if (token.tokenType === Whitespace) continue

    // Определяем первый значимый токен
    if (firstToken === undefined) {
      if (token.tokenType === LArrow || token.tokenType === RArrow) {
        hasLeftArrow = true
        continue
      }
      firstToken = token
      firstTokenType = token.tokenType

      if (firstTokenType === Question) return ParseElementType.OtherField
      if (firstTokenType === Hash) return ParseElementType.VerticalGroup
      if (firstTokenType === Slash) {
        lastToken = token
        continue
      }
    } else if (firstTokenType === Slash) {
      return token.tokenType === Slash ? ParseElementType.Pages : ParseElementType.Page
    }

    // Проверка фигурных скобок после RAngle
    if (token.tokenType === RAngle) foundRAngle = true
    if (foundRAngle && (token.tokenType === LCurly || token.tokenType === RCurly)) {
      hasCurlyBracesAfterRAngle = true
    }

    // Пропуск свойств внутри фигурных скобок
    if (token.tokenType === LCurly) {
      insideProperties = true
      continue
    }
    if (token.tokenType === RCurly) {
      insideProperties = false
      continue
    }
    if (insideProperties) continue

    // Сбор информации о токенах
    if (token.tokenType === VBar) hasVBar = true
    if (token.tokenType === Colon) hasColon = true
    if (radioButtonTokens.includes(token.tokenType)) hasRadioButton = true

    if (token.tokenType === Percent) {
      percentTokenCount++
      if (firstTokenType === Percent && percentTokenCount > 1) {
        return ParseElementType.OneLineGroup
      }
    }

    lastToken = token
  }

  if (firstToken === undefined) return ParseElementType.LabelDecoration

  // Проверка последнего токена на checkbox
  if (lastToken && checkboxTokens.includes(lastToken.tokenType)) {
    hasRightCheckbox = true
  }

  // Определение типа на основе собранной информации
  if (firstTokenType === LAngle && hasVBar) {
    return hasCurlyBracesAfterRAngle ? ParseElementType.CommandBar : ParseElementType.PotentialAutoCommandBar
  }
  if (firstTokenType === LAngle) return ParseElementType.Button
  if (firstTokenType === Slash) return ParseElementType.Page
  if (firstTokenType === Percent) {
    return percentTokenCount > 1 ? ParseElementType.OneLineGroup : ParseElementType.HorizontalGroup
  }

  return determineFieldType(
    hasVBar,
    hasColon,
    hasRightCheckbox,
    hasRadioButton,
    hasLeftArrow,
    firstTokenType!,
    checkboxTokens
  )
}

const determineFieldType = (
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
