import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"
import { readFileSync } from "fs"
// Для использования библиотеки импорта раскомментируйте и настройте пути:
// import xmlImport from "../../lib/xml/import/importer";
// import { importClientApplicationFormFromXML } from "../../lib/metadata/forms/elements/clientApplicationForm/importFromXML";
// import { ZClientApplicationFormXML } from "../../lib";
// import * as z from "zod";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "nkdk.loadConfigFromXml",
    async () => {
      try {
        // Запрашиваем выбор каталога
        const selectedFolders = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: "Выбрать каталог",
          title: "Выберите каталог с XML файлами конфигурации",
        })

        if (!selectedFolders || selectedFolders.length === 0) {
          vscode.window.showInformationMessage(
            "Каталог не выбран. Операция отменена."
          )
          return
        }

        const selectedFolder = selectedFolders[0].fsPath

        // Проверяем, что каталог существует
        if (!fs.existsSync(selectedFolder)) {
          vscode.window.showErrorMessage(
            `Каталог не существует: ${selectedFolder}`
          )
          return
        }

        // Ищем XML файлы в каталоге
        const xmlFiles = findXmlFiles(selectedFolder)

        if (xmlFiles.length === 0) {
          vscode.window.showWarningMessage(
            `В каталоге ${selectedFolder} не найдено XML файлов.`
          )
          return
        }

        // Показываем информацию о найденных файлах
        const message = `Найдено XML файлов: ${xmlFiles.length}\n${xmlFiles
          .map((f) => path.basename(f))
          .join("\n")}`

        vscode.window.showInformationMessage(message)

        // Обрабатываем каждый XML файл
        for (const xmlFile of xmlFiles) {
          try {
            await processXmlFile(xmlFile)
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            vscode.window.showErrorMessage(
              `Ошибка при обработке файла ${path.basename(xmlFile)}: ${errorMessage}`
            )
          }
        }

        vscode.window.showInformationMessage(
          `Обработка завершена. Обработано файлов: ${xmlFiles.length}`
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        vscode.window.showErrorMessage(
          `Ошибка при загрузке конфигурации: ${errorMessage}`
        )
      }
    }
  )

  context.subscriptions.push(disposable)
}

/**
 * Рекурсивно находит все XML файлы в каталоге
 */
function findXmlFiles(dir: string): string[] {
  const xmlFiles: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Рекурсивно ищем в подкаталогах
      xmlFiles.push(...findXmlFiles(fullPath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml")) {
      xmlFiles.push(fullPath)
    }
  }

  return xmlFiles
}

/**
 * Обрабатывает XML файл
 */
async function processXmlFile(filePath: string): Promise<void> {
  try {
    // Читаем содержимое XML файла
    const xmlContent = readFileSync(filePath, "utf-8")

    // Для использования библиотеки импорта раскомментируйте следующий код:
    /*
    const importedXml = xmlImport<{ Form: TClientApplicationFormXML }>(
      xmlContent,
      z.object({ Form: ZClientApplicationFormXML })
    );
    const form = importClientApplicationFormFromXML(importedXml.Form);
    
    // Здесь можно выполнить дополнительные действия с импортированной формой
    // Например, сохранить в файл, отобразить в панели и т.д.
    */

    // Пока просто логируем информацию и открываем файл
    const fileName = path.basename(filePath)
    const outputChannel = vscode.window.createOutputChannel("Nakidka Core")
    outputChannel.appendLine(`Обработка файла: ${fileName}`)
    outputChannel.appendLine(`Размер файла: ${xmlContent.length} символов`)
    outputChannel.show()

    // Открываем файл в редакторе для просмотра
    const document = await vscode.workspace.openTextDocument(filePath)
    await vscode.window.showTextDocument(document)
  } catch (error) {
    throw new Error(
      `Не удалось обработать файл ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export function deactivate() {}
