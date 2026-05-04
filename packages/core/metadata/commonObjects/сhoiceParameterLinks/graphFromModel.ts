import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import type {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
} from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameterLinks } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER_LINK"
const EDGE_YAML = "СвязьПараметровВыбора"
const DATA_PATH_EDGE_KIND = "DATA_PATH"
const DATA_PATH_EDGE_YAML = "ПутьКДанным"
const NODE_SEGMENT = "СвязьПараметровВыбора"

const buildChoiceParameterLinkDataPathGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}) => {
  if (typeof model !== "string" || !model) return undefined

  const globalRef = extractReferenceFromPath(model)
  if (globalRef) {
    return {
      references: [globalRef],
      edgeKind: DATA_PATH_EDGE_KIND,
      edgeYaml: DATA_PATH_EDGE_YAML,
    }
  }

  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  return {
    formLocalReferences: [{ formLocalPath: model, formNodeId }],
    edgeKind: DATA_PATH_EDGE_KIND,
    edgeYaml: DATA_PATH_EDGE_YAML,
  }
}

const ChoiceParameterLinkGraphRule = {
  itemType: "ChoiceParameterLink",
  properties: {
    name: { type: "string", yaml: "Имя" },
    dataPath: { type: "string", yaml: "ПутьКДанным" },
    dataPathReference: { type: "ChoiceParameterLinkDataPath", yaml: DATA_PATH_EDGE_YAML },
    valueChange: { type: "SystemEnumeration", yaml: "ИзменениеЗначения" },
  },
} as const satisfies MetadataItemRule

const buildChoiceParameterLinksGraph: BuildGraphFromModelFunction = ({ model, parentNodeId }) => {
  const links = model as ChoiceParameterLinks | undefined
  if (!Array.isArray(links) || links.length === 0) return undefined

  const children: GraphOpsChild[] = []
  const recurse: NonNullable<GraphOps["recurse"]> = []

  links.forEach((link, index) => {
    const childNodeId = `${parentNodeId}.${NODE_SEGMENT}[${index}]`
    const item = {
      itemType: "ChoiceParameterLink",
      name: link.name,
      dataPath: link.dataPath,
      dataPathReference: link.dataPath,
      valueChange: link.valueChange,
    }

    children.push({
      idSuffix: `${NODE_SEGMENT}[${index}]`,
      absoluteId: childNodeId,
      name: link.name,
      index,
      item,
    })

    recurse.push({
      model: item,
      rule: ChoiceParameterLinkGraphRule,
      parentNodeId: childNodeId,
    })
  })

  return { children, recurse, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule(
  "ChoiceParameterLinkDataPath",
  "buildGraphFromModel",
  buildChoiceParameterLinkDataPathGraph,
)
registerTypeRule("ChoiceParameterLinks", "buildGraphFromModel", buildChoiceParameterLinksGraph)
