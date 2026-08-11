import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { createDataPathRegistrySet } from "../../../validation/dataPath/registry"
import { withDataPathRegistrySet } from "@nkdk/runtime/rule-kit"
import { settingsComposerDataPathRules } from "../../settingsComposer/dataPathRules"
import { TableRules } from "./rules"
import { validateTypeDependentProperties } from "./validateTypeDependentProperties"

describe("validateTypeDependentProperties", () => {
  it.each([
    ["DataCompositionFilter", true, true],
    ["DataCompositionConditionalAppearance", false, true],
    ["DataCompositionUserSettings", true, false],
    ["DataCompositionSettings", false, false],
  ] as const)("checks Table properties for %s", (terminalType, viewMode, detailedRepresentation) => {
    expect(validate({ terminalType, property: "РежимОтображения" })).toHaveLength(viewMode ? 0 : 1)
    expect(validate({
      terminalType,
      property: "ПодробноеОтображениеИменованныхЭлементовНастройки",
    })).toHaveLength(detailedRepresentation ? 0 : 1)
  })

  it.each(["РежимВыбора", "РазрешитьНачалоПеретаскивания", "РазрешитьПеретаскивание", "Ширина"])(
    "does not restrict the common Table property %s",
    (property) => expect(validate({ terminalType: "DataCompositionSettings", property })).toEqual([]),
  )

  it("does not expose the runtime-only UseRestrictions property", () => {
    expect(Object.values(TableRules.properties)).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ yaml: "ОграниченияИспользования" }),
    ]))
  })
})

function validate(params: { terminalType: string; property: string }) {
  const parsed = parseMetadataYaml(`${params.property}: Значение\n`)
  const yaml = parsed.data as Record<string, unknown>
  return withDataPathRegistrySet(createDataPathRegistrySet(settingsComposerDataPathRules), () =>
    validateTypeDependentProperties({
      filePath: "/tmp/Форма.yaml",
      parsed,
      visit: { yaml, yamlPath: [], rule: TableRules },
      target: {
        value: "Компоновщик.Настройки",
        segments: ["Компоновщик", "Настройки"],
        segmentIndex: 1,
        source: { kind: "tableColumn", table: "Компоновщик", name: "Настройки" },
        typeInfo: {
          kinds: ["tableSource"],
          nextTypes: [],
          terminalTypes: [params.terminalType],
          table: { kind: "Registered", type: params.terminalType },
        },
      },
    }))
}
