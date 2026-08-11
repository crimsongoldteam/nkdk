import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import type { ConfirmedComponentState } from "../project/componentState/types"
import type { MetadataProjectResourceMatch } from "../resourceTopology/core/projectProjection"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { FullXmlSyncComponentProfile, FullXmlSyncProfileRuntime } from "./componentProfile"
import { prepareFullXmlSyncProfileRuntime } from "./prepareProfileRuntime"

describe("prepareFullXmlSyncProfileRuntime", () => {
  it("reads the configuration resource and delegates root YAML to the profile", async () => {
    const runtime = createRuntime([configurationResource("Конфигурация.yaml")])
    const readPaths: string[] = []
    const profile = createProfile(({ runtime: current, rootYaml }) => ({
      ...current,
      workerProfile: {
        ...current.workerProfile,
        typeDescriptionXMLNameByType:
          (rootYaml as { legacy: boolean }).legacy ? { AnyIBRef: "AnyRef" } : { AnyIBRef: "AnyIBRef" },
      },
    }))

    const prepared = await prepareFullXmlSyncProfileRuntime({
      profile,
      runtime,
      async readFile(path) {
        readPaths.push(path)
        return Buffer.from("legacy: true\n")
      },
    })

    expect(readPaths).toEqual(["/project/cfe/Дополнение/Конфигурация.yaml"])
    expect(prepared.workerProfile.typeDescriptionXMLNameByType).toEqual({ AnyIBRef: "AnyRef" })
  })

  it("returns a profile without a preparation hook without reading YAML", async () => {
    const runtime = createRuntime([])
    let reads = 0

    const prepared = await prepareFullXmlSyncProfileRuntime({
      profile: createProfile(),
      runtime,
      async readFile() {
        reads++
        return Buffer.from("")
      },
    })

    expect(prepared).toBe(runtime)
    expect(reads).toBe(0)
  })

  it.each([
    ["missing", []],
    ["duplicate", [configurationResource("Конфигурация.yaml"), configurationResource("Корень.yaml")]],
  ] as const)("reports a %s configuration resource", async (_case, resources) => {
    await expect(
      prepareFullXmlSyncProfileRuntime({
        profile: createProfile(({ runtime }) => runtime),
        runtime: createRuntime(resources),
        async readFile() {
          return Buffer.from("")
        },
      })
    ).rejects.toThrow("cfe/Дополнение")
  })

  it("reports the root YAML path and syntax position", async () => {
    await expect(
      prepareFullXmlSyncProfileRuntime({
        profile: createProfile(({ runtime }) => runtime),
        runtime: createRuntime([configurationResource("Конфигурация.yaml")]),
        async readFile() {
          return Buffer.from("legacy: [\n")
        },
      })
    ).rejects.toThrow(/\/project\/cfe\/Дополнение\/Конфигурация\.yaml:\d+:\d+/)
  })
})

function createProfile(
  prepareRuntime?: FullXmlSyncComponentProfile["prepareRuntime"]
): FullXmlSyncComponentProfile {
  return {
    kind: "configurationExtension",
    supports: () => true,
    baseAddress: () => undefined,
    confirm: () => {
      throw new Error("not used")
    },
    ...(prepareRuntime === undefined ? {} : { prepareRuntime }),
  }
}

function createRuntime(resources: readonly MetadataProjectResourceMatch[]): FullXmlSyncProfileRuntime {
  const target = createState(resources)
  return {
    kind: "configurationExtension",
    target,
    workerProfile: {
      kind: "configurationExtension",
      componentKind: "configurationExtension",
      adoptedUuids: {},
    },
  }
}

function createState(resources: readonly MetadataProjectResourceMatch[]): ConfirmedComponentState {
  return {
    structure: {
      address: { kind: "configurationExtension", name: "Дополнение" },
      componentPath: "cfe/Дополнение",
      componentDir: "/project/cfe/Дополнение",
      topology: {} as CompiledMetadataResourceTopology,
      resources,
      projectPaths: resources.map(({ projectPath }) => projectPath),
    },
    hashes: { componentPath: "cfe/Дополнение", projectFiles: [] },
    indexes: { componentPath: "cfe/Дополнение", sourceProjectFiles: [], logicalAddresses: [] },
    snapshot: snapshotConfigurationIndex(
      encodeConfigurationIndex({
        specificationVersion: "1.4",
        indexGeneration: 1n,
        componentPath: "cfe/Дополнение",
        files: [],
        entities: [],
      })
    ),
    projectStateReadToken: createTestProjectStateReadToken(),
  }
}

function configurationResource(projectPath: string): MetadataProjectResourceMatch {
  return {
    kind: "content",
    projectPath,
    assignment: undefined,
    values: {},
    role: "configuration",
    rule: undefined,
    owner: undefined,
    compositionImpact: "none",
  }
}
