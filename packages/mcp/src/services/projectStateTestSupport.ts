import { vi } from "vitest"
import type { CoreProjectStateService } from "../coreApi"
import {
  createDiagnosticBatchWriter,
  createMetadataDiagnosticCollection,
  openDiagnosticBatch,
  type MetadataDiagnostic,
} from "@nkdk/core"

export function createCoreProjectStateTestDouble(): CoreProjectStateService {
  return {
    beginImport: vi.fn(),
    refreshAndValidate: vi.fn(),
    createReadToken: vi.fn(),
    openReadSession: vi.fn(),
    readComponentProjection: vi.fn(),
    reset: vi.fn(),
    rebuild: vi.fn(),
    close: vi.fn(),
  }
}

export function createDiagnosticCollectionForTest(
  diagnostics: readonly (Omit<MetadataDiagnostic, "source"> & { readonly source?: MetadataDiagnostic["source"] })[],
) {
  const writer = createDiagnosticBatchWriter()
  for (const diagnostic of diagnostics) writer.append({ source: "structure", ...diagnostic })
  return createMetadataDiagnosticCollection([openDiagnosticBatch(writer.finish())])
}

export const emptyDiagnosticOutputForTest = {
  diagnostics: [],
  summary: { errors: 0, warnings: 0, shown: 0, omitted: 0 },
  truncated: false,
} as const
