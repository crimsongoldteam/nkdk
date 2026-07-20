import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { buildFullXmlSyncPlan } from "./discovery"
import { createFullXmlSyncSharedMetadata } from "./sharedMetadata"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import { runFullXmlSyncWorkerCommand, resetFullXmlSyncWorkerStateForTests } from "./worker"
import { createFullXmlSyncWorkerPool } from "./workerPool"
import { writeFullXmlSyncConfigDumpInfo } from "./writeConfigDumpInfo"
import { readConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import { writeConfigurationIndexAtomically } from "../configurationIndex/fileIO"
import type { FullXmlSyncCoordinatorDependencies } from "./syncConfiguration"
import { NKDK_CORE_VERSION } from "../../version"

const tempDirs: string[] = []

export async function removeFullSyncTempDirs(): Promise<void> {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true })))
}

export function createTempRoot(): string {
  const root = fs.mkdtempSync(join(os.tmpdir(), "nkdk-full-sync-"))
  tempDirs.push(root)
  return root
}

export function writeSmallXmlDump(xmlDir: string): void {
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.copyFileSync(
    join(__dirname, "../appliedObjects/configuration/__fixtures__/minimal.xml"),
    join(xmlDir, "Configuration.xml")
  )
  fs.writeFileSync(
    join(xmlDir, "ConfigDumpInfo.xml"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">',
      "\t<ConfigVersions/>",
      "</ConfigDumpInfo>",
      "",
    ].join("\n")
  )
  fs.cpSync(join(__dirname, "../appliedObjects/metadataBot/__fixtures__/sync/xml"), join(xmlDir, "Bots"), {
    recursive: true,
  })
}

export async function writeSmallYamlProjectWithIndex(yamlDir: string): Promise<void> {
  fs.mkdirSync(yamlDir, { recursive: true })
  fs.writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Конфигурация\n", "utf8")
  fs.cpSync(join(__dirname, "../appliedObjects/metadataBot/__fixtures__/sync/yaml"), join(yamlDir, "Бот"), {
    recursive: true,
  })
  await writeConfigurationIndexAtomically({
    projectDir: yamlDir,
    data: {
      binding: {
        indexGeneration: 1n,
        producerVersion: NKDK_CORE_VERSION,
        baseId: "default",
        baseFingerprint: new Uint8Array(),
        configurationVersion: new Uint8Array(),
      },
      projectFiles: [],
      identities: [
        {
          logicalAddress: "Бот.БотВсеСвойства",
          kind: "uuid",
          value: "1f777cc7-ac1c-46e8-8e35-82485cee6798",
        },
      ],
      xmlNodes: [],
      xmlValues: [],
    },
  })
}

export function createDirectFullSyncDependencies(): FullXmlSyncCoordinatorDependencies {
  return {
    async exists(path) {
      return fs.existsSync(path)
    },
    async isDirectoryEmpty(path) {
      return fs.readdirSync(path).length === 0
    },
    async mkdir(path) {
      fs.mkdirSync(path, { recursive: true })
    },
    discover: ({ projectDir }) => buildFullXmlSyncPlan({ projectDir }),
    readIndexSnapshot: readConfigurationIndexSnapshot,
    createWorkerPool({ concurrency }) {
      return createFullXmlSyncWorkerPool({
        concurrency,
        createWorkerPool: () => ({
          run: runFullXmlSyncWorkerCommand,
          async destroy() {
            resetFullXmlSyncWorkerStateForTests()
          },
        }),
      })
    },
    createSharedMetadata: createFullXmlSyncSharedMetadata,
    transferExternalFiles: transferFullXmlSyncExternalFiles,
    writeConfigDumpInfo: writeFullXmlSyncConfigDumpInfo,
    writeIndex: writeConfigurationIndexAtomically,
  }
}
