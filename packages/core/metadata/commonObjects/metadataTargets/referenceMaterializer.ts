import type { ParsedYaml } from "@nkdk/runtime"
import type { PendingMetadataTargetReferenceCandidate } from "@nkdk/runtime/rule-kit"
import type { Diagnostic } from "../../validation/types"
import { diagnosticAtYamlPath, type YamlPath } from "../../validation/yamlLocations"
import type { MetadataTypedValue } from "../metadataValue/types"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "./types"

export function materializeMetadataValueReference(params: {
  readonly value: MetadataTypedValue
  readonly constraint: MetadataTargetConstraint
  readonly owner?: MetadataTargetOwner
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yamlPath: YamlPath
}): { references: PendingMetadataTargetReferenceCandidate[]; diagnostics: Diagnostic[] } {
  if (params.value.type !== "ref" || params.value.value === "" || isDesignTimeRefUuid(params.value.value)) {
    return { references: [], diagnostics: [] }
  }

  return materializeCanonicalMetadataReference({ ...params, canonical: params.value.value })
}

export function materializeCanonicalMetadataReference(params: {
  readonly canonical: string
  readonly constraint: MetadataTargetConstraint
  readonly owner?: MetadataTargetOwner
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly yamlPath: YamlPath
}): { references: PendingMetadataTargetReferenceCandidate[]; diagnostics: Diagnostic[] } {

  const parsed = parseMetadataTargetFromModel({
    canonical: params.canonical,
    constraint: params.constraint,
    owner: params.owner,
  })
  if (!parsed.ok) {
    return {
      references: [],
      diagnostics: [
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: params.yamlPath,
          source: "structure",
          severity: "error",
          message: parsed.message,
        }),
      ],
    }
  }

  return {
    references: [
      {
        yamlPath: params.yamlPath,
        canonical: parsed.canonical,
        target: parsed.target,
        constraint: params.constraint,
      },
    ],
    diagnostics: [],
  }
}

function isDesignTimeRefUuid(value: string): boolean {
  return /^[0-9a-f-]{36}\.[0-9a-f-]{36}$/i.test(value)
}
