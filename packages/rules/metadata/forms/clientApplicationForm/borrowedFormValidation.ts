import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type {
  ProjectStateStructuredDocumentFact,
  ProjectStateStructuredDocumentValidationParams,
} from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import { resolveProjectStateDataPathReferenceBatch } from "../../validation/projectStateDependencyValidation"
import { isRedundantClientApplicationBaseForm } from "./baseFormNecessity"
import { parseClientApplicationFormSemanticPayload } from "./formSemanticPayload"

const DOCUMENT_KIND = "clientApplicationForm"

export function validateBorrowedClientApplicationForms(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const facts = params.facts.filter(({ entry }) => entry.documentKind === DOCUMENT_KIND)
  const diagnostics: Diagnostic[] = []
  const workingGroups = groupFacts(facts.filter(({ entry }) => entry.representation === "working"))
  const baseGroups = groupFacts(facts.filter(({ entry }) => entry.representation === "base"))

  for (const extensionFacts of workingGroups.values()) {
    const first = extensionFacts[0]
    if (first === undefined || !first.componentPath.startsWith("cfe/")) continue
    const baseEntries = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: first.entry.logicalAddress,
    })
    diagnostics.push(...missingDiagnostics({
      required: baseEntries.filter(({ representation, componentKind }) =>
        representation === "working" && componentKind === "element"
      ),
      actual: extensionFacts.map(({ entry }) => entry),
      filePath: absolutePath(params.projectDir, first.projectPath),
      subject: "основной формы",
    }))
    const currentElementNames = new Set(baseEntries
      .filter(({ representation, componentKind }) => representation === "working" && componentKind === "element")
      .map(({ name }) => name))
    const currentElements = new Map(baseEntries
      .filter(({ representation, componentKind }) => representation === "working" && componentKind === "element")
      .map((entry) => [entry.name, entry]))
    const savedEntries = groupFactsByAddress(baseGroups, first.componentPath, first.entry.logicalAddress)
      .map(({ entry }) => entry)
    const savedElementNames = new Set(savedEntries
      .filter(({ componentKind }) => componentKind === "element")
      .map(({ name }) => name))
    const workingEntries = extensionFacts.map(({ entry }) => entry)
    const workingElements = new Map(workingEntries
      .filter(({ componentKind }) => componentKind === "element")
      .map((entry) => [entry.name, entry]))
    const effectiveMainAttribute = workingEntries.find(({ componentKind }) => componentKind === "mainAttribute")?.name ??
      baseEntries.find(({ representation, componentKind }) =>
        representation === "working" && componentKind === "mainAttribute"
      )?.name
    const effectivePaths = new Map<string, string | undefined>()
    const effectivePath = (entry: ProjectStateStructuredDocumentEntry): string | undefined => {
      if (effectivePaths.has(entry.name)) return effectivePaths.get(entry.name)
      const payload = formElementDataPathPayload(entry.payload)
      let value = payload?.primaryDataPath === "explicit" ? payload.value : undefined
      if (value === undefined && currentElementNames.has(entry.name)) {
        const current = currentElements.get(entry.name)
        const currentPayload = formElementDataPathPayload(current?.payload)
        value = currentPayload?.primaryDataPath === "explicit"
          ? currentPayload.value
          : effectiveMainAttribute === undefined ? undefined : `${effectiveMainAttribute}.${entry.name}`
      } else if (value === undefined && effectiveMainAttribute !== undefined) {
        value = `${effectiveMainAttribute}.${entry.name}`
      }
      effectivePaths.set(entry.name, value)
      return value
    }
    const candidate = (entry: ProjectStateStructuredDocumentEntry): string | undefined => {
      const payload = formElementDataPathPayload(entry.payload)
      if (payload?.tableOwnerName === undefined) {
        return effectiveMainAttribute === undefined ? undefined : `${effectiveMainAttribute}.${entry.name}`
      }
      const table = workingElements.get(payload.tableOwnerName) ?? currentElements.get(payload.tableOwnerName)
      const tablePath = table === undefined ? undefined : effectivePath(table)
      if (tablePath === undefined) return undefined
      const columnName = entry.name.startsWith(payload.tableOwnerName) && entry.name.length > payload.tableOwnerName.length
        ? entry.name.slice(payload.tableOwnerName.length)
        : entry.name
      return `${tablePath}.${columnName}`
    }
    const redundantCandidates: Array<{
      entry: ProjectStateStructuredDocumentEntry
      value: string
      owner: { readonly kind: string; readonly name: string }
    }> = []
    for (const entry of workingElements.values()) {
      const payload = formElementDataPathPayload(entry.payload)
      const borrowed = currentElementNames.has(entry.name) || savedElementNames.has(entry.name)
      if (borrowed && payload?.primaryDataPath === "empty") {
        diagnostics.push({
          filePath: absolutePath(params.projectDir, first.projectPath),
          line: 1,
          col: 1,
          severity: "error",
          source: "cross-file",
          message: `Пустой ПутьКДанным запрещён для заимствованного элемента «${entry.name}»`,
          path: yamlPointer([...entry.yamlPath, "ПутьКДанным"]),
        })
      }
      if (
        !borrowed &&
        payload?.primaryDataPath === "explicit" &&
        typeof payload.value === "string" &&
        payload.value === candidate(entry) &&
        payload.owner !== undefined
      ) {
        redundantCandidates.push({ entry, value: payload.value, owner: payload.owner })
      }
    }
    const resolvedRedundant = new Set(resolveProjectStateDataPathReferenceBatch({
      checks: redundantCandidates.map(({ entry, value, owner }, index) => ({
        requestId: String(index),
        componentPath: first.componentPath,
        projectPath: first.projectPath,
        check: {
          kind: "dataPath" as const,
          yamlPath: [...entry.yamlPath, "ПутьКДанным"],
          location: { line: 1, col: 1, path: yamlPointer([...entry.yamlPath, "ПутьКДанным"]) },
          owner,
          value,
          tagged: false,
          policyInput: { yaml: "ПутьКДанным" },
          policy: "formDataPath" as const,
        },
      })),
      projectDir: params.projectDir,
      queryPort: params.queryPort,
    }).map(({ requestId }) => requestId))
    redundantCandidates.forEach(({ entry }, index) => {
      if (!resolvedRedundant.has(String(index))) return
      diagnostics.push({
        filePath: absolutePath(params.projectDir, first.projectPath),
        line: 1,
        col: 1,
        severity: "error",
        source: "cross-file",
        message: `Вычисляемый ПутьКДанным собственного элемента «${entry.name}» не нужно указывать явно`,
        path: yamlPointer([...entry.yamlPath, "ПутьКДанным"]),
      })
    })
    for (const name of savedElementNames) {
      if (currentElementNames.has(name)) continue
      diagnostics.push({
        filePath: absolutePath(params.projectDir, first.projectPath),
        line: 1,
        col: 1,
        severity: "warning",
        source: "cross-file",
        message: `Заимствованный элемент «${name}» из сохранённой основы отсутствует в текущей форме cf`,
      })
    }
  }

  for (const baseFacts of baseGroups.values()) {
    const first = baseFacts[0]
    if (first === undefined || !first.componentPath.startsWith("cfe/")) continue
    const working = groupFactsByAddress(workingGroups, first.componentPath, first.entry.logicalAddress)
    diagnostics.push(...missingDiagnostics({
      required: baseFacts.map(({ entry }) => entry).filter(({ componentKind }) =>
        ["element", "attribute", "command", "parameter"].includes(componentKind)
      ),
      actual: working.map(({ entry }) => entry),
      filePath: absolutePath(params.projectDir, first.projectPath),
      subject: "сохранённой основы",
      useRequiredPath: true,
    }))
    diagnostics.push(...baseDataPathDiagnostics({
      facts: baseFacts,
      filePath: absolutePath(params.projectDir, first.projectPath),
    }))
    const current = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: first.entry.logicalAddress,
    })
    const currentYaml = semanticDocumentYaml(current)
    const workingYaml = semanticDocumentYaml(working.map(({ entry }) => entry))
    const savedYaml = semanticDocumentYaml(baseFacts.map(({ entry }) => entry))
    if (
      currentYaml !== undefined
      && workingYaml !== undefined
      && savedYaml !== undefined
      && isRedundantClientApplicationBaseForm({
        currentConfigurationYaml: currentYaml,
        extensionYaml: workingYaml,
        savedBaseYaml: savedYaml,
      })
    ) {
      diagnostics.push({
        filePath: absolutePath(params.projectDir, first.projectPath),
        line: 1,
        col: 1,
        severity: "error",
        source: "cross-file",
        message: "БазоваяФорма.yaml избыточна: основа полностью восстанавливается из основной конфигурации и рабочей формы расширения",
        path: "/",
      })
    }
  }
  return diagnostics
}

