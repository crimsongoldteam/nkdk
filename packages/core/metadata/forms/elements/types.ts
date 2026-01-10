import { BaseElement, BaseElementEnterprise } from "./baseElement/types"

/**
 * Универсальный тип для возвращаемого значения функций импорта из Enterprise
 *
 * @template T - Тип данных из Enterprise (может быть undefined)
 * @template N - Тип имени (может быть undefined)
 * @template R - Результирующий тип (например, CalendarField, FormDecoration и т.д.)
 *
 * Логика:
 * - Если T extends undefined, возвращается undefined
 * - Если N extends undefined, возвращается Partial<R>
 * - Иначе возвращается R
 */
export type ImportFromEnterpriseReturn<
  F extends BaseElementEnterprise | undefined,
  T extends BaseElement | undefined,
  N extends string | undefined,
> = F extends undefined ? undefined : N extends undefined ? Partial<T> : T

export type ImportExportReturn<F, T> = F extends undefined ? undefined : T
