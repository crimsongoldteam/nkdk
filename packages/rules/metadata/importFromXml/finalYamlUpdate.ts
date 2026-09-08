import type { ConfigurationContext } from "@nkdk/runtime"
import type { ValidationProjectFile } from "../validation/projectFiles"
import { objectTargetForProjectFile } from "../validation/addressableMetadataTargets"
import { buildMemberIndexEntries, languageValidationDependency } from "../validation/projectValidationPasses"
import { projectFormStructureDocuments } from "../project/projectStateYamlUpdate"
import {
  projectStateFieldEntries, projectStateFormEntries, projectStateOwnerFacts,
  projectStatePendingCheck, projectStateTargetEntry,
  isolateProjectStateYamlUpdate,
  type ProjectStateLocalValidationResult, type ProjectStateTargetEntry, type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import type { createFinalBoundaryReferences } from "./finalBoundaryReferences"

/** Публикует готовые факты; не запускает rules, схему или поиск ссылок по YAML. */
export function buildFinalImportYamlUpdate(params: {
  readonly projectDir: string
  readonly file: ValidationProjectFile
  readonly context: ConfigurationContext
  readonly yaml: unknown
  readonly facts: ReturnType<ReturnType<typeof createFinalBoundaryReferences>["finish"]>
  readonly localValidation: ProjectStateLocalValidationResult
  readonly fileBackedTargets: readonly ProjectStateTargetEntry[]
  readonly isolated?: true
}): ProjectStateYamlFileUpdate {
  const { file, facts } = params
  const owner = facts.ownerMetadata
  const members = owner === undefined ? [] : buildMemberIndexEntries({
    projectDir: params.projectDir, owner: owner.owner,
    objectTarget: file.kind === "form" ? undefined : objectTargetForProjectFile(file), rawYaml: params.yaml,
  })
  const targets = [
    ...facts.objectIndexEntries.map(entry => projectStateTargetEntry("object", entry)),
    ...members.map(entry => projectStateTargetEntry("member", entry)),
    ...params.fileBackedTargets,
  ]
  const indexed = new Set(targets.map(target => target.canonical))
  const update: ProjectStateYamlFileUpdate = {
    kind: "yaml", projectPath: file.rootProjectPath, componentPath: file.componentPath,
    resourceKind: "yaml", yamlRole: file.kind, localValidation: params.localValidation,
    targets: [...targets, ...facts.logicalAddresses.filter(entry => !indexed.has(entry.logicalAddress))
      .map(entry => ({ kind: "object" as const, canonical: entry.logicalAddress }))],
    owners: owner === undefined ? [] : projectStateOwnerFacts({ ownerFacts: owner.ownerFacts }),
    fields: owner === undefined ? [] : projectStateFieldEntries({ ownerFacts: owner.ownerFacts, fieldIndex: owner.fieldIndex }),
    forms: projectStateFormEntries(facts.formIndex === undefined ? undefined : {
      owner: { kind: file.owner.dir, name: file.owner.name }, index: facts.formIndex,
    }),
    ...(file.kind !== "form" ? {} : { structuredDocuments: projectFormStructureDocuments({
      projectDir: params.projectDir, descriptor: {
        componentPath: file.componentPath, componentDir: file.componentDir,
        rootProjectPath: file.rootProjectPath, projectPath: file.projectPath, role: file.kind,
      }, components: facts.structuredComponents,
    }) }),
    ...languageValidationDependency(facts.localizedTextProperties, params.context),
    pendingReferences: facts.references.map(({ filePath: _filePath, ...reference }) => reference),
    pendingChecks: facts.checks.map(projectStatePendingCheck),
    dependencies: file.kind === "form" ? facts.dependencies : [],
  }
  return params.isolated === true ? isolateProjectStateYamlUpdate(update) : update
}
