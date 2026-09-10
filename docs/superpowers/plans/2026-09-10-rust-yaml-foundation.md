# Этап А: компилятор YAML-деклараций и сквозной Rust-конвертер — план реализации

> **Для исполнителя:** использовать `superpowers:executing-plans`, без субагентов. Выполнять задачи А1–А6 по порядку. До изменения поведения прочитать спецификацию и [главный план](2026-09-10-rust-yaml-declarations.md).

**Goal:** Получить проверяемый Rust-компилятор единого языка и самостоятельные XML→YAML, YAML→XML, validation для скаляров и полного договора I8nText на независимых примерах.

**Architecture:** Типизированный загрузчик и связующий модуль работают при сборке; генератор выпускает Rust-код и карту исходных позиций. Общий runtime содержит операции форматов и восстановления, а common и пример владельца задаются YAML. I8nText проверяет выразимость сложного компонента до переноса всего каталога.

**Tech Stack:** Cargo workspace, edition 2024; кандидаты XML/YAML-переходников и toolchain проверяются по предыдущему эксперименту и фиксируются lockfile. Технические JSON-manifest не являются промежуточной моделью преобразования.

**Spec:** [Единая спецификация](../specs/2026-09-10-declaration-language-design.md), D-01–D-18, D-21–D-24; [карточка I8nText](../specs/2026-09-10-common-declarative/02-text-style.md).

## Обязательные условия

Все обязательные условия главного плана действуют здесь. Не писать runtime-функции `convertI8nText`, `normalizeSynonym`, `classifyFillValue`, даже если их адреса типизированы. Отсутствующая конструкция языка уточняется до её реализации. Этот этап не объявляет полное покрытие проекта и не заменяет текущую точку входа MCP.

## Файлы и публичные границы этапа

| Файлы | Ответственность |
|---|---|
| `rust/Cargo.toml`, `rust/Cargo.lock`, `rust/rust-toolchain.toml` | Воспроизводимая сборка новых crates |
| `rust/crates/rule-model/src/{lib,source,syntax,linked}.rs` | SourceFile, Diagnostic, Module, Program и типизированные узлы |
| `rust/crates/rule-compiler/src/{lib,parse,link,expressions,generate,schema}.rs` | Единственный компилятор |
| `rust/crates/rule-compiler/tests/{parse,link,generate,schema}.rs` | Тесты стабильных договоров компилятора |
| `rust/crates/conversion-core/src/{lib,xml,yaml,presence,inputs,diagnostics,proof,annotations}.rs` | Общие представления, состояния и проверка восстановления |
| `rust/crates/compiled-rules/{Cargo.toml,build.rs,src/lib.rs}` | Генерация каталога в OUT_DIR и публичный доступ к нему |
| `rust/apps/nkdk/{Cargo.toml,src/main.rs}` | Самостоятельные команды convert-file и validate-file |
| `rust/tools/dev/src/{main,corpus,declarations,coverage}.rs` | Независимый корпус, проверка деклараций и полноты |
| `tests/declaration-corpus/`, `tests/conversion-corpus/` | Входы и ожидаемые результаты |
| `tests/migration/{baseline,reuse,coverage}.json` | Зафиксированные источники, решение о повторном использовании и покрытие |
| `docs/superpowers/reports/2026-09-10-rust-yaml-progress.md` | Журнал исполнения трёх этапов |

У каждого создаваемого crate есть `Cargo.toml` и `src/lib.rs` либо `src/main.rs`; создание минимального workspace входит в первый тест, которому он нужен, а не отдельную задачу ради каркаса.

Публичные сигнатуры компилятора; типы Module/Program владеют данными и определены в rule-model, их внутренние узлы следуют единой спецификации:

```rust
pub struct SourceFile<'a> {
    pub path: &'a str,
    pub bytes: &'a [u8],
}
pub struct Diagnostic {
    pub code: String,
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub related: Vec<SourceLocation>,
}
pub struct SourceLocation {
    pub file: String,
    pub line: usize,
    pub column: usize,
}
pub struct GeneratedFile { pub path: String, pub contents: Vec<u8> }
pub struct GeneratedSources {
    pub files: Vec<GeneratedFile>,
    pub dependencies: Vec<String>,
}

pub fn parse(source: SourceFile<'_>) -> Result<Module, Vec<Diagnostic>>;
pub fn link(modules: &[Module]) -> Result<Program, Vec<Diagnostic>>;
pub fn generate(program: &Program) -> Result<GeneratedSources, Vec<Diagnostic>>;
pub fn compile(sources: &[SourceFile<'_>]) -> Result<GeneratedSources, Vec<Diagnostic>>;
```

