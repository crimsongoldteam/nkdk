import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { diagnosticAtYamlPath } from "./yamlLocations"
import {
  registerLocalYamlValueValidator,
  restoreLocalYamlValueValidationRegistryForTests,
  snapshotLocalYamlValueValidationRegistryForTests,
  validateRegisteredLocalYamlValue,
  type LocalYamlValueValidationRegistrySnapshot,
} from "./yamlValueValidationRegistry"

describe("local YAML value validation registry", () => {
  let registry: LocalYamlValueValidationRegistrySnapshot

  beforeEach(() => {
    registry = snapshotLocalYamlValueValidationRegistryForTests()
  })

  afterEach(() => {
    restoreLocalYamlValueValidationRegistryForTests(registry)
  })

  it("вызывает обработчик по типу со значением, владельцем и базовым YAML-путём", () => {
    registerLocalYamlValueValidator({
      type: "NestedValue",
      validator: (params) => [
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: [...params.yamlPath, "Ошибка"],
          severity: "error",
          source: "structure",
          message: `${params.owner.dir}.${params.owner.name}: ${String(params.value)}`,
        }),
      ],
    })

    const result = validateRegisteredLocalYamlValue({
      type: "NestedValue",
      filePath: "/project/Свойства.yaml",
      parsed: parseMetadataYaml("Значение:\n  Ошибка: true\n"),
      value: "проверено",
      yamlPath: ["Значение"],
      owner: { dir: "Тест", name: "Объект" },
    })

    expect(result).toEqual({
      diagnostics: [
        expect.objectContaining({
          path: "/Значение/Ошибка",
          message: "Тест.Объект: проверено",
        }),
      ],
    })
  })

  it("возвращает пустой результат для незарегистрированного типа", () => {
    expect(
      validateRegisteredLocalYamlValue({
        type: "Unknown",
        filePath: "/project/Свойства.yaml",
        parsed: parseMetadataYaml("{}\n"),
        value: {},
        yamlPath: [],
        owner: { dir: "Тест", name: "Объект" },
      })
    ).toEqual({ diagnostics: [] })
  })

  it("измеряет зарегистрированный подшаг профиля", () => {
    registerLocalYamlValueValidator({
      type: "MeasuredValue",
      profileSubstep: "Проверка тестового значения",
      validator: () => [],
    })

    const result = validateRegisteredLocalYamlValue({
      type: "MeasuredValue",
      filePath: "/project/Свойства.yaml",
      parsed: parseMetadataYaml("{}\n"),
      value: {},
      yamlPath: [],
      owner: { dir: "Тест", name: "Объект" },
    })

    expect(result.profile).toEqual({
      substep: "Проверка тестового значения",
      timeMs: expect.any(Number),
    })
    expect(result.profile?.timeMs).toBeGreaterThanOrEqual(0)
  })
})
