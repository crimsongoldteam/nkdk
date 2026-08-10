interface CoreMetadataModule {
  registerCoreMetadata(): void
}

export interface CoreMetadataSetupState {
  __nkdkCoreMetadataModule?: Promise<CoreMetadataModule>
}

type CoreMetadataLoader = () => Promise<CoreMetadataModule>

const globalRegistrationState = globalThis as typeof globalThis & CoreMetadataSetupState
const loadCoreMetadata: CoreMetadataLoader = () => import("../metadata/composition/coreMetadata")

export async function ensureCoreMetadataRegistered(params: {
  state?: CoreMetadataSetupState
  load?: CoreMetadataLoader
} = {}): Promise<void> {
  const state = params.state ?? globalRegistrationState
  const load = params.load ?? loadCoreMetadata

  state.__nkdkCoreMetadataModule ??= load()
  const { registerCoreMetadata } = await state.__nkdkCoreMetadataModule
  registerCoreMetadata()
}
