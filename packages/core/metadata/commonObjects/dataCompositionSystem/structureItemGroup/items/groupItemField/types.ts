import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import type {
  DataCompositionGroupTypeYAML,
  DataCompositionPeriodAdditionTypeYAML,
} from "~/metadata/systemEnumerations/types"
import { GroupItemFieldRules } from "./rules"

export type GroupItemField = MetadataTypeByRule<typeof GroupItemFieldRules>
export type GroupItemFieldYAML =
  | string
  | {
      Поле: string
      Использование?: "Ложь"
      ТипГруппировки?: DataCompositionGroupTypeYAML
      ТипДополнения?: DataCompositionPeriodAdditionTypeYAML
      НачалоПериода?: string
      КонецПериода?: string
    }
