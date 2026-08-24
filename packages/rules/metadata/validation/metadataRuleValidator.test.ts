import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import {
  compileValidationSchema,
  parseMetadataYaml,
  type ValidationSchemaValidator,
} from "@nkdk/runtime"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { createMetadataRuleValidator } from "./metadataRuleValidator"

const booleanRule = { type: "boolean", yaml: "Использовать", required: true } as PropertyRule
const stringRule = { type: "string", yaml: "Заголовок" } as PropertyRule
const rootRule = {
  itemType: "TestItem",
  properties: { use: booleanRule, title: stringRule },
} as MetadataItemRule

function validator() {
  let compilations = 0
  const result = createMetadataRuleValidator({
    propertyValidator(rule): ValidationSchemaValidator {
      compilations += 1
      return compileValidationSchema({}, rule.type === "boolean" ? Type.Boolean() : Type.String())
    },
  })
  return { ...result, compilations: () => compilations }
}

describe("общий валидатор YAML по rules.ts", () => {
  it("проверяет $значение raw, но не проверяет $xml", () => {
    const parsed = parseMetadataYaml(`
Использовать: !xml/raw
  $значение: неверно
  $xml:
    _custom: x
`)

    expect(validator().validate({ yaml: parsed.data, annotations: parsed.annotations, rule: rootRule }))
      .toEqual([expect.objectContaining({
        code: "schema.type",
        target: { kind: "path", path: ["Использовать"] },
      })])
  })

  it("считает raw без $значение присутствующим и не проверяет предметно", () => {
    const parsed = parseMetadataYaml(`
Использовать: !xml/raw
  $xml:
    _custom: x
`)

    expect(validator().validate({ yaml: parsed.data, annotations: parsed.annotations, rule: rootRule }))
      .toEqual([])
  })

  it("проверяет соседнее свойство и отклоняет обычный неизвестный ключ", () => {
    const parsed = parseMetadataYaml(`
Использовать: true
Заголовок: 42
Будущее: x
`)

    expect(validator().validate({ yaml: parsed.data, annotations: parsed.annotations, rule: rootRule }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ code: "schema.type", target: { kind: "path", path: ["Заголовок"] } }),
        expect.objectContaining({ code: "rules.unknown-property", target: { kind: "path", path: ["Будущее"] } }),
      ]))
  })

  it("разрешает неизвестный ключ только как подтверждённую raw-границу", () => {
    const parsed = parseMetadataYaml(`
Использовать: true
Properties\\Future: !xml/raw
  $xml:
    _future: x
`)

    expect(validator().validate({ yaml: parsed.data, annotations: parsed.annotations, rule: rootRule }))
      .toEqual([])
  })

  it("компилирует проверку один раз на PropertyRule, а не на файл", () => {
    const shared = validator()
    const first = parseMetadataYaml("Использовать: true\nЗаголовок: один\n")
    const second = parseMetadataYaml("Использовать: false\nЗаголовок: два\n")

    shared.validate({ yaml: first.data, annotations: first.annotations, rule: rootRule })
    shared.validate({ yaml: second.data, annotations: second.annotations, rule: rootRule })

    expect(shared.compilations()).toBe(2)
  })
})
