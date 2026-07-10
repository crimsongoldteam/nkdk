import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { BasePropertyRule } from "../../orchestration/property/types"
import { fileItemCollectionTarget } from "../../orchestration/property/operationTargets"

/** Правило property-типа ChildFormNames — список имён форм в ChildObjects XML.
 *
 * Хранит имена форм как `string[]`. При импорте читает теги `<Form>` из XML.
 * При экспорте: сначала проверяет context.exportToXML.context?.forms (IO-путь),
 * затем использует значение из референсных данных (round-trip путь).
 */
export interface ChildFormNamesPropertyRule extends BasePropertyRule {
  type: "ChildFormNames"
  /** Имя XML-тега для имени формы, например "Form" */
  xml: string
  /** Имя папки на диске, например "Формы" */
  folderName: string
  forReferenceOnly: true
}

export interface ChildFormNamesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChildFormNames"
}

export type ChildFormNamesRuleParams = Omit<ChildFormNamesWidePropertyRule, "type">

export function childFormNamesRule<const Params extends ChildFormNamesRuleParams>(
  params: WideExactRuleParams<ChildFormNamesRuleParams, Params>
): Readonly<{ type: "ChildFormNames" } & Params> {
  return defineWidePropertyRule("ChildFormNames", {
    ...params,
    operationTarget: fileItemCollectionTarget({
      role: "form",
      migrationSegment: "Форма",
      folderName: params.folderName,
      yamlFileName: "Форма.yaml",
    }),
  })
}
