import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  createConfigurationIndexReader,
  encodeConfigurationIndex,
  snapshotConfigurationIndex,
} from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML, YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import { hasRowFilterTableSource } from "./dynamicListProperties"

const source: YAMLPropertySource = {
  itemName: "Таблица",
  has: () => false,
  raw: (propertyKey) => propertyKey === "dataPath" ? "" : undefined,
  yamlKey: () => undefined,
}

describe("RowFilter таблицы формы", () => {
  it("вычисляется при экспорте без индекса", () => {
    expect(hasRowFilterTableSource(source)).toBe(true)
  })

  it.each([
    ["отсутствовал", false, false],
    ["присутствовал", true, true],
  ])("в indexed round-trip сохраняет присутствие XML-узла: %s", (_case, present, expected) => {
    expect(hasRowFilterTableSource(source, indexedContext(present))).toBe(expected)
  })
})

function indexedContext(present: boolean): ConfigurationContextWithExportToXML {
  const logicalAddress = "Форма.Тест.Элемент.Таблица"
  const snapshot = {
    specificationVersion: "1.4" as const,
    indexGeneration: 1n,
    componentPath: "cf",
    files: [{ projectPath: "Форма.yaml", contentHash: 1n }],
    entities: present
      ? [{
          logicalAddress: `${logicalAddress}.rowFilter`,
          sourceProjectPath: "Форма.yaml",
          xml: { present: true as const },
        }]
      : [],
  }
  const reader = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)))
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      configurationIndex: createConfigurationIndexExportRuntime({
        source: reader,
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "Форма.yaml",
        logicalAddress,
      }),
    },
  }
}
