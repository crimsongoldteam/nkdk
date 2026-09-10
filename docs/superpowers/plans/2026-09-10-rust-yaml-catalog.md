# Этап Б: полный каталог common и rules на YAML — план реализации

**Учёт готовности объектов:** [чеклист перехода](2026-09-10-rust-yaml-object-checklist.md). После завершения каждого объекта обязательно обновлять его статус, подтверждающие ссылки и сводку в той же порции изменений. Частичный перенос не отмечать завершённым.

> **Для исполнителя:** использовать `superpowers:executing-plans`, без субагентов. Вход — принятый этап А. Выполнять работы семействами по карте механизмов ниже, сохраняя проверяемый реестр и индивидуальную приёмку объектов.

**Goal:** Выразить все существующие common и rules владельцев/форм единым языком, расширить Rust-генератор общими конструкциями и получить преобразование полного e2e-проекта с сохранением проверок и аномалий.

**Architecture:** Сложные операции раскладываются на общие конструктивные отношения и предметные YAML-декларации. Каталог компилируется с типизированными параметрами/входами; индексы и ресурсы подготавливает операция. Coverage связывает каждый исходный договор с конкретной декларацией и независимыми случаями.

**Tech Stack:** Workspace этапа А, сгенерированный Rust, существующий e2e и corpus. Нейтральные механизмы не содержат таблиц конкретных типов метаданных.

**Spec:** [Единый язык](../specs/2026-09-10-declaration-language-design.md), особенно §8, §11, §13.3; [реестр common](../specs/2026-09-10-common-declarative/README.md). Все условия [главного плана](2026-09-10-rust-yaml-declarations.md) обязательны.

## Перенос семействами: рабочая карта механизмов

Принято пользователем после обсуждения ускорения перехода. Этот раздел уточняет порядок Б1–Б8: единица реализации — общий механизм вместе с семейством деклараций, единица приёмки — отдельный объект из чеклиста. Существующие подробные задачи ниже сохраняют требования к поведению. Приоритет задают зависимости этой карты; старое указание переносить объекты поштучно больше не действует.

На момент составления карты (база `c7f1a3bc6`) реестр содержал 90 common: 3 приняты, 87 распределены ниже без пропусков и повторов. Актуальная приёмка отражена только в чеклисте и текущем состоянии. У каждого объекта указан основной пакет; готовность требует также всех перечисленных зависимостей. Это распределение работ, а не обещание, что одной возможности достаточно для всего объекта.

