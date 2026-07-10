import type { ConfigurationContext, FormDataPathAttributeContext } from "../../context/types"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import { buildFormDataPathIndex } from "../../validation/dataPath/formIndex"
import {
  formatDataPathStandardMembers,
  type DataPathFormatDirection,
} from "../../validation/dataPath/formatter"
import { createOwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createProjectYamlCache } from "../../validation/projectYamlCache"

interface DataPathFormattingResources {
  index: ReturnType<typeof buildFormDataPathIndex>
  ownerCache: ReturnType<typeof createOwnerMetadataCache>
}

const resourcesByAttributes = new WeakMap<
  readonly FormDataPathAttributeContext[],
  Map<string, DataPathFormattingResources>
>()

export function exportDataPathStandardMembersToYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value
  return formatWithResolver({ context, value, direction: "internal-to-yaml" })
}

export function importDataPathStandardMembersFromYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value
  return formatWithResolver({ context, value, direction: "yaml-to-internal" })
}

function formatWithResolver(params: {
  context: ConfigurationContext
  value: string
  direction: DataPathFormatDirection
}): string {
  const formAttributes = currentFormAttributes(params.context)
  const projectDir = params.context.importFromYAML?.projectDir ?? params.context.exportToYAML?.projectDir
  if (formAttributes.length === 0 || projectDir === undefined) return params.value

  const resources = getFormattingResources({ context: params.context, formAttributes, projectDir })

  return formatDataPathStandardMembers({
    value: params.value,
    direction: params.direction,
    index: resources.index,
    ownerCache: resources.ownerCache,
  })
}

function currentFormAttributes(context: ConfigurationContext): readonly FormDataPathAttributeContext[] {
  return context.importFromYAML?.formAttributes ?? context.exportToYAML?.formAttributes ?? []
}

function getFormattingResources(params: {
  context: ConfigurationContext
  formAttributes: readonly FormDataPathAttributeContext[]
  projectDir: string
}): DataPathFormattingResources {
  let byProjectDir = resourcesByAttributes.get(params.formAttributes)
  if (byProjectDir === undefined) {
    byProjectDir = new Map()
    resourcesByAttributes.set(params.formAttributes, byProjectDir)
  }

  const cached = byProjectDir.get(params.projectDir)
  if (cached !== undefined) return cached

  const resources: DataPathFormattingResources = {
    index: buildFormDataPathIndex({
      filePath: "",
      parsed: parseMetadataYaml(""),
      form: { itemType: "ClientApplicationForm", attributes: params.formAttributes },
    }),
    ownerCache: createOwnerMetadataCache({
      projectDir: params.projectDir,
      yamlCache: createProjectYamlCache(),
      context: params.context,
    }),
  }
  byProjectDir.set(params.projectDir, resources)
  return resources
}
