import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

/** Правило property-типа MetaDataObject — маркер обёртки прикладного объекта в XML.
 *
 * Сообщает оркестратору:
 * - при импорте: использовать `xml[container]` как корень для обхода остальных свойств;
 * - при экспорте: обернуть собранный результат в `{ MetaDataObject: { ...rootAttributes, [container]: result } }`.
 *
 * Не создаёт значения в модели данных (все обработчики возвращают undefined).
 */
export interface MetaDataObjectPropertyRule extends BasePropertyRule {
  type: "MetaDataObject"
  /** Имя тега внутреннего контейнера, например "DocumentNumerator" или "Catalog" */
  container: string
  /** Корневые XML-атрибуты элемента <MetaDataObject>: xmlns-декларации и version */
  rootAttributes: Record<string, string>
  forReferenceOnly: true
}
