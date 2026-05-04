import "~/metadata/commonObjects/metadataValue/graphFromModel"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
} from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameters } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER"
const EDGE_YAML = "ПараметрВыбора"
const NODE_SEGMENT = "ПараметрВыбора"

const ChoiceParameterGraphRule = {
  itemType: "ChoiceParameter",
  properties: {
    name: { type: "string", yaml: "Имя" },
    value: { type: "MetadataValue", yaml: "Значение" },
  },
} as unknown as MetadataItemRule

const buildChoiceParametersGraph: BuildGraphFromModelFunction = ({ model, parentNodeId }) => {
  const parameters = model as ChoiceParameters | undefined
  if (!Array.isArray(parameters) || parameters.length === 0) return undefined

  const children: GraphOpsChild[] = []
  const recurse: NonNullable<GraphOps["recurse"]> = []

  parameters.forEach((parameter, index) => {
    const childNodeId = `${parentNodeId}.${NODE_SEGMENT}[${index}]`
    const item = {
      itemType: "ChoiceParameter",
      name: parameter.name,
      value: parameter.value,
    }

    children.push({
      idSuffix: `${NODE_SEGMENT}[${index}]`,
      absoluteId: childNodeId,
      name: parameter.name,
      index,
      item,
    })

    recurse.push({
      model: item,
      rule: ChoiceParameterGraphRule,
      parentNodeId: childNodeId,
    })
  })

  return { children, recurse, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("ChoiceParameters", "buildGraphFromModel", buildChoiceParametersGraph)
