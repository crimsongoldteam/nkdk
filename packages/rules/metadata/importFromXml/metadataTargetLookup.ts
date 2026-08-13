import type { MetadataRootName } from "@nkdk/runtime/rule-kit"
import type { ProjectStateQueryPort } from "../projectState/contracts/dependencyValidation"
import { parseMetadataTargetFromModel } from "../ruleRuntime/metadataTarget"
import type { ProjectReferenceValueContributor } from "../validation/projectReferenceIndexRegistry"
import { resolveProjectValueTargets } from "../validation/projectReferenceValueResolver"

export type ImportedMetadataTargetStatus = "found" | "missing" | "ambiguous"

export function resolveImportedMetadataTargetStatus(params: {
  readonly canonical: string
  readonly componentPath: string
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "resolveTargets" | "readOwners">
  readonly getContributor: (root: MetadataRootName) => ProjectReferenceValueContributor | undefined
}): ImportedMetadataTargetStatus {
  const requestId = `import-value:${params.canonical}`
  const [direct] = params.queryPort.resolveTargets([{
    requestId,
    componentPath: params.componentPath,
    canonicalTarget: params.canonical,
  }])
  if (direct?.status !== "missing") return direct?.status ?? "missing"

  const parsed = parseMetadataTargetFromModel({
    canonical: params.canonical,
    constraint: { kind: "value" },
  })
  if (!parsed.ok || parsed.target.kind !== "value") return "missing"

  const [semantic] = resolveProjectValueTargets({
    requests: [{ requestId, componentPath: params.componentPath, target: parsed.target }],
    projectDir: params.projectDir,
    queryPort: params.queryPort,
    getContributor: params.getContributor,
  })
  return semantic?.status === "invalid" ? "missing" : semantic?.status ?? "missing"
}
