import type {
  ConfigDumpInfoConfigVersionMap,
  ConfigDumpInfoIdMap,
} from "~/metadata/appliedObjects/configDumpInfo/types"

// В data.xml все три дочерних узла — прямые дети Catalog.КакойТоСправочник (нет вложенности TabularSection → Attribute).
export const idMap: ConfigDumpInfoIdMap = new Map([
  [
    "",
    new Map([
      [
        "Catalog.КакойТоСправочник",
        "ec5cc365-b75d-46a2-a48b-a0b46221dc0d",
      ],
    ]),
  ],
  [
    "Catalog.КакойТоСправочник",
    new Map([
      [
        "Catalog.КакойТоСправочник.Attribute.КакойТоРеквизит",
        "01652dae-7472-4f22-ba4c-0dbc9e299cfc",
      ],
      [
        "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица",
        "050b2909-962d-405c-86f5-050517d347fb",
      ],
      [
        "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизитТаблицы",
        "21b4a462-083e-408e-8787-6f03325c71b8",
      ],
    ]),
  ],
])

export const configVersionMap: ConfigDumpInfoConfigVersionMap = new Map([
  [
    "Catalog.КакойТоСправочник",
    "2f404c2a5a8a6e4b8c1b00430f1f64a100000000",
  ],
])
