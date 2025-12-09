import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

/**
 * Создает каталог "Справочники" в корне проекта, если его еще нет
 * @returns Promise с путем к каталогу "Справочники" или undefined, если не удалось определить корень проекта
 */
export const createSpravochnikiDirectory = async (): Promise<
  string | undefined
> => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Не удалось определить корень проекта")
    return undefined
  }

  const projectRoot = workspaceFolder.uri.fsPath
  const spravochnikiPath = path.join(projectRoot, "Справочники")

  try {
    // Проверяем, существует ли каталог
    if (!fs.existsSync(spravochnikiPath)) {
      // Создаем каталог
      fs.mkdirSync(spravochnikiPath, { recursive: true })
      vscode.window.showInformationMessage(
        `Каталог "Справочники" создан: ${spravochnikiPath}`
      )
    } else {
      vscode.window.showInformationMessage(
        `Каталог "Справочники" уже существует: ${spravochnikiPath}`
      )
    }

    return spravochnikiPath
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(
      `Ошибка при создании каталога "Справочники": ${errorMessage}`
    )
    return undefined
  }
}

/**
 * Рекурсивно ищет файл в каталоге и его подкаталогах
 * @param dir - каталог для поиска
 * @param fileName - имя файла для поиска
 * @returns путь к найденному файлу или null
 */
const findFileRecursively = (dir: string, fileName: string): string | null => {
  try {
    // Проверяем корневой каталог
    const rootFile = path.join(dir, fileName)
    if (fs.existsSync(rootFile) && fs.statSync(rootFile).isFile()) {
      return rootFile
    }

    // Проверяем подкаталоги
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(dir, entry.name)
        const found = findFileRecursively(subDir, fileName)
        if (found) {
          return found
        }
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа
  }
  return null
}

/**
 * Копирует файлы ManagerModule.bsl и ObjectModule.bsl из исходного каталога в целевой
 * @param sourceDir - исходный каталог
 * @param targetDir - целевой каталог
 */
const copyModuleFiles = (sourceDir: string, targetDir: string): void => {
  const filesToCopy = ["ManagerModule.bsl", "ObjectModule.bsl"]

  filesToCopy.forEach((fileName) => {
    // Ищем файл рекурсивно в исходном каталоге
    const sourceFile = findFileRecursively(sourceDir, fileName)

    if (sourceFile) {
      const targetFile = path.join(targetDir, fileName)
      try {
        // Убеждаемся, что целевой каталог существует
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        fs.copyFileSync(sourceFile, targetFile)
        vscode.window.showInformationMessage(
          `Скопирован файл: ${fileName} из ${sourceFile} в ${targetDir}`
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        vscode.window.showErrorMessage(
          `Ошибка при копировании файла ${fileName}: ${errorMessage}`
        )
      }
    } else {
      vscode.window.showInformationMessage(
        `Файл ${fileName} не найден в ${sourceDir}`
      )
    }
  })
}

/**
 * Перебирает все каталоги в папке Catalogs и копирует модули в Справочники
 * @param selectedPath - путь к выбранному каталогу
 * @param spravochnikiPath - путь к каталогу Справочники
 */
const processCatalogs = (
  selectedPath: string,
  spravochnikiPath: string
): void => {
  const catalogsPath = path.join(selectedPath, "Catalogs")

  if (!fs.existsSync(catalogsPath)) {
    vscode.window.showWarningMessage(
      `Каталог Catalogs не найден: ${catalogsPath}`
    )
    return
  }

  try {
    const catalogDirs = fs.readdirSync(catalogsPath, { withFileTypes: true })

    catalogDirs.forEach((dirent) => {
      if (dirent.isDirectory()) {
        const catalogName = dirent.name
        const sourceCatalogPath = path.join(catalogsPath, catalogName)
        const targetCatalogPath = path.join(spravochnikiPath, catalogName)

        try {
          // Создаем каталог в Справочники, если его еще нет
          if (!fs.existsSync(targetCatalogPath)) {
            fs.mkdirSync(targetCatalogPath, { recursive: true })
            vscode.window.showInformationMessage(
              `Создан каталог: ${catalogName} в Справочники`
            )
          }

          // Копируем файлы модулей
          copyModuleFiles(sourceCatalogPath, targetCatalogPath)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          vscode.window.showErrorMessage(
            `Ошибка при обработке каталога ${catalogName}: ${errorMessage}`
          )
        }
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(
      `Ошибка при чтении каталога Catalogs: ${errorMessage}`
    )
  }
}

/**
 * Выбирает каталог с помощью диалога VS Code
 * @returns Promise с путем к выбранному каталогу или undefined, если выбор отменен
 */
export const importConfigFromXml = async (): Promise<string | undefined> => {
  const selectedFolders = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Выбрать каталог",
    title: "Выберите каталог для импорта конфигурации",
  })

  if (!selectedFolders || selectedFolders.length === 0) {
    vscode.window.showInformationMessage("Выбор каталога отменен")
    return undefined
  }

  const selectedPath = selectedFolders[0].fsPath
  vscode.window.showInformationMessage(`Выбран каталог: ${selectedPath}`)

  createSpravochnikiDirectory()
    .then((spravochnikiPath) => {
      if (spravochnikiPath) {
        vscode.window.showInformationMessage(
          `Каталог "Справочники" создан: ${spravochnikiPath}`
        )
        // Обрабатываем каталоги из папки Catalogs
        processCatalogs(selectedPath, spravochnikiPath)
      }
    })
    .catch((error) => {
      vscode.window.showErrorMessage(
        `Ошибка при создании каталога "Справочники": ${error}`
      )
    })

  return selectedPath
}
