export interface SharedBufferProbe {
  readonly byteLength: number
  readonly first: number
}

export function probeSharedBuffer(bytes: Uint8Array): SharedBufferProbe
export function fillSharedBuffer(bytes: Uint8Array, value: number): void
