# Round-trip Multi Dir And Top Level Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обновить short round-trip так, чтобы core-обход использовал `TopLevelMetadataItemRules`, а `/round-trip-xml` последовательно проверял несколько XML-каталогов и останавливался на первом каталоге с diff.

**Architecture:** Core-часть остаётся в `shortRoundTripXML.ts`, но вместо жёсткого `Catalogs` получает универсальный обход правил с `xmlDir`. Shell-раннер получает маленькие функции определения конфигурационного каталога, выбора последовательности запусков и вывода diff относительно каталога, на котором найдено расхождение.

**Tech Stack:** TypeScript, Vitest, Node `fs/path`, Bash, `git diff`, существующая команда `nkdk short-round-trip-test`.

---

## File Structure

- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts`
  - Расширяет существующий тест: проверяет не только `Catalogs`, но и `Documents`, `DocumentNumerators`, `Sequences`.
- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`
  - Заменяет жёсткий обход справочников на обход `TopLevelMetadataItemRules`.
  - Сохраняет обработку форм как вложенный шаг для каждого объекта.
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`
  - Определяет, является ли `NKDK_XML_DIR` одиночной конфигурацией или контейнером нескольких конфигураций.
  - Запускает `short-round-trip-test` по каталогам последовательно.
  - Останавливается на первом каталоге с diff.
- Modify: `.agents/skills/round-trip-xml/SKILL.md`
  - Обновляет описание шага 1 и stdout-протокола под multi-dir поведение.

## Task 1: Core Test For Registered Top-Level Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts`

- [ ] **Step 1: Extend the existing failing test**

Replace the current test body with this version. It keeps the existing catalog/form assertions and adds expectations for all XML directories already present in `packages/core/tests/fixtures/sync/syncConfiguration/xml`.

```ts
  it("round-trip XML -> модель -> XML должен быть идемпотентным для зарегистрированных типов", async () => {
    await shortRoundTripXML({ inputDir, outputDir })

    const expectedCatalogXML = readXMLFileAsString("sync/syncConfiguration/xml/Catalogs/Контрагенты.xml")
    const resultCatalogXML = fs.readFileSync(join(outputDir, "Catalogs", "Контрагенты.xml"), "utf-8")
    expect(resultCatalogXML).toBe(expectedCatalogXML)

    const expectedDocumentXML = readXMLFileAsString("sync/syncConfiguration/xml/Documents/ДокументПоУмолчанию.xml")
    const resultDocumentXML = fs.readFileSync(join(outputDir, "Documents", "ДокументПоУмолчанию.xml"), "utf-8")
    expect(resultDocumentXML).toBe(expectedDocumentXML)

    const expectedNumeratorXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/DocumentNumerators/НумераторПоУмолчанию.xml"
    )
    const resultNumeratorXML = fs.readFileSync(
      join(outputDir, "DocumentNumerators", "НумераторПоУмолчанию.xml"),
      "utf-8"
    )
    expect(resultNumeratorXML).toBe(expectedNumeratorXML)

    const expectedSequenceXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Sequences/ПоследовательностьПоУмолчанию.xml"
    )
    const resultSequenceXML = fs.readFileSync(
      join(outputDir, "Sequences", "ПоследовательностьПоУмолчанию.xml"),
      "utf-8"
    )
    expect(resultSequenceXML).toBe(expectedSequenceXML)

    const expectedFormXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"
    )
    const resultFormXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml"),
      "utf-8"
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetaXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента.xml"
    )
    const resultFormMetaXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml"),
      "utf-8"
    )
    expect(resultFormMetaXML).toBe(expectedFormMetaXML)
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: FAIL because `Documents/ДокументПоУмолчанию.xml`, `DocumentNumerators/НумераторПоУмолчанию.xml`, or `Sequences/ПоследовательностьПоУмолчанию.xml` is not written to `out-round-trip`.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
git commit -m "test: :white_check_mark: покрыть top-level round-trip"
```

## Task 2: Core Implementation Via TopLevelMetadataItemRules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`

- [ ] **Step 1: Replace the hard-coded imports**

Replace:

```ts
import { basename, join } from "path"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
```