Все позиции однобазовые. Компилятор не открывает файлы в этих функциях: файловый адаптер build.rs/CLI передаёт SourceFile, поэтому обычные тесты полностью работают в памяти.

Публичная граница сгенерированного каталога:

```rust
pub enum Direction { XmlToYaml, YamlToXml }
pub struct EntryId(pub u32);
pub struct FileResult {
    pub bytes: Vec<u8>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}

pub fn convert_file(
    entry: EntryId, direction: Direction, source: &[u8], inputs: &PreparedInputs,
) -> Result<FileResult, Vec<RuntimeDiagnostic>>;
pub fn validate_file(
    entry: EntryId, source: &[u8], inputs: &PreparedInputs,
) -> Vec<RuntimeDiagnostic>;
```

`RuntimeDiagnostic` содержит code/severity/file/path/line/column/message и отдельный адрес вхождения; совпадение публичных полей сверяется по корпусу. `PreparedInputs` — проверенный набор типизированных слотов операции: text, boolean, number, sequence и index; доступ к произвольной конфигурации отсутствует. Состав слотов для EntryId и их адаптеры генерируются из inputs/bind. `EntryId` выбирается один раз на границе файла. Это не публичная возможность объявлять callback.

`FileResult.bytes` — только результат одного файла; исходник и временные буферы освобождаются после публикации. Ни одна из этих сигнатур не требует полной модели проекта. Более потоковая запись допускается после измерения без изменения предметного договора.

### А1. Подготовить независимые ожидания и закрыть договор I8nText

**Files:** создать три `tests/migration/*.json`, журнал исполнения и `tests/conversion-corpus/manifest.json`; дополнить единую спецификацию в разделах 4–10. Читать зафиксированный корпус предыдущего эксперимента, common/i8nText, formattedI8nText, helpers/synonymHelpers.ts, runtime/validation/localizedTextYAML.ts и .agents/xml-anomalies.md. Копировать только отслеживаемые git файлы с проверенным происхождением.

**Interfaces:** вход — ревизии источников и текущие тесты; выход — manifest с case-id, group, source-path/SHA256, режимом, inputs, expected YAML/XML/diagnostics, policy области тегов. Coverage различает `unreviewed`, `specified`, `implemented`, `verified`, `infrastructure`; файл или каталог без роли не считается покрытым.

- [x] Зафиксировать текущую ревизию, toolchain и состояние worktree. Сверить прежний Rust-код через `git show 4e1a2818879434c57cd93e4616f875fd9479dfc9:rust/Cargo.toml`, а не через незакоммиченный каталог. В reuse.json для каждого выбранного исходника записать hash и решение `reuse-mechanism`, `reuse-test`, `rewrite`, `exclude` с причиной. Не переносить готовую ветку целиком.
- [ ] Проверить независимые XML/YAML/diagnostics ожидания корпуса и привязки к e2e. В baseline.json записать обе ревизии: источник действующего договора и источник старого эксперимента; конфликт хэшей блокирует импорт случая, а не обновляет SHA автоматически.
- [ ] Заполнить в той же спеке полную таблицу I8nText: missing, empty-container, empty-content, nil/typed оболочки, preserveEmptyXML, excludeIfEqualNameYAML, skipEmptyToXML, один/несколько языков, совпадение с именем и маркер отсутствующего основного языка. Каждый профиль получает декларацию и ожидаемые обе стороны; не ограничиваться непустым примером из редакции 0.2.
- [ ] Записать отдельные случаи неизвестного языка, двух разнесённых повторов с разным текстом, неканонического порядка, сочетаний invalid на карте/ключах, `#`/пустого кода, formatted=true без текста. Для служебного языка сохранить различие областей XML-импорта и YAML-проверки, установленное исходниками.
- [ ] Уточнить в спеке точную структуру presence/shorthand/constraints/annotation policy и общих выражений вывода синонима. Если текущий алгоритм splitPascalCase нельзя выразить уже описанной грамматикой, записать общую текстовую конструкцию и независимые примеры её Unicode-границ; не добавлять предметный Rust escape hatch.
- [x] Подготовить 4 базовых scalar-случая: true, false, точная строка с пробелами, число с явным типом. Добавить отказ неизвестного свойства и существующую разрешённую аномальную форму. Содержимое исходных XML не менять.
- [ ] Проверить ссылки, хэши и согласованность таблиц; в журнале перечислить конкретные принятые результаты. Это исследовательская задача, для неё не писать тест, дублирующий текст документа. Проверить дубли и сохранить локальный коммит.

