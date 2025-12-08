import * as vscode from "vscode"

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

  return selectedPath
}
