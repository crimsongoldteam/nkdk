import { loadCoreApi, type CoreApi, type CoreProjectStateService } from "../coreApi"

export interface ProjectStateHandle {
  get(): Promise<CoreProjectStateService>
  close(): Promise<void>
}

export function createProjectStateHandle(
  loadCore: () => Promise<CoreApi> = loadCoreApi,
): ProjectStateHandle {
  let servicePromise: Promise<CoreProjectStateService> | undefined
  let closePromise: Promise<void> | undefined
  let closed = false

  return {
    get() {
      if (closed) return Promise.reject(new Error("ProjectState handle закрыт"))
      servicePromise ??= loadCore().then((core) => core.createProjectStateService())
      return servicePromise
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = servicePromise?.then((service) => service.close()) ?? Promise.resolve()
      return closePromise
    },
  }
}

export const projectStateHandle = createProjectStateHandle()
