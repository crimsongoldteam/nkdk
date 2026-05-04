import { describe, expect, it } from "vitest"
import { normalizeProjectFile, pairedFormPath } from "./projectFiles"

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
  })
})
