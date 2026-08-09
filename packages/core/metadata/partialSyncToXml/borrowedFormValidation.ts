import fs from "node:fs"
import { join } from "node:path"
import { hashFileBytes } from "../configurationIndex/hash"
import type { Diagnostic } from "../diagnostics/types"
import { validateBaseFormCompatibility } from "../forms/clientApplicationForm/baseFormCompatibility"
import type { FullXmlSyncProfileRuntime } from "../fullSyncToXml/componentProfile"
import type { ConfirmedComponentState } from "../project/componentState/types"
import { prepareYamlFiles } from "../project/prepareYamlFiles"

export async function validateBorrowedExtensionForms(params: {
  readonly runtime: FullXmlSyncProfileRuntime
}): Promise<readonly Diagnostic[]> {
  if (params.runtime.kind !== "configurationExtension") return []
  const base = params.runtime.base
  if (base === undefined) throw new Error("Валидация заимствованных форм не получила состояние cf")
  const diagnostics: Diagnostic[] = []
  for (const borrowed of params.runtime.borrowedForms ?? []) {
    const extension = await readPreparedForm(
      params.runtime.target,
      borrowed.extensionProjectPath,
      diagnostics,
    )
    const baseForm = await readPreparedForm(base, borrowed.baseProjectPath, diagnostics)
    if (extension === undefined || baseForm === undefined) continue
    diagnostics.push(...validateBaseFormCompatibility({
      base: baseForm,
      extension,
      extensionFilePath: absoluteProjectPath(
        params.runtime.target,
        borrowed.extensionProjectPath,
      ),
    }))
  }
  return diagnostics
}

async function readPreparedForm(
  state: ConfirmedComponentState,
  projectPath: string,
  diagnostics: Diagnostic[],
): Promise<unknown | undefined> {
  const sourcePath = absoluteProjectPath(state, projectPath)
  const expectedHash = state.hashes.projectFiles.find((file) => file.projectPath === projectPath)?.contentHash
  if (expectedHash === undefined) {
    diagnostics.push(errorDiagnostic(sourcePath, `Для заимствованной формы отсутствует подтверждённый хэш: ${projectPath}`))
    return undefined
  }
  const bytes = await fs.promises.readFile(sourcePath)
  if (hashFileBytes(bytes) !== expectedHash) {
    diagnostics.push(errorDiagnostic(sourcePath, `YAML-форма изменена после получения хэшей: ${projectPath}`))
    return undefined
  }
  const resource = state.structure.resources.find((candidate) =>
    candidate.kind === "content" && candidate.projectPath === projectPath
  )
  if (resource?.assignment === undefined || resource.rule?.itemType !== "ClientApplicationForm") {
    diagnostics.push(errorDiagnostic(sourcePath, `Путь не является YAML-формой: ${projectPath}`))
    return undefined
  }
  const prepared = prepareYamlFiles({
    files: [{
      projectPath,
      filePath: sourcePath,
      role: "form",
      owner: ownerFromPath(projectPath),
      itemType: resource.assignment.itemRule.itemType,
    }],
    itemTypeByYamlDir: {},
    sourceBytes: new Map([[sourcePath, bytes]]),
  })
  diagnostics.push(...prepared.diagnostics)
  const file = prepared.yamlFiles[0]
  if (file === undefined) return undefined
  diagnostics.push(...file.syntaxDiagnostics)
  return file.syntaxDiagnostics.some(({ severity }) => severity === "error") ? undefined : file.data
}

function absoluteProjectPath(state: ConfirmedComponentState, projectPath: string): string {
  return join(state.structure.componentDir, ...projectPath.split("/"))
}

function ownerFromPath(projectPath: string): { dir: string; name: string } {
  const segments = projectPath.split("/")
  return { dir: segments[0] ?? "", name: segments[1] ?? "" }
}

function errorDiagnostic(filePath: string, message: string): Diagnostic {
  return { filePath, line: 1, col: 1, severity: "error", source: "cross-file", message }
}
