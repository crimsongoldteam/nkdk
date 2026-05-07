import type { DataCompositionSchemaDataSetField, DataCompositionSchemaDataSetFieldYAML } from "../types"

export const fullDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "Реквизит1",
  field: "Реквизит1",
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    condition: true,
  },
} as const satisfies DataCompositionSchemaDataSetField

export const fullDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "Реквизит1",
  Поле: "Реквизит1",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const satisfies DataCompositionSchemaDataSetFieldYAML

export const legacyDataCompositionSchemaDataSetFieldYAML = {
  ПутьКДанным: "Реквизит1",
  Поле: "Реквизит1",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const satisfies DataCompositionSchemaDataSetFieldYAML

export const nestedDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ВложенныйНаборДанныхСхемыКомпоновкиДанных",
  dataPath: "Товары",
  field: "Товары",
} as const

export const nestedDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ВложенныйНаборДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "Товары",
  Поле: "Товары",
} as const

export const folderDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "ГруппаПолей",
  title: {
    items: {
      ru: "Группа полей",
    },
  },
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    condition: true,
  },
} as const

export const folderDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "ГруппаПолей",
  Заголовок: "Группа полей",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const
