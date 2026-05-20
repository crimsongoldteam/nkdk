import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { validateForm } from "./validateForm"

const createFormDir = (): string => mkdtempSync(join(tmpdir(), "nakidka-validate-form-"))

describe("validateForm", () => {
  it("не требует Форма.nkdk рядом с Форма.yaml", () => {
    const formDir = createFormDir()
    writeFileSync(join(formDir, "Форма.yaml"), "Элементы: {}\n")

    expect(validateForm({ formDir, formName: "Форма" })).toEqual([])
  })

  it("сообщает об устаревшем Форма.nkdk без Форма.yaml", () => {
    const formDir = createFormDir()
    writeFileSync(join(formDir, "Форма.nkdk"), "ПолеВвода1(Реквизит):\n")

    expect(validateForm({ formDir, formName: "Форма" })).toEqual([
      expect.objectContaining({
        filePath: join(formDir, "Форма.nkdk"),
        message: "Устаревший файл структуры формы: Форма.nkdk",
        severity: "error",
      }),
    ])
  })

  it("не сообщает об устаревшем Форма.nkdk, если есть Форма.yaml", () => {
    const formDir = createFormDir()
    mkdirSync(formDir, { recursive: true })
    writeFileSync(join(formDir, "Форма.yaml"), "Элементы: {}\n")
    writeFileSync(join(formDir, "Форма.nkdk"), "ПолеВвода1(Реквизит):\n")

    expect(validateForm({ formDir, formName: "Форма" })).toEqual([])
  })
})
