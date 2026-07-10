import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { BasePropertyRule } from "../../orchestration/property/types"
import { fileItemCollectionTarget } from "../../orchestration/property/operationTargets"

/** Правило property-типа ChildTemplateNames — список имён макетов в ChildObjects XML.
 *
 * Хранит имена макетов как `string[]`. При импорте читает теги `<Template>` из XML.
 * При экспорте: сначала проверяет referenceData (round-trip), затем context.templates (IO-путь).
 */
export interface ChildTemplateNamesPropertyRule extends BasePropertyRule {
  type: "ChildTemplateNames"
  /** Имя XML-тега для имени макета, например "Template" */
  xml: string
  /** Имя папки на диске, например "Макеты" */
  folderName: string
  forReferenceOnly: true
}

export interface ChildTemplateNamesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChildTemplateNames"
}

export type ChildTemplateNamesRuleParams = Omit<ChildTemplateNamesWidePropertyRule, "type">

export function childTemplateNamesRule<const Params extends ChildTemplateNamesRuleParams>(
  params: WideExactRuleParams<ChildTemplateNamesRuleParams, Params>
): Readonly<{ type: "ChildTemplateNames" } & Params> {
  return defineWidePropertyRule("ChildTemplateNames", {
    ...params,
    operationTarget: fileItemCollectionTarget({
      role: "template",
      migrationSegment: "Макет",
      folderName: params.folderName,
      yamlFileName: "Шаблон.yaml",
    }),
  })
}
