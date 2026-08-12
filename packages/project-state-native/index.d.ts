export interface SharedBufferProbe {
  readonly byteLength: number
  readonly first: number
}

export function probeSharedBuffer(bytes: Uint8Array): SharedBufferProbe
export function fillSharedBuffer(bytes: Uint8Array, value: number): void

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
  close(): void
}

export function openProjectStateReader(sections: ProjectStateSections): NativeProjectStateReader
