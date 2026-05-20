import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { describe, expect, it } from "vitest"
import {
  isSupportedProjectFile,
  normalizeProjectFile,
  readProjectFileList,
} from "./projectFiles"

describe("projectFiles", () => {
  it("нормализует абсолютный путь к относительному project filePath", () => {
    expect(
      normalizeProjectFile(
        "/repo/project",
        "/repo/project/Справочник/Товары/Свойства.yaml",
      ),
    ).toBe("Справочник/Товары/Свойства.yaml")
  })

  it("распознаёт поддержанные файлы проекта", () => {
    expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(true)
    expect(isSupportedProjectFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(false)
    expect(isSupportedProjectFile("HTTPСервис/API/Формы/Форма/Форма.yaml")).toBe(false)
    expect(isSupportedProjectFile("README.md")).toBe(false)
  })

  it("читает список файлов проекта по правилам core", () => {
    const projectPath = mkdtempSync(join(tmpdir(), "nkdk-project-files-"))
    writeProjectFile(projectPath, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    writeProjectFile(projectPath, "РегистрСведений/Цены/Свойства.yaml")
    writeProjectFile(projectPath, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")
    writeProjectFile(projectPath, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")
    writeProjectFile(projectPath, "HTTPСервис/API/Формы/Форма/Форма.yaml")

    expect(readProjectFileList(projectPath)).toEqual([
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
      "РегистрСведений/Цены/Свойства.yaml",
    ])
  })
})

function writeProjectFile(projectPath: string, filePath: string): void {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, "")
}