### А2. Загрузить строгий YAML без потери исходных позиций

**Files:** rule-model/source.rs, syntax.rs; rule-compiler/parse.rs; tests/parse.rs; `tests/declaration-corpus/{valid,invalid}/`; workspace manifests. Точный набор допустимых ключей задаёт спецификация после А1.

**Interfaces:** `parse(SourceFile) -> Result<Module, Vec<Diagnostic>>`; Module не содержит Rust-имён функций и универсальной карты непроверенных дополнительных свойств.

- [x] Создать минимальный Cargo workspace и test target parse. Проверить импорт кандидата YAML-парсера на повторном ключе, пользовательском теге, anchor, алиасе и позиции; принять адаптер только при доступности этих данных. Версии закрепить в Cargo.lock.
- [x] Добавить табличную проверку допустимого минимума и содержательных отказов. Тест в памяти:

  ```rust
  #[test]
  fn duplicate_keys_report_the_second_occurrence() {
      let errors = parse(SourceFile {
          path: "common/boolean.yaml",
          bytes: b"format: nkdk-declarations/1\nkind: value\nid: first\nid: second\n",
      }).err().expect("duplicate must fail");
      assert!(errors.iter().any(|d| d.code == "duplicate_key" && d.line == 4));
  }
  ```

- [x] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-rule-compiler --test parse`; получить отказ именно для неподдержанного договора, затем реализовать событийное чтение и закрытый разбор узлов в parse.rs. Не использовать загрузчик, молча перезаписывающий ключ.
- [x] Дополнить таблицу отказов: неизвестный format/kind/key, два документа, merge, tags, anchors, нестроковый ключ, runtime-код в scalar. Разбор `with` числа сохраняет лексическую точность; пустая строка не равна null.
- [x] Повторить целевой тест, сверить единичный успешный Module и позиции ошибок; выполнить проверки слоя и коммит. Ошибки парсинга не расширяют синтаксис пользовательских YAML-файлов.

### А3. Связать типы, параметры и фрагменты

**Files:** rule-model/linked.rs; rule-compiler/link.rs, expressions.rs; tests/link.rs; декларации в tests/declaration-corpus/valid для `value`, `fragment`, `object` и imports/with/bind.

**Interfaces:** `link(&[Module]) -> Result<Program, Vec<Diagnostic>>`; Program содержит устойчивые id узлов, разрешённые QName, граф зависимостей и происхождение. Генератор не получает неизвестные имена или неразрешённые типы.

- [ ] Добавить пару небольших деклараций common и owner и fragment с повтором имени поля. Проверка требует коллизию с двумя исходными позициями, даже если повторные поля одинаковы. Добавить два порядка входного списка модулей; связанное значение должно быть одинаковым.

  ```rust
  #[test]
  fn reversed_input_order_preserves_linked_program() {
      let a = parse(SourceFile { path: "a.yaml", bytes: include_bytes!("fixtures/common.yaml") }).unwrap();
      let b = parse(SourceFile { path: "b.yaml", bytes: include_bytes!("fixtures/owner.yaml") }).unwrap();
      assert_eq!(link(&[a.clone(), b.clone()]).unwrap(), link(&[b, a]).unwrap());
  }
  ```

  Создать `rust/crates/rule-compiler/tests/fixtures/common.yaml` и `owner.yaml` как независимые малые примеры из spec; читать через include_bytes!, а не файловую систему unit-теста. Eq у Program сравнивает семантику без порядка поступления SourceFile.

- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-rule-compiler --test link`, затем реализовать разрешение imports/local/use, запрет циклов composition, проверку with/bind и структурированный граф field/input-зависимостей.
- [ ] Добавить отдельные строки той же таблицы для необъявленного входа, несовместимого типа, runtime-выражения в with, зависимости common→forms, совпадающего XML-пути и неоднозначного reverse. Локальный цикл поля отвергать независимо от порядка fields.
- [ ] Разделить ошибки языка и отсутствие runtime-факта: до запуска операции допускается типизированный обязательный слот, но не неизвестное имя слота. Неготовность конкретных данных проверяет подготовка операции.
- [ ] Получить зелёные тесты, проверить сохранённые связанные позиции и отсутствие правил last-wins; проверки слоя и коммит.

