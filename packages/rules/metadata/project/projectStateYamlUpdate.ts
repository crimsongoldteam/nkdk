import {
  isolateProjectStateYamlUpdate,
  toProjectStateFileUpdate,
  type ProjectStateStructuredDocumentEntry,
  type ProjectStateTargetEntry,
  type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { expandMetadataPathPattern } from "../resourceTopology/core/patterns"
import { projectXmlExportAssignment } from "../resourceTopology/core/xmlExportProjection"
import { currentValidationRegistrySet } from "../validation/validationExecutionContext"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import type { ProjectValidationFirstPassResult } from "../validation/projectValidationPasses"

export interface ProjectStateYamlUpdateDescriptor {
  readonly componentPath: string
  readonly componentDir: string
  readonly rootProjectPath: string
  readonly projectPath: string
  readonly role: "configuration" | "properties" | "form"
  readonly indexContribution?: "isolated"
}

export interface BuildProjectStateYamlFileUpdateParams {
  readonly projectDir: string
  readonly descriptor: ProjectStateYamlUpdateDescriptor
  readonly firstPass: ProjectValidationFirstPassResult
  readonly fileBackedTargets?: readonly ProjectStateTargetEntry[]
}

export function buildProjectStateYamlFileUpdate(
  params: BuildProjectStateYamlFileUpdateParams,
): ProjectStateYamlFileUpdate {
  const { descriptor, firstPass } = params
  const projectedDataPathKeys = new Set(firstPass.structuredComponents
    ?.filter(({ componentKind }) => componentKind === "dataPath")
    .map(({ yamlPath }) => JSON.stringify(yamlPath)) ?? [])
  const components = firstPass.structuredComponents === undefined
    ? undefined
    : [
        ...firstPass.structuredComponents,
        ...(descriptor.indexContribution === "isolated" && firstPass.state.kind === "form"
          ? firstPass.state.pendingChecks.flatMap((check) => {
              if (check.kind !== "dataPath" || projectedDataPathKeys.has(JSON.stringify(check.yamlPath))) return []
              return [{
                componentKind: "dataPath" as const,
                name: check.value,
                yamlPath: check.yamlPath,
              }]
            })
          : []),
      ]
  const update = toProjectStateFileUpdate(firstPass, {
    projectPath: descriptor.rootProjectPath,
    componentPath: descriptor.componentPath,
    resourceKind: "yaml",
    yamlRole: descriptor.role,
  }, params.fileBackedTargets ?? [], [
    ...projectFormStructureDocuments({
      projectDir: params.projectDir,
      descriptor,
      components,
    }),
    ...(firstPass.structuredDocuments ?? []),
  ])

  return descriptor.indexContribution === "isolated"
    ? isolateProjectStateYamlUpdate(update)
    : update
}

export function projectFormStructureDocuments(params: {
  readonly projectDir: string
  readonly descriptor: ProjectStateYamlUpdateDescriptor
  readonly components: ProjectValidationFirstPassResult["structuredComponents"]
}): readonly ProjectStateStructuredDocumentEntry[] {
  if (params.components === undefined) return []
  const component = validationProjectComponentFromAddress(params.projectDir, params.descriptor)
  const match = classifyMetadataProjectPath(component.topology, params.descriptor.projectPath)
  if (match === undefined || match.assignment === undefined) return []
  const representation = match.kind === "yamlCompanion" ? "base" : "working"
  if (match.kind !== "content" && match.kind !== "yamlCompanion") return []
  const workingProjectPath = match.kind === "content"
    ? match.projectPath
    : expandMetadataPathPattern(match.assignment.projectPattern, match.values)
  const workingMatch = classifyMetadataProjectPath(component.topology, workingProjectPath)
  if (workingMatch === undefined || workingMatch.kind !== "content") return []
  const logicalAddress = projectXmlExportAssignment(component.topology, workingMatch).logicalAddress
  const projection = currentValidationRegistrySet<{
    form: { structureProjection?: import("../ruleRuntime/definition").MetadataFormStructureProjection }
  }>()?.form.structureProjection
  if (projection === undefined) throw new Error("Не зарегистрирована проекция структуры формы")
  return projection({
    components: params.components,
    representation,
    logicalAddress,
    workingProjectPath,
  })
}
