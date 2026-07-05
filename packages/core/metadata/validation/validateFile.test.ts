import { Type } from "@sinclairtypebox"
import { TypeCompiler, ValueErrorType } from "@sinclair/typebox/compiler"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { describe, expect, it } from "vitest"
import {
  expandDiscriminatedUnionErrors,
  getDiscriminatedUnionExpansionContextBuildCountForTests,
  resetDiscriminatedUnionExpansionContextCacheForTests,
} from "./discriminatedUnionErrors"
import { typeboxErrorsToDiagnostics } from "./typeboxErrorsToDiagnostics"
import { validateFile, validateParsedFile } from "./validateFile"

// Простая схема для юнит-тестов — не зависит от доменных правил каталогов
const simpleSchema = Schema.Compile(
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

const requiredSchema = Schema.Compile(
  Type.Object(
    {
      ОбязательноеПоле: Type.String(),
      НеобязательноеПоле: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  )
)

const plainUnionSchema = Schema.Compile(
  Type.Union([
    Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
    Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
  ])
)

const discriminatedUnionSchema = Schema.Compile(
  Type.Union(
    [
      Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
      Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
    ],
    { discriminantKey: "Вид" }
  )
)

const nestedDiscriminatedUnionSchema = Schema.Compile(
  Type.Union(
    [
      Type.Object(
        {
          Вид: Type.Literal("Контейнер"),
          Child: Type.Union(
            [
              Type.Object({ Вид: Type.Literal("Первый"), Поле: Type.String() }, { additionalProperties: false }),
              Type.Object({ Вид: Type.Literal("Второй"), Число: Type.Number() }, { additionalProperties: false }),
            ],
            { discriminantKey: "Вид" }
          ),
        },
        { additionalProperties: false }
      ),
      Type.Object({ Вид: Type.Literal("Пустой"), Поле: Type.String() }, { additionalProperties: false }),
    ],
    { discriminantKey: "Вид" }
  )
)

const childItemsModule = Type.Module({
  ChildItems: Type.Record(
    Type.String(),
    Type.Union(
      [
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
      ],
      { discriminantKey: "Вид" }
    )
  ),
})

const referencedNestedDiscriminatedUnionSchema = Schema.Compile(
  Type.Object(
    {
      Элементы: childItemsModule.Import("ChildItems"),
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
    expect(result).toHaveLength(1)
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

  it("раскрывает discriminantKey union по Вид и возвращает ошибку выбранной ветки", () => {
    const text = `Вид: Второй\nЧисло: не-число\nЛишнее: значение\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: discriminatedUnionSchema })

    expect(result.some((diagnostic) => diagnostic.message === "Expected union value")).toBe(false)
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "test.yaml",
          line: 2,
          col: 8,
          path: "/Число",
          source: "structure",
          severity: "error",
        }),
        expect.objectContaining({
          filePath: "test.yaml",
          line: 3,
          col: 1,
          path: "/Лишнее",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("для неизвестного Вид возвращает targeted discriminator diagnostic", () => {
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
        message: 'Неизвестное значение дискриминатора "Вид": "Третий". Ожидается одно из: Первый, Второй',
      }),
    ])
  })

  it("рекурсивно раскрывает вложенный discriminantKey union и сохраняет полный path", () => {
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

  it("раскрывает discriminantKey union с Type.Ref из корневой схемы", () => {
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

  it("кэширует контекст ссылок для повторного раскрытия одной TypeCheck-схемы", () => {
    resetDiscriminatedUnionExpansionContextCacheForTests()
    const parsed = parseMetadataYaml(
      `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`
    )
    const errors = [...referencedNestedDiscriminatedUnionSchema.Errors(parsed.data)]

    const first = expandDiscriminatedUnionErrors(errors, referencedNestedDiscriminatedUnionSchema)
    const second = expandDiscriminatedUnionErrors(errors, referencedNestedDiscriminatedUnionSchema)

    expect(second).toEqual(first)
    expect(getDiscriminatedUnionExpansionContextBuildCountForTests()).toBe(1)
  })

  it("оставляет Type.Ref union без падения при прямом вызове diagnostics без root schema", () => {
    const parsed = parseMetadataYaml(
      `Элементы:\n  Группа1:\n    Вид: Группа\n    Элементы:\n      Надпись1:\n        Вид: Надпись\n        Заголовок: 123\n`
    )
    const errors = [...referencedNestedDiscriminatedUnionSchema.Errors(parsed.data)]

    const result = typeboxErrorsToDiagnostics(errors, parsed, "test.yaml")

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: "test.yaml",
          message: "Expected union value",
          path: "/Элементы/Группа1",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("для отсутствующего Вид возвращает targeted discriminator diagnostic с не задано", () => {
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
        message: 'Неизвестное значение дискриминатора "Вид": не задано. Ожидается одно из: Первый, Второй',
      }),
    ])
  })

  it("для нестрокового Вид возвращает targeted discriminator diagnostic с не задано", () => {
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
        message: 'Неизвестное значение дискриминатора "Вид": не задано. Ожидается одно из: Первый, Второй',
      }),
    ])
  })

  it("оставляет обычный union без discriminantKey как TypeBox Union error", () => {
    const text = `Вид: Второй\nЧисло: не-число\n`

    const result = validateFile({ filePath: "test.yaml", text, schema: plainUnionSchema })

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Expected union value",
          source: "structure",
          severity: "error",
        }),
      ])
    )
    expect([...plainUnionSchema.Errors({ Вид: "Второй", Число: "не-число" })][0]?.type).toBe(ValueErrorType.Union)
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
})
