import type { GroupItemAuto, GroupItemField } from "../groupItem/types"
import type { StructureItemGroup, StructureItemGroupYAML } from "../types"

const periodBeginEnd = {
  type: "dateTime" as const,
  value: "0001-01-01T00:00:00",
}

const groupItemFieldНаименование = {
  itemType: "GroupItemField" as const,
  field: "Наименование",
  groupType: "Items",
  periodAdditionType: "None",
  periodAdditionBegin: periodBeginEnd,
  periodAdditionEnd: periodBeginEnd,
} satisfies GroupItemField

const groupItemFieldПометка = {
  itemType: "GroupItemField" as const,
  field: "ПометкаУдаления",
  groupType: "Items",
  periodAdditionType: "None",
  periodAdditionBegin: periodBeginEnd,
  periodAdditionEnd: periodBeginEnd,
} satisfies GroupItemField

const groupItemAuto: GroupItemAuto = {
  itemType: "GroupItemAuto",
}

const innerMost = {
  itemType: "StructureItemGroup" as const,
  groupItems: [groupItemFieldПометка],
} as StructureItemGroup

const middle = {
  itemType: "StructureItemGroup" as const,
  groupItems: [groupItemAuto],
  item: [innerMost],
} as StructureItemGroup

export const fullStructureItemGroup = {
  itemType: "StructureItemGroup" as const,
  groupItems: [groupItemFieldНаименование],
  item: [middle],
} as StructureItemGroup

const dateIso = "0001-01-01T00:00:00"
/** Формат даты при экспорте в YAML (как в платформе). */
const dateRuYaml = "01.01.0001 00:00:00"

/** Вход для импорта из YAML (ISO в строках). */
export const fullStructureItemGroupYAML = {
  ПоляГруппировки: [
    {
      Поле: "Наименование",
      ТипГруппировки: "Элементы",
      ТипДополнения: "БезДополнения",
      НачалоПериода: dateIso,
      КонецПериода: dateIso,
    },
  ],
  Структура: [
    {
      ПоляГруппировки: [{}],
      Структура: [
        {
          ПоляГруппировки: [
            {
              Поле: "ПометкаУдаления",
              ТипГруппировки: "Элементы",
              ТипДополнения: "БезДополнения",
              НачалоПериода: dateIso,
              КонецПериода: dateIso,
            },
          ],
        },
      ],
    },
  ],
} as unknown as StructureItemGroupYAML

/** Ожидаемый вывод export в YAML (даты в русском формате). */
export const fullStructureItemGroupYAMLExport = {
  ПоляГруппировки: [
    {
      Поле: "Наименование",
      ТипГруппировки: "Элементы",
      ТипДополнения: "БезДополнения",
      НачалоПериода: dateRuYaml,
      КонецПериода: dateRuYaml,
    },
  ],
  Структура: [
    {
      ПоляГруппировки: [{}],
      Структура: [
        {
          ПоляГруппировки: [
            {
              Поле: "ПометкаУдаления",
              ТипГруппировки: "Элементы",
              ТипДополнения: "БезДополнения",
              НачалоПериода: dateRuYaml,
              КонецПериода: dateRuYaml,
            },
          ],
        },
      ],
    },
  ],
} as unknown as StructureItemGroupYAML
