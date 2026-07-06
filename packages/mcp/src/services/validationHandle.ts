import { loadCoreApi, type CoreApi } from "../coreApi"

type ValidationHandle = ReturnType<CoreApi["createValidationWorkerPoolHandle"]>

let handlePromise: Promise<ValidationHandle> | undefined

export function getValidationHandle(): Promise<ValidationHandle> {
  handlePromise ??= loadCoreApi().then((core) => core.createValidationWorkerPoolHandle())
  return handlePromise
}

export async function closeValidationHandle(): Promise<void> {
  const handle = await handlePromise
  handlePromise = undefined
  await handle?.close()
}

export function resetValidationHandleForTests(): void {
  handlePromise = undefined
}
