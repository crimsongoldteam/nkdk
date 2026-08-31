# Избыточная основа управляемой формы — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не сохранять при импорте и запрещать при валидации `БазоваяФорма.yaml`, если её смысловое содержимое полностью восстанавливается из текущей формы `cf` и рабочей формы `cfe`.

**Architecture:** Concrete-модуль `ClientApplicationForm` вводит один предикат необходимости основы: он симметрично проецирует текущую форму `cf` и сохранённую основу относительно рабочей формы `cfe`, затем сравнивает нормализованные YAML-модели. Импорт вызывает предикат до записи файла, а валидатор получает те же три смысловые модели из payload корневых `document`-фактов одного снимка ProjectState; нейтральные слои только сохраняют непрозрачную строку payload.

**Tech Stack:** TypeScript 7, Vitest 4, YAML runtime metadata, ClientApplicationForm base-form projection, ProjectState structured documents.

**Spec:** `docs/superpowers/specs/2026-08-30-reliable-long-mcp-operations-and-created-resource-sync-design.md`, часть 3 «Избыточная БазоваяФорма.yaml».

## Global Constraints

- Договор действует только для управляемых форм `ClientApplicationForm`, одинаково для вложенных и общих форм.
- Сравниваются смысловые модели, а не текст или байты YAML; порядок ключей объектов и технические XML-поля незначимы, порядок массивов и иерархия элементов значимы.
- Текущая форма `cf` и сохранённая основа проходят один проектор относительно одной рабочей формы `cfe`; `События` исключаются симметрично.
- Значимое отличие сохранённой основы остаётся допустимым и участвует в round-trip.
- При отсутствии любой из трёх моделей валидатор не выдаёт предположительную диагностику избыточности.
- Валидация использует один подтверждённый снимок ProjectState и не перечитывает связанные YAML-файлы с диска.
- Нейтральные слои ProjectState не знают имён `БазоваяФорма.yaml`, каталогов `Формы`/`ОбщаяФорма` и конкретных `itemType`.
- Новый пользовательский файл, отдельная таблица ProjectState и новые применения `!xml` не создаются.
- Существующие XML-фикстуры не изменяются.
- База проверки дублей до реализации: `0be52d22726dfbd408a8e36cde0888cdd2bab97d`.

---

### Task 1: Единый смысловой предикат необходимости основы

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/baseFormNecessity.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/baseFormNecessity.test.ts`
- Reuse: `packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Reuse: `packages/rules/metadata/forms/clientApplicationForm/baseFormYaml.ts`

**Interfaces:**
- Consumes: `ClientApplicationFormYAML`, необязательный `MetadataItemRule`, `projectClientApplicationBaseForm`, `equalBaseFormYaml`.
- Produces: `isRedundantClientApplicationBaseForm(params): boolean`.

- [ ] **Step 1: Добавить падающие тесты симметричной проекции**

Создать `baseFormNecessity.test.ts` с тремя договорами:

```ts
import { describe, expect, it } from "vitest"
import { isRedundantClientApplicationBaseForm } from "./baseFormNecessity"

describe("необходимость сохранённой основы формы", () => {
  const extensionYaml = {
    События: { ПриОткрытии: "ОбработкаОткрытия" },
    Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 20 } },
  }
  const currentConfigurationYaml = {
    _version: "2.20",
    События: { ПриОткрытии: "ОбработкаОткрытия" },
    Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 20 } },
  }

  it("считает избыточной основу с теми же Событиями и техническими полями", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml,
      extensionYaml,
      savedBaseYaml: {
        Элементы: { Поле: { Ширина: 20, Вид: "ПолеВвода", _id: "7" } },
        События: { ПриОткрытии: "ОбработкаОткрытия" },
      },
    })).toBe(true)
  })

  it("сохраняет основу со значимым отличием", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml,
      extensionYaml,
      savedBaseYaml: { Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 99 } } },
    })).toBe(false)
  })

  it("учитывает порядок и иерархию элементов", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml,
      extensionYaml,
      savedBaseYaml: {
        Элементы: { Группа: { Вид: "Группа", Элементы: { Поле: { Вид: "ПолеВвода" } } } },
      },
    })).toBe(false)
  })
})
```

Добавить параметризованные варианты значимого отличия для корневого свойства, состава `Реквизиты`, `Команды`, `Параметры` и вложенного состава `Элементы`; каждый вариант должен возвращать `false`.

