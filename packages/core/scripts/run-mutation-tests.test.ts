import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import {
  assertStableMutationReport,
  parseMutationArguments,
  validateMutationFiles,
} from "./run-mutation-tests.mjs"

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
