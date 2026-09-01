import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import { dataPathRootName } from "../../validation/dataPath/coreResolver"
import { resolveProjectStateDataPathReferenceResultBatch } from "../../validation/projectStateDependencyValidation"
import type { ProjectStateQueryPort } from "../../projectState/contracts/dependencyValidation"

export interface BorrowedFormDataPathCheck {
  readonly value: string
  readonly yamlPath: readonly (string | number)[]
  readonly owner: { readonly kind: string; readonly name: string }
  readonly mode: "explicit" | "implicit-own"
}

export function collectBorrowedFormDataPathChecks(params: {
  readonly workingEntries: readonly ProjectStateStructuredDocumentEntry[]
  readonly currentEntries: readonly ProjectStateStructuredDocumentEntry[]
}): readonly BorrowedFormDataPathCheck[] {
  const checks: BorrowedFormDataPathCheck[] = []
  const seen = new Set<string>()
  const currentElementNames = new Set(params.currentEntries
    .filter(({ componentKind }) => componentKind === "element")
    .map(({ name }) => name))
  const workingElements = new Map(params.workingEntries
    .filter(({ componentKind }) => componentKind === "element")
    .map((entry) => [entry.name, entry]))
  const currentElements = new Map(params.currentEntries
    .filter(({ componentKind }) => componentKind === "element")
    .map((entry) => [entry.name, entry]))
  const mainAttribute = params.workingEntries.find(({ componentKind }) => componentKind === "mainAttribute")?.name
    ?? params.currentEntries.find(({ componentKind }) => componentKind === "mainAttribute")?.name
  const effectivePaths = new Map<string, string | undefined>()

  const accept = (check: BorrowedFormDataPathCheck) => {
    const key = `${JSON.stringify(check.yamlPath)}\u0000${check.value}`
    if (seen.has(key)) return
    seen.add(key)
    checks.push(check)
  }

  for (const entry of params.workingEntries) {
    if (entry.componentKind !== "dataPath") continue
    const payload = dataPathPayload(entry.payload)
    if (payload?.owner === undefined) continue
    accept({
      value: entry.name,
      yamlPath: entry.yamlPath,
      owner: payload.owner,
      mode: "explicit",
    })
  }

  const effectivePath = (entry: ProjectStateStructuredDocumentEntry): string | undefined => {
    if (effectivePaths.has(entry.name)) return effectivePaths.get(entry.name)
    const payload = elementPayload(entry.payload)
    let value = payload?.primaryDataPath === "explicit" ? payload.value : undefined
    if (value === undefined && currentElementNames.has(entry.name)) {
      const currentPayload = elementPayload(currentElements.get(entry.name)?.payload)
      value = currentPayload?.primaryDataPath === "explicit"
        ? currentPayload.value
        : mainAttribute === undefined ? undefined : `${mainAttribute}.${entry.name}`
    } else if (value === undefined && mainAttribute !== undefined) {
      value = `${mainAttribute}.${entry.name}`
    }
    effectivePaths.set(entry.name, value)
    return value
  }

  for (const entry of workingElements.values()) {
    if (currentElementNames.has(entry.name)) continue
    const payload = elementPayload(entry.payload)
    if (payload?.primaryDataPath !== "missing" || payload.owner === undefined) continue
    let value: string | undefined
    if (payload.tableOwnerName === undefined) {
      value = mainAttribute === undefined ? undefined : `${mainAttribute}.${entry.name}`
    } else {
      const table = workingElements.get(payload.tableOwnerName) ?? currentElements.get(payload.tableOwnerName)
      const tablePath = table === undefined ? undefined : effectivePath(table)
      const columnName = entry.name.startsWith(payload.tableOwnerName) && entry.name.length > payload.tableOwnerName.length
        ? entry.name.slice(payload.tableOwnerName.length)
        : entry.name
      value = tablePath === undefined ? undefined : `${tablePath}.${columnName}`
    }
    if (value === undefined) continue
    accept({
      value,
      yamlPath: [...entry.yamlPath, "ПутьКДанным"],
      owner: payload.owner,
      mode: "implicit-own",
    })
  }
  return checks
}

