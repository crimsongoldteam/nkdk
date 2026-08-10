import { resolve } from "node:path"
import { parseMetadataYamlData } from "@nkdk/runtime"
import type {
  FullXmlSyncComponentProfile,
  FullXmlSyncProfileRuntime,
} from "./componentProfile"

export async function prepareFullXmlSyncProfileRuntime(params: {
  readonly profile: FullXmlSyncComponentProfile
  readonly runtime: FullXmlSyncProfileRuntime
  readonly readFile: (path: string) => Promise<Uint8Array>
}): Promise<FullXmlSyncProfileRuntime> {
  if (params.profile.prepareRuntime === undefined) return params.runtime

  const resources = params.runtime.target.structure.resources.filter(
    ({ kind, role }) => kind === "content" && role === "configuration"
  )
  if (resources.length !== 1) {
    throw new Error(
      `Для компонента ${params.runtime.target.structure.componentPath} ожидается один корневой YAML-ресурс, найдено: ${resources.length}`
    )
  }

  const resource = resources[0]!
  const path = resolve(params.runtime.target.structure.componentDir, resource.projectPath)
  const bytes = await params.readFile(path)
  const parsed = parseMetadataYamlData(Buffer.from(bytes).toString("utf8"))
  const first = parsed.syntaxErrors[0]
  if (first !== undefined) {
    throw new Error(`Не удалось разобрать YAML-файл ${path}:${first.line}:${first.col}: ${first.message}`)
  }

  return params.profile.prepareRuntime({ runtime: params.runtime, rootYaml: parsed.data })
}
