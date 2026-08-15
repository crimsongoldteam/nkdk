import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
} from "./store"
import type {
  ConfigurationIndexCandidateStore,
  ConfigurationIndexStore,
  ConfigurationIndexStoreDescriptor,
} from "./store"
import type { ComponentAddress } from "../components/address"

export class ConfigurationIndexStoreTestScope {
  private readonly temporaryDirectories: string[] = []
  private readonly stores = new Set<ConfigurationIndexStore>()
  private readonly candidates = new Set<ConfigurationIndexCandidateStore>()

  async temporaryProject(): Promise<string> {
    const path = await mkdtemp(join(tmpdir(), "nkdk-configuration-index-"))
    this.temporaryDirectories.push(path)
    return path
  }

  open(descriptor: ConfigurationIndexStoreDescriptor, mode: "readOnly" | "readWrite"): ConfigurationIndexStore {
    const store = openConfigurationIndexStore(descriptor, mode)
    this.stores.add(store)
    return store
  }

  async candidate(params: {
    projectDir: string
    operationId: string
    purpose?: "import" | "full" | "partial"
    address?: ComponentAddress
  }): Promise<ConfigurationIndexCandidateStore> {
    const store = await createConfigurationIndexCandidateStore({
      projectDir: params.projectDir,
      address: params.address ?? { kind: "configuration" },
      operationId: params.operationId,
      purpose: params.purpose ?? "full",
    })
    this.candidates.add(store)
    return store
  }

  async close(): Promise<void> {
    await Promise.all([
      ...[...this.candidates].map((store) => store.discard()),
      ...[...this.stores].map((store) => store.close()),
    ])
    await Promise.all(this.temporaryDirectories.map((path) => rm(path, { recursive: true, force: true })))
    this.candidates.clear()
    this.stores.clear()
    this.temporaryDirectories.length = 0
  }
}
