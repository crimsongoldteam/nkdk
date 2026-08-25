import type { ConfigurationIndexBlock } from "@nkdk/runtime"
import type { FullXmlSyncExecutionBatch } from "../fullSyncToXml/workerPool"
import type { PartialXmlArchiveWriter } from "./archiveWriter"

export async function writePartialXmlSyncWorkerBatch(params: {
  readonly batch: FullXmlSyncExecutionBatch
  readonly writer: Pick<PartialXmlArchiveWriter, "addGenerated">
  readonly writtenPayloadPaths: Set<string>
  readonly rebuiltBlocks: Map<string, ConfigurationIndexBlock>
}): Promise<void> {
  for (const document of params.batch.generatedDocuments) {
    await params.writer.addGenerated(document)
    params.writtenPayloadPaths.add(document.targetXmlPath)
  }
  for (const fragment of params.batch.configurationFragments) {
    mergePartialBlock(params.rebuiltBlocks, fragment)
  }
}

function mergePartialBlock(
  blocks: Map<string, ConfigurationIndexBlock>,
  fragment: { readonly targetProjectPath: string; readonly entities: ConfigurationIndexBlock["entities"] },
): void {
  if (fragment.entities.length === 0) {
    blocks.set(fragment.targetProjectPath, { entities: [] })
    return
  }
  const merged = new Map((blocks.get(fragment.targetProjectPath)?.entities ?? []).map((entity) => [entity.logicalAddress, entity]))
  for (const entity of fragment.entities) {
    const previous = merged.get(entity.logicalAddress)
    if (previous !== undefined && JSON.stringify(previous) !== JSON.stringify(entity)) {
      throw new Error(`Конфликт блока ${fragment.targetProjectPath}: ${entity.logicalAddress}`)
    }
    merged.set(entity.logicalAddress, entity)
  }
  blocks.set(fragment.targetProjectPath, { entities: [...merged.values()] })
}