function semanticDocumentYaml(entries: readonly ProjectStateStructuredDocumentEntry[]) {
  return parseClientApplicationFormSemanticPayload(
    entries.find(({ componentKind }) => componentKind === "document")?.payload,
  )
}

function formElementDataPathPayload(value: string | undefined): {
  readonly version: 1
  readonly primaryDataPath: "missing" | "empty" | "explicit"
  readonly value?: string
  readonly tableOwnerName?: string
  readonly owner?: { readonly kind: string; readonly name: string }
} | undefined {
  if (value === undefined) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return parsed.version === 1 &&
      (parsed.primaryDataPath === "missing" || parsed.primaryDataPath === "empty" || parsed.primaryDataPath === "explicit")
      ? parsed as ReturnType<typeof formElementDataPathPayload>
      : undefined
  } catch {
    return undefined
  }
}

function baseDataPathDiagnostics(params: {
  readonly facts: readonly ProjectStateStructuredDocumentFact[]
  readonly filePath: string
}): readonly Diagnostic[] {
  const attributes = new Set(params.facts
    .filter(({ entry }) => entry.componentKind === "attribute")
    .map(({ entry }) => entry.name))
  return params.facts
    .filter(({ entry }) => entry.componentKind === "dataPath")
    .flatMap(({ entry }) => {
      const root = entry.name.trim().split(".")[0]
      if (root === undefined || attributes.has(root) || root === "Элементы" || root === "ТекущиеДанные") return []
      return [{
        filePath: params.filePath,
        line: 1,
        col: 1,
        severity: "error" as const,
        source: "structure" as const,
        message: `ПутьКДанным «${entry.name}»: корень «${root}» не объявлен в реквизитах сохранённой основы`,
        path: yamlPointer(entry.yamlPath),
      }]
    })
}

