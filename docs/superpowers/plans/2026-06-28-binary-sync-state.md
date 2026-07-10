# Binary Sync State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace slow YAML parsing of XML sync state with a compact binary `.nkdk-sync.bin` format while keeping one-time legacy YAML migration.

**Architecture:** Add a focused binary codec module next to the existing sync state code, then make `readXmlSyncState` prefer binary and fall back to legacy YAML only when binary is absent. Keep the public `XmlSyncState` shape unchanged for this stage, so hashing, diffing, planning, and XML sync code do not need broad changes.

**Tech Stack:** TypeScript, Node `Buffer`, `fs.promises`, Vitest, existing `yaml` package for legacy fallback, existing `xxh3-64` string format at the public API boundary.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts`
  - Owns binary constants, encode/decode, file IO for `.nkdk-sync.bin`.
  - Does not import YAML, hashing, discovery, or XML sync logic.
  - Exposes `BINARY_SYNC_STATE_FILE`, `readBinaryXmlSyncState`, `writeBinaryXmlSyncState`, `encodeBinaryXmlSyncState`, `decodeBinaryXmlSyncState`.

- Modify `packages/core/metadata/appliedObjects/configuration/syncState.ts`
  - Keep public `XmlSyncState`, `readXmlSyncState`, `writeXmlSyncState`, `hashProjectFiles`, `diffSyncState`.
  - Add `BINARY_SYNC_STATE_FILE` re-export.
  - Make reads prefer `.nkdk-sync.bin`; if absent, read legacy `.nkdk-sync.yaml`.
  - Make writes emit `.nkdk-sync.bin` only.
  - Keep `SYNC_STATE_FILE = ".nkdk-sync.yaml"` for legacy fallback and tests.

- Modify `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`
  - Update existing write/read tests for binary primary format.
  - Add legacy YAML fallback tests.
  - Add invalid binary tests.
  - Keep hashing and diff tests unchanged except imports/expectations.

## Task 1: Add Binary Codec Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Add failing imports to the test**

Modify the import block in `packages/core/metadata/appliedObjects/configuration/syncState.test.ts` to include the binary file constant and codec helpers:

```ts
import {
  BINARY_SYNC_STATE_FILE,
  decodeBinaryXmlSyncState,
  encodeBinaryXmlSyncState,
} from "./syncStateBinary"
```

Keep the existing import from `./syncState`.

- [ ] **Step 2: Add a failing binary round-trip test**

Add this test near the top of `describe("xml sync state", ...)`, before the current write/read test:

```ts
  it("encodes and decodes binary sync state", () => {
    const state = {
      version: 1 as const,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    }

    const encoded = encodeBinaryXmlSyncState(state)

    expect(encoded.subarray(0, 8).toString("ascii")).toBe("NKDKSYNC")
    expect(decodeBinaryXmlSyncState(encoded)).toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })
```

- [ ] **Step 3: Add failing invalid binary tests**

Add these tests after the binary round-trip test:

```ts
  it("rejects binary sync state with invalid magic", () => {
    const buffer = Buffer.from("NOTSTATE")

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })

  it("rejects binary sync state with unsupported version", () => {
    const buffer = Buffer.alloc(14)
    buffer.write("NKDKSYNC", 0, "ascii")
    buffer.writeUInt16LE(2, 8)
    buffer.writeUInt32LE(0, 10)

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })

  it("rejects truncated binary sync state entries", () => {
    const buffer = Buffer.alloc(14)
    buffer.write("NKDKSYNC", 0, "ascii")
    buffer.writeUInt16LE(1, 8)
    buffer.writeUInt32LE(1, 10)

    expect(() => decodeBinaryXmlSyncState(buffer)).toThrow("Некорректный .nkdk-sync.bin")
  })
```

- [ ] **Step 4: Create a stub module so tests compile**

Create `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts` with temporary stubs:

```ts
import type { XmlSyncState } from "./syncState"

export const BINARY_SYNC_STATE_FILE = ".nkdk-sync.bin"

export function encodeBinaryXmlSyncState(_state: XmlSyncState): Buffer {
  throw new Error("not implemented")
}

