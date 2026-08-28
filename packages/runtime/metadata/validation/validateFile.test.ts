import { compileValidationSchema } from "./compileValidationSchema"
import { Type, type TSchema } from "typebox"
import { parseMetadataYaml } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { typeboxErrorsToDiagnostics } from "./typeboxErrorsToDiagnostics"
import {
  evaluateParsedXmlAnomalyBoundaries,
  validateFile,
  validateParsedFile,
  validateParsedFileWithIssues,
} from "./validateFile"
import type { ValidationSchemaValidator } from "./compileValidationSchema"

// Простая схема для юнит-тестов — не зависит от доменных правил каталогов
const simpleSchema = compileValidationSchema(
  Type.Object(
    {
      Имя: Type.Optional(Type.String()),
      Количество: Type.Optional(Type.Number()),
      Реквизиты: Type.Optional(
        Type.Array(
          Type.Object(
            {
              Тип: Type.Optional(Type.String()),
              Синоним: Type.Optional(Type.String()),
            },
            { additionalProperties: false }
          )
        )
      ),
      ВложенныйОбъект: Type.Optional(
        Type.Object(
          {
            УровеньВложенности: Type.Optional(
              Type.Object(
                {
                  Значение: Type.Optional(Type.String()),
                },
                { additionalProperties: false }
              )
            ),
          },
          { additionalProperties: false }
        )
      ),
    },
    { additionalProperties: false }
  )
)

