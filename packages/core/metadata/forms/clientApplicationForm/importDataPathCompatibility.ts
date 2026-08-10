import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { FormDataPathOccurrence } from "../../validation/dataPath/formTraversal"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { evaluateDataPathCompatibility, toDataPathPolicyInput } from "../../validation/dataPath/policies"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import { ClientApplicationFormRules } from "./rules"

export function finalizeImportedFormDataPathCompatibility(params: {
  yaml: unknown
  originalOccurrences: readonly FormDataPathOccurrence[]
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
}): void {
  const originals = new Map(
    params.originalOccurrences.map((occurrence) => [yamlPathKey(occurrence.yamlPath), occurrence])
  )
  const finalizedOccurrences = collectFormDataPathOccurrencesFromYAML({
    yaml: params.yaml,
    rule: ClientApplicationFormRules,
  })

  for (const occurrence of finalizedOccurrences) {
    if (occurrence.rule.allowedKinds === undefined || occurrence.rule.yaml !== "ПутьКДанным") continue
    const original = originals.get(yamlPathKey(occurrence.yamlPath))
    if (original === undefined) continue

    const resolution = resolveDataPathCore({
      value: occurrence.value,
      nameMode: "yaml",
      index: params.index,
      ownerCache: params.ownerCache,
      ...(occurrence.tableContext === undefined ? {} : { tableContext: occurrence.tableContext }),
    })
    if (resolution.status === "error" || resolution.target === undefined) continue

    const compatibility = evaluateDataPathCompatibility({
      rule: toDataPathPolicyInput(occurrence.rule),
      target: resolution.target,
      hasValuesPicture: occurrence.hasValuesPicture,
    })
    if (compatibility.status !== "incompatible") continue

    occurrence.setValue(original.value)
    occurrence.markTag?.("xml")
  }
}

function yamlPathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}