with:

```ts
import { basename, join } from "path"
import { TopLevelMetadataItemRules } from "./topLevelRules"
```

- [ ] **Step 2: Add focused helpers above `shortRoundTripXML`**

Insert these helpers after `makeContextToXML`.

```ts
const getRuleXMLDir = (rule: (typeof TopLevelMetadataItemRules)[number]): string | undefined => {
  return "xmlDir" in rule && typeof rule.xmlDir === "string" ? rule.xmlDir : undefined
}

const readMetadataItemXML = (params: {
  itemDir: string
  itemName: string
  forReference: boolean
  rule: (typeof TopLevelMetadataItemRules)[number]
}) => {
  const xmlContent = fs.readFileSync(join(params.itemDir, `${params.itemName}.xml`), "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)

  return importMetadataItemFromXML({
    context: makeContextFromXML(params.forReference),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
}

const roundTripMetadataItemXML = (params: {
  inputDir: string
  outputDir: string
  itemName: string
  rule: (typeof TopLevelMetadataItemRules)[number]
}) => {
  const item = readMetadataItemXML({
    itemDir: params.inputDir,
    itemName: params.itemName,
    forReference: false,
    rule: params.rule,
  })
  const referenceItem = readMetadataItemXML({
    itemDir: params.inputDir,
    itemName: params.itemName,
    forReference: true,
    rule: params.rule,
  })

  const xmlObj = exportMetadataItemToXML({
    context: makeContextToXML(params.itemName),
    data: item,
    referenceData: referenceItem,
    rule: params.rule,
  })

  if (xmlObj) {
    fs.mkdirSync(params.outputDir, { recursive: true })
    fs.writeFileSync(join(params.outputDir, `${params.itemName}.xml`), xmlExport(xmlObj), "utf-8")
  }
}

const roundTripFormsXML = (params: { inputDir: string; outputDir: string; itemName: string; xmlDir: string }) => {
  const formsInputDir = join(params.inputDir, params.itemName, "Forms")
  if (!fs.existsSync(formsInputDir)) {
    return
  }

  const formEntries = fs.readdirSync(formsInputDir, { withFileTypes: true })
  const formXmlFiles = formEntries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  for (const formEntry of formXmlFiles) {
    const formName = basename(formEntry.name, ".xml")
    const formExtPath = join(formsInputDir, formName, "Ext", "Form.xml")
    if (!fs.existsSync(formExtPath)) continue

    try {
      const form = readFormFromXML({
        context: makeContextFromXML(false),
        inputDir: formsInputDir,
        formName,
      })

      const referenceForm = readFormFromXML({
        context: makeContextFromXML(true),
        inputDir: formsInputDir,
        formName,
      })

      const formContextToXML = makeContextToXML(params.itemName)

      const formXML = exportClientApplicationFormToXML({
        context: formContextToXML,
        form,
        referenceForm,
      })

      const metadataXML = exportFormMetadataToXML({
        context: formContextToXML,
        form,
        referenceForm,
        name: formName,
      })

      const formsOutputDir = join(params.outputDir, params.itemName, "Forms")
      const formExtOutputDir = join(formsOutputDir, formName, "Ext")
      fs.mkdirSync(formExtOutputDir, { recursive: true })

      fs.writeFileSync(join(formsOutputDir, `${formName}.xml`), xmlExport({ MetaDataObject: metadataXML }), "utf-8")
      fs.writeFileSync(join(formExtOutputDir, "Form.xml"), xmlExport({ Form: formXML }), "utf-8")
    } catch (err) {
      console.error(`Ошибка round-trip формы "${params.xmlDir}/${params.itemName}/${formName}":`, err)
    }
  }
}
```

- [ ] **Step 3: Replace the body of `shortRoundTripXML`**

Replace everything inside `shortRoundTripXML` after the `inputDir` existence guard with this loop.