- [ ] **Step 2: Запустить тест и подтвердить отсутствие предиката**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/baseFormNecessity.test.ts
```

Expected: FAIL — модуль `baseFormNecessity` отсутствует.

- [ ] **Step 3: Реализовать предикат через две одинаковые проекции**

В `baseFormNecessity.ts` добавить:

```ts
import type { MetadataItemRule } from "../../ruleRuntime"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import { equalBaseFormYaml } from "./baseFormYaml"
import type { ClientApplicationFormYAML } from "./types"

export function isRedundantClientApplicationBaseForm(params: {
  readonly currentConfigurationYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly savedBaseYaml: ClientApplicationFormYAML
  readonly rule?: MetadataItemRule
}): boolean {
  const expected = projectClientApplicationBaseForm({
    baseYaml: params.currentConfigurationYaml,
    extensionYaml: params.extensionYaml,
    ...(params.rule === undefined ? {} : { rule: params.rule }),
  })
  const saved = projectClientApplicationBaseForm({
    baseYaml: params.savedBaseYaml,
    extensionYaml: params.extensionYaml,
    ...(params.rule === undefined ? {} : { rule: params.rule }),
  })
  return equalBaseFormYaml(saved.yaml, expected.yaml)
}
```

Не добавлять отдельное исключение для `События`: симметрию обеспечивает существующая регистрация `eventBaseFormProjectionRules`.

- [ ] **Step 4: Запустить тесты проекции и сравнения**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/baseFormNecessity.test.ts metadata/forms/clientApplicationForm/baseFormProjection.test.ts metadata/forms/clientApplicationForm/baseFormYaml.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: все тесты PASS, type-check exit 0.

- [ ] **Step 5: Проверить дубли и закоммитить предикат**

```bash
pnpm duplicates -- --base 0be52d22726dfbd408a8e36cde0888cdd2bab97d
git add packages/rules/metadata/forms/clientApplicationForm/baseFormNecessity.ts packages/rules/metadata/forms/clientApplicationForm/baseFormNecessity.test.ts
git commit -m "fix: :bug: определить избыточную основу формы"
```

### Task 2: Не записывать избыточную основу при XML-импорте

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.ts:1190-1233`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`

**Interfaces:**
- Consumes: `isRedundantClientApplicationBaseForm`, завершённый candidate, текущую форму `cf`, рабочую форму `cfe`.
- Produces: `prepareBaseFormCandidate(...)` возвращает `undefined` только при доказанной избыточности; значимо отличающийся candidate возвращается без изменения.

- [ ] **Step 1: Добавить импортный сценарий с восстановимой основой**

В `importConfigurationExtension.integration.test.ts` программно создать в копии входного XML третью форму `ФормаРавнаяОснова` без изменения исходных фикстур:

1. Скопировать metadata и каталог `Ext` формы `ФормаОтчета` под новым именем и заменить UUID/имя так же, как делает `addFormWithoutBase`.
2. Добавить имя формы в `ChildObjects` расширения и основной конфигурации.
3. Для основной конфигурации сформировать тело из `minimal.xml` и `baseFormAttributesXml()` существующим способом.
4. В рабочем теле расширения заменить содержимое `BaseForm` на то же тело основной формы, включая блок `Events`, но оставить собственные элементы рабочей формы вне `BaseForm`.
5. После импорта закрепить отсутствие файла:

```ts
expect(fs.existsSync(join(
  projectDir,
  "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Формы/ФормаРавнаяОснова/БазоваяФорма.yaml",
))).toBe(false)
```

Существующее утверждение для `ФормаОтчета` оставить: её `Ширина: 99` и аномалия являются значимыми отличиями, поэтому файл должен сохраниться.

Тем же helper создать восстановимую общую форму `ОбщаяРавнаяОснова`: добавить её XML-описатель и тело в `CommonForms`, зарегистрировать в `ChildObjects` обеих конфигураций и проверить отсутствие `cfe/РасширениеКонтроль/ОбщаяФорма/ОбщаяРавнаяОснова/БазоваяФорма.yaml`. Оба размещения проходят один production-путь `prepareBaseFormCandidate`; никаких условий по физическому пути в worker не добавлять.

- [ ] **Step 2: Запустить интеграционный тест и подтвердить лишний файл**

Run outside sandbox because the test uses LMDB:

```bash
pnpm --filter @nkdk/rules exec vitest run --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
```

Expected: новый сценарий FAIL — `БазоваяФорма.yaml` для `ФормаРавнаяОснова` существует; остальные утверждения PASS.

- [ ] **Step 3: Подключить общий предикат в worker**

В `worker.ts` удалить прямой импорт `equalBaseFormYaml` и заменить локальную одностороннюю проверку:

```ts
const projection = projectClientApplicationBaseForm({
  baseYaml: current,
  extensionYaml: extension,
  rule,
})
return equalBaseFormYaml(candidate, projection.yaml) ? undefined : candidate
```

на:

```ts
return isRedundantClientApplicationBaseForm({
  currentConfigurationYaml: clientApplicationFormYaml(currentForm.yaml, params.candidate.baseProjectPath),
  extensionYaml: clientApplicationFormYaml(extensionForm.yaml, params.candidate.targetProjectPath),
  savedBaseYaml: clientApplicationFormYaml(params.candidate.yaml, params.candidate.targetProjectPath),
  rule: params.candidate.rule,
})
  ? undefined
  : params.candidate
