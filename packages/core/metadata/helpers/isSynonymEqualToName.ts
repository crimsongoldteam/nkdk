import { I8nTextEnterprise } from "../commonObjects/i8nText/types"
import { canConvertToPascalCase } from "../helpers/canConvertToPascalCase"

/**
 * Checks if a synonym (description) matches the name in PascalCase format.
 *
 * The function is used to determine if a synonym is automatically
 * generated from the name. If the synonym matches the name, it can
 * be omitted from export, as it is the default value.
 *
 * Uses canConvertToPascalCase for correct handling of abbreviations,
 * which the change-case library does not handle properly.
 *
 * @param synonym - Synonym in I8nTextEnterprise format (string for one language or object for multiple)
 * @param name - Name in PascalCase format
 * @returns `true` if the synonym matches the name, otherwise `false`
 *
 * @example
 * ```ts
 * isSynonymEqualToName("Тестовый реквизит", "ТестовыйРеквизит") // true
 * isSynonymEqualToName("История КПП", "ИсторияКПП") // true (correctly handles abbreviations)
 * isSynonymEqualToName({ ru: "Тестовый реквизит" }, "ТестовыйРеквизит") // false (multiple languages)
 * isSynonymEqualToName(undefined, "ТестовыйРеквизит") // false
 * ```
 */
export const isSynonymEqualToName = (synonym: I8nTextEnterprise | undefined, name: string): boolean => {
  if (!synonym) return false

  // If synonym is an object (multiple languages), it's not a default value
  if (typeof synonym !== "string") return false

  // Check if synonym can be converted to name (correctly handles abbreviations)
  return canConvertToPascalCase(synonym, name)
}