```ts
  for (const rule of TopLevelMetadataItemRules) {
    const xmlDir = getRuleXMLDir(rule)
    if (!xmlDir) continue

    const itemsInputDir = join(inputDir, xmlDir)
    if (!fs.existsSync(itemsInputDir)) continue

    const itemsOutputDir = join(outputDir, xmlDir)
    const entries = fs.readdirSync(itemsInputDir, { withFileTypes: true })
    const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

    for (const entry of xmlFiles) {
      const itemName = basename(entry.name, ".xml")

      try {
        roundTripMetadataItemXML({
          inputDir: itemsInputDir,
          outputDir: itemsOutputDir,
          itemName,
          rule,
        })
      } catch (err) {
        console.error(`Ошибка round-trip объекта "${xmlDir}/${itemName}":`, err)
      }

      roundTripFormsXML({
        inputDir: itemsInputDir,
        outputDir: itemsOutputDir,
        itemName,
        xmlDir,
      })
    }
  }
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: PASS. If it fails on whitespace or ordering, inspect only the failing registered type and stop with a short report if the failure is unrelated to the walker refactor.

- [ ] **Step 5: Commit the core implementation**

```bash
git add packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts
git commit -m "feat: :sparkles: обобщить short round-trip объектов"
```

## Task 3: Shell Runner Multi-Directory Selection

**Files:**
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Add shell helpers after `is_positive_integer`**

```bash
KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences")

is_config_dir() {
  local candidate="$1"
  local xml_dir

  for xml_dir in "${KNOWN_XML_DIRS[@]}"; do
    if [ -d "${candidate}/${xml_dir}" ]; then
      return 0
    fi
  done

  return 1
}

collect_run_dirs() {
  local root="$1"
  local child

  if is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi

  while IFS= read -r child; do
    if is_config_dir "${child}"; then
      printf '%s\n' "${child}"
    fi
  done < <(find "${root}" -mindepth 1 -maxdepth 1 -type d | sort)
}
```

- [ ] **Step 2: Replace the single-directory restore/run/diff block**

Replace the block from `# ── Чистый старт XML-репо` through `DIFF_COUNT="${#DIFF_FILES[@]}"` with this version.

```bash
# ── Каталоги запуска ─────────────────────────────────────────────────────────

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

# ── Чистый старт XML-репо ────────────────────────────────────────────────────

echo "[restore] Откат XML-репо к HEAD..."
git -C "${NKDK_XML_REPO}" restore .

# ── Short round-trip ─────────────────────────────────────────────────────────

DIFF_FILES=()
ACTIVE_XML_DIR=""

for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
  echo "[round-trip] Запуск short-round-trip-test: ${RUN_XML_DIR}"
  ${NKDK} short-round-trip-test "${RUN_XML_DIR}"

  DIFF_FILES=()
  while IFS= read -r diff_file; do
    DIFF_FILES+=("${diff_file}")
  done < <(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort)

  if [ "${#DIFF_FILES[@]}" -gt 0 ]; then
    ACTIVE_XML_DIR="${RUN_XML_DIR}"
    break
  fi
done

if [ -z "${ACTIVE_XML_DIR}" ]; then
  ACTIVE_XML_DIR="${RUN_DIRS[${#RUN_DIRS[@]} - 1]}"
fi

DIFF_COUNT="${#DIFF_FILES[@]}"
```

- [ ] **Step 3: Add active directory to the no-diff output**

Replace:

```bash
  echo "=== Round-trip чистый: диффов нет ==="
```

with:

```bash
  echo "=== Round-trip чистый: диффов нет ==="
  echo "Проверено каталогов: ${#RUN_DIRS[@]}"
```

- [ ] **Step 4: Update `xml_file_abs` and diff emitters to use `ACTIVE_XML_DIR`**

Replace `xml_file_abs` with:

```bash
xml_file_abs() {
  local relative_path="$1"
  echo "${ACTIVE_XML_DIR%/}/${relative_path}"
}
```

In `emit_single_diff`, add this block before `=== DIFF_COUNT ===`:

```bash
  echo "=== ACTIVE_XML_DIR ==="
  echo "${ACTIVE_XML_DIR}"
  echo ""
```

In `emit_triage_diff`, add this line after `INDEX: ${index}`:

```bash
  echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
```

Replace both `git -C "${NKDK_XML_DIR}" ... diff` calls inside `emit_single_diff` and `emit_triage_diff` with:

