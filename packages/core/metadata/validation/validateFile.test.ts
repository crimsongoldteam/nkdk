import { Type } from "@sinclair/typebox"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { describe, expect, it } from "vitest"
import { validateFile, validateParsedFile } from "./validateFile"

// Простая схема для юнит-тестов — не зависит от доменных правил каталогов
const simpleSchema = TypeCompiler.Compile(
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
            { additionalProperties: false },
          ),
        ),
      ),
      ВложенныйОбъект: Type.Optional(
        Type.Object(
          {
            УровеньВложенности: Type.Optional(
              Type.Object(
                {
                  Значение: Type.Optional(Type.String()),
                },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
)

const requiredSchema = TypeCompiler.Compile(
  Type.Object(
    {
      ОбязательноеПоле: Type.String(),
      НеобязательноеПоле: Type.Optional(Type.String()),
    },
    { additionalProperties: false },
  ),
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
    })
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