### А4. Сгенерировать две законченные операции для скаляров

**Files:** rule-compiler/generate.rs, tests/generate.rs; core/xml.rs, yaml.rs, inputs.rs; compiled-rules/build.rs и src/lib.rs; apps/nkdk/src/main.rs; declarations/common/{boolean,string,number}.yaml; `tests/declaration-corpus/valid/scalar-owner.yaml`; dev/corpus.rs.

**Interfaces:** `generate(Program) -> GeneratedSources`, публичные convert_file/validate_file из раздела границ. build.rs читает декларации и записывает только OUT_DIR; сгенерированный crate зависит от compiler только при сборке.

- [ ] В generate integration-test создать временный маленький crate, собрать сгенерированные исходники и выполнить один двусторонний случай. Не ограничиваться `output.contains("function_name")`: сгенерированный Rust должен компилироваться и выдавать ожидаемые байты.
- [ ] Добавить корпус с ожидаемой парой из независимого источника:

  ```json
  {
    "id": "scalar-boolean-true",
    "group": "scalars",
    "entry": "test.scalar-owner",
    "xml": "<Server>true</Server>",
    "yaml": "Сервер: Истина\n",
    "expectedDiagnostics": []
  }
  ```

  Это тестовый owner, а не заявление о покрытии CommonModule целиком. Неизвестное поле входного XML должно дать явный отказ до публикации результата.

- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-rule-compiler --test generate`; реализовать прямой код scalar/enum/record и привязок полей. Операторы общие, ветки по test.scalar-owner или common.boolean в compiler/core запрещены.
- [ ] Реализовать CLI `nkdk convert-file --entry ID --direction xml-to-yaml|yaml-to-xml --input PATH --output PATH --inputs PATH` и Rust-команду `nkdk-dev corpus run --manifest PATH --group NAME`. Последняя проверяет обе стороны и диагностики; неизвестная/пустая группа — ненулевой exit code.
- [ ] Добавить транзитивный rerun-if-changed для всех импортов, стабильное упорядочивание исходников и карту позиций. Пересборка после изменения импортированной таблицы enum должна менять наблюдаемый результат; повторная неизменённая сборка — давать идентичные GeneratedSources.
- [ ] Получить зелёный corpus/scalars и compiled-code test; зафиксировать минимальную поддержку в coverage.json, выполнить проверки слоя и коммит.

### А5. Получить validation и схемы из тех же ограничений

**Files:** rule-compiler/expressions.rs, schema.rs, tests/schema.rs; compiled-rules/src/lib.rs; `tests/declaration-corpus/valid/numeric-bound.yaml`; core/diagnostics.rs; dev/declarations.rs.

**Interfaces:** validate_file использует те же сгенерированные predicates, что импорт и экспорт. `schema(program: &Program, entry: &str) -> Result<Vec<u8>, Vec<Diagnostic>>` возвращает JSON Schema только выражаемой структурной части. CLI `nkdk-dev declarations check --dir PATH` проверяет исходный язык и импорты, а не данные пользователя.

- [ ] Создать табличный тест conditional maximum: codeType=Number, codeLength=38 проходит, 39 даёт адрес codeLength; при String граница 50. Добавить missing dependency и ошибку типа, сохранив различие этих исходов.

  ```rust
  #[test]
  fn numeric_boundary_is_shared_by_conversion_and_validation() {
      let accepted = "ТипКода: Число\nДлинаКода: 38\n";
      let rejected = "ТипКода: Число\nДлинаКода: 39\n";
      for (yaml, has_error) in [(accepted, false), (rejected, true)] {
          let diagnostics = validate_numeric_case(yaml);
          assert_eq!(diagnostics.iter().any(|d| d.path == "ДлинаКода"), has_error);
      }
  }
  ```

  `validate_numeric_case(&str) -> Vec<RuntimeDiagnostic>` — локальный helper теста: выбирает сгенерированный numeric-bound EntryId и пустые PreparedInputs, вызывает validate_file. Он не вычисляет ожидания и не реализует условие проверки.

- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-rule-compiler --test schema`; реализовать генерацию predicate для eq/lte/when и его подключение к обоим направлениям/validation. Запретить неявное приведение отсутствующего значения к false/0.
- [ ] Проверить, что validation не вызывает XML-writer и не запрашивает resource/identity публикацию. Проверять это через тестовый счётчик общего адаптера, не через повторение алгоритма validation в тесте.
- [ ] Создать схему исходного языка из описанного синтаксиса и сверить с parse на корпусе допустимых/ошибочных деклараций. Отдельно сравнить схему пользовательского numeric-bound с заранее записанным ожидаемым набором допустимых/недопустимых YAML; project lookup не изображать средствами JSON Schema.
- [ ] Получить зелёную проверку обеих схем и диагностики, выполнить проверки слоя и коммит.