```bash
git -C "${ACTIVE_XML_DIR}" -c core.quotepath=false diff --relative -- "${file}"
```

- [ ] **Step 5: Run shell syntax check**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: no output and exit code 0.

- [ ] **Step 6: Commit shell multi-dir selection**

```bash
git add .agents/skills/round-trip-xml/round-trip.sh
git commit -m "feat: :sparkles: проверять несколько XML-каталогов"
```

## Task 4: Skill Documentation Update

**Files:**
- Modify: `.agents/skills/round-trip-xml/SKILL.md`

- [ ] **Step 1: Update step 1 contract**

In `## Шаг 1. Запуск round-trip`, replace the numbered list items 1-6 with:

```md
1. Читает `NKDK_XML_REPO` (обязательная) и `NKDK_XML_DIR` (опциональная) из `.env`.
2. Проверяет, что рабочее дерево `nakidka-core` чистое — иначе падает.
3. Делает `git restore .` в XML-репо.
4. Определяет каталоги запуска:
   - если `NKDK_XML_DIR` сам содержит зарегистрированные XML-каталоги (`Catalogs`, `Documents`, `DocumentNumerators`, `Sequences`) — проверяет только его;
   - иначе проходит по дочерним каталогам `NKDK_XML_DIR` в алфавитном порядке и берёт только те, где есть зарегистрированные XML-каталоги.
5. Запускает `nkdk short-round-trip-test` последовательно по каждому каталогу.
6. Если после каталога появился хотя бы один diff — останавливается на этом каталоге и дальше не смотрит.
7. В одиночном режиме выводит выбранный diff-файл и полный diff. Без параметров выбирается первый по алфавиту diff найденного каталога, `--diff-index N` выбирает N-й файл из отсортированного списка.
8. В triage-режиме (`--triage --batch-size N --start-index K`) выводит пачку diff-файлов найденного каталога.
```

- [ ] **Step 2: Update triage response rules**

In the triage output template, add this line after `XML-файл`:

```text
   XML-каталог: <значение ACTIVE_XML_DIR, если есть в выводе скрипта>
```

- [ ] **Step 3: Run a documentation diff review**

Run:

```bash
git diff -- .agents/skills/round-trip-xml/SKILL.md
```

Expected: diff only describes multi-dir behavior and registered directories; it must not change reproducer workflow steps.

- [ ] **Step 4: Commit documentation**

```bash
git add .agents/skills/round-trip-xml/SKILL.md
git commit -m "docs: :memo: описать multi-dir round-trip"
```

## Task 5: Verification

**Files:**
- Verify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts`
- Verify: `.agents/skills/round-trip-xml/round-trip.sh`
- Verify: `.agents/skills/round-trip-xml/SKILL.md`

- [ ] **Step 1: Generate Langium files if this is a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits 0. If generated files change, inspect them before committing; do not revert unrelated user changes.

- [ ] **Step 2: Run focused core test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run shell syntax check**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: no output and exit code 0.

- [ ] **Step 4: Run manual multi-dir smoke test**

Run from repository root:

```bash
NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 1
```

Expected: output prints several `[round-trip] Запуск short-round-trip-test: ...` lines only until the first directory with diff, then emits `=== DIFF_COUNT ===`, `=== TRIAGE_RANGE ===`, and `ACTIVE_XML_DIR:` for the stopped directory. It must not continue to later sibling directories after the first diff.

- [ ] **Step 5: Run full project tests before closing the issue**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 6: Commit any verification-only updates**

Only run this if verification produced intentional tracked changes, such as Langium output.

```bash
git status --short
git add <intentional-files>
git commit -m "chore: :wrench: обновить сгенерированные файлы"
```

## Self-Review

- Spec coverage: Task 1 and Task 2 cover `TopLevelMetadataItemRules`; Task 3 covers sequential multi-dir traversal and stop-on-first-diff; Task 4 covers skill protocol; Task 5 covers focused and full verification.
- Placeholder scan: no unfinished placeholders remain in the plan steps.
- Type consistency: helper names are consistent across test, implementation, and shell steps.
