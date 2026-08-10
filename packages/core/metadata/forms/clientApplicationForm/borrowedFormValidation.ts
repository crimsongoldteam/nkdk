import { join } from "node:path"
import type { Diagnostic } from "../../diagnostics/types"
import type {
  ProjectStateStructuredDocumentFact,
  ProjectStateStructuredDocumentValidationParams,
} from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"

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
  }
  return diagnostics
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
      severity: "error" as const,
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
