import { markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"

export interface ExtendedConfigurationObjectState {
  readonly uuidPresent: boolean
  readonly mode: "control" | "notify"
}

export const EXTENDED_CONFIGURATION_OBJECT_YAML = "ОбъектРасширяемойКонфигурации"

export function writeExtendedConfigurationObjectYAML(
  yaml: Record<string, unknown>,
  state: ExtendedConfigurationObjectState,
): void {
  if (state.mode === "control" && state.uuidPresent) return
  yaml[EXTENDED_CONFIGURATION_OBJECT_YAML] = state.uuidPresent ? {} : state.mode === "notify" ? "" : {}
  if (state.mode === "notify") {
    markYAMLScalarTag(yaml, EXTENDED_CONFIGURATION_OBJECT_YAML, "проверять")
  }
}

export function readExtendedConfigurationObjectYAML(
  yaml: Readonly<Record<string, unknown>>,
): ExtendedConfigurationObjectState {
  const present = Object.prototype.hasOwnProperty.call(yaml, EXTENDED_CONFIGURATION_OBJECT_YAML)
  if (!present) return { uuidPresent: true, mode: "control" }

  const value = yaml[EXTENDED_CONFIGURATION_OBJECT_YAML]
  const tag = yamlScalarTagAt(yaml, EXTENDED_CONFIGURATION_OBJECT_YAML)
  if (isEmptyRecord(value) && tag === undefined) {
    return { uuidPresent: false, mode: "control" }
  }
  if (isEmptyRecord(value) && tag === "проверять") {
    return { uuidPresent: true, mode: "notify" }
  }
  if (value === "" && tag === "проверять") {
    return { uuidPresent: false, mode: "notify" }
  }
  throw new Error(
    `${EXTENDED_CONFIGURATION_OBJECT_YAML}: допустимы пустое поле, !проверять или !проверять \"\"`,
  )
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
}
