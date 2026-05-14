import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { describe, expect, it } from "vitest"
import {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
  pairedProjectGraphFile,
} from "./projectFiles"

const createProject = () => mkdtempSync(join(tmpdir(), "nkdk-graph-files-"))

function write(root: string, filePath: string): void {
  const fullPath = join(root, ...filePath.split("/"))
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, "")
}

describe("graphImport projectFiles", () => {
  it("читает свойства для всех top-level регистраций, а не только старые три каталога", () => {
    const root = createProject()
    write(root, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    write(root, "РегистрСведений/Цены/Свойства.yaml")
    write(root, "Справочник/Товары/Свойства.yaml")

    expect(discoverProjectGraphFiles(root)).toEqual([
      "РегистрСведений/Цены/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
    ].sort())
  })

  it("читает формы только если rule содержит ChildFormNames", () => {
    const root = createProject()
    write(root, "Обработка/ЗагрузкаДанных/Свойства.yaml")
    write(root, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")
    write(root, "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")
    write(root, "HTTPСервис/API/Свойства.yaml")
    write(root, "HTTPСервис/API/Формы/Форма/Форма.yaml")

    expect(discoverProjectGraphFiles(root)).toEqual([
      "HTTPСервис/API/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Свойства.yaml",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
    ].sort())
  })

  it("проверяет поддержанные пути тем же rule-driven механизмом", () => {
    expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Свойства.yaml")).toBe(true)
    expect(isSupportedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(true)
    expect(isSupportedProjectGraphFile("HTTPСервис/API/Формы/Форма/Форма.yaml")).toBe(false)
    expect(isSupportedProjectGraphFile("README.md")).toBe(false)
  })

  it("находит пару формы без знания владельца", () => {
    expect(pairedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk")).toBe(
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml",
    )
    expect(pairedProjectGraphFile("Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml")).toBe(
      "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk",
    )
  })
})