```

Остальную финализацию deferred values и DataPath candidate выполнять до сравнения как сейчас.

- [ ] **Step 4: Повторить импортный тест и type-check**

```bash
pnpm --filter @nkdk/rules exec vitest run --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: восстановимая основа не записана, значимо отличающаяся основа сохранена, команды exit 0.

- [ ] **Step 5: Проверить дубли и закоммитить импорт**

```bash
pnpm duplicates -- --base 0be52d22726dfbd408a8e36cde0888cdd2bab97d
git add packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts
git commit -m "fix: :bug: не сохранять восстановимую основу формы"
```

### Task 3: Передать смысловую форму через ProjectState и запретить избыточный файл

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/formSemanticPayload.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/formSemanticPayload.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`
- Modify: `packages/rules/metadata/project/projectStateYamlUpdate.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Consumes: `normalizeBaseFormYaml`, существующее строковое поле `ProjectStateStructuredDocumentEntry.payload`, query port ProjectState.
- Produces: `serializeClientApplicationFormSemanticPayload(yaml): string`, `parseClientApplicationFormSemanticPayload(payload): ClientApplicationFormYAML | undefined`, payload корневой записи `componentKind: "document"`, диагностику избыточной основы.

- [ ] **Step 1: Добавить падающие тесты переносимого payload**

В `formSemanticPayload.test.ts` закрепить версионный договор и отказ от некорректных данных:

```ts
import { expect, it } from "vitest"
import {
  parseClientApplicationFormSemanticPayload,
  serializeClientApplicationFormSemanticPayload,
} from "./formSemanticPayload"

it("сериализует нормализованную смысловую форму", () => {
  const payload = serializeClientApplicationFormSemanticPayload({
    _version: "2.20",
    Элементы: { Поле: { Вид: "ПолеВвода", _id: "7" } },
  })
  expect(JSON.parse(payload)).toEqual({
    version: 1,
    yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
  })
  expect(parseClientApplicationFormSemanticPayload(payload)).toEqual({
    Элементы: { Поле: { Вид: "ПолеВвода" } },
  })
})

it.each([undefined, "{}", "{broken"])("не принимает неизвестный payload %s", (payload) => {
  expect(parseClientApplicationFormSemanticPayload(payload)).toBeUndefined()
})
```

В `formStructureProjection.test.ts` потребовать у единственной корневой записи `document` payload с полной моделью формы, а у записей элементов сохранить существующие DataPath payload.

- [ ] **Step 2: Запустить тесты и подтвердить отсутствие смыслового payload**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/formSemanticPayload.test.ts metadata/forms/clientApplicationForm/formStructureProjection.test.ts
```

Expected: FAIL — функций сериализации нет, корневая запись `document` не содержит модель формы.

- [ ] **Step 3: Реализовать версионный payload в concrete-модуле формы**

В `formSemanticPayload.ts` реализовать:

```ts
import { normalizeBaseFormYaml } from "./baseFormYaml"
import type { ClientApplicationFormYAML } from "./types"

interface ClientApplicationFormSemanticPayloadV1 {
  readonly version: 1
  readonly yaml: ClientApplicationFormYAML
}

export function serializeClientApplicationFormSemanticPayload(yaml: unknown): string {
  return JSON.stringify({ version: 1, yaml: normalizeBaseFormYaml(yaml) })
}

