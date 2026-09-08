import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import {
  compileValidationSchema,
  explicitYAMLString,
  createXmlAnomalyAnnotations,
  markYAMLScalarTag,
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

it("готовит таблицу правил один раз для повторных пустых границ", () => {
  let enumerations = 0
  const rule: MetadataItemRule = {
    itemType: "SparseValidation",
    properties: new Proxy({ use: booleanRule, title: stringRule }, {
      ownKeys(target) { enumerations++; return Reflect.ownKeys(target) },
    }),
  }
  const validation = createMetadataRuleValidator({ propertyValidator: validatorForTest })
  const input = { rule, yaml: {}, yamlPath: [], annotations: createXmlAnomalyAnnotations() }
  const first = validation.validateBoundary(input)
  const before = enumerations
  expect(validation.validateBoundary(input)).toEqual(first)
  expect(first.map(issue => issue.code)).toEqual(["rules.required"])
  expect(enumerations).toBe(before)
})

it("разрешает вычисляемое поле, объявленное общей схемой объекта", () => {
  const parsed = parseMetadataYaml("Вид: ПолеНадписи\nИспользовать: true\n")
  const result = createMetadataRuleValidator({
    propertyValidator: validatorForTest,
    isKnownProperty: (_rule, key) => key === "Вид",
  })

  expect(result.validate({ yaml: parsed.data, annotations: parsed.annotations, rule: rootRule })).toEqual([])
})

function validatorForTest(rule: PropertyRule): ValidationSchemaValidator {
  return compileValidationSchema({}, rule.type === "boolean" ? Type.Boolean() : Type.String())
}

it("отличает разрешённое схемой служебное поле от запрещённого, сохраняя raw", () => {
  const rule: MetadataItemRule = { itemType: "RuntimeField", properties: {
    use: { ...booleanRule, runtimeOnly: true },
  } }
  const input = { rule, yamlPath: [], annotations: createXmlAnomalyAnnotations() }
  const create = (allowed: boolean) => createMetadataRuleValidator({
    propertyValidator: validatorForTest, validateUnknownProperties: false,
    isKnownProperty: () => allowed,
  })
  expect(create(true).validateBoundary({ ...input, yaml: { Использовать: true } })).toEqual([])
  expect(create(false).validateBoundary({ ...input, yaml: { Использовать: true } }))
    .toEqual([expect.objectContaining({ code: "rules.unknown-property" })])
  expect(create(false).validateBoundary({ ...input, yaml: {} })).toEqual([])
  const raw = parseMetadataYaml("Использовать: !xml/raw\n  $xml:\n    Use: true\n")
  expect(create(false).validateBoundary({ ...input, yaml: raw.data, annotations: raw.annotations })).toEqual([])
})

describe("общий валидатор YAML по rules.ts", () => {
  it("проверяет явную строку импорта как строку, не меняя исходное значение", () => {
    const value = explicitYAMLString("001")
    const yaml = { Использовать: true, Заголовок: value }
    expect(validator().validateBoundary({ yaml, rule: rootRule, yamlPath: [], annotations: createXmlAnomalyAnnotations() }))
      .toEqual([])
    expect(yaml.Заголовок).toBe(value)
  })

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

  it("не проверяет служебное представление стандартных реквизитов как обычное значение", () => {
    const yaml = { Использовать: undefined }
    markYAMLScalarTag(yaml, "Использовать", "xml/standard-attributes")

    expect(validator().validate({
      yaml,
      annotations: parseMetadataYaml("").annotations,
      rule: rootRule,
    })).toEqual([])
  })

  it("не проверяет компактное значение PropertyState как обычное значение свойства", () => {
    const yaml = { Использовать: {} }
    markYAMLScalarTag(yaml, "Использовать", "изменять")

    expect(validator().validate({
      yaml,
      annotations: parseMetadataYaml("").annotations,
      rule: rootRule,
    })).toEqual([])
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
