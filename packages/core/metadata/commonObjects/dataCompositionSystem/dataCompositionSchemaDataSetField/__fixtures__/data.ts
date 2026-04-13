import type { DataCompositionSchemaDataSetField, DataCompositionSchemaDataSetFieldYAML } from "../types"

export const fullDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  dataPath: "Реквизит1",
  field: "Реквизит1",
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    condition: true,
  },
} as const satisfies DataCompositionSchemaDataSetField

export const fullDataCompositionSchemaDataSetFieldYAML = {
  ПутьКДанным: "Реквизит1",
  Поле: "Реквизит1",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const satisfies DataCompositionSchemaDataSetFieldYAML