export function parseClientApplicationFormSemanticPayload(
  payload: string | undefined,
): ClientApplicationFormYAML | undefined {
  if (payload === undefined) return undefined
  try {
    const parsed = JSON.parse(payload) as Partial<ClientApplicationFormSemanticPayloadV1>
    return parsed.version === 1 && isRecord(parsed.yaml)
      ? parsed.yaml as ClientApplicationFormYAML
      : undefined
  } catch {
    return undefined
  }
}
```

Локальный `isRecord` принимает только ненулевой объект не-массив. Не расширять общие типы ProjectState: поле `payload?: string` уже поддерживается fragment/snapshot и строковым пулом.

- [ ] **Step 4: Поместить модель в существующую запись document**

В `collectClientApplicationFormStructure` первой записью вернуть служебный компонент:

```ts
{
  componentKind: "document",
  name: "",
  yamlPath: [],
  payload: serializeClientApplicationFormSemanticPayload(yaml),
}
```

В `projectClientApplicationFormStructure` найти этот компонент, перенести его payload в уже существующую корневую запись `document`, а при проекции остальных компонентов исключить служебный компонент. Результат должен содержать ровно одну запись `componentKind: "document"`; общая сигнатура `MetadataFormStructureProjection` не меняется.

В `projectStateYamlUpdate.integration.test.ts` дополнить существующий тест рабочей формы:

```ts
const document = update.structuredDocuments?.find(({ componentKind }) => componentKind === "document")
expect(JSON.parse(document?.payload ?? "null")).toMatchObject({
  version: 1,
  yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
})
```

- [ ] **Step 5: Добавить падающие тесты диагностики избыточности**

В `borrowedFormValidation.test.ts` расширить helper `fact` возможностью задать payload корневой записи и добавить:

```ts
it("запрещает полностью восстановимую сохранённую основу", () => {
  const current = { События: { ПриОткрытии: "Обработка" }, Элементы: { Поле: { Вид: "ПолеВвода" } } }
  const extension = { События: { ПриОткрытии: "Обработка" }, Элементы: { Поле: { Вид: "ПолеВвода" } } }
  const saved = { Элементы: { Поле: { Вид: "ПолеВвода" } }, События: { ПриОткрытии: "Обработка" } }
  const diagnostics = validate([
    document("cf", "working", current),
    document("cfe/X", "working", extension),
    document("cfe/X", "base", saved, "БазоваяФорма.yaml"),
  ])
  expect(diagnostics).toContainEqual(expect.objectContaining({
    severity: "error",
    filePath: join("/project/cfe/X/БазоваяФорма.yaml"),
    path: "/",
    message: "БазоваяФорма.yaml избыточна: основа полностью восстанавливается из основной конфигурации и рабочей формы расширения",
  }))
})
```

Добавить соседние тесты:

- `Ширина: 99` в сохранённой основе не даёт диагностику избыточности;
- отсутствие payload `cf`, `cfe` или основы не даёт диагностику избыточности;
- тот же договор работает с логическим адресом общей формы и путём `ОбщаяФорма/РабочийСтол/БазоваяФорма.yaml`.

В `projectStateDependencyValidation.test.ts` добавить транзакционный сценарий: подтвердить снимок с `cf`, рабочей формой `cfe` и избыточной основой, получить новую ошибку, затем начать обновление, вызвать `store.deleteFiles([base.projectPath])` и убедиться, что повторная Б5 больше не возвращает диагностику избыточности. Это закрепляет очистку ошибки после инкрементального удаления файла, а не только прямой вызов валидатора.

- [ ] **Step 6: Реализовать проверку в валидаторе формы**

В цикле `baseGroups` функции `validateBorrowedClientApplicationForms`:

1. Получить корневую запись сохранённой основы из `baseFacts`.
2. Получить корневую запись рабочей формы того же компонента через `groupFactsByAddress(workingGroups, ...)`.
3. Получить корневую запись текущей формы `cf` через существующий `queryPort.readStructuredDocumentEntries({ componentPath: "cf", logicalAddress })`.
4. Разобрать три payload через `parseClientApplicationFormSemanticPayload`.
5. Только при наличии всех трёх моделей вызвать `isRedundantClientApplicationBaseForm`.
6. При `true` добавить одну диагностику на `first.projectPath` с `severity: "error"`, `source: "cross-file"`, `line: 1`, `col: 1`, `path: "/"` и точным сообщением из спеки.

Не добавлять проверок физического пути или типа владельца: группы уже отобраны по `documentKind: "clientApplicationForm"`, роли `base` и `working`, адресу и component path.

- [ ] **Step 7: Запустить проверки ProjectState и валидатора**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/formSemanticPayload.test.ts metadata/forms/clientApplicationForm/formStructureProjection.test.ts metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/project/projectStateYamlUpdate.integration.test.ts metadata/validation/projectStateDependencyValidation.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: все тесты PASS; payload проходит первый проход и ProjectState, диагностика появляется только при доказанном равенстве.

- [ ] **Step 8: Проверить дубли и закоммитить валидацию**

```bash
pnpm duplicates -- --base 0be52d22726dfbd408a8e36cde0888cdd2bab97d
git add packages/rules/metadata/forms/clientApplicationForm/formSemanticPayload.ts packages/rules/metadata/forms/clientApplicationForm/formSemanticPayload.test.ts packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.ts packages/rules/metadata/forms/clientApplicationForm/formStructureProjection.test.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts packages/rules/metadata/project/projectStateYamlUpdate.integration.test.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "fix: :bug: запретить избыточную основу формы"
```

### Task 4: Архитектурный договор и полная проверка

**Files:**
- Modify after explicit approval: `.agents/architecture.md`
- Verify: `docs/superpowers/specs/2026-08-30-reliable-long-mcp-operations-and-created-resource-sync-design.md`
- Verify: all files changed by Tasks 1-3.

**Interfaces:**
- Consumes: итоговый предикат, payload ProjectState и валидатор.
- Produces: документированный concrete-договор и полностью проверенную реализацию без расхождений со спецификацией.

- [ ] **Step 1: После явного разрешения обновить architecture.md**

В разделе архитектуры metadata-операций зафиксировать нейтральный договор:

- structured document может хранить переносимое смысловое представление в непрозрачном строковом payload;
- ProjectState сохраняет и возвращает payload, но не интерпретирует его;
- concrete-модуль формы отвечает за сериализацию, разбор, проекцию и межфайловую диагностику;
- все связанные представления для сравнения читаются из одного подтверждённого снимка, без повторного чтения YAML с диска.

Не упоминать `БазоваяФорма.yaml` и имена каталогов как условия нейтральных слоёв.

- [ ] **Step 2: Запустить полный набор обязательных проверок**

Сначала выполнить точечные регрессии экспорта: существующие тесты должны по-прежнему восстанавливать `BaseForm` из `cf` при отсутствии файла и использовать сохранённую основу при значимом отличии.

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/forms/clientApplicationForm/syncToXML.integration.test.ts metadata/fullSyncToXml/baseFormSource.integration.test.ts
```

