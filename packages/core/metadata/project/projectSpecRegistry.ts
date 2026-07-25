import type { TSchema } from "typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import { registerJSONSchemaIdentity } from "../orchestration/jsonSchemaRefs"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { XmlImportRoute } from "../importFromXml/types"
import type { MetadataResourceDeclaration } from "../resourceTopology/types"

export interface RegisteredProjectSpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode; name?: string }) => TSchema
  nesting?: ProjectSpecNesting
  /** Дополнительные абсолютные маршруты XML-выгрузки, принадлежащие этому project spec. */
  xmlImportRoutes?: readonly XmlImportRoute[]
  /** Нейтральное описание файлов Проекта и связанных с ними XML-ресурсов. */
  resources?: readonly MetadataResourceDeclaration[]
}

export type ProjectSpecNesting = {
  kind: "recursiveChildDir"
  childDir: string
  itemRole: string
  collectionRole: string
}

const specsByDir = new Map<string, RegisteredProjectSpec>()

export function registerProjectSpec(spec: RegisteredProjectSpec): void {
  specsByDir.set(spec.dir, spec)
  registerJSONSchemaIdentity({
    name: spec.rule.itemType,
    source: spec.rule,
    exporter: ({ context }) =>
      spec.exportSchema({
        context,
        mode: context.exportToJSONSchema?.mode ?? "externalRefs",
      }),
  })
}

export function getRegisteredProjectSpecs(): readonly RegisteredProjectSpec[] {
  return [...specsByDir.values()].sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

export function getRegisteredProjectSpecByDir(dir: string): RegisteredProjectSpec | undefined {
  return specsByDir.get(dir)
}

export function clearProjectSpecRegistryForTests(): void {
  specsByDir.clear()
}

export function unregisterProjectSpecForTests(dir: string): void {
  specsByDir.delete(dir)
}
