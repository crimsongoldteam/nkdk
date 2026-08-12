export interface SharedBufferProbe {
  readonly byteLength: number
  readonly first: number
}

export function probeSharedBuffer(bytes: Uint8Array): SharedBufferProbe
export function fillSharedBuffer(bytes: Uint8Array, value: number): void
export function nativeTestDiagnosticBatch(): Uint8Array<ArrayBuffer>

export interface ProjectStateSections {
  readonly header: Uint8Array
  readonly strings: Uint8Array
  readonly files: Uint8Array
  readonly facts: Uint8Array
  readonly lookups: Uint8Array
  readonly diagnostics: Uint8Array
}

export interface ProjectStateReaderStats {
  readonly format: "0.5.0"
  readonly files: number
  readonly copiedSnapshotBytes: number
  readonly decodedStringCacheBytes: number
}

export interface NativeProjectStateReader {
  stats(): ProjectStateReaderStats
  filePaths(): string[]
  execute(request: Uint8Array): Uint8Array
  validateDependencyPage(input: DependencyValidationPageInput): NativeDependencyValidationPage
  close(): void
}

export interface DependencyValidationPageInput {
  readonly projectDir: string
  readonly cursor: number
  readonly batchSize: number
}

export interface NativeDependencyValidationStats {
  readonly filesVisited: number
  readonly checksVisited: number
  readonly nativeDiagnostics: number
  readonly deferredChecks: number
  readonly nativeTemporaryBytes: number
}

export interface NativeDependencyValidationPage {
  readonly diagnostics: Uint8Array<ArrayBuffer>
  readonly deferred: Uint8Array<ArrayBuffer>
  readonly nextCursor?: number
  readonly stats: NativeDependencyValidationStats
}

export interface ProjectStateFragmentSections {
  readonly header: Uint8Array
  readonly strings: Uint8Array
  readonly files: Uint8Array
  readonly facts: Uint8Array
  readonly diagnostics: Uint8Array
}

export interface ProjectStateSectionSizes {
  readonly header: number
  readonly strings: number
  readonly files: number
  readonly facts: number
  readonly lookups: number
  readonly diagnostics: number
}

export interface SnapshotPlanInput {
  readonly base?: ProjectStateSections
  readonly fragments: readonly ProjectStateFragmentSections[]
  readonly deletedProjectPaths: readonly string[]
}

export interface NativeSnapshotStats {
  readonly files: number
  readonly strings: number
  readonly temporaryBytes: number
  readonly copiedSnapshotBytes: number
  readonly planMs: number
  readonly writeMs: number
}

export interface NativeSnapshotPlan {
  layout(): ProjectStateSectionSizes
  writeInto(output: ProjectStateSections): NativeSnapshotStats
  close(): void
}

export function openProjectStateReader(sections: ProjectStateSections): NativeProjectStateReader
export function planProjectStateSnapshot(input: SnapshotPlanInput): NativeSnapshotPlan
