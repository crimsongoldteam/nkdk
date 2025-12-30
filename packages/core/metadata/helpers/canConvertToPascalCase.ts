// Regular expressions for supporting Latin and Cyrillic characters
const UPPER_CASE_LETTERS = /^[A-ZА-ЯЁ]/
const ALL_UPPER_CASE = /^[A-ZА-ЯЁ]+$/
const LOWER_CASE_LETTERS = /^[a-zа-яё]/

/**
 * Функция проверяет можно ли однозначно по строке str определить pascalStr
 *
 * @param str - Source string to check
 * @param pascalStr - Expected value in PascalCase format
 * @returns `true` if the string can be converted to the specified PascalCase format, otherwise `false`
 */
export const canConvertToPascalCase = (str: string, pascalStr: string): boolean => {
  const pascalWords = splitPascalCase(pascalStr)

  return pascalWords === str
}

/**
 * Splits a PascalCase string into words separated by spaces, handling abbreviations correctly.
 *
 * Rules:
 * - First word keeps its original case
 * - Subsequent words are converted to lowercase (except abbreviations)
 * - Abbreviations (all uppercase letters) remain unchanged
 * - Single word strings are returned as-is
 *
 * Examples:
 * - "TestTest" -> "Test test"
 * - "BackInUSSR" -> "Back in USSR"
 * - "USSR" -> "USSR"
 * - "ИсторияКПП" -> "История КПП"
 *
 * @param str - PascalCase string to split
 * @returns String with words separated by spaces
 */
function splitPascalCase(str: string): string {
  // Early return for empty strings
  if (str.length === 0) {
    return ""
  }

  const words: string[] = []
  let currentWord = ""
  // Track if current word is an abbreviation (all uppercase) to avoid regex checks
  let isCurrentAbbreviation = true
  // Track if current word contains a digit
  let hasDigit = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const isUpper = UPPER_CASE_LETTERS.test(char)
    const isLower = LOWER_CASE_LETTERS.test(char)
    const isDigit = /^[0-9]$/.test(char)

    if (isUpper) {
      if (currentWord.length > 0) {
        if (isCurrentAbbreviation) {
          // Current word is an abbreviation and next char is uppercase:
          // continue the abbreviation (e.g., "USSR" -> keep together)
          currentWord += char
        } else if (hasDigit) {
          // Current word has a digit and lowercase letters, and next char is uppercase:
          // continue the word (e.g., "Test1Test" -> keep as one word)
          currentWord += char
        } else {
          // Current word has lowercase letters (no digit), start a new word
          words.push(currentWord)
          currentWord = char
          isCurrentAbbreviation = true
          hasDigit = false
        }
      } else {
        // Start of the string
        currentWord = char
        isCurrentAbbreviation = true
        hasDigit = false
      }
    } else if (isLower) {
      // Lowercase letter found: current word is not an abbreviation
      currentWord += char
      isCurrentAbbreviation = false
    } else if (isDigit) {
      // Digit found: add to current word
      currentWord += char
      hasDigit = true
      // Digits make the word not an abbreviation (if it was)
      isCurrentAbbreviation = false
    }
    // Ignore other non-letter characters (they shouldn't appear in PascalCase, but handle gracefully)
  }

  // Add the last word if exists
  if (currentWord.length > 0) {
    words.push(currentWord)
  }

  // Single word: return as-is (no transformation needed)
  if (words.length === 1) {
    return words[0]
  }

  // Build result string: first word unchanged, others lowercase (except abbreviations)
  let result = words[0] // First word keeps original case

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    // Check if word is abbreviation only once (optimization)
    if (ALL_UPPER_CASE.test(word)) {
      result += " " + word
    } else {
      // Convert first letter to lowercase
      result += " " + word.charAt(0).toLowerCase() + word.slice(1)
    }
  }

  return result
}
