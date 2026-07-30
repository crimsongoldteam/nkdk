import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import * as mutationTestRunner from "./run-mutation-tests.mjs"

const {
  assertStableMutationReport,
  parseMutationArguments,
  validateMutationFiles,
  validateMutationTestFiles,
} = mutationTestRunner

describe("run mutation tests", () => {
  it("требует явное имя отчёта и production-файлы", () => {
    expect(() => parseMutationArguments([])).toThrow("Использование:")
    expect(() => parseMutationArguments(["--report", "before"])).toThrow("Не указаны production-файлы")
  })

  it("принимает безопасное имя отчёта и список файлов", () => {
    expect(parseMutationArguments(["--report", "before-change", "packages/core/a.ts"])).toEqual({
      reportName: "before-change",
      files: ["packages/core/a.ts"],
    })
  })

  it("принимает разделитель аргументов pnpm", () => {
    expect(
      parseMutationArguments(["--", "--report", "before-change", "packages/core/a.ts"])
    ).toEqual({
      reportName: "before-change",
      files: ["packages/core/a.ts"],
    })
  })

  it("принимает явный список связанных тестовых файлов", () => {
    expect(
      parseMutationArguments([
        "--report",
        "before-change",
        "--tests",
        "packages/core/a.test.ts,packages/core/b.spec.ts",
        "packages/core/a.ts",
      ])
    ).toEqual({
      reportName: "before-change",
      testFiles: ["packages/core/a.test.ts", "packages/core/b.spec.ts"],
      files: ["packages/core/a.ts"],
    })
  })

  it.each([
    "../outside.ts",
    "packages/core/a.test.ts",
    "packages/core/__fixtures__/a.ts",
    "packages/core/a.js",
  ])("отклоняет небезопасную цель mutation testing %s", (file) => {
    expect(() => validateMutationFiles("/project", [file], () => true)).toThrow()
  })

  it("нормализует допустимые production-файлы", () => {
    expect(validateMutationFiles("/project", ["packages/core/a.ts"], () => true)).toEqual([
      "packages/core/a.ts",
    ])
  })

  it("проверяет и преобразует тестовые файлы в пути Vitest пакета core", () => {
    expect(
      validateMutationTestFiles(
        "/project",
        ["packages/core/metadata/a.test.ts", "packages/core/helpers/b.spec.ts"],
        () => true
      )
    ).toEqual(["packages/core/metadata/a.test.ts", "packages/core/helpers/b.spec.ts"])
  })

  it.each([
    "../outside.test.ts",
    "packages/platform/a.test.ts",
    "packages/core/a.ts",
    "packages/core/__fixtures__/a.test.ts",
  ])("отклоняет небезопасный тестовый файл mutation testing %s", (file) => {
    expect(() => validateMutationTestFiles("/project", [file], () => true)).toThrow()
  })

  it.each(["Timeout", "RuntimeError", "CompileError"])(
    "отклоняет недостоверный mutation-отчёт со статусом %s",
    (status) => {
      expect(() =>
        assertStableMutationReport({
          files: {
            "packages/core/a.ts": {
              mutants: [{ id: "1", status }],
            },
          },
        })
      ).toThrow(`Недостоверный mutation-отчёт: ${status}=1`)
    }
  )
})