export function missingBorrowedFormRootDiagnostics(params: {
  readonly checks: readonly BorrowedFormDataPathCheck[]
  readonly workingEntries: readonly ProjectStateStructuredDocumentEntry[]
  readonly currentEntries: readonly ProjectStateStructuredDocumentEntry[]
  readonly filePath: string
}): readonly Diagnostic[] {
  const workingAttributes = new Set(params.workingEntries
    .filter(({ componentKind }) => componentKind === "attribute")
    .map(({ name }) => name))
  const currentAttributes = new Set(params.currentEntries
    .filter(({ componentKind }) => componentKind === "attribute")
    .map(({ name }) => name))
  return params.checks.flatMap((check) => {
    const root = dataPathRootName(check.value)
    if (
      root === "Элементы"
      || root === "ТекущиеДанные"
      || workingAttributes.has(root)
      || !currentAttributes.has(root)
    ) return []
    return [{
      filePath: params.filePath,
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "cross-file" as const,
      path: yamlPointer(check.yamlPath),
      message: `Путь «${check.value}» использует реквизит формы «${root}», который не добавлен в «Реквизиты» заимствованной формы`,
    }]
  })
}

export function unavailableBorrowedFormSegmentDiagnostics(params: {
  readonly checks: readonly BorrowedFormDataPathCheck[]
  readonly workingEntries: readonly ProjectStateStructuredDocumentEntry[]
  readonly componentPath: string
  readonly projectPath: string
  readonly filePath: string
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readDependencyInputs" | "readDependencyOwnerInputs">
}): readonly Diagnostic[] {
  const workingAttributes = new Set(params.workingEntries
    .filter(({ componentKind }) => componentKind === "attribute")
    .map(({ name }) => name))
  const eligible = params.checks.filter((check) => workingAttributes.has(dataPathRootName(check.value)))
  const results = resolveProjectStateDataPathReferenceResultBatch({
    checks: eligible.map((check, index) => ({
      requestId: String(index),
      componentPath: params.componentPath,
      projectPath: params.projectPath,
      check: {
        kind: "dataPath" as const,
        yamlPath: check.yamlPath,
        location: { line: 1, col: 1, path: yamlPointer(check.yamlPath) },
        owner: check.owner,
        value: check.value,
        policyInput: { yaml: String(check.yamlPath.at(-1) ?? "ПутьКДанным") },
        policy: "formDataPath" as const,
      },
    })),
    projectDir: params.projectDir,
    queryPort: params.queryPort,
  })
  return results.flatMap(({ requestId, resolution }) => {
    if (resolution.status !== "error" || resolution.failedSegmentIndex === undefined) return []
    const check = eligible[Number(requestId)]
    const segment = resolution.segments[resolution.failedSegmentIndex]
    if (check === undefined || segment === undefined) return []
    return [{
      filePath: params.filePath,
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "cross-file" as const,
      path: yamlPointer(check.yamlPath),
      message: `Путь «${check.value}» обращается к реквизиту «${segment}», который недоступен в компоненте расширения`,
    }]
  })
}

interface ElementPayloadV1 {
  readonly version: 1
  readonly primaryDataPath: "missing" | "empty" | "explicit"
  readonly value?: string
  readonly tableOwnerName?: string
  readonly owner?: { readonly kind: string; readonly name: string }
}

interface DataPathPayloadV1 {
  readonly version: 1
  readonly mode: "explicit"
  readonly owner?: { readonly kind: string; readonly name: string }
}

function elementPayload(value: string | undefined): ElementPayloadV1 | undefined {
  const parsed = parsePayload(value)
  return parsed?.version === 1
    && (parsed.primaryDataPath === "missing" || parsed.primaryDataPath === "empty" || parsed.primaryDataPath === "explicit")
    ? parsed as unknown as ElementPayloadV1
    : undefined
}

function dataPathPayload(value: string | undefined): DataPathPayloadV1 | undefined {
  const parsed = parsePayload(value)
  return parsed?.version === 1 && parsed.mode === "explicit"
    ? parsed as unknown as DataPathPayloadV1
    : undefined
}

function parsePayload(value: string | undefined): Record<string, unknown> | undefined {
  if (value === undefined) return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function yamlPointer(path: readonly (string | number)[]): string {
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}
