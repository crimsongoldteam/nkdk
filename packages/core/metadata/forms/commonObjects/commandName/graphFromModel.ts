/**
 * Регистрирует buildGraphFromModel для типа CommandName.
 *
 * PRD #121: свойство commandName на кнопках формы — имя команды в текущей форме.
 * Материализуется как reference-ребро «ИмяКоманды» от узла кнопки к узлу команды формы.
 *
 * Если команды с таким именем нет в форме — создаётся заглушка через ensureNode
 * в applyGraphOps. formNodeId пробрасывается через extra от forms/elements.
 */

import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { registerEdgeKind } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
import { canonicalizeMetadataGraphPath } from "~/metadata/commonObjects/metadataPath/graphPath"
import {
  BuildGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"

const EDGE_KIND = "COMMAND_NAME"
const EDGE_YAML = "ИмяКоманды"
const INTERNAL_COMMAND_NAME_PATTERN = /^0(?::[0-9a-fA-F-]+)?$/

registerEdgeKind(EDGE_KIND, { yaml: EDGE_YAML, owning: false })

function formNameFromNodeId(formNodeId: string): string {
  return formNodeId.split(".").pop() ?? formNodeId
}

export function buildCommandNameGraphOps(model: string, formNodeId: string): GraphOps | undefined {
  if (INTERNAL_COMMAND_NAME_PATTERN.test(model)) return undefined

  const formCommandPrefix = "Form.Command."
  if (model.startsWith(formCommandPrefix)) {
    const name = model.slice(formCommandPrefix.length)
    return {
      references: [{ id: `${formNodeId}.Command.${name}`, name }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const formStandardCommandPrefix = "Form.StandardCommand."
  if (model.startsWith(formStandardCommandPrefix)) {
    const standardCommand = model.slice(formStandardCommandPrefix.length)
    return {
      references: [
        {
          id: formNodeId,
          name: formNameFromNodeId(formNodeId),
          edgeProps: { commandScope: "form", standardCommand },
        },
      ],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const itemStandardCommandMatch = /^Form\.Item\.([^.]+)\.StandardCommand\.([^.]+)$/.exec(model)
  if (itemStandardCommandMatch) {
    const [, targetItemName, standardCommand] = itemStandardCommandMatch
    if (!targetItemName || !standardCommand) return undefined
    return {
      references: [
        {
          id: `${formNodeId}.Element.${targetItemName}`,
          name: targetItemName,
          edgeProps: { commandScope: "item", standardCommand, targetItemName },
        },
      ],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const canonical = canonicalizeMetadataGraphPath(model)
  if (canonical !== model || model.startsWith("CommonCommand.") || model.includes(".Command.")) {
    return {
      references: [{ id: canonical, name: canonical.split(".").pop() ?? canonical }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  return {
    references: [{ id: `${formNodeId}.Command.${model}`, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}

const buildCommandNameGraph: BuildGraphFromModelFunction = ({
  model,
  extra,
}): GraphOps | undefined => {
  if (typeof model !== "string" || !model) return undefined
  const formNodeId = extra?.formNodeId as string | undefined
  if (!formNodeId) return undefined

  return buildCommandNameGraphOps(model, formNodeId)
}

registerTypeRule("CommandName", "buildGraphFromModel", buildCommandNameGraph)
