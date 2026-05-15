import type { DataCompositionSchemaDataSetField, DataCompositionSchemaDataSetFieldYAML } from "../types"
import { stringAvailableValues, stringAvailableValuesYAML } from "../../availableValues/__fixtures__/data"

export const appearanceDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "Сумма",
  field: "Сумма",
  appearance: {
    itemType: "AppearanceFields",
    Формат: {
      parameter: "Формат",
      value: { type: "string", value: "ЧЦ=15; ЧДЦ=2" },
    },
  },
} as const satisfies DataCompositionSchemaDataSetField

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

export const availableValuesDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "Состояние",
  field: "Состояние",
  title: {
    items: {
      ru: "Состояние",
    },
  },
  availableValues: stringAvailableValues,
} satisfies DataCompositionSchemaDataSetField

export const availableValuesDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "Состояние",
  Поле: "Состояние",
  Заголовок: "Состояние",
  ДоступныеЗначения: stringAvailableValuesYAML,
} satisfies DataCompositionSchemaDataSetFieldYAML
