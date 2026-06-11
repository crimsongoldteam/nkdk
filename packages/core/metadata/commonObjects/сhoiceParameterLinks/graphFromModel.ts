import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsChild,
} from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ChoiceParameterLinks } from "./types"

const EDGE_KIND = "CHOICE_PARAMETER_LINK"
const EDGE_YAML = "СвязьПараметровВыбора"
const NODE_SEGMENT = "СвязьПараметровВыбора"

const ChoiceParameterLinkGraphRule = {
  itemType: "ChoiceParameterLink",
  properties: {
    name: { type: "string", yaml: "Имя" },
    dataPath: { type: "DataPath", yaml: "ПутьКДанным" },
    valueChange: { type: "string", yaml: "ИзменениеЗначения" },
  },
} as unknown as MetadataItemRule

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

registerTypeRule("ChoiceParameterLinks", "buildGraphFromModel", buildChoiceParameterLinksGraph)
