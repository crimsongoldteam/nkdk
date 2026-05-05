import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { parseClientApplicationFormFromNKDK } from "~/metadata/forms/clientApplicationForm/parseNKDK"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import {
  registerGraphImport,
  toGraphModel,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"

export function registerFormGraphImport(): void {
  registerGraphImport({
    kind: "form",
    phase: 1,
    includeStubEdgesInChangedFile: true,
    matchPath: matchFormPath,
    importModel: async ({ context, parsed, sources }) => {
      const nkdkModel = sources.paired?.text
        ? await parseClientApplicationFormFromNKDK(context, sources.paired.text)
        : createEmptyClientApplicationForm()

      const model = importClientApplicationFormFromYAML(
        context,
        parsed.data,
        nkdkModel ?? createEmptyClientApplicationForm(),
      )
      return {
        model,
        graphModel: toGraphModel(model),
        rule: ClientApplicationFormRules,
      }
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
  const parts = filePath.split("/")
  if (parts.length !== 5 || parts[2] !== "Формы" || parts[4] !== "Форма.yaml") return undefined

  const ownerDir = parts[0]!
  const ownerName = parts[1]!
  const formName = parts[3]!
  if (!["Справочник", "Документ", "Перечисление"].includes(ownerDir)) return undefined

  return {
    kind: "form",
    name: formName,
    pathParams: {
      ownerNodeId: `${ownerDir}.${ownerName}`,
      ownerDir,
      ownerName,
    },
  }
}