export function decodeBinaryXmlSyncState(_buffer: Buffer): XmlSyncState {
  throw new Error("not implemented")
}

export async function readBinaryXmlSyncState(_xmlDir: string): Promise<XmlSyncState> {
  throw new Error("not implemented")
}

export async function writeBinaryXmlSyncState(_xmlDir: string, _state: XmlSyncState): Promise<void> {
  throw new Error("not implemented")
}
```

- [ ] **Step 5: Run tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: FAIL. The new tests fail with `not implemented` from `encodeBinaryXmlSyncState` and `decodeBinaryXmlSyncState`.

## Task 2: Implement Binary Codec

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Replace stubs with binary implementation**

Replace the full contents of `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts` with:

```ts
import fs from "fs"
import { join } from "path"
import type { XmlSyncState } from "./syncState"

export const BINARY_SYNC_STATE_FILE = ".nkdk-sync.bin"

const MAGIC = "NKDKSYNC"
const MAGIC_LENGTH = 8
const HEADER_LENGTH = MAGIC_LENGTH + 2 + 4
const VERSION = 1
const UINT32_BYTES = 4
const UINT64_BYTES = 8
const HASH_PREFIX = "xxh3-64:"
const HASH_HEX_LENGTH = 16

export function encodeBinaryXmlSyncState(state: XmlSyncState): Buffer {
  const entries = Object.entries(state.files).sort(([left], [right]) => left.localeCompare(right, "ru"))
  const encodedPaths = entries.map(([path]) => Buffer.from(path, "utf-8"))
  const totalLength =
    HEADER_LENGTH +
    entries.reduce((sum, [, hash], index) => {
      assertHash(hash)
      return sum + UINT32_BYTES + encodedPaths[index].length + UINT64_BYTES
    }, 0)

  const buffer = Buffer.allocUnsafe(totalLength)
  let offset = 0
  buffer.write(MAGIC, offset, MAGIC_LENGTH, "ascii")
  offset += MAGIC_LENGTH
  buffer.writeUInt16LE(VERSION, offset)
  offset += 2
  buffer.writeUInt32LE(entries.length, offset)
  offset += 4

  for (let index = 0; index < entries.length; index += 1) {
    const [path, hash] = entries[index]
    const pathBuffer = encodedPaths[index]
    buffer.writeUInt32LE(pathBuffer.length, offset)
    offset += UINT32_BYTES
    pathBuffer.copy(buffer, offset)
    offset += pathBuffer.length
    buffer.writeBigUInt64LE(hashToBigInt(hash), offset)
    offset += UINT64_BYTES
  }

  return buffer
}

export function decodeBinaryXmlSyncState(buffer: Buffer): XmlSyncState {
  try {
    if (buffer.length < HEADER_LENGTH) throw new Error("header")
    if (buffer.subarray(0, MAGIC_LENGTH).toString("ascii") !== MAGIC) throw new Error("magic")

    let offset = MAGIC_LENGTH
    const version = buffer.readUInt16LE(offset)
    offset += 2
    if (version !== VERSION) throw new Error("version")

    const entryCount = buffer.readUInt32LE(offset)
    offset += 4
    const files: Record<string, string> = {}

    for (let index = 0; index < entryCount; index += 1) {
      ensureAvailable(buffer, offset, UINT32_BYTES)
      const pathLength = buffer.readUInt32LE(offset)
      offset += UINT32_BYTES
      ensureAvailable(buffer, offset, pathLength + UINT64_BYTES)
      const path = buffer.subarray(offset, offset + pathLength).toString("utf-8")
      offset += pathLength
      const hash = buffer.readBigUInt64LE(offset)
      offset += UINT64_BYTES
      files[path] = `${HASH_PREFIX}${hash.toString(16).padStart(HASH_HEX_LENGTH, "0")}`
    }

    if (offset !== buffer.length) throw new Error("trailing")

    return { version: 1, files }
  } catch {
    throw new Error(`Некорректный ${BINARY_SYNC_STATE_FILE}`)
  }
}

