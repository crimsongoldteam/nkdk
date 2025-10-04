import * as vscode from "vscode"
import {
  xmlImport,
  importClientApplicationFormFromXML,
  ZClientApplicationFormXML,
  formatClientApplicationForm,
} from "../dist/nakidka-core.cjs.js"

/**
 * Provider for cat scratch editors.
 *
 * Cat scratch editors are used for `.cscratch` files.
 * When opened, they display the file content in a standard VS Code editor
 * with all '{' characters replaced with '['.
 */
export class CatScratchEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CatScratchEditorProvider(context)
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CatScratchEditorProvider.viewType,
      provider,
      {
        supportsMultipleEditorsPerDocument: false,
      }
    )
    return providerRegistration
  }

  private static readonly viewType = "catCustoms.catScratch"

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Открывает дополнительное окно с React App из библиотеки dist
   */
  private async openPageTsxWindow(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri

      if (!workspaceRoot) {
        vscode.window.showErrorMessage("Не удалось найти корневую папку рабочего пространства")
        return
      }

      // Создаем webview панель для отображения React App
      const panel = vscode.window.createWebviewPanel("pageTsxViewer", "React App Preview", vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true,
      })

      // Используем скрипт из расширения, а не из каталога проекта
      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, "out", "build", "nakidka-core.cjs.js")
      )

      // HTML содержимое с React App из библиотеки dist
      const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Просмотр формы</title>
    <script type="module" src="${scriptUri}"></script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`

      panel.webview.html = htmlContent

      // Показываем информационное сообщение
      vscode.window.showInformationMessage("Открыто дополнительное окно с React App из библиотеки nakidka-core")

      panel.webview.postMessage({ command: "refactor" })
    } catch (error) {
      vscode.window.showErrorMessage(`Ошибка при открытии дополнительного окна: ${error}`)
    }
  }

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const originalContent = document.getText()

    const xmlData = xmlImport(originalContent)
    const xmlForm = ZClientApplicationFormXML.parse((xmlData as any).Form)
    const form = importClientApplicationFormFromXML(xmlForm)

    const formattedContent = formatClientApplicationForm(form, {})

    // Создаем временный документ с трансформированным содержимым
    const tempDoc = await vscode.workspace.openTextDocument({
      content: formattedContent.join("\n"),
      language: "plaintext",
    })

    // Сохраняем ссылку на временный документ
    // this.tempDocuments.set(document.uri.toString(), tempDoc)

    // Открываем временный документ в стандартном редакторе VS Code
    await vscode.window.showTextDocument(tempDoc, {
      viewColumn: webviewPanel.viewColumn,
      preserveFocus: false,
    })

    // Открываем дополнительное окно с содержимым page.tsx
    await this.openPageTsxWindow()

    // Обработчик изменений во временном документе
    // const changeListener = vscode.workspace.onDidChangeTextDocument(async (e) => {
    //   if (e.document.uri.toString() === tempDoc.uri.toString() && !this.isUpdating) {
    //     this.isUpdating = true

    //     try {
    //       // Получаем измененное содержимое из временного документа
    //       const modifiedText = e.document.getText()

    //       // Обратная трансформация: заменяем '[' на '{'
    //       const originalText = modifiedText.replace(/\[/g, "{")

    //       // Создаем WorkspaceEdit для обновления исходного документа
    //       const edit = new vscode.WorkspaceEdit()
    //       const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length))
    //       edit.replace(document.uri, fullRange, originalText)

    //       // Применяем изменения
    //       const success = await vscode.workspace.applyEdit(edit)
    //       if (success) {
    //         // Сохраняем документ, чтобы убрать признак модификации
    //         await document.save()
    //       }
    //     } finally {
    //       this.isUpdating = false
    //     }
    //   }
    // })

    // Обработчик изменений в исходном документе
    // const documentChangeListener = vscode.workspace.onDidChangeTextDocument(async (e) => {
    //   if (e.document.uri.toString() === document.uri.toString() && !this.isUpdating) {
    //     this.isUpdating = true

    //     try {
    //       // Если исходный документ изменился, обновляем временный документ
    //       const newContent = e.document.getText().replace(/\{/g, "[")

    //       // Обновляем содержимое временного документа
    //       const tempEdit = new vscode.WorkspaceEdit()
    //       const tempFullRange = new vscode.Range(tempDoc.positionAt(0), tempDoc.positionAt(tempDoc.getText().length))
    //       tempEdit.replace(tempDoc.uri, tempFullRange, newContent)
    //       await vscode.workspace.applyEdit(tempEdit)

    //       // Сохраняем временный документ, чтобы убрать признак модификации
    //       await tempDoc.save()
    //     } finally {
    //       this.isUpdating = false
    //     }
    //   }
    // })

    // // Обработчик сохранения исходного документа
    // const saveListener = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
    //   if (savedDoc.uri.toString() === document.uri.toString() && !this.isUpdating) {
    //     this.isUpdating = true

    //     try {
    //       // Обновляем временный документ при сохранении исходного
    //       const newContent = savedDoc.getText().replace(/\{/g, "[")

    //       const tempEdit = new vscode.WorkspaceEdit()
    //       const tempFullRange = new vscode.Range(tempDoc.positionAt(0), tempDoc.positionAt(tempDoc.getText().length))
    //       tempEdit.replace(tempDoc.uri, tempFullRange, newContent)
    //       await vscode.workspace.applyEdit(tempEdit)
    //       await tempDoc.save()
    //     } finally {
    //       this.isUpdating = false
    //     }
    //   }
    // })

    // // Очистка при закрытии webview
    // webviewPanel.onDidDispose(() => {
    //   changeListener.dispose()
    //   documentChangeListener.dispose()
    //   saveListener.dispose()

    //   // Удаляем ссылку на временный документ
    //   this.tempDocuments.delete(document.uri.toString())
    // })
  }
}
