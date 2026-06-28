import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { collectSyncStateFilePaths } from "./syncStateFiles"

describe("collectSyncStateFilePaths", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-sync-state-files-"))
    dirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, content = ""): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content, "utf-8")
  }

  it("collects rule-described metadata files and skips unknown files", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Конфигурация.yaml", "Имя: Тест\n")
    writeProjectFile(projectDir, "МодульПриложения.bsl", "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Имя: Товары\n")
    writeProjectFile(projectDir, "Справочник/Товары/МодульОбъекта.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Имя: ФормаЭлемента\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Справка/ru.html", "<html>help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/unknown.tmp", "noise\n")
    writeProjectFile(projectDir, "Миграции/2026-05-05-143000.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Конфигурация.yaml",
      "МодульПриложения.bsl",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
  })

  it("collects nested subsystem properties without walking unrelated roots", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml", "Имя: Продажи\n")
    writeProjectFile(projectDir, "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml", "Имя: Розница\n")
    writeProjectFile(projectDir, "ПроизвольныйКаталог/Файл.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml",
      "Подсистема/Продажи/Свойства.yaml",
    ])
  })
})
