import type { ProjectStateSections } from "../index.js"

export interface TestProjectStateBuffers {
  readonly header: SharedArrayBuffer
  readonly strings: SharedArrayBuffer
  readonly files: SharedArrayBuffer
  readonly facts: SharedArrayBuffer
  readonly lookups: SharedArrayBuffer
  readonly diagnostics: SharedArrayBuffer
}

export interface TestProjectStateSnapshotView {
  filePaths(): string[]
  filePath(fileId: number): string
  componentPath(fileId: number): string
  fileRecord(fileId: number): { readonly hash: bigint }
}

export function unicodeSnapshot(): TestProjectStateBuffers
export function targetSnapshot(): TestProjectStateBuffers
export function fileBackedTargetSnapshot(): TestProjectStateBuffers
export function readinessSnapshot(options?: {
  readonly includeBase?: boolean
  readonly baseReady?: boolean
}): TestProjectStateBuffers
export function snapshotView(buffers: TestProjectStateBuffers): TestProjectStateSnapshotView
export function sectionViews(buffers: TestProjectStateBuffers): ProjectStateSections
