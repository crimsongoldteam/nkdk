import {
  TestRunner,
  type RunnerTestCase as Test,
  type RunnerTestSuite as Suite,
} from "vitest"

import {
  createMetadataExecutionRegistrySets,
  enterMetadataExecutionRegistrySets,
  type MetadataExecutionRegistrySets,
} from "../metadata/composition/metadataExecutionContext"
import { metadataRules } from "../metadata/composition/metadataRules"

export default class MetadataTestRunner extends TestRunner {
  private readonly registriesByFile = new Map<string, MetadataExecutionRegistrySets>()

  override importFile(filepath: string, source: "collect" | "setup"): unknown {
    if (source === "collect") this.enterFileContext(filepath)
    return super.importFile(filepath, source)
  }

  override onBeforeRunSuite(suite: Suite): Promise<void> {
    const result = super.onBeforeRunSuite(suite)
    this.enterFileContext(suite.file.filepath)
    return result
  }

  override async onAfterRunSuite(suite: Suite): Promise<void> {
    try {
      await super.onAfterRunSuite(suite)
    } finally {
      if (suite.file === suite) this.registriesByFile.delete(suite.file.filepath)
    }
  }

  override onBeforeTryTask(test: Test): void {
    super.onBeforeTryTask(test)
    this.enterFileContext(test.file.filepath)
  }

  private enterFileContext(filepath: string): void {
    let registries = this.registriesByFile.get(filepath)
    if (registries === undefined) {
      registries = createMetadataExecutionRegistrySets(metadataRules)
      this.registriesByFile.set(filepath, registries)
    }
    enterMetadataExecutionRegistrySets(registries)
  }
}
