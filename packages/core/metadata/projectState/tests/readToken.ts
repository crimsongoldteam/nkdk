import type { ProjectStateReadToken } from "../contracts"
import { buildProjectStateSnapshot } from "../binary/builder"
import { createBinaryProjectStateReadToken } from "../binary/readToken"

export function createTestProjectStateReadToken(): ProjectStateReadToken {
  return createBinaryProjectStateReadToken(buildProjectStateSnapshot({ fragments: [], deletions: [] }))
}
