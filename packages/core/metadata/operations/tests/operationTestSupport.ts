import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createTestProjectStateReadToken } from "../../projectState/tests/readToken"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../../diagnostics/collection"
import type { ProjectReferenceLocation } from "../../projectState/readSession"
import type { ProjectStateReadSession } from "../../projectState/readSession"
import { missingProjectFileMetadataTargetReferences } from "../../projectState/tests/readSession"
import type { ProjectStateService } from "../../projectState/service"
import type { Diagnostic } from "../../validation/types"
import { runProjectQuery } from "../../workerPool/projectQueries"

export const operationValidationError = {
  filePath: "cf/Справочник/Товары/Свойства.yaml",
  line: 1,
  col: 1,
  severity: "error",
  source: "structure",
  message: "Ошибка validation",
} as const satisfies Diagnostic

export const operationLockFieldYaml = [
  "ПоляБлокировкиДанных:",
  "  - Реквизит.Артикул",
  "Реквизиты:",
  "  Артикул:",
  "    Тип: Строка",
]

export const operationPictureFormYaml = [
  "Реквизиты:",
  "  ИндексКартинки:",
  "    Тип: Число",
  "Элементы:",
  "  Картинка:",
  "    Вид: ПолеРисунка",
  "    КартинкаЗначений: ОбщаяКартинка.Состояния",
  "    ПутьКДанным: ИндексКартинки",
]

export const operationDataPathFormYaml = [
  "Реквизиты:",
  "  Объект:",
  "    Тип: Справочник.Товары",
  "Элементы:",
  "  Артикул:",
  "    Вид: ПолеВвода",
  "    ПутьКДанным: Объект.Артикул",
]

export function createOperationTestProjectHarness(prefix: string) {
  const tempDirs: string[] = []
  let index: OperationTestIndex = {}
  const projectState = completeOperationProjectState({
    async refreshAndValidate() {
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics(index.diagnostics ?? []),
        readToken: createTestProjectStateReadToken(),
        stats: emptyOperationRefreshStats(),
      }
    },
    openReadSession() {
      const session = completeOperationReadSession({
        resolveTargets(requests) {
          return requests.map(({ requestId, canonicalTarget }) => {
            const projectPath = index.targetProjectPath ?? operationTargetProjectPath(canonicalTarget)
            const inferred = operationFileBackedPaths(canonicalTarget, projectPath)
            const fileBacked = inferred === undefined ? undefined : {
              itemProjectPath: index.itemProjectPath ?? inferred.itemProjectPath,
              ownerProjectPath: index.ownerProjectPath ?? inferred.ownerProjectPath,
            }
            return {
              requestId,
              status: "found" as const,
              target: { kind: fileBacked === undefined ? "object" as const : "member" as const, canonical: canonicalTarget },
              source: { projectPath, componentPath: "cf", ...fileBacked },
            }
          })
        },
        findReferences(requests) {
          return requests.map(({ requestId }) => ({ requestId, references: index.references ?? [] }))
        },
      })
      return {
        ...session,
        readComponentTargetPage() {
          return { entries: (index.collectionNames ?? []).map((name) => ({
            logicalAddress: `${index.collectionCanonicalPrefix}.${name}`,
            sourceProjectPath: "ignored",
          })) }
        },
      }
    },
  })
  return {
    projectState,
    setIndex(next: OperationTestIndex) { index = next },
    createProject() {
      const dir = mkdtempSync(join(tmpdir(), prefix))
      tempDirs.push(dir)
      return dir
    },
    writeProjectFile(projectDir: string, projectPath: string, lines: string | string[]) {
      const rootedPath = projectPath.startsWith("cf/") ? projectPath : `cf/${projectPath}`
      const filePath = join(projectDir, ...rootedPath.split("/"))
      mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(filePath, Array.isArray(lines) ? lines.join("\n") : lines)
      return filePath
    },
    cleanup() {
      index = {}
      for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
    },
    async close() {
      await projectState.close()
    },
  }
}

export interface OperationTestIndex {
  readonly targetProjectPath?: string
  readonly itemProjectPath?: string
  readonly ownerProjectPath?: string
  readonly references?: readonly ProjectReferenceLocation[]
  readonly diagnostics?: readonly Diagnostic[]
  readonly collectionCanonicalPrefix?: string
  readonly collectionNames?: readonly string[]
}