| Пакет | Общий механизм | Основные common-объекты | Зависимости и граница приёмки | Независимые граничные случаи |
|---|---|---|---|---|
| М1 — принят | Размеченный выбор строки / точного числа | `stringOrNumber`, `predefinedCode` | Сначала два простых потребителя; позже используется внутри MetadataValue. Не выбирать число по виду строки `001`. | Разные xsi:type при одинаковом тексте; точное большое число; строка `001`; пустота и неизвестный тип. |
| М2 | Параметры, присутствие и числовая запись скаляров | `boolean`, `number`, `string`, `minMaxValue`, `dateTime` | Приняты boolean, number, minMaxValue и dateTime; typed/default, nil и точка/запятая проверены. Строковые ссылки и итоговая приёмка string ждут М6. | Отсутствие ≠ пустота ≠ default; условные границы; пробелы; аномалия сокращённого значения; время не зависит от машины. |
| М3 | Вложенная запись и профиль календаря | `standardPeriod`, `standartBeginningDate` | После М2 и пакета перечислений. Один общий механизм для двух календарных структур. | Отсутствующие вложенные поля; секунды; неизвестный variant; нет придуманного ограничения start≤end. |
| М4 | Коллекции обычных значений и записей | `fieldsList`, `indexField`, `webSocketClientHeaders`, `xDTOPackages`, `usePurposes` | Расширить уже работающую коллекцию I8nText: сменное XML-имя, оболочки, наборы и составные элементы. | Пустота; один/несколько элементов; повтор ключа; порядок; отсутствие Key/Value; неизвестные элементы без фильтрации. |
| М5 | Текстовые представления, выбор формы и оформление | `border`, `color`, `font`, `picture`, `styleItemValue` | Требует М1–М4, перечислений и М6 для проверяемых ссылок. Перенос оформления завершать после готовности ссылочной части. | Пересекающиеся словари; префиксы; auto; нули/false; прозрачность; тип StyleItem; неизвестный вариант. |
| М6 | Подготовленные индексы, пути, QName и проверяемые ссылки | `metadataPath`, `metadataRef`, `metadataField`, `metadataTargets`, `metadataTargetProjectResolvers`, `xdtoTypeName`, `typeLink`, `typeDescription`, `childSubsystemNames`, `functionalOptionsProperty`, `inputByStringFields` | Сначала общая подготовка фактов и грамматика; затем пакет ссылочных деклараций. Этот механизм разблокирует ссылочные части М2/М5. | Не найдено / неоднозначно / цикл; относительный владелец; URI вместо префикса; declared/effective type; индекс готовится вне преобразования значения. |
| М7 | Значение с объявленным типом и обратимые сокращения | `metadataValue`, `fillValue`, `metadataObjectRefCollection`, `choiceList`, `mobileDeviceCommandBarContent`, `сhoiceParameters`, `сhoiceParameterLinks` | После М1, М3, М4, М6. Выбор определяется объявленным типом и правилами представления. | Строка/число/ссылка; nil; пустой список; точность; недоступные факты; общий шаблон восстановления сокращений. |
| М8 | Стандартные составы, соединение коллекций и состояния | `accountingFlag`, `accumulationRegisterAggregates`, `additionalIndex`, `characteristicsDescription`, `exchangePlanContent`, `predefined`, `predefinedItem`, `standardAttributeDescription`, `standardTabularSectionDescription`, `commonAttributeContent`, `userVisible` | После записей/коллекций/ссылок; predefinedItem дополнительно ждёт идентичности М9. | Повторы по обеим сторонам соединения; порядок; отсутствующий стандартный элемент; Modify/Check; рекурсивные элементы; ролевой и общий флаг. |
| М9 | Подготовленные идентичности, ресурсы и интерфейсы | `uuid`, `userSettingsID`, `childFileItemNames`, `childFormNames`, `childTemplateNames`, `choiceForm`, `clientApplicationInterface`, `externalFile`, `externalPicture`, `help`, `homePageWorkArea`, `internalInfo`, `module`, `rootCommandInterface`, `wsDefinitionSchemas`, `xmlRoot` | Идентичности выделять ранним законченным подпакетом для М8; файловые ресурсы и интерфейсы — после фактов и коллекций. | Стабильный ID при контрольном экспорте; bsl/bin; отсутствие/неоднозначность ресурса; порядок; рекурсивные панели; IO остаётся в операции. |
| М10 | Рекурсивные варианты DCS | `dataCompositionSystem` | После М1, М3–М9 по фактическим импортам. 25 вложенных каталогов принимаются по договору, корень — после них. | Приоритет вариантов; группы; один массив как одно значение; параметры с правилами по ключу; порядок; вложенные аномалии. |
| М11 | Композиция и подключения владельцев | `metadataAttribute`, `metadataCommand`, `metadataCommandGroup`, `metadataDocumentJournalColumn`, `metadataExternalDataSourceCube`, `metadataExternalDataSourceCubeDimension`, `metadataExternalDataSourceCubeResource`, `metadataExternalDataSourceDimensionTable`, `metadataExternalDataSourceField`, `metadataExternalDataSourceFunction`, `metadataExternalDataSourceTable`, `metadataHTTPServiceMethod`, `metadataHTTPServiceURLTemplate`, `metadataIntegrationServiceChannel`, `metadataRegisterAttribute`, `metadataRegisterDimension`, `metadataRegisterField`, `metadataRegisterResource`, `metadataSequenceDimension`, `metadataTabularSection`, `metadataTaskAddressingAttribute`, `metadataWebServiceOperation` | Подключать по мере готовности импортов; затем appliedObjects и forms. common не получает зависимость на реализации владельцев. | Полный состав полей; XML-order; overrides; qualified owner; схема; вложенные типы; состояния расширения. |

**Отдельный пакет: все системные перечисления.** Перенести каталог одной таблицей деклараций через общий генератор таблиц и одну общую проверку полного покрытия. Проверить все пары, коллизии, неизвестный литерал и восстановление исходного XML. Не создавать отдельный механизм или одинаковый тест для каждого перечисления; в чеклисте остаётся один пункт.

**Сквозной механизм аномалий.** Неизвестная структура, смешанный XML, повторы самого свойства и повреждённый синтаксис остаются работой общего резервного пути. Закрывать связанные случаи вместе с семейством, где они встречаются; не писать предметные обработчики. Перед полной приёмкой проекта проверить и оставшиеся классы отклонений. Ошибки реализации и IO не превращать в успешный результат с пометкой данных.

**Порядок ближайшей работы:** М1 → М2 → весь каталог системных перечислений → М3 → М4 → М6 → завершение М5 → М7 → идентичности М9 → М8 → остаток М9 → М10 → оставшиеся подключения М11. Готовые подключения М11 можно принимать раньше, когда доступны их импорты. Перенос М6 перед приёмкой М5 устраняет ожидание ссылочных проверок оформления. UUID не задерживает весь пакет обычных скаляров.

