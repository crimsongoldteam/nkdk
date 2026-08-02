import { vi } from "vitest"
import type { CoreProjectStateService } from "../coreApi"

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