function groupFacts(facts: readonly ProjectStateStructuredDocumentFact[]) {
  const groups = new Map<string, ProjectStateStructuredDocumentFact[]>()
  for (const fact of facts) {
    const key = `${fact.componentPath}\u0000${fact.entry.logicalAddress}`
    const group = groups.get(key) ?? []
    group.push(fact)
    groups.set(key, group)
  }
  return groups
}

function groupFactsByAddress(
  groups: ReadonlyMap<string, readonly ProjectStateStructuredDocumentFact[]>,
  componentPath: string,
  logicalAddress: string,
): readonly ProjectStateStructuredDocumentFact[] {
  return groups.get(`${componentPath}\u0000${logicalAddress}`) ?? []
}

function missingDiagnostics(params: {
  readonly required: readonly ProjectStateStructuredDocumentEntry[]
  readonly actual: readonly ProjectStateStructuredDocumentEntry[]
  readonly filePath: string
  readonly subject: string
  readonly useRequiredPath?: boolean
}): readonly Diagnostic[] {
  const actual = new Set(params.actual.map(componentKey))
  return params.required
    .filter((entry) => !actual.has(componentKey(entry)))
    .map((entry) => ({
      filePath: params.filePath,
      line: 1,
      col: 1,
      severity: "warning" as const,
      source: "cross-file" as const,
      message: `В рабочей форме отсутствует ${componentLabel(entry.componentKind)} ${params.subject} «${entry.name}»`,
      ...(params.useRequiredPath ? { path: yamlPointer(entry.yamlPath) } : {}),
    }))
}

function componentKey(entry: ProjectStateStructuredDocumentEntry): string {
  return `${entry.componentKind}\u0000${entry.name}`
}

function componentLabel(kind: string): string {
  return ({ element: "элемент", attribute: "реквизит", command: "команда", parameter: "параметр" } as const)[
    kind as "element" | "attribute" | "command" | "parameter"
  ] ?? "компонент"
}

function yamlPointer(path: readonly (string | number)[]): string {
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}

function absolutePath(projectDir: string, projectPath: string): string {
  return join(projectDir, ...projectPath.split("/"))
}
