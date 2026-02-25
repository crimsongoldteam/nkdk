import {
  exportClientApplicationFormToEnterprise,
  importClientApplicationFromFromNKDK,
  type ClientApplicationFormEnterprise,
} from "@nakidka/core"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import * as vscode from "vscode"
import type { SseServerHandle } from "./sseServer.js"

const nkdkServices = createNkdkServices(EmptyFileSystem)
const parseNkdk = parseHelper<NkdkForm>(nkdkServices.Nkdk)

type FormContext = Parameters<typeof importClientApplicationFromFromNKDK>[0]["context"]

export function registerDocumentChangeHandler(sseServer: SseServerHandle | undefined): vscode.Disposable {
  return vscode.workspace.onDidChangeTextDocument(async (e) => {
    const payload = await getPayload(e.document)
    if (!payload) {
      throw new Error("Не удалось получить payload")
    }
    sseServer?.broadcast(payload)
  })
}

export async function getPayload(document: vscode.TextDocument): Promise<ClientApplicationFormEnterprise> {
  const minimalContext: FormContext = {
    defaultLanguage: "ru",
    preview: {
      prefix: "р_",
      attributes: {},
    },
  }
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
  const enterpriseForm = exportClientApplicationFormToEnterprise(minimalContext, form)
  if (!enterpriseForm) {
    throw new Error("Не удалось экспортировать форму в Enterprise формат")
  }
  return enterpriseForm
}
