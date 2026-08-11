import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { BasePropertyRule } from "@nkdk/runtime/rule-kit"
import { fileItemCollectionTarget } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

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
  /** Правило содержимого вложенной формы. */
  itemRule?: MetadataItemRule
  forReferenceOnly: true
}

export interface ChildFormNamesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChildFormNames"
  itemRule?: MetadataItemRule
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
