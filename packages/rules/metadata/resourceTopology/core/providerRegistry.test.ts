import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { metadataResourceTopologyProvider } from "../adapters/metadataProvider"
import {
  getMetadataResourceTopology,
  registerMetadataResourceTopologyProvider,
  resetMetadataResourceTopologyProviderForTests,
  type MetadataResourceTopologyProvider,
} from "./providerRegistry"
import type { CompiledMetadataResourceTopology } from "./types"

const topology = {} as CompiledMetadataResourceTopology

describe("metadata resource topology provider registry", () => {
  beforeEach(resetMetadataResourceTopologyProviderForTests)
  afterEach(() => {
    resetMetadataResourceTopologyProviderForTests()
    registerMetadataResourceTopologyProvider(metadataResourceTopologyProvider)
  })

  it("requires a registered provider", () => {
    expect(() => getMetadataResourceTopology()).toThrow("provider не зарегистрирован")
  })

  it("caches the topology for the current revision", () => {
    let revision = "1"
    const compile = vi.fn(() => topology)
    const provider: MetadataResourceTopologyProvider = { revision: () => revision, compile }
    registerMetadataResourceTopologyProvider(provider)

    expect(getMetadataResourceTopology()).toBe(topology)
    expect(getMetadataResourceTopology()).toBe(topology)
    expect(compile).toHaveBeenCalledTimes(1)

    revision = "2"
    expect(getMetadataResourceTopology()).toBe(topology)
    expect(compile).toHaveBeenCalledTimes(2)
  })

  it("rejects a different provider", () => {
    const first: MetadataResourceTopologyProvider = { revision: () => "1", compile: () => topology }
    const second: MetadataResourceTopologyProvider = { revision: () => "1", compile: () => topology }
    registerMetadataResourceTopologyProvider(first)

    expect(() => registerMetadataResourceTopologyProvider(second)).toThrow("provider уже зарегистрирован")
  })
})
