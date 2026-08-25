import { describe, expect, it } from "vitest"
import {
  typeboxErrorsToValidationIssues,
  validationIssueTargetKey,
} from "./validationIssue"

describe("структурированная ошибка валидации", () => {
  it("адресует каждое дополнительное свойство", () => {
    expect(typeboxErrorsToValidationIssues([{
      keyword: "additionalProperties",
      schemaPath: "#/additionalProperties",
      instancePath: "",
      params: { additionalProperties: ["Будущее"] },
      message: "additional",
    }])).toEqual([expect.objectContaining({
      code: "schema.additionalProperties",
      target: { kind: "path", path: ["Будущее"] },
    })])
  })

  it("не зависит от текста и локали TypeBox", () => {
    const error = {
      keyword: "maxLength",
      schemaPath: "#/properties/Имя/maxLength",
      instancePath: "/Имя",
      params: { limit: 10 },
      message: "must NOT have more than 10 characters",
    }
    const translated = { ...error, message: "длина превышает 10 символов" }

    expect(typeboxErrorsToValidationIssues([error])).toEqual(
      typeboxErrorsToValidationIssues([translated]),
    )
    expect(typeboxErrorsToValidationIssues([error])).toEqual([{
      code: "schema.maxLength",
      kind: "semantic",
      target: { kind: "path", path: ["Имя"] },
      params: { limit: 10 },
    }])
  })

  it("адресует отсутствующее свойство отдельно от родителя", () => {
    const [issue] = typeboxErrorsToValidationIssues([{
      keyword: "required",
      schemaPath: "#/required",
      instancePath: "/Диапазон",
      params: { requiredProperties: ["Минимум", "Максимум"] },
      message: "required",
    }])

    expect(issue?.target).toEqual({ kind: "missing", path: ["Диапазон", "Минимум"] })
    expect(validationIssueTargetKey(issue!.target)).toBe("missing:/Диапазон/Минимум")
  })

  it("разворачивает все отсутствующие свойства", () => {
    const issues = typeboxErrorsToValidationIssues([{
      keyword: "required",
      schemaPath: "#/required",
      instancePath: "",
      params: { requiredProperties: ["Имя", "Синоним"] },
      message: "required",
    }])

    expect(issues.map(({ target }) => target)).toEqual([
      { kind: "missing", path: ["Имя"] },
      { kind: "missing", path: ["Синоним"] },
    ])
  })

  it("адресует конкретное повторное вхождение", () => {
    const [issue] = typeboxErrorsToValidationIssues([{
      keyword: "uniqueItems",
      schemaPath: "#/uniqueItems",
      instancePath: "/Языки",
      params: { duplicateIndex: 2 },
      message: "duplicate",
    }])

    expect(issue?.target).toEqual({ kind: "occurrence", path: ["Языки"], occurrence: 2 })
  })

  it("не выбирает ошибки неоднозначных ветвей union", () => {
    const issues = typeboxErrorsToValidationIssues([
      {
        keyword: "required",
        schemaPath: "#/properties/Значение/anyOf/0/required",
        instancePath: "/Значение",
        params: { requiredProperties: ["Тип"] },
        message: "required",
      },
      {
        keyword: "required",
        schemaPath: "#/properties/Значение/anyOf/1/required",
        instancePath: "/Значение",
        params: { requiredProperties: ["Значение"] },
        message: "required",
      },
      {
        keyword: "anyOf",
        schemaPath: "#/properties/Значение",
        instancePath: "/Значение",
        params: {},
        message: "anyOf",
      },
    ])

    expect(issues).toEqual([{
      code: "schema.anyOf",
      kind: "semantic",
      target: { kind: "path", path: ["Значение"] },
      params: {},
    }])
  })
})
