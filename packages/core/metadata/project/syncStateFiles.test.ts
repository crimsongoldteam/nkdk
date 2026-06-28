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
    writeProjectFile(
      projectDir,
      "Справочник/Товары/Свойства.yaml",
      ["Имя: Товары", "Команды:", "  Печать:", "    Синоним: Печать", ""].join("\n"),
    )
    writeProjectFile(projectDir, "Справочник/Товары/МодульОбъекта.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Печать.bsl", "Процедура ОбработкаКоманды()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Имя: ФормаЭлемента\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html", "<html>form help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query", "ВЫБРАТЬ 1\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Картинки/Иконка.png", "png\n")
    writeProjectFile(projectDir, "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml", "<template/>\n")
    writeProjectFile(projectDir, "Справочник/Товары/Справка/ru.html", "<html>help</html>\n")
    writeProjectFile(projectDir, "Обработка/Сервис/Свойства.yaml", "Имя: Сервис\n")
    writeProjectFile(projectDir, "Обработка/Сервис/МодульОбъекта.bin", "binary\n")
    writeProjectFile(projectDir, "ОбщаяФорма/Редактор/Свойства.yaml", "Имя: Редактор\n")
    writeProjectFile(projectDir, "ОбщаяФорма/Редактор/Form.bin", "binary\n")
    writeProjectFile(projectDir, "ОбщийМакет/ПечатнаяФорма/Свойства.yaml", "Имя: ПечатнаяФорма\n")
    writeProjectFile(projectDir, "ОбщийМакет/ПечатнаяФорма/Template.bin", "binary\n")
    writeProjectFile(projectDir, "ОбщийМакет/ПечатнаяФорма/Картинка.png", "png\n")
    writeProjectFile(projectDir, "Справочник/Товары/unknown.tmp", "noise\n")
    writeProjectFile(projectDir, "Миграции/2026-05-05-143000.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Конфигурация.yaml",
      "МодульПриложения.bsl",
      "Обработка/Сервис/МодульОбъекта.bin",
      "Обработка/Сервис/Свойства.yaml",
      "ОбщаяФорма/Редактор/Свойства.yaml",
      "ОбщаяФорма/Редактор/Form.bin",
      "ОбщийМакет/ПечатнаяФорма/Картинка.png",
      "ОбщийМакет/ПечатнаяФорма/Свойства.yaml",
      "ОбщийМакет/ПечатнаяФорма/Template.bin",
      "Справочник/Товары/Команды/Печать.bsl",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query",
      "Справочник/Товары/Формы/ФормаЭлемента/Картинки/Иконка.png",
      "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml",
    ])
  })

  it("collects nested subsystem properties without walking unrelated roots", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml", "Имя: Продажи\n")
    writeProjectFile(projectDir, "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml", "Имя: Розница\n")
    writeProjectFile(projectDir, "Подсистема/Продажи/Подсистемы/Розница/Справка/ru.html", "<html>help</html>\n")
    writeProjectFile(projectDir, "ПроизвольныйКаталог/Файл.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml",
      "Подсистема/Продажи/Подсистемы/Розница/Справка/ru.html",
      "Подсистема/Продажи/Свойства.yaml",
    ])
  })
})
