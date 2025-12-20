import * as changeCase from "change-case"

// Regular expressions for supporting Latin and Cyrillic characters
const UPPER_CASE_LETTERS = /^[A-ZА-ЯЁ]/
const ALL_UPPER_CASE = /^[A-ZА-ЯЁ]+$/
const PASCAL_CASE = /^[A-ZА-ЯЁ][a-zA-Zа-яё]*$/

/**
 * Checks if a string can be converted to the specified PascalCase format.
 *
 * The function verifies that a string can be correctly converted to PascalCase
 * and the result matches the expected value. The following rules are applied during conversion:
 * - Words with lowercase letters are converted to PascalCase
 * - Abbreviations (all uppercase letters) are preserved unchanged
 * - Multiple consecutive spaces are not allowed
 * - Words starting with uppercase letters after a space (except abbreviations) are not allowed
 *
 * Supports both Latin and Cyrillic characters.
 *
 * @param str - Source string to check
 * @param pascalStr - Expected value in PascalCase format
 * @returns `true` if the string can be converted to the specified PascalCase format, otherwise `false`
 *
 * @example
 * ```ts
 * canConvertToPascalCase("Test test", "TestTest") // true
 * canConvertToPascalCase("Test Test", "TestTest") // false (uppercase after space)
 * canConvertToPascalCase("Back in USSR", "BackInUSSR") // true (abbreviation preserved)
 * canConvertToPascalCase("Тест  тест", "ТестТест") // false (multiple spaces)
 * ```
 */
export const canConvertToPascalCase = (str: string, pascalStr: string): boolean => {
  // If the string is already in PascalCase and matches, return true
  if (str === pascalStr && PASCAL_CASE.test(str)) {
    return true
  }

  // If the string contains multiple consecutive spaces, return false
  if (/\s{2,}/.test(str)) {
    return false
  }

  // Split the string into words
  const words = str.split(/\s+/).filter((w) => w.length > 0)

  // If the string contains spaces, check for uppercase letters after space
  // in words that are not abbreviations
  if (words.length > 1) {
    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      // If the word starts with an uppercase letter and is not an abbreviation (not all uppercase)
      if (UPPER_CASE_LETTERS.test(word) && !ALL_UPPER_CASE.test(word)) {
        return false
      }
    }
  }

  // Split the string into words, preserving abbreviation information
  const result: string[] = []

  for (const word of words) {
    // If the word is an abbreviation (all uppercase letters)
    if (ALL_UPPER_CASE.test(word)) {
      result.push(word)
    } else {
      // Convert the word to PascalCase
      const pascalWord = changeCase.pascalCase(word)
      result.push(pascalWord)
    }
  }

  const modifiedStr = result.join("")
  return modifiedStr === pascalStr
}
