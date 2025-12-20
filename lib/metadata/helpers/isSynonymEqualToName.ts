import { I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types"
import { pascalCase } from "change-case"

/**
 * Проверяет, соответствует ли синоним (описание) имени в формате PascalCase.
 * 
 * Функция используется для определения, является ли синоним автоматически
 * сгенерированным из имени. Если синоним соответствует имени, его можно
 * не экспортировать, так как это дефолтное значение.
 * 
 * @param synonym - Синоним в формате I8nTextEnterprise (строка для одного языка или объект для нескольких)
 * @param name - Имя в формате PascalCase
 * @returns `true` если синоним соответствует имени, иначе `false`
 * 
 * @example
 * ```ts
 * isSynonymEqualToName("Тестовый реквизит", "ТестовыйРеквизит") // true
 * isSynonymEqualToName({ ru: "Тестовый реквизит" }, "ТестовыйРеквизит") // false (несколько языков)
 * isSynonymEqualToName(undefined, "ТестовыйРеквизит") // false
 * ```
 */
export const isSynonymEqualToName = (
  synonym: I8nTextEnterprise | undefined,
  name: string
): boolean => {
  if (!synonym) return false

  // Если синоним - объект (несколько языков), это не дефолтное значение
  if (typeof synonym !== "string") return false

  // Преобразуем строку в PascalCase и сравниваем с именем
  const synonymPascalCase = pascalCase(synonym)
  return synonymPascalCase === name
}

