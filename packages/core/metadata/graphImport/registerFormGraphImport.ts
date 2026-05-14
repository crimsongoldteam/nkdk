import type { ChildFormNamesPropertyRule } from "~/metadata/commonObjects/childFormNames/types"
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { parseClientApplicationFormFromNKDK } from "~/metadata/forms/clientApplicationForm/parseNKDK"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { parseProjectGraphFileOwner } from "./projectFiles"

export function registerFormGraphImport(): void {
  registerGraphImport({
    kind: "form",
    phase: 1,
    includeStubEdgesInChangedFile: true,
    matchPath: matchFormPath,
    importModel: ({ context, parsed, sources }) => {
      const buildModel = (nkdkModel = createEmptyClientApplicationForm()) => {
        const model = importClientApplicationFormFromYAML(
          context,
          parsed.data,
          nkdkModel,
        )
        return {
          model,
          graphModel: toGraphModel(model),
          rule: ClientApplicationFormRules,
        }
      }

      if (!sources.paired?.text) {
        return buildModel()
      }

      return parseClientApplicationFormFromNKDK(context, sources.paired.text).then(
        (nkdkModel) => buildModel(nkdkModel ?? createEmptyClientApplicationForm()),
      )
    },
    declareRoot: ({ graph, name, pathParams }) => {
      const ownerNodeId = pathParams.ownerNodeId
      if (!ownerNodeId) {
        throw new Error("importMetadataFileWithGraph: form kind требует ownerNodeId")
      }

      const formNodeId = `${ownerNodeId}.Форма.${name}`
      graph.ensureNode(ownerNodeId, { name: ownerNodeId.split(".").pop() ?? ownerNodeId })
      graph.ensureNode(formNodeId, { name })
      graph.ensureEdge(ownerNodeId, formNodeId, "FORM", { yaml: "Форма" })
      return formNodeId
    },
    afterBuildGraph: ({ graph, parentNodeId, filePath, sources }) => {
      if (!sources.paired?.filePath) return

      graph.addContributedFilePath(parentNodeId, sources.paired.filePath)
      const visualPrefix = `${parentNodeId}.Элемент.`
      const visualNodeIds = [...graph.nodesWithPrefix(visualPrefix)]

      for (const nodeId of visualNodeIds) {
        graph.removeFilePath(nodeId, filePath)
        graph.addFilePath(nodeId, sources.paired.filePath)
      }

      for (const { source, target, attributes } of graph.edgeEntriesTouching(visualNodeIds)) {
        graph.ensureEdge(source, target, attributes.kind, { filePath: sources.paired.filePath })
      }
    },
  })
}

function matchFormPath(filePath: string): GraphImportSourceMatch | undefined {
  const owner = parseProjectGraphFileOwner(filePath)
  if (!owner) return undefined

  const parts = filePath.split("/")
  if (parts.length !== 5 || parts[4] !== "Форма.yaml") return undefined

  const formName = parts[3]!
  const hasFormsRule = Object.values(owner.rule.properties).some(
    (rule) => isChildFormRule(rule) && parts[2] === rule.folderName,
  )
  if (!hasFormsRule) return undefined

  return {
    kind: "form",
    name: formName,
    pathParams: {
      ownerNodeId: `${owner.dir}.${owner.name}`,
      ownerDir: owner.dir,
      ownerName: owner.name,
    },
  }
}

function isChildFormRule(rule: PropertyRule): rule is ChildFormNamesPropertyRule {
  return rule.type === "ChildFormNames"
}
