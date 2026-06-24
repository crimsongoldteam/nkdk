import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

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