### Цикл одного семейства

- [ ] Прочитать одну карточку договора и затронутые исходники; перечислить все потребители нового механизма и необходимые профили. Не перечитывать весь каталог.
- [ ] Подключить в проверку минимум двух разных потребителей, если они есть: для М1 это stringOrNumber и predefinedCode. Зафиксировать независимые ожидаемые значения до реализации.
- [ ] Реализовать общий механизм и декларации семейства. Язык расширять только при невозможности выразить договор существующими средствами; не создавать функции конкретных common.
- [ ] Во время изменения выполнять узкие проверки механизма. Для деклараций использовать параметризованную проверку корпуса; добавлять отдельный тест только для нового наблюдаемого договора.
- [ ] После законченного семейства выполнить полные проверки слоя по командам ниже. Если проверка выявила общий дефект, после исправления повторить затронутые проверки и необходимые общие проверки.
- [ ] Для каждого принятого объекта обновить чеклист и coverage в тех же изменениях; один итоговый результат семейства записать в журнал. Обновить короткое текущее состояние и продолжить следующий доступный пакет без ожидания подтверждения.

### Проверки без повторного выполнения всего проекта на каждом шаге

| Когда | Проверка |
|---|---|
| Изменён оператор/генерация | Из каталога `rust`: `cargo test -p nkdk-rule-compiler --test <затронутый набор>` и `cargo test -p nkdk-compiled-rules --test <затронутый набор>`; сначала убедиться, что новый случай выявляет дефект |
| Подключается декларация | Общий корпус с независимыми ожиданиями и существующие неизменённые e2e-свойства: обе стороны, validation, round-trip; пустая выборка считается неудачей |
| Завершено семейство | Из `rust`: `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`; из корня: `pnpm duplicates -- --base <коммит начала семейства>`; регрессии затронутых e2e-профилей |
| Меняются зависимости/подключения | `pnpm test:architecture:rules` и `pnpm test:architecture`; также обязательны перед PR |
| Затронуто поведение TS | Его соответствующие тесты; `pnpm test` обязательно перед закрытием issue и полной приёмкой. Команды с LMDB — вне песочницы по AGENTS.md |

Порог jscpd не ослаблять, baseline не перезаписывать ради новых нарушений. Зелёная проверка после простого изменения документации не требует повторного полного Rust-прогона. Цели 10× проверяются отдельно на сопоставимых операциях e2e; число принятых деклараций их не доказывает.

### Ограничение расхода контекста

[Текущее состояние](2026-09-10-rust-yaml-current.md) — единственная краткая точка входа: текущий пакет, следующий шаг, ограничения, последний принятый коммит. Карта выше хранит порядок; чеклист — готовность объектов; журнал — исторические доказательства. Не копировать одну и ту же историю во все документы, не возвращать полные журналы успешных команд: достаточно кода завершения и итогов. Без субагентов. Вопрос пользователю нужен только для нового неоднозначного договора; независимую работу продолжать.

## Карта файлов и порядок покрытия

| Задача | Исходники common / rules | Целевые декларации и общие механизмы |
|---|---|---|
| Б1 | Карточки 01, 02, 04: скаляры, оформление, текстовые коллекции | `declarations/common/*.yaml`; compiler/generate/{patterns,choices}.rs; core/text/{pattern,number,calendar}.rs |
| Б2 | Карточка 03: пути, ссылки, типы, metadataTargets; факты runtime | common/{metadata-path,metadata-ref,metadata-field,type-description,type-link,xdto-type-name}.yaml; core/facts/{index,query,graph}.rs |
| Б3 | FillValue и все составные MetadataValue | common/{metadata-value,fill-value}.yaml и вложенные варианты; owner profiles; compiler/generate/relations.rs |
| Б4 | Карточка 06: стандартные составы, ExchangePlanContent, состояния | common/{standard-attribute-description,exchange-plan-content,predefined,predefined-item}.yaml; core/collections/{join,canonical}.rs |
| Б5 | Все 25 вложенных частей DataCompositionSystem | `declarations/common/data-composition-system/`; compiler/generate/{recursive,choices}.rs |
| Б6 | Карточка 08 и инфраструктура 09: ресурсы, identity, интерфейсы | common/{module,help,external-file,internal-info,client-application-interface}.yaml; core/resources.rs, identities.rs |
| Б7 | Карточка 05, остаток всех 90 каталогов, appliedObjects, forms, systemEnumerations | `declarations/common/metadata-*/rules.yaml`, `declarations/applied-objects/*/rules.yaml`, `declarations/forms/`, `declarations/system-enumerations/` |
| Б8 | Каталог, зависимости, дубли и полный e2e | `tests/migration/coverage.json`, dev/{coverage,architecture,duplicates,e2e}.rs |