### А6. Выразить I8nText и аномалии без специальной функции

**Files:** declarations/common/{i8n-text,formatted-i8n-text}.yaml; core/{presence,proof,annotations}.rs; compiler/generate.rs и узкие `src/generate/{collections,presence,shorthand}.rs` при росте файла; tests/conversion-corpus/cases/i8n-*; compiled-rules/tests/i8n_contract.rs.

**Interfaces:** генератор поддерживает sequence<Record>, keyed-mapping, shorthand, presence и applicability constraints из А1. Аннотации хранят точные адреса вхождений; сгенерированный XML-экспорт используется и обычной операцией, и proof.

- [ ] Перед кодом проверить полноту таблицы и деклараций А1: каждая действующая I8nText-ветвь имеет независимый случай обеих сторон. Связывание и типизация новых операторов обязаны отвергать неоднозначный shorthand и необъявленный язык как вход декларации.
- [ ] Добавить в один табличный набор наблюдаемые сочетания из А1. Как минимум два одинаковых кода языка с разным содержимым обязаны сохраниться двумя вхождениями; перестановка языков обязана сохранить порядок и разрешённую invalid-аннотацию, а не исправиться сортировкой.
- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test i8n_contract`; реализовать общие emit/read механизмы и генерацию predicate/shortening. Если потребуется функция с именем I8nText внутри core/compiler, вернуться к разложению декларации.
- [ ] Подключить единый proof: строить окончательный кандидат YAML, заново экспортировать его, сравнивать восстановленный XML без нормализации содержимого. Для совпадения не сохранять подробный diff; для несовпадения выделить минимальную разрешённую границу и повторно проверить окончательный аннотированный кандидат.
- [ ] Добавить повреждение кандидата между чтением и proof: изменение текста должно обнаружиться, даже если исходный XML остался доступен в буфере. Подделанная исходная копия не может давать успешную проверку. Raw допускается только в уже разрешённых I8nText item-случаях из корпуса.
- [ ] Прогнать `nkdk-dev corpus run --manifest tests/conversion-corpus/manifest.json --group i8n-text`, затем весь поддержанный корпус scalars+i8n-text. Записать ограничения покрытия; выполнить fmt/clippy/workspace tests, дубли и коммит.

## Приёмка этапа А

- [ ] Исходник common и owner на одном YAML-языке проходит parse/link/generate и реальную сборку Rust.
- [ ] Нет ручного I8nText-конвертера или отдельной функции его проверки; обе стороны и validation получены из одной декларации.
- [ ] Сохранены подтверждённые состояния I8nText, форматирование, языки, повторы, порядок и аннотации.
- [ ] Независимый корпус выполняется реальным сгенерированным кодом, нулевой набор не считается успехом.
- [ ] Нейтральные crates не зависят от compiled-rules/предметных модулей; compiler отсутствует среди runtime-зависимостей бинарника.
- [ ] Первый результат измеряется только как поддержанный ограниченный этап, без заявления общей цели 10×.

Приёмка этапа А открывает [этап Б](2026-09-10-rust-yaml-catalog.md). Полный проект и публичный MCP до него не переключаются.
