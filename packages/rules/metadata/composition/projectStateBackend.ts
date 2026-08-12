import type { ProjectStateBackend, ProjectStateBackendKind } from "../projectState/backend"
import {
  rustProjectStateBackend,
  typescriptProjectStateBackend,
} from "../projectState/rust/backend"

export function resolveProjectStateBackendKind(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ProjectStateBackendKind {
  const value = environment["NKDK_PROJECT_STATE_BACKEND"] ?? "typescript"
  if (value === "typescript" || value === "rust") return value
  throw new Error("NKDK_PROJECT_STATE_BACKEND должен иметь значение typescript или rust")
}

export function createProjectStateBackend(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ProjectStateBackend {
  return resolveProjectStateBackendKind(environment) === "rust"
    ? rustProjectStateBackend
    : typescriptProjectStateBackend
}
