// Универсальные типы для маппинга метаданных

/**
 * Создаёт тип обратного маппинка (из enterprise значений в ключи)
 */
export type ReverseMapping<T extends Record<string, string>> = {
  [V in T[keyof T]]: {
    [K in keyof T]: T[K] extends V ? K : never
  }[keyof T]
}

/**
 * Создаёт identity маппинг и тип из его значений
 */
export type IdentityMapping<T extends Record<string, string>> = {
  [K in keyof T]: K
}
export type IdentityMappingType<T extends Record<string, string>> = IdentityMapping<T>[keyof IdentityMapping<T>]

/**
 * Универсальная функция для создания identity маппинга
 */
export function createIdentityMapping<T extends Record<string, string>>(
  source: T
): IdentityMapping<T> {
  return Object.fromEntries(
    Object.keys(source).map((key) => [key, key])
  ) as IdentityMapping<T>
}

/**
 * Универсальная функция для создания обратного маппинка
 */
export function createReverseMapping<T extends Record<string, string>>(
  source: T
): ReverseMapping<T> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [value, key])
  ) as ReverseMapping<T>
}