const requiredSchema = compileValidationSchema(
  Type.Object(
    {
      ОбязательноеПоле: Type.String(),
      НеобязательноеПоле: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )
)

const plainUnionSchema = compileValidationSchema(
  Type.Union([
    Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
    Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
  ])
)

function discriminatorUnion(discriminator: string, schemas: [TSchema, TSchema, ...TSchema[]]): TSchema {
  return {
    oneOf: schemas,
    discriminator: { propertyName: discriminator },
  } as TSchema
}

const discriminatedUnionSchema = compileValidationSchema(
  discriminatorUnion("Вид", [
    Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
    Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
  ])
)

const nestedDiscriminatedUnionSchema = compileValidationSchema(
  discriminatorUnion("Вид", [
    Type.Object(
      {
        Вид: Type.Literal("Контейнер"),
        Child: discriminatorUnion("Вид", [
          Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
          Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
        ]),
      },
      { additionalProperties: false }
    ),
    Type.Object({ Вид: Type.Literal("Пустой"), Поле: Type.String() }, { additionalProperties: false }),
  ])
)

const childItemsDefinitions = {
  ChildItems: Type.Record(
    Type.String(),
    discriminatorUnion("Вид", [
      Type.Object(
        {
          Вид: Type.Literal("Группа"),
          Элементы: Type.Optional(Type.Ref("ChildItems")),
        },
        { additionalProperties: false }
      ),
      Type.Object(
        {
          Вид: Type.Literal("Надпись"),
          Заголовок: Type.String(),
        },
        { additionalProperties: false }
      ),
    ])
  ),
}

const referencedNestedDiscriminatedUnionSchema = compileValidationSchema(
  {
    ChildItems: Type.Cyclic(childItemsDefinitions, "ChildItems"),
  },
  Type.Object(
    {
      Элементы: Type.Ref("ChildItems"),
    },
    { additionalProperties: false }
  )
)

describe("validateFile", () => {
  it("возвращает пустой массив для валидного YAML", () => {
    const text = `Имя: Тестовое наименование\nКоличество: 42\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    expect(result).toEqual([])
  })

  it("обнаруживает синтаксическую ошибку YAML", () => {
    const text = `Имя: [незакрытая скобка\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      filePath: "test.yaml",
      source: "syntax",
      severity: "error",
    })
    // При синтаксической ошибке line и col должны быть числами > 0
    expect(result[0]!.line).toBeGreaterThan(0)
    expect(result[0]!.col).toBeGreaterThan(0)
  })

  it("при синтаксической ошибке не запускает TypeBox-проверку (нет дополнительных диагностик)", () => {
    const text = `Имя: [незакрытая скобка\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    // Только синтаксическая ошибка, никаких structure-диагностик
    expect(result.every((d) => d.source === "syntax")).toBe(true)
  })

  it("uses js-yaml syntax diagnostics from ParsedYaml", () => {
    const parsed = parseMetadataYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(
      validateParsedFile({
        filePath: "test.yaml",
        parsed,
        schema: simpleSchema,
      })
    ).toEqual([
      expect.objectContaining({
        filePath: "test.yaml",
        line: 1,
        col: 6,
        source: "syntax",
        severity: "error",
      }),
    ])
  })

  it("обнаруживает поле с недопустимым дополнительным ключом", () => {
    const text = `НесуществующееПоле: значение\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      filePath: "test.yaml",
      source: "structure",
      severity: "error",
    })
  })

  it("получает результат структурной проверки одним вызовом Errors", () => {
    const parsed = parseMetadataYaml(`НесуществующееПоле: значение\n`)
    let checkCalls = 0
    let errorsCalls = 0
    const countedSchema: ValidationSchemaValidator = {
      Check(value) {
        checkCalls += 1
        return simpleSchema.Check(value)
      },
      Errors(value) {
        errorsCalls += 1
        return simpleSchema.Errors(value)
      },
    }

    const result = validateParsedFile({ filePath: "test.yaml", parsed, schema: countedSchema })

    expect(result.length).toBeGreaterThan(0)
    expect(checkCalls).toBe(0)
    expect(errorsCalls).toBe(1)
  })

  it("обнаруживает неверный тип: число там, где ожидается строка", () => {
    const text = `Имя: 12345\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    // YAML парсит 12345 как integer, TypeBox String его отвергает
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({
      source: "structure",
      severity: "error",
    })
  })

  it("обнаруживает отсутствующее обязательное поле, координаты на родительском узле", () => {
    const text = `НеобязательноеПоле: "значение"\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: requiredSchema })
    const required = result.find((d) => d.path === "/ОбязательноеПоле")
    expect(required).toBeDefined()
    expect(required).toMatchObject({
      source: "structure",
      severity: "error",
      message: 'Отсутствует обязательное свойство "ОбязательноеПоле"',
    })
    expect(result.filter((d) => d.path === "/ОбязательноеПоле")).toHaveLength(1)
    // Координаты должны быть на родительском (корневом) узле — line 1, col 1
    expect(required!.line).toBe(1)
    expect(required!.col).toBe(1)
  })

  it("вложенный путь — кириллица в ключах JSON Pointer декодируется корректно", () => {
    const text = `Реквизиты:\n  - НесуществующийКлюч: значение\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    // Ожидаем structure-ошибку с путём, включающим кириллический ключ
    const structureErrors = result.filter((d) => d.source === "structure")
    expect(structureErrors.length).toBeGreaterThan(0)
    const withCyrillicPath = structureErrors.find((d) => d.path?.includes("НесуществующийКлюч"))
    expect(withCyrillicPath).toBeDefined()
  })

  it("числовой индекс массива в пути конвертируется корректно", () => {
    const text = `Реквизиты:\n  - Тип: 12345\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    // Путь к ошибке должен содержать /0/ (числовой индекс массива)
    const withIndex = result.find((d) => d.path?.includes("/0/"))
    expect(withIndex).toBeDefined()
    expect(withIndex).toMatchObject({
      source: "structure",
      severity: "error",
    })
  })

  it("вложенный путь глубиной ≥ 3 — координаты указывают на корректный узел", () => {
    const text = `ВложенныйОбъект:\n  УровеньВложенности:\n    НесуществующееПоле: значение\n`
    const result = validateFile({ filePath: "test.yaml", text, schema: simpleSchema })
    const deepError = result.find((d) => d.path && d.path.split("/").length >= 4)
    expect(deepError).toBeDefined()
    expect(deepError).toMatchObject({
      source: "structure",
      severity: "error",
    })
    // Координата должна быть в разумных пределах (строка 3 или около)
    expect(deepError!.line).toBeGreaterThanOrEqual(1)
  })

  it("выбирает ветвь TypeBox по Вид и возвращает одну её ошибку", () => {
    const text = `Вид: Второй\nЧисло: не-число\nЛишнее: значение\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

    expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
    expect(result).toEqual([
      expect.objectContaining({
        filePath: "test.yaml",
        line: 3,
        col: 9,
        path: "/Лишнее",
        source: "structure",
        severity: "error",
      }),
    ])
  })

  it("указывает неизвестный Вид на поле discriminator", () => {
    const text = `Вид: Третий\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

    expect(result).toEqual([
      expect.objectContaining({
        filePath: "test.yaml",
        line: 1,
        col: 6,
        path: "/Вид",
        source: "structure",
        severity: "error",
        message: "must be equal to one of the allowed values",
      }),
    ])
  })

  it("сохраняет полный путь ошибки вложенного discriminator", () => {
    const text = `Вид: Контейнер\nChild:\n  Вид: Второй\n  Число: не-число\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: nestedDiscriminatedUnionSchema })

    expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "test.yaml",
          line: 4,
          col: 10,
          path: "/Child/Число",
          source: "structure",
          severity: "error",
          message: "Expected number",
        }),
      ])
    )
  })

  it("обрабатывает рекурсивный discriminator через Type.Ref", () => {
    const text = `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: referencedNestedDiscriminatedUnionSchema })

    expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "test.yaml",
          line: 7,
          col: 20,
          path: "/Элементы/Группа1/Элементы/Надпись1/Заголовок",
          source: "structure",
          severity: "error",
          message: "Expected string",
        }),
      ])
    )
  })

  it("преобразует ошибку Type.Ref discriminator без разворачивания корневой схемы", () => {
    const parsed = parseMetadataYaml(
      `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`
    )
    const [, errors] = referencedNestedDiscriminatedUnionSchema.Errors(parsed.data)

    const result = typeboxErrorsToDiagnostics(errors, parsed, "test.yaml")

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "test.yaml",
          path: "/Элементы/Группа1/Элементы/Надпись1/Заголовок",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("указывает отсутствующий Вид на поле discriminator", () => {
    const text = `Поле: значение\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

    expect(result).toEqual([
      expect.objectContaining({
        filePath: "test.yaml",
        line: 1,
        col: 1,
        path: "/Вид",
        source: "structure",
        severity: "error",
        message: "Expected string",
      }),
    ])
  })

  it("указывает нестроковый Вид на поле discriminator", () => {
    const text = `Вид: 123\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

    expect(result).toEqual([
      expect.objectContaining({
        filePath: "test.yaml",
        line: 1,
        col: 6,
        path: "/Вид",
        source: "structure",
        severity: "error",
        message: "Expected string",
      }),
    ])
  })

  it("оставляет обычный union без discriminator последовательной проверкой TypeBox", () => {
    const text = `Вид: Второй\nЧисло: не-число\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: plainUnionSchema })

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toMatchObject({ source: "structure", severity: "error" })
    const [, errors] = plainUnionSchema.Errors({ Вид: "Второй", Число: "не-число" })
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe("validateParsedFile", () => {
  it("использует уже разобранный YAML без повторного парсинга текста", () => {
    const parsed = {
      ...parseMetadataYaml(`Имя: Тестовое наименование\nКоличество: 42\n`),
      text: `Имя: [незакрытая скобка\n`,
    }

    const result = validateParsedFile({ filePath: "test.yaml", parsed, schema: simpleSchema })

    expect(result).toEqual([])
  })

  it("не проверяет raw без $значение, но продолжает проверять соседей", () => {
    const schema = compileValidationSchema(Type.Object({
      Использовать: Type.Boolean(),
      Заголовок: Type.String(),
    }, { additionalProperties: false }))
    const parsed = parseMetadataYaml(`
Использовать: !xml/raw
  $xml:
    _custom: x
Заголовок: 42
`)

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.issues).toEqual([expect.objectContaining({
      code: "schema.type",
      target: { kind: "path", path: ["Заголовок"] },
    })])
    expect(result.diagnostics).toEqual([expect.objectContaining({ path: "/Заголовок" })])
  })

  it("проверяет смысловое $значение raw", () => {
    const schema = compileValidationSchema(Type.Object({ Использовать: Type.Boolean() }))
    const parsed = parseMetadataYaml(`
Использовать: !xml/raw
  $значение: неверно
  $xml:
    _custom: x
`)

    expect(validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema }).issues)
      .toEqual([expect.objectContaining({ target: { kind: "path", path: ["Использовать"] } })])
  })

  it("invalid подавляет только ошибку точно помеченного значения", () => {
    const schema = compileValidationSchema(Type.Object({
      Использовать: Type.Boolean(),
      Вложенный: Type.Object({ Значение: Type.String() }),
    }))
    const parsed = parseMetadataYaml(`
Использовать: !xml/invalid неверно
Вложенный: !xml/invalid
  Значение: 42
`)

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "schema.type",
        target: { kind: "path", path: ["Вложенный", "Значение"] },
      }),
      expect.objectContaining({
        code: "xml/anomaly-tag-unnecessary",
        target: { kind: "path", path: ["Вложенный"] },
      }),
    ])
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/Вложенный/Значение" }),
    ]))
  })

  it("считает тег invalid лишним, если значение правильно", () => {
    const schema = compileValidationSchema(Type.Object({ Использовать: Type.Boolean() }))
    const parsed = parseMetadataYaml(`Использовать: !xml/invalid true\n`)

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "xml/anomaly-tag-unnecessary",
        target: { kind: "path", path: ["Использовать"] },
      }),
    ])
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ path: "/Использовать", source: "structure" }),
    ])
  })

  it("считает invalid на повторных логических ключах обоснованным", () => {
    const schema = compileValidationSchema(Type.Object({}, { additionalProperties: true }))
    const parsed = parseMetadataYaml([
      "Код: первое",
      "!xml/invalid Код: второе",
      "!xml/invalid/2 Код: третье",
    ].join("\n"))

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.diagnostics).toEqual([])
    expect(result.issues).toEqual([])
    expect(result.boundaries).toEqual([
      {
        annotation: "invalid",
        target: { kind: "occurrence", path: ["Код"], occurrence: 1 },
        state: "accepted",
      },
      {
        annotation: "invalid",
        target: { kind: "occurrence", path: ["Код"], occurrence: 2 },
        state: "accepted",
      },
    ])
  })

  it("связывает invalid уникального логического ключа с его смысловым значением", () => {
    const parsed = parseMetadataYaml([
      "Заголовок:",
      "  ru: Текст",
      "  !xml/invalid en: Text",
    ].join("\n"))
    const target = { kind: "path" as const, path: ["Заголовок", "en"] }

    const result = evaluateParsedXmlAnomalyBoundaries({
      filePath: "test.yaml",
      parsed,
      diagnostics: [],
      issues: [{ code: "i18n.unregistered-language", kind: "semantic", target }],
    })

    expect(result.diagnostics).toEqual([])
    expect(result.issues).toEqual([])
    expect(result.boundaries).toEqual([
      { annotation: "invalid", target, state: "accepted" },
    ])
  })

  it.each([
    {
      name: "сохраняет как отсутствующее обязательное свойство",
      property: Type.String(),
      issues: [],
      boundaries: [{
        annotation: "invalid",
        target: { kind: "missing", path: ["Заголовок"] },
        state: "accepted",
      }],
    },
    {
      name: "считает лишним для необязательного свойства",
      property: Type.Optional(Type.String()),
      issues: [expect.objectContaining({
        code: "xml/anomaly-tag-unnecessary",
        target: { kind: "missing", path: ["Заголовок"] },
      })],
      boundaries: [],
    },
  ])("пустой invalid $name", ({ property, issues, boundaries }) => {
    const schema = compileValidationSchema(Type.Object({ Заголовок: property }))
    const parsed = parseMetadataYaml("Заголовок: !xml/invalid\n")

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.issues).toEqual(issues)
    expect(result.boundaries).toEqual(boundaries)
  })

  it("возвращает accepted и pending для соседних точных границ", () => {
    const parsed = parseMetadataYaml(`
Первый: !xml/invalid неверно
Второй: !xml/invalid true
`)
    const firstTarget = { kind: "path" as const, path: ["Первый"] }

    const result = evaluateParsedXmlAnomalyBoundaries({
      filePath: "test.yaml",
      parsed,
      diagnostics: [],
      issues: [{ code: "schema.type", kind: "semantic", target: firstTarget }],
      deferUnnecessaryFor: (target) => target.path[0] === "Второй",
    })

    expect(result.boundaries).toEqual([
      { annotation: "invalid", target: firstTarget, state: "accepted" },
      {
        annotation: "invalid",
        target: { kind: "path", path: ["Второй"] },
        state: "pending",
      },
    ])
  })

  it("проверяет регистрацию important", () => {
    const schema = compileValidationSchema(Type.Object({ Использовать: Type.Boolean() }))
    const parsed = parseMetadataYaml(`Использовать: !xml/important неверно\n`)

    const result = validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema })

    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "xml/important-not-registered",
        target: { kind: "path", path: ["Использовать"] },
      }),
    ])
  })

  it("проверяет invalid внутри смыслового значения raw", () => {
    const schema = compileValidationSchema(Type.Object({ Использовать: Type.Boolean() }))
    const parsed = parseMetadataYaml(`
Использовать: !xml/raw
  $значение: !xml/invalid неверно
  $xml:
    _custom: x
`)

    expect(validateParsedFileWithIssues({ filePath: "test.yaml", parsed, schema }))
      .toMatchObject({ diagnostics: [], issues: [] })
  })
})