Затем выполнить полный набор. Run `pnpm test` outside sandbox because LMDB uses mmap and file locks:

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 0be52d22726dfbd408a8e36cde0888cdd2bab97d
```

Expected: все команды exit 0, новые дубли и архитектурные нарушения отсутствуют.

- [ ] **Step 3: Закоммитить архитектурное уточнение отдельно**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: описать смысловой payload форм"
```

- [ ] **Step 4: Провести независимое ревью полного diff**

По навыку `executing-plans-with-review` передать одному ревьюеру:

- спецификацию `docs/superpowers/specs/2026-08-30-reliable-long-mcp-operations-and-created-resource-sync-design.md`;
- этот план;
- зафиксированный перед реализацией base SHA;
- путь worktree `C:/git/nkdk/.worktrees/fix-designer-agent-prompt-diagnostics`.

Ревьюер проверяет все коммиты, staged/unstaged изменения и связанные untracked-файлы после base SHA, не редактирует файлы и возвращает `APPROVED` либо `CHANGES_REQUIRED` по договору навыка. При замечаниях основной агент исправляет их, повторяет затронутые проверки и возвращает тому же ревьюеру полный обновлённый diff до `APPROVED`.

- [ ] **Step 5: Повторить финальные проверки на одобренном дереве**

После `APPROVED` снова выполнить:

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 0be52d22726dfbd408a8e36cde0888cdd2bab97d
```

Если любая команда меняет файлы или требует исправления, одобрение аннулируется и полный результат повторно передаётся тому же ревьюеру.
