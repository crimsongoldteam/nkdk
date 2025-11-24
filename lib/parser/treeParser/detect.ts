import { TElementType, ZElementType } from "~/lib/metadata/forms/elements/types"

export const detectElementType = (text: string): TElementType => {
  const trimmed = text.trim()
  const len = trimmed.length

  if (len === 0) {
    return ZElementType.enum.LabelDecoration
  }

  // Проверяем первый символ напрямую (быстрее чем startsWith)
  const firstChar = trimmed[0]

  // начинается с // - страницы (проверяем до /)
  if (firstChar === "/" && len >= 2 && trimmed[1] === "/") {
    return ZElementType.enum.Pages
  }

  // начинается с # - вертикальная группа
  if (firstChar === "#") {
    return ZElementType.enum.UsualGroup
  }

  // начинается с / - страница
  if (firstChar === "/") {
    return ZElementType.enum.Page
  }

  // начинается с % - горизонтальная группа
  if (firstChar === "%") {
    return ZElementType.enum.UsualGroup
  }

  // Кэшируем проверку наличия | (используется дважды)
  const hasVBar = trimmed.includes("|")

  // начинается с < и содержит | - командная панель
  if (firstChar === "<" && hasVBar) {
    return ZElementType.enum.CommandBar
  }

  // начинается с < - кнопка
  if (firstChar === "<") {
    return ZElementType.enum.Button
  }

  // содержит | - таблица
  if (hasVBar) {
    return ZElementType.enum.Table
  }

  // содержит () - радиокнопка
  if (trimmed.includes("()")) {
    return ZElementType.enum.RadioButtonField
  }

  // содержит [] - флажок
  if (trimmed.includes("[]")) {
    return ZElementType.enum.CheckBoxField
  }

  // содержит : - поле ввода
  if (trimmed.includes(":")) {
    return ZElementType.enum.InputField
  }

  // все остальное - надпись
  return ZElementType.enum.LabelDecoration
}
