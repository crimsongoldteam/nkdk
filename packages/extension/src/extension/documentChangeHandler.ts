import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import * as vscode from "vscode"
import {
  exportClientApplicationFormToEnterprise,
  importClientApplicationFromFromNKDK,
  type ClientApplicationFormEnterprise,
} from "@nakidka/core"
import type { SseServerHandle } from "./sseServer.js"

const nkdkServices = createNkdkServices(EmptyFileSystem)
const parseNkdk = parseHelper<NkdkForm>(nkdkServices.Nkdk)

const minimalContext = {
  defaultLanguage: "ru",
  preview: { prefix: "", attributes: {} as Record<string, { name: string; parentPath?: string; title?: string; type: string }> },
}

export function registerDocumentChangeHandler(sseServer: SseServerHandle | undefined): vscode.Disposable {
  return vscode.workspace.onDidChangeTextDocument((e) => {
    sseServer?.broadcast(e.document.getText())
  })
}

export async function getPayload(document: vscode.TextDocument): Promise<ClientApplicationFormEnterprise> {
  const nkdkString = document.getText()
  const doc = await parseNkdk(nkdkString)
  const nkdkAst = doc.parseResult?.value
  if (doc.parseResult.parserErrors.length > 0 || !nkdkAst) {
    throw new Error("Ошибка разбора NKDK")
  }
  const form = importClientApplicationFromFromNKDK({ context: minimalContext, value: nkdkAst })
  if (!form) {
    throw new Error("Не удалось импортировать форму из NKDK")
  }
  return exportClientApplicationFormToEnterprise(minimalContext, form)
}
