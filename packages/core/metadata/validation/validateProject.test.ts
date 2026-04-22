import { join } from "path"
import { describe, expect, it } from "vitest"
import { validateProject } from "./validateProject"

const fixturesDir = join(__dirname, "__fixtures__")

const baseContext = {
  version: "2.20",
  defaultLanguage: "ru",
}

describe("validateProject — структурные ошибки и битые ссылки", () => {
  const projectPath = join(fixturesDir, "project-with-errors")

  it("возвращает диагностики при наличии ошибок", () => {
    const diagnostics = validateProject({ projectPath, context: baseContext })
    expect(diagnostics.length).toBeGreaterThan(0)
  })

  it("обнаруживает структурную ошибку (недопустимое поле) в Свойства.yaml", () => {
    const diagnostics = validateProject({ projectPath, context: baseContext })
    const structureErrors = diagnostics.filter((d) => d.source === "structure")
    expect(structureErrors.length).toBeGreaterThan(0)
    expect(structureErrors[0]).toMatchObject({
      severity: "error",
      source: "structure",
    })
  })

  it("обнаруживает битую ссылку на несуществующий справочник", () => {
    const diagnostics = validateProject({ projectPath, context: baseContext })
    const referenceErrors = diagnostics.filter((d) => d.source === "reference")
    expect(referenceErrors.length).toBeGreaterThan(0)
    expect(referenceErrors[0]).toMatchObject({
      severity: "error",
      source: "reference",
      message: expect.stringContaining("НесуществующийСправочник"),
    })
  })
})

describe("validateProject — отсутствующий внешний файл формы", () => {
  const projectPath = join(fixturesDir, "project-with-form")

  it("обнаруживает отсутствие Форма.nkdk при наличии Форма.yaml", () => {
    const diagnostics = validateProject({ projectPath, context: baseContext })
    const externalFileErrors = diagnostics.filter((d) => d.source === "external-file")
    expect(externalFileErrors.length).toBeGreaterThan(0)
    expect(externalFileErrors[0]).toMatchObject({
      severity: "error",
      source: "external-file",
      message: expect.stringContaining("Форма.nkdk"),
    })
  })
})

describe("validateProject — точность позиции битой ссылки в многотипном реквизите", () => {
  const projectPath = join(fixturesDir, "project-with-multitype-ref")

  it("координата диагностики указывает на строку Тип:, а не на строку реквизита", () => {
    const diagnostics = validateProject({ projectPath, context: baseContext })
    const referenceErrors = diagnostics.filter((d) => d.source === "reference")
    expect(referenceErrors.length).toBeGreaterThan(0)

    const broken = referenceErrors.find((d) => d.message.includes("БитыйСправочник"))
    expect(broken).toBeDefined()

    // МногоТипныйРеквизит — на строке 2, Тип: — на строке 3.
    // Позиция должна указывать на строку значения Тип (3), а не на реквизит (2).
    expect(broken!.line).toBeGreaterThanOrEqual(3)
  })
})
