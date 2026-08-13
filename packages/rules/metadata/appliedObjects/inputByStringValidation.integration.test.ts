import { parseMetadataYaml } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { metadataRules } from "../composition/metadataRules"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"

const runtime = createValidationRegistrySet(metadataRules, createRuleRegistrySet(metadataRules))

describe("ВводПоСтроке in composed validation runtime", () => {
  it.each([
    [
      "ВводПоСтроке:\n  - СтандартныйРеквизит.Наименование\n  - СтандартныйРеквизит.Номер\n",
      "ВводПоСтроке совпадает с вычисляемым значением и не должен задаваться явно",
    ],
    [
      "ДлинаНомера: 0\nВводПоСтроке:\n  - СтандартныйРеквизит.Номер\n",
      "СтандартныйРеквизит.Номер недоступен при ДлинаНомера: 0",
    ],
    [
      "ТипНомера: Число\nДлинаНомера: 39\n",
      "ДлинаНомера не должна превышать 38 при ТипНомера: Число",
    ],
  ])("reports applied-object contract errors", (text, message) => {
    expect(validateTask(text)).toContainEqual(expect.objectContaining({ severity: "error", message }))
  })

  it("accepts a task without number and without explicit input fields", () => {
    expect(validateTask("ДлинаНомера: 0\n")).toEqual([])
  })
})

function validateTask(text: string) {
  const parsed = parseMetadataYaml(text)
  return runtime.validateLocalValue({
    type: "MetadataTask",
    filePath: "/project/Задача/Тест/Свойства.yaml",
    parsed,
    value: parsed.data,
    yamlPath: [],
    owner: { dir: "Задача", name: "Тест" },
  }).diagnostics
}
