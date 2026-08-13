import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  configurationIndexStoreDescriptor,
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
} from "@nkdk/runtime"

const projectDir = await mkdtemp(join(tmpdir(), "nkdk-packed-lmdb-"))
const projectPath = "Конфигурация.yaml"
const contentHash = 0x0102030405060708n
const block = {
  entities: [{
    logicalAddress: "Конфигурация",
    uuid: "11111111-1111-4111-8111-111111111111",
  }],
}

try {
  const candidate = await createConfigurationIndexCandidateStore({
    projectDir,
    address: { kind: "configuration" },
    operationId: "packed-smoke",
    purpose: "import",
  })
  candidate.replaceHashes([{ projectPath, contentHash }])
  candidate.mergeBlockFragment({ targetProjectPath: projectPath, entities: block.entities })
  candidate.validateCandidate()

  const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })
  const active = openConfigurationIndexStore(descriptor, "readWrite")
  await active.publishImportedCandidate(candidate)

  const reopened = openConfigurationIndexStore(descriptor, "readOnly")
  try {
    const hashes = reopened.readHashes()
    const restored = reopened.getBlocks([projectPath]).get(projectPath)
    if (hashes.length !== 1 || hashes[0]?.projectPath !== projectPath || hashes[0]?.contentHash !== contentHash) {
      throw new Error("Packed LMDB smoke прочитал другой hash")
    }
    if (JSON.stringify(restored) !== JSON.stringify(block)) {
      throw new Error("Packed LMDB smoke прочитал другой блок")
    }
  } finally {
    await reopened.close()
  }
} finally {
  await rm(projectDir, { recursive: true, force: true })
}
