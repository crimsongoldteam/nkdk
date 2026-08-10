export interface ClosableMetadataRuntime {
  close(): Promise<void>
}

export interface MetadataRuntimeHandle<Runtime extends ClosableMetadataRuntime> {
  get(): Promise<Runtime>
  close(): Promise<void>
}

export function createMetadataRuntimeHandle<Runtime extends ClosableMetadataRuntime>(
  load: () => Promise<{ readonly create: () => Runtime }>,
): MetadataRuntimeHandle<Runtime> {
  let runtimePromise: Promise<Runtime> | undefined
  let closePromise: Promise<void> | undefined
  let closed = false

  return {
    get() {
      if (closed) return Promise.reject(new Error("Metadata runtime handle закрыт"))
      runtimePromise ??= load().then(({ create }) => create())
      return runtimePromise
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = runtimePromise?.then((runtime) => runtime.close()) ?? Promise.resolve()
      return closePromise
    },
  }
}

export const metadataRuntimeHandle = createMetadataRuntimeHandle(async () => {
  const [{ createMetadataRuntime, metadataRules }, { createMetadataWorkerManifest }] = await Promise.all([
    import("@nkdk/rules"),
    import("./metadataWorkerManifest"),
  ])
  return {
    create: () => createMetadataRuntime({
      rules: metadataRules,
      workers: createMetadataWorkerManifest(import.meta.url),
    }),
  }
})
