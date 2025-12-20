// Regular expressions for supporting Latin and Cyrillic characters
const UPPER_CASE_LETTERS = /^[A-ZА-ЯЁ]/
const ALL_UPPER_CASE = /^[A-ZА-ЯЁ]+$/
const PASCAL_CASE = /^[A-ZА-ЯЁ][a-zA-Zа-яё]*$/

/**
 * Функция проверяет можно ли однозначно по строке str определить pascalStr
 *
 * @param str - Source string to check
 * @param pascalStr - Expected value in PascalCase format
 * @returns `true` if the string can be converted to the specified PascalCase format, otherwise `false`
 */
export const canConvertToPascalCase = (str: string, pascalStr: string): boolean => {
  const splitted = splitWords(pascalStr)
  return splitted === str
}

// Разбивате строку по словами (учитывая аббривиатуры) считая что каждое слово начинается с заглавной буквы
export const splitWords = (str: string): string => {
  return str
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .join(" ")
}
