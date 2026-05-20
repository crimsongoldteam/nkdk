import {
  exportClientApplicationFormToEnterprise,
  type ClientApplicationFormEnterprise,
} from "@nakidka/core"
import { getFormFromCache } from "src/documentCache.js"
import * as vscode from "vscode"
import type { SseServerHandle } from "./sseServer.js"

type FormContext = Parameters<typeof exportClientApplicationFormToEnterprise>[0]

async function broadcastPayloadForDocument(
  document: vscode.TextDocument,
  sseServer: SseServerHandle | undefined
): Promise<void> {
  try {
    const payload = await getPayload(document)
    if (!payload) {
      return
    }
    sseServer?.broadcast(payload)
  } catch {
    // игнорируем: документ не YAML или ещё не распарсен
  }
}

export function registerDocumentChangeHandler(sseServer: SseServerHandle | undefined): vscode.Disposable {
  const changeDisposable = vscode.workspace.onDidChangeTextDocument(async (e) => {
    await broadcastPayloadForDocument(e.document, sseServer)
  })

  const openDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    await broadcastPayloadForDocument(document, sseServer)
  })

  const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor) {
      await broadcastPayloadForDocument(editor.document, sseServer)
    }
  })

  // при активации расширения отправить payload для уже открытого документа
  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor) {
    void broadcastPayloadForDocument(activeEditor.document, sseServer)
  }

  return vscode.Disposable.from(changeDisposable, openDisposable, activeEditorDisposable)
}

export async function getPayload(document: vscode.TextDocument): Promise<ClientApplicationFormEnterprise | undefined> {
  if (document.languageId !== "yaml") return undefined

  const formInfo = await getFormFromCache(document)
  if (!formInfo) {
    throw new Error("Не удалось импортировать форму из YAML")
  }

  const context: FormContext = {
    defaultLanguage: "ru",
    enterprise: {
      prefix: formInfo.prefix,
      attributes: {},
      elementsTree: [],
      allElementsNames: [],
    },
    version: "2.20",
  }

  const enterpriseForm = exportClientApplicationFormToEnterprise(context, formInfo.form)
  if (!enterpriseForm) {
    throw new Error("Не удалось экспортировать форму в Enterprise формат")
  }
  return enterpriseForm
}
