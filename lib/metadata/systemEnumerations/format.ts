import { z } from "zod"

/**
 * Форматирует значение системного перечисления из английского ключа в русское enterprise значение
 * @param value - значение ключа enum (например, "Vertical")
 * @param keySchema - zod схема для ключей enum
 * @param enterpriseSchema - zod схема для enterprise значений enum
 * @returns enterprise значение (например, "Вертикальная")
 */
export function formatSystemEnumeration<
  TKey extends string,
  TEnterprise extends string
>(
  value: TKey,
  keySchema: z.ZodEnum<any>,
  enterpriseSchema: z.ZodEnum<any>
): TEnterprise {
  // Получаем ключи из keySchema.enum (это объект, где ключи и значения одинаковы)
  const keyEnum = keySchema.enum
  const keys = Object.keys(keyEnum) as TKey[]

  // Получаем значения из enterpriseSchema.enum (это объект, где ключи и значения одинаковы)
  const enterpriseEnum = enterpriseSchema.enum
  const values = Object.values(enterpriseEnum) as TEnterprise[]

  // Находим индекс ключа в массиве ключей
  const keyIndex = keys.indexOf(value)

  if (keyIndex === -1) {
    throw new Error(`Key "${value}" not found in enum schema`)
  }

  // Возвращаем соответствующее enterprise значение по тому же индексу
  // Порядок должен совпадать, так как оба enum созданы из одного исходного enum объекта
  return values[keyIndex]
}
