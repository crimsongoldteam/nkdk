export interface BinaryRecordCodec<T> {
  readonly viewLength: number
  encode(value: T, view: DataView, offset?: number): void
  decode(view: DataView, offset?: number): T
}

/** Принадлежащие writer блоки; опубликованные данные копируются отдельно. */
export class BinaryRecordBuffer<T> {
  readonly #blocks: DataView[] = []
  readonly #recordsPerBlock: number
  #length = 0

  constructor(readonly codec: BinaryRecordCodec<T>) {
    if (!Number.isSafeInteger(codec.viewLength) || codec.viewLength <= 0) {
      throw new RangeError("Неверная длина двоичной записи")
    }
    this.#recordsPerBlock = Math.max(1, Math.floor(4096 / codec.viewLength))
  }

  get length(): number { return this.#length }
  get byteLength(): number { return this.#length * this.codec.viewLength }
  get capacityBytes(): number { return this.#blocks.length * this.#recordsPerBlock * this.codec.viewLength }

  append(value: T): number {
    const index = this.#length
    if (!Number.isSafeInteger((index + 1) * this.codec.viewLength)) {
      throw new RangeError("Переполнение размера двоичных записей")
    }
    const blockId = Math.floor(index / this.#recordsPerBlock)
    if (this.#blocks[blockId] === undefined) {
      this.#blocks.push(new DataView(new ArrayBuffer(this.#recordsPerBlock * this.codec.viewLength)))
    }
    this.codec.encode(value, this.#blocks[blockId]!, (index % this.#recordsPerBlock) * this.codec.viewLength)
    this.#length++
    return index
  }

  read(index: number): T {
    this.#assertIndex(index)
    return this.codec.decode(this.#blocks[Math.floor(index / this.#recordsPerBlock)]!,
      (index % this.#recordsPerBlock) * this.codec.viewLength)
  }

  write(index: number, value: T): void {
    this.#assertIndex(index)
    this.codec.encode(value, this.#blocks[Math.floor(index / this.#recordsPerBlock)]!,
      (index % this.#recordsPerBlock) * this.codec.viewLength)
  }

  copyTo(target: Uint8Array<ArrayBufferLike>, offset: number): number {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > target.byteLength - this.byteLength) {
      throw new RangeError("Двоичные записи не помещаются в целевой диапазон")
    }
    let copied = 0
    for (const block of this.#blocks) {
      const length = Math.min(block.byteLength, this.byteLength - copied)
      if (length <= 0) break
      target.set(new Uint8Array(block.buffer, block.byteOffset, length), offset + copied)
      copied += length
    }
    return copied
  }

  clear(): void {
    this.#blocks.length = 0
    this.#length = 0
  }

  #assertIndex(index: number): void {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.#length) {
      throw new RangeError(`Неизвестная двоичная запись: ${index}`)
    }
  }
}