function operationTargetProjectPath(canonical: string): string {
  const [root, objectName, memberKind, memberName] = canonical.split(".")
  const yamlDir = root === "Catalog"
    ? "Справочник"
    : root === "Document"
      ? "Документ"
      : root === "CommonPicture"
        ? "ОбщаяКартинка"
        : root
  if (memberKind === "Form" && memberName !== undefined) {
    return `cf/${yamlDir}/${objectName}/Формы/${memberName}/Форма.yaml`
  }
  return `cf/${yamlDir}/${objectName}/Свойства.yaml`
}

function operationFileBackedPaths(
  canonical: string,
  projectPath: string,
): { readonly itemProjectPath: string; readonly ownerProjectPath: string } | undefined {
  const [root, objectName, memberKind] = canonical.split(".")
  if (memberKind !== "Form" && memberKind !== "Template") return undefined
  const yamlDir = root === "Catalog"
    ? "Справочник"
    : root === "Document"
      ? "Документ"
      : root === "Report"
        ? "Отчет"
        : root
  return {
    itemProjectPath: projectPath.split("/").slice(0, -1).join("/"),
    ownerProjectPath: `cf/${yamlDir}/${objectName}/Свойства.yaml`,
  }
}

export function completeOperationReadSession(
  overrides: Pick<ProjectStateReadSession, "resolveTargets" | "findReferences">,
): ProjectStateReadSession {
  return {
    ...overrides,
    readOwners: () => [],
    readDependencyInputs: () => [],
    readDependencyOwnerInputs: () => [],
    readOwnerRefPage: () => ({ refs: [] }),
    readComponentTargetPage: () => ({ entries: [] }),
    readValidationStatus: () => [],
    readFileMetadataTargetReferences: missingProjectFileMetadataTargetReferences,
    close() {},
  }
}

export function operationTargetReadSession(params: {
  readonly canonical: string
  readonly projectPath: string
  readonly onRead: () => void
}): ProjectStateReadSession {
  return completeOperationReadSession({
    resolveTargets() {
      params.onRead()
      return [{
        requestId: "target",
        status: "found",
        target: { kind: "object", canonical: params.canonical },
        source: { projectPath: params.projectPath, componentPath: "cf" },
      }]
    },
    findReferences() {
      return [{ requestId: "references", references: [] }]
    },
  })
}

export function operationMetadataReference(
  projectPath: string,
  yamlPath: readonly (string | number)[],
  canonical: string,
): ProjectReferenceLocation {
  return { kind: "metadataTarget", projectPath, componentPath: "cf", yamlPath, canonical }
}

export function operationDataPathReference(): ProjectReferenceLocation {
  return {
    kind: "dataPath",
    projectPath: "cf/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    componentPath: "cf",
    yamlPath: ["Элементы", "Артикул", "ПутьКДанным"],
    value: "Объект.Артикул",
    resolvedSegments: ["Объект", "Артикул"],
    segmentIndex: 1,
  }
}

export function completeOperationProjectState(
  overrides: Pick<ProjectStateService, "refreshAndValidate" | "openReadSession">,
): ProjectStateService {
  return {
    ...overrides,
    workers: {
      async beginOperation({ id, concurrency }) {
        return {
          id,
          concurrency,
          async run(_workerIndex, command) {
            if (command.kind !== "projectQuery") throw new Error("unexpected metadata worker operation")
            const session = overrides.openReadSession(createTestProjectStateReadToken())
            try {
              return runProjectQuery(command.command, session)
            } finally {
              session.close()
            }
          },
          async finish() {},
        }
      },
      async installProjectState() {},
      async clearProjectState() {},
      size: () => 1,
      async close() {},
    },
    async beginImport() { throw new Error("unexpected beginImport") },
    async createReadToken() { throw new Error("unexpected createReadToken") },
    async readComponentProjection() { throw new Error("unexpected readComponentProjection") },
    async reset() {},
    async rebuild() { throw new Error("unexpected rebuild") },
    async close() {},
  }
}

export function emptyOperationRefreshStats() {
  return { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 }
}
