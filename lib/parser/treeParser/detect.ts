import { TElementType, ZElementType } from "~/lib/metadata/forms/elements/types"

export const detectElementType = (text: string): TElementType => {
  const trimmed = text.trim()

  // начинается с # - вертикальная группа
  if (trimmed.startsWith("#")) {
    return ZElementType.enum.UsualGroup
  }

  // начинается с // - страницы
  if (trimmed.startsWith("//")) {
    return ZElementType.enum.Pages
  }

  // начинается с / - страница
  if (trimmed.startsWith("/")) {
    return ZElementType.enum.Page
  }

  // начинается с % - горизонтальная группа
  if (trimmed.startsWith("%")) {
    return ZElementType.enum.UsualGroup
  }

  // начинается с < и содержит | - командная панель
  if (trimmed.startsWith("<") && trimmed.includes("|")) {
    return ZElementType.enum.CommandBar
  }

  // начинается с < - кнопка
  if (trimmed.startsWith("<")) {
    return ZElementType.enum.Button
  }

  // содержит | - таблица
  if (trimmed.includes("|")) {
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
