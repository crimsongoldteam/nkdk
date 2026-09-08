import { prepareYAMLDocumentData, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import { vi } from "vitest"
import * as finalReferences from "../metadata/importFromXml/finalBoundaryReferences"
import * as finalUpdates from "../metadata/importFromXml/finalYamlUpdate"
import { validateKnownProjectYaml } from "../metadata/importFromXml/serializedYamlValidation"
import { createValidationRulesSnapshot } from "../metadata/validation/rulesSnapshot"
import { permissiveValidationSchemaCache } from "./permissiveValidationSchemaCache"
const validateFinalYaml = validateKnownProjectYaml

/** Независимая сверка опубликованных фактов, не требующая проверки корня в production. */
export function observeFinalImportYamlFacts(compare: (input: {
  readonly params: Parameters<typeof finalUpdates.buildFinalImportYamlUpdate>[0]
  readonly expected: ReturnType<typeof validateKnownProjectYaml>
  readonly update: ReturnType<typeof finalUpdates.buildFinalImportYamlUpdate>
}) => void) {
  const boundaries = new WeakMap<object, { readonly root: Record<string, unknown>; readonly annotations: XmlAnomalyAnnotations }>()
  const snapshots = new WeakMap<object, ReturnType<typeof createValidationRulesSnapshot>>()
  const create = finalReferences.createFinalBoundaryReferences
  const collection = vi.spyOn(finalReferences, "createFinalBoundaryReferences").mockImplementation(() => {
    const collector = create()
    const finish = collector.finish
    collector.finish = (root, annotations) => {
      const facts = finish(root, annotations)
      boundaries.set(facts, { root, annotations })
      return facts
    }
    return collector
  })
  const build = finalUpdates.buildFinalImportYamlUpdate
  const publication = vi.spyOn(finalUpdates, "buildFinalImportYamlUpdate").mockImplementation(params => {
    const boundary = boundaries.get(params.facts)
    if (boundary === undefined) throw new Error("Публикация без окончательных локальных фактов")
    const canonical = prepareYAMLDocumentData(boundary.root, boundary.annotations)
    let rulesSnapshot = snapshots.get(params.context)
    if (rulesSnapshot === undefined) {
      rulesSnapshot = createValidationRulesSnapshot(params.context)
      snapshots.set(params.context, rulesSnapshot)
    }
    const update = build(params)
    compare({ params, update, expected: validateFinalYaml({
      projectDir: params.projectDir, file: params.file, context: params.context,
      data: canonical.data, annotations: canonical.annotations,
      schemaCache: permissiveValidationSchemaCache, rulesSnapshot,
    }) })
    return update
  })
  return { restore() { publication.mockRestore(); collection.mockRestore() } }
}
