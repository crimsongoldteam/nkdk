import { describe, expect, it } from "vitest"
import { isSupportedProjectFile, normalizeProjectFile, pairedFormPath } from "./projectFiles"

describe("projectFiles", () => {
  it("нормализует абсолютный путь к относительному project filePath", () => {
    expect(
      normalizeProjectFile(
        "/repo/project",
        "/repo/project/Справочник/Товары/Свойства.yaml",
      ),
    ).toBe("Справочник/Товары/Свойства.yaml")
  })

  it("находит пару Форма.yaml для Форма.nkdk", () => {
    expect(
      pairedFormPath("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"),
    ).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    expect(
      pairedFormPath("Справочник/Товары/Формы/ФормаСписка/Форма.yaml"),
    ).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk")
  })

  it("распознаёт поддержанные файлы проекта", () => {
    expect(isSupportedProjectFile("Справочник/Товары/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectFile("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk")).toBe(true)
    expect(isSupportedProjectFile("README.md")).toBe(false)
  })
})