export async function readBinaryXmlSyncState(xmlDir: string): Promise<XmlSyncState> {
  const buffer = await fs.promises.readFile(join(xmlDir, BINARY_SYNC_STATE_FILE))
  return decodeBinaryXmlSyncState(buffer)
}

export async function writeBinaryXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await fs.promises.mkdir(xmlDir, { recursive: true })
  await fs.promises.writeFile(join(xmlDir, BINARY_SYNC_STATE_FILE), encodeBinaryXmlSyncState(state))
}

function ensureAvailable(buffer: Buffer, offset: number, length: number): void {
  if (length < 0 || offset + length > buffer.length) throw new Error("truncated")
}

function assertHash(hash: string): void {
  if (!new RegExp(`^${HASH_PREFIX}[0-9a-f]{${HASH_HEX_LENGTH}}$`).test(hash)) {
    throw new Error(`Некорректный hash sync state: ${hash}`)
  }
}

function hashToBigInt(hash: string): bigint {
  assertHash(hash)
  return BigInt(`0x${hash.slice(HASH_PREFIX.length)}`)
}
```

- [ ] **Step 2: Run binary codec tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS for the new codec tests. Existing write/read test may still expect YAML and can fail in later tasks only after integration changes; if it fails now, confirm the failure is not from the new codec tests before continuing.

- [ ] **Step 3: Commit binary codec**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "feat: :sparkles: добавить бинарный sync state"
```

## Task 3: Integrate Binary State Read/Write

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Update imports in `syncState.ts`**

Add this import to `packages/core/metadata/appliedObjects/configuration/syncState.ts`:

```ts
import {
  BINARY_SYNC_STATE_FILE,
  readBinaryXmlSyncState,
  writeBinaryXmlSyncState,
} from "./syncStateBinary"
```

Then add this export near `SYNC_STATE_FILE`:

```ts
export { BINARY_SYNC_STATE_FILE }
```

- [ ] **Step 2: Replace `readXmlSyncState` and `writeXmlSyncState`**

Replace the current `readXmlSyncState` and `writeXmlSyncState` functions in `syncState.ts` with:

```ts
export async function readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined> {
  const binaryPath = join(xmlDir, BINARY_SYNC_STATE_FILE)
  if (fs.existsSync(binaryPath)) return readBinaryXmlSyncState(xmlDir)

  const path = join(xmlDir, SYNC_STATE_FILE)
  if (!fs.existsSync(path)) return undefined

  const parsed = YAML.parse(await fs.promises.readFile(path, "utf-8")) as unknown
  if (!isXmlSyncState(parsed)) throw new Error(`Некорректный ${SYNC_STATE_FILE}`)

  return { version: 1, files: sortRecord(parsed.files) }
}

export async function writeXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await writeBinaryXmlSyncState(xmlDir, { version: 1, files: sortRecord(state.files) })
}
```

- [ ] **Step 3: Update the primary write/read test**

Replace the current test named `"writes and reads flat xxh3-64 state"` in `syncState.test.ts` with:

```ts
  it("writes and reads binary xxh3-64 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })

    expect(readFileSync(join(xmlDir, BINARY_SYNC_STATE_FILE)).subarray(0, 8).toString("ascii")).toBe("NKDKSYNC")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })
```

- [ ] **Step 4: Add legacy YAML fallback test**

Add this test after the primary binary write/read test:

```ts
  it("reads legacy YAML sync state when binary state is absent", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      [
        "version: 1",
        "files:",
        "  Справочник/Товары/Свойства.yaml: xxh3-64:0000000000000aaa",
        "  Справочник/Товары/Модуль.bsl: xxh3-64:0000000000000bbb",
        "",
      ].join("\n"),
      "utf-8",
    )

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
      },
    })
  })
```

- [ ] **Step 5: Add binary priority test**

Add this test after the legacy fallback test:

```ts
  it("prefers binary sync state over legacy YAML state", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      "version: 1\nfiles:\n  old.yaml: xxh3-64:0000000000000001\n",
      "utf-8",
    )
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "new.yaml": "xxh3-64:0000000000000002",
      },
    })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "new.yaml": "xxh3-64:0000000000000002",
      },
    })
  })
```

