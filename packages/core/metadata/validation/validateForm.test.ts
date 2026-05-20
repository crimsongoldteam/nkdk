import { mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { validateForm } from "./validateForm"

const createFormDir = (): string => mkdtempSync(join(tmpdir(), "nakidka-validate-form-"))

describe("validateForm", () => {
  it("принимает форму с единым YAML-файлом", () => {
    const formDir = createFormDir()
    writeFileSync(join(formDir, "Форма.yaml"), "Элементы: {}\n")

    expect(validateForm({ formDir, formName: "Форма" })).toEqual([])
  })
})
