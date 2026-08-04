import { loadCoreApi, type CoreApi, type CoreProjectStateService } from "../coreApi"
import type { ToolFailure } from "../contracts/common"
import { resolveComponent, type ResolveComponentResult } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"

type ResolvedComponent = Extract<ResolveComponentResult, { ok: true }>

export async function prepareMetadataOperation<T extends { readonly projectState?: CoreProjectStateService }>(
  input: { readonly projectDir: string; readonly componentPath?: string },
  deps: T | undefined,
): Promise<
  | { readonly ok: true; readonly component: ResolvedComponent; readonly core: T | CoreApi; readonly projectState: CoreProjectStateService }
  | { readonly ok: false; readonly error: ToolFailure }
> {
  const component = resolveComponent(input)
  if (!component.ok) return component
  return {
    ok: true,
    component,
    core: deps ?? await loadCoreApi(),
    projectState: deps?.projectState ?? await projectStateHandle.get(),
  }
}