- [ ] **Step 6: Keep old SHA rejection test as legacy fallback**

The existing `"rejects old sha256 state"` test remains valid because it writes only `.nkdk-sync.yaml`.
Do not change it except imports if needed.

- [ ] **Step 7: Run sync state tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit integration**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "fix: :bug: читать бинарный sync state"
```

## Task 4: Verify CLI-Level Behavior

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts` only if a missing assertion is discovered
- No production files expected

- [ ] **Step 1: Run focused configuration tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS. This verifies `syncConfigurationIncrementallyToXML` still reads and writes state through the public API.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS across `packages/core`, `packages/cli`, and `packages/mcp`.

- [ ] **Step 3: If tests required changes, commit them**

Only if Step 1 or Step 2 required additional test adjustments, commit them:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "test: :white_check_mark: уточнить binary sync state"
```

If no changes were needed, skip this commit.

## Task 5: ERP Migration and Performance Verification

**Files:**
- No repository files should be modified
- External verification touches `/Users/nikita/git/round-trip/erp/.nkdk-sync.bin`

- [ ] **Step 1: Build binary sync state for ERP**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected:

```text
Файл .nkdk-sync.yaml обновлён
real <time>
```

Note: the CLI message may still mention `.nkdk-sync.yaml` until command text is updated in a later cleanup. The expected file after this task is `/Users/nikita/git/round-trip/erp/.nkdk-sync.bin`.

- [ ] **Step 2: Measure binary state read only**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import { performance } from "node:perf_hooks"; import { readXmlSyncState } from "./metadata/appliedObjects/configuration/syncState"; void (async()=>{ const t0=performance.now(); const state=await readXmlSyncState("/Users/nikita/git/round-trip/erp"); const t1=performance.now(); console.log(JSON.stringify({files: Object.keys(state?.files ?? {}).length, readSec:+((t1-t0)/1000).toFixed(3)}, null, 2)); })();'
```

Expected:

```json
{
  "files": 121463,
  "readSec": <well below 1 second on a warm run>
}
```

- [ ] **Step 3: Force one changed hash for sync verification**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import { readXmlSyncState, writeXmlSyncState } from "./metadata/appliedObjects/configuration/syncState"; void (async()=>{ const dir="/Users/nikita/git/round-trip/erp"; const state=await readXmlSyncState(dir); if(!state) throw new Error("state missing"); state.files["Справочник/Бригады/Свойства.yaml"]="xxh3-64:0000000000000000"; await writeXmlSyncState(dir,state); })();'
```

Expected: command exits with code `0`.

- [ ] **Step 4: Run one-file incremental sync timing**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- sync /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected:

```text
Готово: 1 успешно, 0 с ошибкой
real <time close to hash-all cost plus small overhead>
```

The target is much closer to the measured `~22s` hash time than the previous `~136s`.

- [ ] **Step 5: Check ERP tracked diff**

Run:

```bash
git -c core.quotePath=false status --short
```

in `/Users/nikita/git/round-trip/erp`.

Expected: no tracked `Configuration.xml` diff. Untracked state files may be present.

## Task 6: Final Review

**Files:**
- No changes expected unless verification uncovers a bug

- [ ] **Step 1: Inspect commits**

Run:

```bash
git log --oneline -5
git status --short --branch
```

Expected:

- branch is `incremental-xml-sync-state`
- working tree is clean
- recent commits include binary sync state implementation

- [ ] **Step 2: Summarize measured performance**

Prepare the final response with:

- old state read time: `66.563s`
- new state read time from Task 5
- full one-file sync time from Task 5
- test commands run
- commit hashes created

## Self-Review

- Spec coverage: binary format, YAML fallback, binary priority, invalid binary handling, write strategy, tests, and ERP measurements are covered.
- Placeholder scan: no placeholder markers or fill-in-later instructions remain.
- Type consistency: all planned functions use `XmlSyncState`, `Record<string, string>`, and the existing `xxh3-64:<16 hex>` public hash string format.
