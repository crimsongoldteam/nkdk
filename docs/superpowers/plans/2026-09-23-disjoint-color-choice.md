# Непересекающийся выбор цветов — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Исполнять в текущей задаче без субагентов по выбору пользователя; проверка и коммит не завершают ход.

**Goal:** Задать `Color` единой YAML-декларацией и общим скомпилированным выбором форм без частного Rust-обработчика и без ложного пересечения стандартных цветов с элементами стиля.

**Architecture:** `choice` вычитает конечное множество точных XML-строк из одного явно объявленного открытого варианта при построении автомата. Тот же выбор проверяет обратную запись открытого варианта. Словари, имена 1С, допустимые формы цвета и проверка ссылки остаются в декларациях; во время преобразования используется готовый автомат.

**Tech Stack:** Rust 1.98.1 / edition 2024; существующие `rule-model`, `rule-compiler`, `conversion-core`, `compiled-rules`, `regex-automata`; YAML `nkdk-declarations/1`; Node.js/pnpm для массового переноса и проверок. Новых зависимостей нет.

**Spec:** [Язык деклараций, «Точный словарь и открытое имя без пересечения»](../specs/2026-09-10-declaration-language-design.md#точный-словарь-и-открытое-имя-без-пересечения). Сверяться также с [архитектурой тестов](../../../.agents/testing.md) и [общим планом переноса](2026-09-10-rust-yaml-declarations.md).

## Global Constraints

- Только XML ↔ YAML, валидация и аномалии; Enterprise не переносится.
- Имена пользовательского YAML остаются 1С-совместимыми: `ЦветОсобогоТекста` и `ЭлементСтиля.ПоясняющийТекст`. Варианты декларации называются `СтандартныйЦветСтиля` и `ЭлементСтиля`.
- `ЭлементСтиля.SpecialTextColor` не существует в допустимых метаданных 1С: проверка сообщает «Недопустимое имя элемента стиля». Это ложное пересечение шаблонов компилятора, а не два допустимых значения.
- Декларация описывает обычные значения; отклонения выводятся общим механизмом. Применение `!xml` к неверным `Color` отдельно согласовано 2026-09-23. Для других классов значений по-прежнему требуется согласование по `AGENTS.md`.
- Нейтральный компилятор и исполнитель не проверяют строку `Color`, название объекта или предметный XML-префикс. Не менять XML-фикстуры.
- Rust-сборки: `CARGO_BUILD_JOBS=1 CARGO_INCREMENTAL=0`, чтобы ограничить пик памяти `rustc`.
- Флажок `commonObjects/color` ставить только после полной приёмки всех применимых форм и проверок; готовность 192 владельцев учитывается отдельно.

## Review Focus

1. XML `style:SpecialTextColor` при перестановке вариантов всё равно даёт `ЦветОсобогоТекста`; тест задачи 2.
2. Ручной YAML `ЭлементСтиля.SpecialTextColor` не экспортируется молча в стандартный цвет; тест задачи 2.
3. Неизвестный `style:` и неверный `#` сохраняют исходный ввод и соседние поля общим путём аномалий; тест задачи 3.
4. `auto` и отсутствующий элемент дают отсутствующий YAML по существующему тесту, а `0` и `0:<uuid>` остаются различимыми; тест задачи 3.
5. Ссылка `ЭлементСтиля.<имя>` проверяет существование и тип `Color` по подготовленному индексу, включая отсутствие объекта; тест задачи 3.

---

### Task 1: Объявление вычитания и проверка ссылок на варианты

**Files:**
- Modify: `rust/crates/rule-model/src/lib.rs`, `rust/crates/rule-model/src/linked.rs`
- Modify: `rust/crates/rule-compiler/src/syntax.rs`, `rust/crates/rule-compiler/src/link.rs`, `rust/crates/rule-compiler/src/link/choice_contracts.rs`
- Modify for exhaustive choice matches: `rust/crates/rule-compiler/src/generate/{choice_value,owner,scalar}.rs`, `rust/crates/rule-compiler/src/generate/text_choice/variant.rs`, `rust/crates/rule-compiler/src/link/{constraints,scalar_inputs,text_pattern,text_projection,text_sequence}.rs`, `rust/crates/rule-compiler/src/plan/{values,xml_ownership}.rs`, `rust/crates/rule-compiler/src/schema.rs`
- Test: `rust/crates/rule-compiler/tests/parse.rs`, `rust/crates/rule-compiler/tests/link.rs`

**Interfaces:**
- Consumes: current text `choice` with an optional XML discriminator and YAML selectors.
- Produces: `fallback: Option<String>` on either text `choice` representation, resolved to exactly one existing variant for that side; the discriminated XML form cannot also use it. The plain choice with no `fallback` keeps its present behavior.

- [x] **Step 1: Add failing parser/link tests.** Extend existing choice cases with the following input and expectations; include unknown variant, empty name, duplicate key and a discriminated choice using `fallback` as negative cases.

  ```yaml
  value: {kind: choice, variants: [{name: СтандартныйЦветСтиля, type: {use: standard}}, {name: ЭлементСтиля, type: {use: item}}]}
  representations:
    xml: {kind: choice, fallback: ЭлементСтиля}
    yaml: {kind: choice}
  ```

- [x] **Step 2: Run red.** `cd rust && CARGO_BUILD_JOBS=1 CARGO_INCREMENTAL=0 cargo test -p nkdk-rule-compiler --test parse --test link` — the `fallback` field is rejected by the parser.
- [x] **Step 3: Implement the syntax/model/link change.** Extend the existing choice representation with `fallback: Option<String>` while retaining existing YAML selector data. Resolve and validate the variant name once; no name comparison in the runtime. Keep the discriminator and text exclusion modes mutually exclusive. Update all exhaustive matches without adding subject-specific conditions.

  ```rust
  // In rule-model, retain existing selectors in the YAML case.
  XmlRepresentation::Choice { fallback: Option<String> }
  YamlRepresentation::Choice { variants: Vec<YamlChoiceCase>, fallback: Option<String> }
  LinkedXml::Choice { fallback: Option<String> }
  ```

- [x] **Step 4: Run green.** Repeat the two Rust tests; then `cargo check -p nkdk-rule-compiler -p nkdk-compiled-rules` with the same environment and `pnpm duplicates -- --base 7d64cd403` from the repository root. Expected: no changed behavior for choices without `fallback`, no new duplicates.
- [x] **Step 5: Commit.** `feat: :sparkles: объявить исключение словаря в choice`.

### Task 2: Доказать непересечение и проверять обратную запись

**Files:**
- Modify: `rust/crates/rule-compiler/src/automata.rs`, `rust/crates/rule-compiler/src/automata/sequence.rs`, `rust/crates/rule-compiler/src/generate/text_choice.rs`
- Inspect without changing the public interface: `rust/crates/conversion-core/src/pattern.rs`
- Test: `rust/crates/rule-compiler/tests/text_pattern.rs`, `rust/crates/compiled-rules/tests/scalars.rs`
- Create: `rust/declarations/probes/disjoint-style-choice.yaml`

**Interfaces:**
- Consumes: linked optional `fallback` from Task 1 and each variant's `selection_parts(xml)` / `selection_parts(yaml)`.
- Produces: a deterministic choice plan whose accepted forms are pairwise disjoint after subtracting finite exact words from the designated open variant. The selector returns the same variant index independent of YAML order. The writer rejects an open variant whose generated spelling belongs to the subtracted set.

- [x] **Step 1: Add red cases to the existing choice matrix.** Use a two-word finite enum and an open text-pattern. Check `style:SpecialTextColor → СтандартныйЦветСтиля`, `style:ПоясняющийТекст → ЭлементСтиля`, and the same results when the variants are swapped. Check that `ЭлементСтиля.SpecialTextColor` gets a diagnostic on YAML→XML, while overlap between two finite variants still reports `choice_overlap` with two source positions.

  ```yaml
  value: {kind: choice, variants: [{name: ЭлементСтиля, type: {use: item}}, {name: СтандартныйЦветСтиля, type: {use: standard}}]}
  representations: {xml: {kind: choice, fallback: ЭлементСтиля}, yaml: {kind: choice}}
  ```

- [x] **Step 2: Run red.** `cd rust && CARGO_BUILD_JOBS=1 CARGO_INCREMENTAL=0 cargo test -p nkdk-rule-compiler --test text_pattern` — current overlap rejection or wrong choice is observed. Run `cargo test -p nkdk-compiled-rules --test scalars` with the same environment; its new behavior also fails.
- [x] **Step 3: Implement compile-time subtraction.** Collect finite complete strings from the non-open variants, validate that every permitted overlap is between one of these and the declared open variant, and assign exact strings solely to the finite variant in the compiled choice automaton. Reject unbounded-vs-unbounded and finite-vs-finite overlap as before; preserve state and byte budgets. The generated writer uses the same compiled exclusion to diagnose an open value that would be read as finite. Do not add a runtime chain of per-variant parsers or a `Color` branch.

  ```rust
  // Invariant enforced while compiling the choice; no subject names involved.
  // selected("style:SpecialTextColor") == exact_variant
  // selected("style:ПоясняющийТекст") == open_variant
  // write(open_variant, "SpecialTextColor") -> diagnostic
  ```

- [x] **Step 4: Run green.** Targeted Rust tests, `cargo clippy -p nkdk-rule-compiler -p nkdk-compiled-rules --all-targets -- -D warnings` with bounded build settings, and `pnpm duplicates -- --base 7d64cd403`; expected: exact/open forms and non-overlap rejection all pass, no new duplicates. Record whether the final runtime selector needs one or more scans; one compiled selection per read is the acceptance target.
- [x] **Step 5: Commit.** `feat: :sparkles: собирать непересекающийся текстовый выбор`.

### Task 3: Полная декларация common `Color`

**Files:**
- Create: `rust/declarations/common/color.yaml`, `rust/declarations/fragments/metadata-style-item-type.yaml`, `rust/declarations/probes/style-item-type-facts.yaml`
- The `rust/crates/compiled-rules/build.rs` catalog includes new common declarations automatically; no manual registration file is needed
- Test: the existing relevant matrices in `rust/crates/compiled-rules/tests/`, using unchanged XML fixtures from `packages/rules/metadata/commonObjects/color/__fixtures__/`
- Test: `tests/migration/` independent expected XML/YAML cases from `e2e/fixtures/xml`

**Interfaces:**
- Consumes: Task 2's compiled choice, `system.StyleColors`, `system.WindowsColors`, `system.WebColors`, general metadata-name and reference-index expressions.
- Produces: `common.color` for XML ↔ YAML, validation and schema. It handles absolute `#RRGGBB`, standard style, custom style item, Windows and Web colors, `0`, `0:<uuid>`, `auto`, absent value and malformed input through common anomaly behavior. `auto` and absent XML both canonically omit YAML, matching the existing `не сохраняет присутствие Color auto` test.

- [x] **Step 1: Add independent failing cases.** Reuse the five unchanged XML fixtures (`absolute`, `win`, `web`, `style`, `customStyle`) and the existing raw/auto tests. Assert each XML→expected YAML and expected YAML→XML separately, then round-trip; for `auto`, expect the existing canonical omission of the XML element. Include a valid and missing `ЭлементСтиля` of type `Color`, a same-name reference written manually in YAML, malformed `#`/`0:`/unknown prefix, and preserved sibling property. Do not derive expected YAML from the declaration itself.

  ```text
  style:SpecialTextColor  -> ЦветОсобогоТекста
  style:ПоясняющийТекст   -> ЭлементСтиля.ПоясняющийТекст
  win:ButtonLightShadow   -> ТеньКнопкиСветлая
  web:AliceBlue           -> АкварельноСиний
  #C3C0C3                 -> #C3C0C3
  0:615512b6-4378-4fce-86f1-a56725f945da -> identical YAML string
  ```

- [x] **Step 2: Run red.** `cd rust && CARGO_BUILD_JOBS=1 CARGO_INCREMENTAL=0 cargo test -p nkdk-compiled-rules --test scalars`. Expected: `common.color` is absent or some listed forms fail.
- [x] **Step 3: Implement the declaration with reusable mechanisms only.** Wrap each finite color dictionary in a `text-pattern` adding the XML prefix and preserving its current Russian YAML literal. Write the custom element as `style:<имя>` / `ЭлементСтиля.<имя>` with the declared reference check. The producer fragment reads the ordinary `Name` and `Type` of `MetadataStyleItem` and contributes `name → type` to `metadata.style-item-types`; the Color value binds this index, requires the name to exist and its type to equal `Color`. Add disjoint literal/pattern branches for absolute and raw spellings. Represent XML `auto` as a semantic variant shortened by `presence.yaml.missing`; the existing TypeScript test confirms that its explicit presence is not retained. Generate JSON Schema from the same declaration; do not write a Color-specific Rust function.

  ```yaml
  value:
    kind: choice
    variants:
    - {name: СтандартныйЦветСтиля, type: {use: standardStyleColor}}
    - {name: ЭлементСтиля, type: {use: styleItemColor}}
    - {name: Авто, type: {use: autoColor}}
  representations:
    xml: {kind: choice, fallback: ЭлементСтиля}
    yaml: {kind: choice}
  presence:
  - target: self
    yaml:
      missing: {denotes: {variant: {name: Авто, value: {literal: auto}}}}
      omitWhen: {isVariant: {value: {self: true}, variant: Авто}}
  ```

- [x] **Step 4: Run green.** Targeted compiled-rules tests, schema validation, e2e corpus and `pnpm duplicates -- --base 7d64cd403`; compare each result to the independent expected forms. `auto` must omit YAML as in the existing TypeScript test, while raw references remain literal. If malformed Color needs a previously unapproved `!xml` boundary, document the concrete XML/YAML difference and request the separate approval required by `AGENTS.md` before enabling it; continue the other cases while the answer is pending. Only JSON/YAML and XML behavior is in scope; do not port Enterprise.
- [x] **Step 5: Commit.** `feat: :sparkles: описать Color декларацией`.

### Task 4: Подключение потребителей и полная приёмка common

**Files:**
- Modify: `tools/rules-migration/src/emit.mjs` only for a demonstrated generic missing dependency, never a Color-specific emitter branch
- Modify: `tests/migration/rules-candidates/` generated output and its checked manifest
- Modify: `docs/superpowers/plans/2026-09-10-rust-yaml-object-checklist.md`, `docs/superpowers/plans/2026-09-10-rust-yaml-catalog.md`
- Create: `docs/superpowers/reports/2026-09-23-color-acceptance.md`

**Interfaces:**
- Consumes: accepted `common.color` and the existing candidate/contract generators.
- Produces: mechanically regenerated `Color` property candidates; independent acceptance evidence for common `Color`. Owner checkboxes remain separate until each whole owner passes.

- [x] **Step 1: Add a failing migration-inventory assertion.** Check that every source property of type `Color` points to a resolvable common declaration or has an explicit report of a different blocker; no silent skip and no handwritten owner-specific wiring. Existing TypeScript tests are mapped to the new tests without deleting unique coverage.
- [x] **Step 2: Run red.** `pnpm test:migration-inventory` and the affected migration contract check; expected: `Color` is still `unsupported-common` in the manifest.
- [x] **Step 3: Regenerate candidates and independent contracts.** Run `pnpm migration:candidates` and `pnpm migration:contracts`; do not hand-edit generated declarations. Verify that the unblock count and remaining reasons are recorded in the report. Mark the single `commonObjects/color` checkbox only when all Task 3 forms, reference validation, schema, anomalies, and independent e2e cases pass; otherwise leave it empty with the precise remaining blocker.
- [x] **Step 4: Verify the layer.** `pnpm test:migration-inventory`, `pnpm test:migration-contracts`, targeted Rust tests, `pnpm test:architecture:rules`, `pnpm test:architecture`, `pnpm test:architecture:rust`, and `pnpm duplicates -- --base 7d64cd403`. Then run full `pnpm test` outside the sandbox as required by `AGENTS.md`, `CARGO_BUILD_JOBS=1 CARGO_INCREMENTAL=0 cargo clippy --all-targets -- -D warnings` from `rust/`, and `git diff --check`. Expected: all pass, no new duplicate, all unchanged XML fixtures.
- [x] **Step 5: Commit.** `feat: :sparkles: подключить Color к массовому переносу` together with generated candidates and checklist/report evidence.

## Self-review before execution

- Task 1 produces the linked `fallback` consumed by Task 2; Task 2 produces the selector and writer guard consumed by Task 3; Task 3 provides `common.color` consumed by Task 4.
- The five Review Focus cases are assigned to Tests in Tasks 2–3. Color acceptance is distinct from owner acceptance.
- Task 3 must not declare success by round-trip alone: compare each direction with independent XML/YAML expectations, including canonical absence for `auto` and both raw reference forms.
- `auto` uses the existing choice-presence expressions. StyleItem type lookup uses an ordinary declared index contribution; neither behavior is placed in the neutral orchestrator by name.
