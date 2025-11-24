import { IToken } from "chevrotain"
import { TElementType, ZElementType } from "~/lib/metadata/forms/elements/types"
import {
  CheckboxChecked,
  CheckboxUnchecked,
  Colon,
  Hash,
  LAngle,
  Picture,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Slash,
  VBar,
  Whitespace,
} from "./lexer"

export const detectElementType = (tokens: IToken[]): TElementType => {
  // Фильтруем пробелы для анализа
  const significantTokens = tokens.filter(
    (token) => token.tokenType !== Whitespace
  )

  // Пустая строка или только пробелы
  if (significantTokens.length === 0) {
    return ZElementType.enum.LabelDecoration
  }

  const firstToken = significantTokens[0]
  const firstTokenType = firstToken.tokenType

  // начинается с // - страницы (два Slash подряд)
  if (
    firstTokenType === Slash &&
    significantTokens.length >= 2 &&
    significantTokens[1].tokenType === Slash
  ) {
    return ZElementType.enum.Pages
  }

  // начинается с # - вертикальная группа
  if (firstTokenType === Hash) {
    return ZElementType.enum.UsualGroup
  }

  // начинается с / - страница
  if (firstTokenType === Slash) {
    return ZElementType.enum.Page
  }

  // начинается с % - горизонтальная группа (проверяем первый символ Text токена)
  if (
    firstTokenType.name === "Text" &&
    firstToken.image.trim().startsWith("%")
  ) {
    return ZElementType.enum.UsualGroup
  }

  // Проверяем наличие VBar в токенах
  const hasVBar = significantTokens.some((token) => token.tokenType === VBar)

  // начинается с < и содержит | - командная панель
  if (firstTokenType === LAngle && hasVBar) {
    return ZElementType.enum.CommandBar
  }

  // начинается с < - кнопка
  if (firstTokenType === LAngle) {
    return ZElementType.enum.Button
  }

  // содержит | - таблица
  if (hasVBar) {
    return ZElementType.enum.Table
  }

  // содержит () - радиокнопка (проверяем наличие RadioButtonChecked или RadioButtonUnchecked)
  const hasRadioButton = significantTokens.some(
    (token) =>
      token.tokenType === RadioButtonChecked ||
      token.tokenType === RadioButtonUnchecked
  )
  if (hasRadioButton) {
    return ZElementType.enum.RadioButtonField
  }

  // содержит [] - флажок (проверяем наличие CheckboxChecked или CheckboxUnchecked)
  const hasCheckbox = significantTokens.some(
    (token) =>
      token.tokenType === CheckboxChecked ||
      token.tokenType === CheckboxUnchecked
  )
  if (hasCheckbox) {
    return ZElementType.enum.CheckBoxField
  }

  // начинается с @ - картинка
  if (firstTokenType === Picture) {
    return ZElementType.enum.PictureDecoration
  }

  // содержит : - поле ввода
  const hasColon = significantTokens.some((token) => token.tokenType === Colon)
  if (hasColon) {
    return ZElementType.enum.InputField
  }

  // все остальное - надпись
  return ZElementType.enum.LabelDecoration
}
