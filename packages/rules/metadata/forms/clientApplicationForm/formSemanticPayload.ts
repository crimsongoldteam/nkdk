import { normalizeBaseFormYaml } from "./baseFormYaml"
import type { ClientApplicationFormYAML } from "./types"

interface ClientApplicationFormSemanticPayloadV1 {
  readonly version: 1
  readonly yaml: ClientApplicationFormYAML
}

export function serializeClientApplicationFormSemanticPayload(yaml: unknown): string {
  return JSON.stringify({ version: 1, yaml: normalizeBaseFormYaml(yaml) })
}

export function parseClientApplicationFormSemanticPayload(
  payload: string | undefined,
): ClientApplicationFormYAML | undefined {
  if (payload === undefined) return undefined
  try {
    const parsed = JSON.parse(payload) as Partial<ClientApplicationFormSemanticPayloadV1>
    return parsed.version === 1 && isRecord(parsed.yaml)
      ? parsed.yaml as ClientApplicationFormYAML
      : undefined
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
