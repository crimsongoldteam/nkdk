import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

/** Правило property-типа XMLRoot — маркер обёртки прикладного объекта/внешнего файла в XML.
 *
 * Сообщает оркестратору:
 * - при импорте: использовать `xml[container]` как корень для обхода остальных свойств;
 * - при экспорте: вернуть результат, обёрнутый в `{ [container]: { ...rootAttributes, ...result } }`.
 *
 * Не создаёт значения в модели данных (все обработчики возвращают undefined).
 */
export interface XMLRootPropertyRule extends BasePropertyRule {
  type: "XMLRoot"
  /** Имя корневого XML-тега, например "Catalog", "PredefinedData", "AdditionalIndexes" */
  container: string
  /** Атрибуты корневого тега: xmlns-декларации и version */
  rootAttributes:
    | Record<string, string>
    | ((params: { data: unknown; referenceData: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
  forReferenceOnly: true
  /** Если true, корневой тег XML — это сам container (без внешней обёртки <MetaDataObject>).
   *  Используется для внешних файлов вроде Ext/Predefined.xml. По умолчанию (false) корень = <MetaDataObject>. */
  isFileRoot?: true
}

export type XMLRootRuleParams = Omit<XMLRootPropertyRule, "type">

export function xmlRootRule<const Params extends XMLRootRuleParams>(
  params: ExactRuleParams<XMLRootRuleParams, Params>
): Readonly<{ type: "XMLRoot" } & Params> {
  return definePropertyRule("XMLRoot", params)
}
