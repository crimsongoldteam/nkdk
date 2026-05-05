import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

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