Для точных имён источников использовать `source-inventory.json` и `registration-inventory.json` первого обзора. Имя `сhoiceParameterLinks` в исходниках начинается с кириллической «с»; машинный реестр исключает потерю такого каталога при ручной транслитерации. DCS проверяется как 25 вложенных каталогов и корневой index, а не одним флагом «DCS готов».

Одна запись coverage.json включает `sourcePaths`, `registrations`, `targetDeclarations`, `caseIds`, `status`, `reason`. Для `verified` обязательны непустые targetDeclarations и caseIds. Для служебного реэкспорта `infrastructure` нужно указать, где обеспечивается его ответственность. Checker проверяет точное равенство множества исходных записей, а не только число 90.

## Общая граница фактов

Сигнатуры для Б2–Б6; определения находятся в conversion-core, подготовка файлов и IO — вне чистого правила:

```rust
pub struct FactId(pub u32);
pub struct Generation(pub u64);
pub struct PreparedFacts { /* закрытые типизированные колонки */ }
pub struct FactRequest { pub fact: FactId, pub owner: String }
pub enum FactState<T> { Ready(T), Missing, Ambiguous, Cycle, Unready }
pub struct FactPlan { /* проверенные проекции и зависимости из деклараций */ }
pub struct SourceBatch<'a> { pub files: Vec<(&'a str, &'a [u8])> }
pub struct FactBuilder { /* накопление компактных колонок поколения */ }

impl FactBuilder {
    pub fn new(plan: &FactPlan, generation: Generation) -> Self;
    pub fn push(&mut self, source: SourceBatch<'_>) -> Result<(), Vec<RuntimeDiagnostic>>;
    pub fn finish(self) -> Result<PreparedFacts, Vec<RuntimeDiagnostic>>;
}

pub fn prepare_facts(
    plan: &FactPlan, source: SourceBatch<'_>, generation: Generation,
) -> Result<PreparedFacts, Vec<RuntimeDiagnostic>>;
```

Комментарии в закрытых структурах обозначают намеренно непубличное хранение, не право хранить произвольный JSON/полный контекст. FactPlan генерируется из contributions/inputs; фактическое значение не выводится из имени FactId. Typed-колонки и layout описываются в спеке перед реализацией Б2. Сгенерированные адаптеры превращают разрешённые facts в PreparedInputs конкретного EntryId из этапа А.

SourceBatch — ограниченная порция файлов по общему бюджету памяти, а не все исходники проекта. FactBuilder.push объединяет компактные индексные колонки разных порций; исходные буферы освобождаются после push. Только finish публикует готовое поколение и окончательно разрешает зависимости. prepare_facts — удобная граница для одного полного небольшого набора, внутри использующая тот же builder. Runtime хранит поколение фактов, а не копии XML для каждого потребителя.

### Б1. Перенести оформление, скаляры и текстовые грамматики

- [ ] Для каждого типа проверить общий вывод аномалий из нормальной декларации согласно §9 единой спецификации. Не вводить перечни аномалий и предметные обработчики. Нестандартные входные данные сохраняются, обработка продолжается, итоговый XML восстанавливается без потерь.
- [ ] Для boolean заменить текущие отказы на пустом XML-узле и неизвестном токене сохранением аномалии свойства: пользователь согласовал эту область `!xml/raw`. Расширить существующие проверки нормальными значениями, отсутствием, нестандартным значением, сохранностью соседних полей и обратным восстановлением. Условия аномалий отдельно в YAML не описывать.

