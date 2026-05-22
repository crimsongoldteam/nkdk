import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { GroupItemFieldRules } from "./rules"

export type GroupItemField = MetadataTypeByRule<typeof GroupItemFieldRules>
export type GroupItemFieldYAML =
  | string
  | {
      Поле: string
      Использование?: "Ложь"
      ТипГруппировки?: "Элементы" | "Иерархия"
      ТипДополнения?: "Нет" | "Элементы" | "Иерархия"
      НачалоПериода?: string
      КонецПериода?: string
    }
