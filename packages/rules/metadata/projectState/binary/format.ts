import { ProjectStateHeaderRecordView, ProjectStateSectionRecordView } from "./layouts"

export const PROJECT_STATE_FORMAT_VERSION = Object.freeze({ major: 0, minor: 6, patch: 0 })

export type ProjectStateSectionKind =
  | "strings"
  | "files"
  | "facts"
  | "lookups"
  | "diagnostics"

export interface ProjectStateSectionDescriptor {
  readonly kind: ProjectStateSectionKind
  readonly offset: number
  readonly byteLength: number
  readonly records: number
}

const MAGIC_FIRST = 0x4b444b4e
const MAGIC_SECOND = 0x54415453
const MAX_UINT16 = 0xffff
const MAX_UINT32 = 0xffff_ffff
const MAX_UINT64 = 0xffff_ffff_ffff_ffffn

const SECTION_KIND_IDS: Readonly<Record<ProjectStateSectionKind, number>> = {
  strings: 1,
  files: 2,
  facts: 3,
  lookups: 4,
  diagnostics: 5,
}

const SECTION_KINDS = new Map(
  Object.entries(SECTION_KIND_IDS).map(([kind, id]) => [id, kind as ProjectStateSectionKind]),
)

function assertUnsignedInteger(value: number, maximum: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${field} должен быть целым числом от 0 до ${maximum}`)
  }
}

function assertSections(
  sections: readonly ProjectStateSectionDescriptor[],
  headerByteLength: number,
): void {
  let previousEnd = headerByteLength

  for (const section of sections) {
    assertUnsignedInteger(section.offset, MAX_UINT32, `Смещение раздела ${section.kind}`)
    assertUnsignedInteger(section.byteLength, MAX_UINT32, `Размер раздела ${section.kind}`)
    assertUnsignedInteger(section.records, MAX_UINT32, `Число записей раздела ${section.kind}`)

    if (section.offset < previousEnd) {
      throw new Error(`Раздел ${section.kind} нарушает порядок или пересекается с предыдущим`)
    }

    previousEnd = section.offset + section.byteLength
  }
}

export function encodeProjectStateHeader(input: {
  readonly sections: readonly ProjectStateSectionDescriptor[]
  readonly payloadHash: bigint
}): Uint8Array<ArrayBuffer> {
  assertUnsignedInteger(input.sections.length, MAX_UINT16, "Число разделов")
  if (input.payloadHash < 0n || input.payloadHash > MAX_UINT64) {
    throw new Error("Хэш полезных данных должен быть беззнаковым 64-битным числом")
  }

  const headerByteLength =
    ProjectStateHeaderRecordView.viewLength +
    input.sections.length * ProjectStateSectionRecordView.viewLength
  assertSections(input.sections, headerByteLength)

  const buffer = new ArrayBuffer(headerByteLength)
  const view = new DataView(buffer)

  ProjectStateHeaderRecordView.encode(
    {
      magicFirst: MAGIC_FIRST,
      magicSecond: MAGIC_SECOND,
      ...PROJECT_STATE_FORMAT_VERSION,
      sectionCount: input.sections.length,
      payloadHash: input.payloadHash,
      headerByteLength,
      reserved: 0,
    },
    view,
  )

  input.sections.forEach((section, index) => {
    ProjectStateSectionRecordView.encode(
      {
        kind: SECTION_KIND_IDS[section.kind],
        reserved: 0,
        offset: section.offset,
        byteLength: section.byteLength,
        records: section.records,
      },
      view,
      ProjectStateHeaderRecordView.viewLength + index * ProjectStateSectionRecordView.viewLength,
    )
  })

  return new Uint8Array(buffer)
}

export function decodeProjectStateHeader(bytes: Uint8Array): {
  readonly version: typeof PROJECT_STATE_FORMAT_VERSION
  readonly sections: readonly ProjectStateSectionDescriptor[]
  readonly payloadHash: bigint
} {
  if (bytes.byteLength < ProjectStateHeaderRecordView.viewLength) {
    throw new Error("Заголовок состояния проекта оборван")
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const header = ProjectStateHeaderRecordView.decode(view)

  if (header.magicFirst !== MAGIC_FIRST || header.magicSecond !== MAGIC_SECOND) {
    throw new Error("Неверная сигнатура состояния проекта")
  }

  if (
    header.major !== PROJECT_STATE_FORMAT_VERSION.major ||
    header.minor !== PROJECT_STATE_FORMAT_VERSION.minor ||
    header.patch !== PROJECT_STATE_FORMAT_VERSION.patch
  ) {
    throw new Error(
      `Несовместимая версия состояния проекта: ожидается ${PROJECT_STATE_FORMAT_VERSION.major}.${PROJECT_STATE_FORMAT_VERSION.minor}.${PROJECT_STATE_FORMAT_VERSION.patch}`,
    )
  }

  const expectedHeaderByteLength =
    ProjectStateHeaderRecordView.viewLength +
    header.sectionCount * ProjectStateSectionRecordView.viewLength
  if (
    header.headerByteLength !== expectedHeaderByteLength ||
    header.headerByteLength > bytes.byteLength
  ) {
    throw new Error("Неверная длина заголовка состояния проекта")
  }

  const sections = Array.from({ length: header.sectionCount }, (_, index) => {
    const section = ProjectStateSectionRecordView.decode(
      view,
      ProjectStateHeaderRecordView.viewLength + index * ProjectStateSectionRecordView.viewLength,
    )
    const kind = SECTION_KINDS.get(section.kind)
    if (kind === undefined) {
      throw new Error(`Неизвестный раздел состояния проекта: ${section.kind}`)
    }
    return {
      kind,
      offset: section.offset,
      byteLength: section.byteLength,
      records: section.records,
    }
  })

  assertSections(sections, header.headerByteLength)

  return {
    version: PROJECT_STATE_FORMAT_VERSION,
    sections,
    payloadHash: header.payloadHash,
  }
}