**Files:** карточки 01, 02, 04; `declarations/common/{border,color,font,picture,style-item-value,date-time,standard-period,type-link}.yaml`; compiler/generate/patterns.rs, choices.rs; core/text/*.rs; compiled-rules/tests/text_and_style.rs.

**Interfaces:** типизированные text-pattern/choice из Program; результат — тот же convert_file/validate_file, без новых common API.

- [ ] Для каждого вида строки составить принятие/каноническую печать: qualified name, ref с префиксом, escaping, вложенные скобки, пустота. Вписать точные узлы slots/sequence/choice/repeat в единую спеку; ограничение вложенности даёт диагностику, а не усечение.
- [ ] Добавить табличные случаи Font/Color/Border/Picture и различение строки `001` от числа; для дат — точность минут/секунд, исходный timezone и invalid. Не усиливать календарную проверку автоматически. Участвуют реальные существующие XML-фикстуры, а не новые упрощённые ожидания.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test text_and_style`, получить содержательные отказы, реализовать общие разбор/печать и декларации.

  ```rust
  // Свойство text-pattern, а не повтор его алгоритма:
  for case in independent_pattern_cases() {
      let value = parse_pattern(&case.pattern, &case.input).unwrap();
      assert_eq!(print_pattern(&case.pattern, &value).unwrap(), case.canonical);
  }
  ```

  `PatternCase { pattern: Pattern, input: String, canonical: String }` и `independent_pattern_cases() -> Vec<PatternCase>` определяются в тестовом модуле; Pattern — заранее скомпилированный детерминированный автомат text-pattern со слотами. `parse_pattern(&Pattern, &str) -> Result<PatternValue, PatternError>` и `print_pattern(&Pattern, &PatternValue) -> Result<String, PatternError>` — общий механизм core/text/pattern.rs; связанные слоты и ошибки типизированы по Pattern. Генератор специализирует постоянный шаблон/таблицу автомата; YAML или дерево исходной грамматики не разбирается заново на каждом значении.

- [ ] Проверить пересечение вариантов и канонический reverse; `rawRef` Color/Font/Picture не переводить автоматически в новый raw-тег. Выполнить обе стороны и validation группы text-style, затем коммит каждого завершённого семейства.

### Б2. Подготовить ссылки и типы один раз на операцию

**Files:** common ссылок/типов из таблицы; core/facts/{index,query,graph}.rs; compiler/link.rs, generate/facts.rs; compiled-rules/tests/references.rs; core/tests/facts.rs.

**Interfaces:** FactPlan/PreparedFacts/prepare_facts из общей границы. Lookup сохраняет found/missing/ambiguous и поколение; DefinedType-expansion выдаёт Cycle отдельно.

- [ ] Зафиксировать в спеке типы индексных колонок, ключи, доступные проекции, пути зависимости и правила generation. Связать metadata reference occurrences и rename-потребителей с тем же определением reference, а не копией resolver.
- [ ] Добавить in-memory графы: обычная ссылка, неверный вид цели, неоднозначность, цепочка DefinedType, цикл из двух узлов, отсутствующая цель. Проверить, что unresolved не превращается в пустой список разрешённых типов.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-conversion-core --test facts`; реализовать подготовку колонок, общий lookup и ограниченный graph-expansion.

  ```rust
  #[test]
  fn a_cycle_is_not_an_empty_effective_type() {
      let result = expand_test_graph(&[("A", "B"), ("B", "A")], "A");
      assert!(matches!(result, FactState::Cycle));
  }
  ```

  `expand_test_graph(&[(&str, &str)], &str) -> FactState<Vec<String>>` — helper теста: составляет общий FactPlan графа и вызывает подготовку/lookup; он не содержит собственный обход. Написать его в core/tests/facts.rs.

- [ ] Сгенерировать extraction-проекции из declarations, а не сканировать все XML для каждого lookup. Проверить счётчиком, что два потребителя одного факта используют одну подготовку поколения; изменение входного файла инвалидирует только объявленных зависимых потребителей.
- [ ] Выполнить corpus group references в обоих направлениях и validation. UUID-ссылки сохраняют отдельный действующий договор без lookup; собственные UUID относятся к Б6. Проверки слоя и коммит.

### Б3. Выразить MetadataValue и FillValue декларативно

**Files:** declarations/common/metadata-value/*.yaml, fill-value.yaml; профили Catalog/Document/Attribute; compiler/generate/relations.rs; compiled-rules/tests/fill_value.rs; tests/conversion-corpus/cases/fill-*.

**Interfaces:** входы declared/effective type, owner policy, presence и PreparedFacts; результат содержит value/implicit/invalid/unresolved и диагностический адрес. Все варианты и ограничения принадлежат декларациям; никаких classifyFillValue в Rust.

- [ ] Заполнить в единой спеке конечную таблицу классификации: string/number/boolean/date, UUID/reference, ValueStorage, nil/missing, соответствие ограничению типа, standard-member default, declared/effective состояния. Указать роль каждой ранее написанной предметной функции и её заменяющих общих узлов.
- [ ] Ввести один независимый корпус для MetadataValue и FillValue: строковая лексика против YAML quoting, длина/точность числа, nullable, ссылка другого вида, unresolved DefinedType, default двух разных владельцев, одинаковое явное значение в cf и adopted. Ожидания брать из действующих тестов и ограничений, не из старой Rust-классификации.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test fill_value`; добавить недостающие общие predicate/match и декларации, не новые Rust-модули common.

  ```rust
  #[test]
  fn different_owners_bind_the_same_common_contract() {
      let report = run_fill_value_cases(&["catalog-default", "document-default"]);
      assert_eq!(report.failed_cases, 0);
      assert_eq!(report.common_definition_ids, ["common.fill-value"]);
  }
  ```

  `run_fill_value_cases(&[&str]) -> FillCaseReport` и `FillCaseReport { failed_cases: usize, common_definition_ids: Vec<String> }` — локальный helper compiled-rules/tests/fill_value.rs: выполняет case-id через реальный каталог и читает происхождение общего определения из GeneratedSources. Результат конвертера и проверки сравниваются с manifest.

- [ ] Провести отрицательную проверку каталога: декларация с `native`, `operation` или Rust-путём функции отвергается. Изменение таблицы implicit в YAML должно менять обе стороны и validation после пересборки без изменения Rust-common.
- [ ] Прогнать группы metadata-value/fill-value и ранее покрытые references/i8n-text; проверки слоя и коммит. Не считать скалярный benchmark доказательством этого результата.

### Б4. Реализовать обратимые соединения и состояния расширений

**Files:** common/exchange-plan-content.yaml, standard-attribute-description.yaml, predefined*.yaml; core/collections/{join,canonical}.rs; compiler/generate/state_relations.rs; compiled-rules/tests/collection_states.rs.

**Interfaces:** проверенный узел keyed-join содержит ключи, кардинальности, источники порядка и обратные проекции. State-relation — конечная таблица, параметризованная профилем владельца; runtime не выбирает её по itemType.

- [ ] Закрыть в той же спеке грамматику join, canonical-members и state-relation на ExchangePlanContent: Item и ExtensionProperty могут присутствовать раздельно, disabled отличается от отсутствия, Check/Modify имеют разные представления.
- [ ] Добавить таблицу граничных случаев: непарный элемент каждой стороны, повтор ключа, state-only disabled, некорректная autoregistration, изменение стандартного члена, перестановка. Для каждой строки проверить оба направления, диагностику и отсутствие потери элемента.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test collection_states`; реализовать общий план соединения и обратное распределение.

  ```rust
  for case in independent_join_cases() {
      let joined = join(&case.plan, &case.left, &case.right).unwrap();
      let restored = split(&case.plan, &joined).unwrap();
      assert_eq!(restored.left, case.left);
      assert_eq!(restored.right, case.right);
  }
  ```

  `JoinPlan` — связанный узел rule-model; `join(&JoinPlan, &[JoinRow], &[JoinRow]) -> Result<JoinedRows, JoinError>` и `split(&JoinPlan, &JoinedRows) -> Result<JoinInputs, JoinError>` — общие механизмы core/collections/join.rs. `JoinRow` хранит типизированные поля и адрес вхождения по схеме плана, `JoinInputs { left: Vec<JoinRow>, right: Vec<JoinRow> }`; состав тестовых данных заранее задан в independent_join_cases, не вычисляется через split.

- [ ] Проверить, что неинвертируемая проекция отвергается компилятором. Если для panelDef нужна общая структура shared-definition, исследовать существующий договор на Б6, не подменять его потерей дубликатов.
- [ ] Прогнать группы collection-states/standard-members и базовый корпус; проверки слоя и коммит.

### Б5. Перенести все варианты DCS

**Files:** declarations/common/data-composition-system/* по 25 записям [карточки DCS](../specs/2026-09-10-common-declarative/07-dcs.md); compiler/generate/recursive.rs; compiled-rules/tests/dcs_contract.rs.

**Interfaces:** рекурсивные sequence/record/choice, локальные rule-профили параметров и discriminator из общего языка. Кардинальность определяется типом на конкретном уровне, не проверкой «это массив».

- [ ] Развернуть полную декларацию ParameterValue перед кодом: scalar/map/marker, value 0/1/many, массив ChoiceParameterLinks как одно значение, presentation/use/items, Font-ключи и xsi:nil. В спеке выписать пары пересекающихся форм и способ однозначного выбора.
- [ ] Составить отдельные таблицы DcsMetadataValue и DcsMetadataTypedValue; пустой registry.ts не считать отсутствием реализации. Внести quoted text, Field, DesignTimeValue, пустой ValueList, типы и настройки групп.
- [ ] Получить падающие случаи `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test dcs_contract`, затем реализовать общую рекурсию с контролем глубины и дискретный dispatch по объявленным ключам/дискриминаторам.

  ```rust
  #[test]
  fn collection_valued_parameter_stays_one_parameter_value() {
      let report = run_dcs_case("parameter-choice-links-array");
      assert_eq!(report.semantic_value_count, 1);
      assert!(report.xml_matches && report.yaml_matches && report.diagnostics_match);
  }
  ```

  `run_dcs_case(&str) -> DcsCaseReport` — helper таблицы dcs_contract; поля отчёта: semantic_value_count, xml_matches, yaml_matches, diagnostics_match. Количество значений проверяется на внешнем XML-числе value-узлов/ожидаемом договоре, а не на приватном контейнере реализации.

- [ ] Перенести остальные строки DCS с точной ссылкой на декларацию и case-id: filter, order, conditionalAppearance, structureItemGroup, parameters, calculatedFields. Не помечать дочерние каталоги автоматически по статусу родительского.
- [ ] Проверить весь dcs-корпус и сочетания вложенного I8nText/MetadataValue. Ошибка глубины должна завершиться диагностикой без обрезанного результата. Проверки слоя и коммиты завершённых семейств.

### Б6. Описать ресурсы, идентичности и совместные определения

**Files:** common/{module,help,external-file,external-picture,internal-info,uuid,child-file-item-names,client-application-interface,root-command-interface}.yaml; core/{resources,identities}.rs; compiled-rules/tests/resources.rs; apps/nkdk/src/prepare.rs.

**Interfaces:** декларативные ResourceRequest/IdentityRequest → подготовленные слоты → ResourceContribution. Чтение/запись и генерация UUID происходят один раз на границе операции; контрольный экспорт использует те же значения.

- [ ] В той же спеке задать точные структуры requests/contributions, относительные сегменты путей, ошибки выхода за корень, альтернативные файлы и владение shared-definition. Для ClientApplicationInterface описать panel/panelDef, повторное использование определения и текущие разрешённые границы raw.
- [ ] Добавить integration-набор в реальном временном каталоге: пустой BSL/HTML, несколько языков Help, Template.xml с двоичным соседом, собственный UUID, повторное использование panelDef, прерывание до публикации. Содержимое файлов сравнивать побайтово; XML-шаблон пока копируется целиком по действующему ограничению.
- [ ] Выполнить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test resources`; реализовать общие шаблоны/identity slots и отдельный файловый адаптер приложения.

  ```rust
  #[test]
  fn proof_reuses_prepared_identity() {
      let report = run_resource_case("missing-own-uuid");
      assert_eq!(report.identity_allocations, 1);
      assert!(report.proof_matches && report.resource_bytes_match);
  }
  ```

  `run_resource_case(&str) -> ResourceCaseReport` — helper resources.rs; счётчик allocations берётся у тестового генератора identity, а proof_matches и resource_bytes_match — из независимых ожидаемых файлов. Unit-тесты планирования ресурсов в памяти отделить от этого filesystem integration-набора.

- [ ] Проверить, что ошибка преобразования не публикует половину группы файлов; отложенную группу передать последующему проектному runtime. Никакого IO из generated common.
- [ ] Прогнать resources/interface корпус, уточнить coverage для всех 14 ресурсных каталогов и служебных root-файлов. Проверки слоя и коммит.

### Б7. Перенести полный каталог common, владельцев и форм

**Files:** все декларации по таблице этапа; `tests/migration/coverage.json`; dev/coverage.rs; compiled-rules/tests/catalog_contract.rs; `declarations/catalog.json` — список корневых entry-id для сборки, не второй язык правил.

**Interfaces:** неизменные convert_file/validate_file и генерируемые факт/resource-планы. Каталог выбирает EntryId; подключение common/fragment определяется imports, а не itemType-ветками runtime.

- [ ] Реализовать точную проверку coverage: `nkdk-dev coverage check --manifest tests/migration/coverage.json --require verified`. До окончания переноса она обязана перечислять непокрытые записи, а не возвращать успех по одному проценту покрытия.
- [ ] Переносить последовательно: оставшиеся скаляры/коллекции → metadataAttribute и 21 соседний metadata-record → CommonModule целиком → Catalog/Document → остальные appliedObjects → InputField и остальные forms → общие регистрации. Системные перечисления переносить перед их первым потребителем. На каждом шаге брать список source/registrations из реестра, а не угадывать по имени каталога.
- [ ] Для каждого владельца сопоставить все поля и ветви: xmlOrder/reference, dynamic defaults, adopted state, children, schema, references, rename, files (Enterprise исключён из переноса). Добавить независимый случай в существующую таблицу catalog_contract и получить содержательный отказ перед декларацией.

  ```rust
  #[test]
  fn a_verified_owner_has_no_unmapped_registration() {
      let report = check_owner_coverage("MetadataCatalog");
      assert!(report.unmapped.is_empty(), "{:?}", report.unmapped);
      assert!(report.failed_cases.is_empty(), "{:?}", report.failed_cases);
  }
  ```

  `check_owner_coverage(&str) -> OwnerCoverageReport` и поля `unmapped: Vec<String>`, `failed_cases: Vec<String>` — тестовый helper: читает скомпилированные include_bytes manifest и прогоняет соответствующие case-id. Отсутствие владельца в manifest считается ошибкой.

- [ ] Перенести builders/spread в use/with/compose; зависимые defaults — в уже определённые выражения/state-relations. Если обнаружен невыразимый договор, сначала дополнить общую грамматику и её отрицательные тесты; нельзя оставить `toXML: rust_function`.
- [ ] Обновлять coverage только после двух направлений, validation и всех зарегистрированных вспомогательных вкладов. Для реэкспорта или test-helper указать заменивший механизм, без создания фиктивной common-декларации.
- [ ] Запустить `cargo test --manifest-path rust/Cargo.toml -p nkdk-compiled-rules --test catalog_contract`, затем весь corpus и coverage check. Все 90 каталогов и все owner/form-регистрации должны быть учтены; проверки слоя и последовательные коммиты владельцев.

### Б8. Добавить архитектурные проверки, дубли и полный e2e

**Files:** `rust/architecture.json`; dev/{architecture,duplicates,e2e}.rs; dev/tests/{architecture,duplicates,e2e_contract}.rs; `.github/workflows/rust.yml`; reports/2026-09-10-rust-yaml-progress.md.

**Interfaces:** команды `nkdk-dev architecture check`, `nkdk-dev duplicates --base SHA`, `nkdk-dev e2e --xml DIR --yaml DIR --work DIR`. Инструменты возвращают ненулевой код для нарушения/неполного покрытия; пустой e2e — ошибка.

На этом этапе e2e — пакетное преобразование всех файлов компонента с общими facts в временный каталог. Постоянное состояние, инкрементальные операции и публикация рабочего проекта принадлежат В1; тестовый runner переиспользует generated-rules и подготовку из Б2/Б6, не создаёт второй предметный runtime.

- [ ] Добавить тестовые графы запрещённых зависимостей common→forms, core→compiled-rules и compiler как runtime-dependency. Проверять Cargo metadata для normal/build/dev рёбер отдельно и граф imports деклараций; одно не заменяет другое.
- [ ] Перенести проверяющий механизм старого architecture.rs после проверки его договора; расширить единым каталогом imports/with/bind. Не заменять проверку графа одним поиском строки itemType.
- [ ] Реализовать две проверки дублей: лексические токены ручного Rust и одинаковые осмысленные поддеревья связанного описания YAML. Сравнивать с git-base, исключать target/generated; семантически разные параметры/привязки не считать дублями. Сохранить понятный отчёт пар путей, а не автоматически создавать общий fragment.

  ```rust
  #[test]
  fn a_new_clone_fails_but_existing_debt_does_not() {
      assert!(check_duplicate_fixture("existing-only").passed);
      assert!(!check_duplicate_fixture("new-rust-clone").passed);
      assert!(!check_duplicate_fixture("new-rule-clone").passed);
      assert!(check_duplicate_fixture("different-bindings").passed);
  }
  ```

  `check_duplicate_fixture(&str) -> DuplicateReport { passed: bool, pairs: Vec<(String,String)> }` — helper dev/tests/duplicates.rs, использующий заранее заданные base/head версии файлов в памяти. Порог Rust-токенов закрепить равным существующим 50 токенам/5 строкам; порог осмысленного rule-фрагмента определить явными положительными/отрицательными fixtures, не длиной форматированного YAML.

- [ ] Запустить оба приложения отдельно на полном `e2e/fixtures/xml/cf` и `cfe` с той же базой, затем YAML→XML и validation. Проверить результирующее дерево, ресурсы, диагностику и аномалии. Отчёт сравнения не убирает UUID, namespaces, пустые узлы или порядок ради совпадения; допустимые подготовленные identity должны быть одинаковыми у сравниваемых операций.
- [ ] Подключить Rust проверки к CI параллельно существующей TS-проверке. Завершить этап только после workspace tests, полного corpus, coverage, architecture, duplicates и e2e. До удаления TS сохраняется также обязательная `pnpm duplicates` по главному плану.

## Приёмка этапа Б

- [ ] Все common/owner/form-записи точного реестра подтверждены; количество каталогов не используется вместо покрытия ветвей и регистраций.
- [ ] Новые common и rules состоят из YAML и общей грамматики; ручных предметных функций преобразования/проверки в core/compiler нет.
- [ ] Полный e2e конвертируется в обе стороны и проходит validation с сохранением согласованных аномалий.
- [ ] Core и compiler можно проверить без импорта полного предметного каталога.
- [ ] Остаточные публичные операции платформы/MCP/состояния явно переданы [этапу В](2026-09-10-rust-yaml-application.md), а не объявлены перенесёнными вместе с конвертером.
