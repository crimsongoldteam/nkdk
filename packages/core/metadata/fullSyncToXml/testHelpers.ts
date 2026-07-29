import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import { runFullXmlSyncWorkerCommand, resetFullXmlSyncWorkerStateForTests } from "./worker"
import { createFullXmlSyncWorkerPool } from "./workerPool"
import { readConfigurationIndexSnapshot } from "../configurationIndex/sharedSnapshot"
import { writeConfigurationIndexAtomically } from "../configurationIndex/fileIO"
import type { FullXmlSyncCoordinatorDependencies } from "./syncConfiguration"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
} from "../project/componentState"
import { resolveFullXmlSyncComponentProfile } from "./componentProfile"
import { buildXmlSyncPlan } from "./selection"
import { validateFullXmlSyncWrittenFiles } from "./validateWrittenFiles"

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
  fs.cpSync(join(__dirname, "../appliedObjects/metadataBot/__fixtures__/sync/xml"), join(xmlDir, "Bots"), {
    recursive: true,
  })
}

export async function writeSmallYamlProjectWithIndex(projectDir: string): Promise<void> {
  const yamlDir = join(projectDir, "cf")
  fs.mkdirSync(yamlDir, { recursive: true })
  fs.writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Конфигурация\n", "utf8")
  fs.cpSync(join(__dirname, "../appliedObjects/metadataBot/__fixtures__/sync/yaml"), join(yamlDir, "Бот"), {
    recursive: true,
  })
  await writeConfigurationIndexAtomically({
    projectDir,
    address: { kind: "configuration" },
    data: {
      specificationVersion: "1.3",
      indexGeneration: 1n,
      componentPath: "cf",
      files: [{
        projectPath: "Бот/БотВсеСвойства/Свойства.yaml",
        contentHash: 0n,
      }, {
        projectPath: "Бот/БотВсеСвойства/Модуль.bsl",
        contentHash: 0n,
      }],
      entities: [
        {
          logicalAddress: "Бот.БотВсеСвойства",
          sourceProjectPath: "Бот/БотВсеСвойства/Свойства.yaml",
          identities: {
            uuid: "1f777cc7-ac1c-46e8-8e35-82485cee6798",
          },
        },
        {
          logicalAddress: "ВнешнееСостояние",
          sourceProjectPath: "Бот/БотВсеСвойства/Модуль.bsl",
          xml: { explicitEmpty: true },
        },
      ],
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
    readStructure: readComponentProjectStructure,
    readSnapshot: readConfigurationIndexSnapshot,
    readHashes: readComponentHashState,
    readIndexes: readComponentIndexes,
    confirmState: confirmComponentState,
    resolveProfile: resolveFullXmlSyncComponentProfile,
    buildPlan: buildXmlSyncPlan,
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
    transferExternalFiles: transferFullXmlSyncExternalFiles,
    validateWrittenFiles: validateFullXmlSyncWrittenFiles,
    writeIndex: writeConfigurationIndexAtomically,
  }
}
