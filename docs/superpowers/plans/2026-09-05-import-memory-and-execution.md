# Доработки памяти и общего исполнения импорта — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans through executing-plans-with-review. Реализацию и исправления выполняет основной агент; делегируется только независимое итоговое ревью. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Завершить согласованную оптимизацию XML-импорта: не удерживать лишние факты и представления, передавать только общие двоичные данные и выполнять преобразование с проверкой без повторной работы.

**Architecture:** Два чтения XML остаются. Первый проход оставляет отобранные локальные зависимости у владельца задания и передаёт факты общего индекса; после одной промежуточной публикации второй проход использует общий исполнитель импорта/экспорта и локальную смысловую проверку. Окончательные YAML, снимок компонента и состояние проекта сохраняют свои отдельные договоры публикации.

**Tech Stack:** TypeScript, Node.js 26.4.x, pnpm 10.33.0, Vitest, node:test, saxes, structurae, SharedArrayBuffer, LMDB, compiled MCP stdio. Новые зависимости не требуются.

**Spec:** `docs/superpowers/specs/2026-09-03-import-round-trip-optimization-design.md` — согласованная редакция после решения об удалении неиспользуемых строк.

## Global Constraints

- Worktree: `/Users/nikita/git/nkdk/.worktrees/round-trip-report-mb`; ветка `codex/round-trip-report-mb`. Не создавать второй worktree и не изменять `develop`/`main`.
- База сравнения этих доработок: `f9c51e1748d6f41cbe2806c90e9bd3c033367b6e`. Ревью включает весь последующий diff, staged/unstaged и относящиеся к реализации untracked-файлы.
- Поведенческий эталон `origin/develop` закреплён как `39b6aceedbee24d590d24566da0aa3eebeb22f07`; это отдельная база сравнения YAML, не база diff реализации.
- Этот план продолжает уже написанный код, а не повторно исполняет отмеченные пункты плана `2026-09-03-import-round-trip-optimization.md`. Старый план не является разрешением сохранить нарушение актуальной спеки. Его незакрытое ревью не объявляется пройденным.
- Ровно два основных чтения/разбора XML. Нет MessagePack, reference XML, `forReferenceOnly`, третьего чтения ради proof или полной контрольной XML-копии.
- «Production-код полностью отказывается от старого compatibility-представления XML». Удаляются также локальные/ленивые переходники, а не только публичные поля.
- «Данные, необходимые только воркеру-владельцу задания, остаются в его памяти без сериализации, упаковки, передачи главному потоку и записи во временный файл».
- «Каждый заново собираемый снимок содержит только строки, используемые его итоговыми записями и индексами». UUID и XML ID не перенумеровываются.
- «После его завершения не допускаются дополнительная сортировка, нормализация или дописывание аннотаций». Смысловые проверки выполняются до единственного обратного преобразования; XML-аннотации не запускают повторный proof.
- Нельзя расширять `PropertyRule`, `BasePropertyRule` и параметры построителей без отдельного согласования; внутренние скомпилированные планы используют существующие декларации и регистрации.
- Нельзя менять существующие XML-фикстуры и массово переписывать YAML-эталоны. Каждая новая аномалия относительно закреплённого develop требует объяснения, согласования нового применения тега и регрессионного теста.
- Нейтральные слои не получают ветвлений по конкретным формам/метаданным. Rules не зависят от platform; сборка предметных регистраций остаётся в composition.
- Блочное обновление `project-state.bin`, новая семантика метаданных, изменение числа воркеров между проходами и прогон реальной ARAutomation не входят в задачу.
- Unit-тесты только в памяти; FS/worker/LMDB — integration. Полные тесты и LMDB запускаются вне песочницы. Лимиты длительности и архитектурный baseline не ослабляются.
- Каждый слой заканчивается целевыми тестами, проверкой типов, `pnpm duplicates -- --base f9c51e1748d6f41cbe2806c90e9bd3c033367b6e` и коммитом по навыку `commit`.
- Пользователь разрешил обновление `.agents/architecture.md` под локальные проверки, один общий индекс и отбор используемых строк. Другие архитектурные решения не добавляются автоматически.

## Карта файлов и ответственности

| Задача | Изменяемые и новые файлы | Ответственность |
| --- | --- | --- |
| 1 | `.agents/skills/import-profile/import-profile.mjs`, `import-profile.test.mjs`; `.agents/architecture.md` | Достоверный разбор исходных измерений и согласованное описание потока. |
| 2 | `packages/rules/metadata/importFromXml/{prepareFacts,preparedDependencies,validationContribution,worker,ownerFacts,propertyFactsYamlView}.ts`; новый `importFactSelection.ts`; `packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts` | Состав и время жизни локальных фактов, прямые адреса без YAML Proxy. |
| 3 | `packages/runtime/xml/import/{document,saxesParser,importer,contracts}.ts`, `xml/structure/rawCodec.ts`; `metadata/ruleRuntime/xmlAnomaly/compatibilityView.ts`; потребители структурного XML в rules | Единственное дерево XML и операции прямого чтения. |
| 4 | `packages/runtime/metadata/ruleRuntime/property/{compiledPropertyPlan,xmlImportPlan,fromXMLToYAML,fromYAMLToXML,xmlPropertyExecution,compiledRuleExecution}.ts`; metadataCollection/formElement/metadataItem; предметные коллекции forms | Общий разреженный план присутствия и вложенный исполнитель. |
| 5 | `packages/rules/metadata/importFromXml/{worker,workerPool,types,validationContribution,semanticBoundary}.ts`; новый `localValidation.ts`; `packages/runtime/metadata/configurationIndex/{fragment,blockCodec,localReader}.ts` | Локальные проверки и минимальные двоичные общие сведения восстановления. |
| 6 | `packages/rules/metadata/projectState/importSession.ts`, `importSession.integration.test.ts`; `importFromXml/importConfiguration.ts`, `importConfiguration.integration.test.ts` | Единственная промежуточная публикация, окончательное состояние отдельно. |
| 7 | новый `packages/runtime/metadata/binary/recordBuffer.ts` и тест; `packages/rules/metadata/projectState/binary/{fragment,layouts,factTables}.ts` | Прямая запись числовых таблиц в блоки. |
| 8 | `packages/rules/metadata/projectState/binary/{stringPool,typedBuilder,builder}.ts` и тесты; новый `utf8StringArena.ts`; `packages/runtime/metadata/binary/hashIndex.ts` | Отбор живых строк, перенумерация ссылок, устранение копий UTF-8. |
| 9 | новый `packages/runtime/settings/workerCount.ts` и тест; новый `packages/rules/metadata/project/workerSettings.ts` и integration-тест; `packages/rules/metadata/runtime/createMetadataRuntime.ts`; `packages/platform/src/settings/{projectSettings,projectSettingsSchema}.ts`, `sessions/types.ts`; MCP settings consumers | Настраиваемый размер пула без зависимости rules от platform. |
| 10 | `importFromXml` и `fullSyncToXml` integration-тесты; runtime property/proof-тесты; e2e-тесты; новый отчёт `docs/superpowers/reports/2026-09-05-import-memory-and-execution.md` | Поведенческая эквивалентность, измерения и независимое ревью. |

Все пути в таблице относительно worktree. Новые модули не вводят второй реализации имеющегося алгоритма. Создание отдельного файла оправдано указанной ответственностью.

## Задача 1. Исходное состояние и достоверные измерения

**Interfaces:** существующие `parseProfileSteps(stderr)`, `summarizeImportSteps(steps, responseMs)` и `runProfile(options, dependencies)` сохраняют публичный смысл. Разбор строковых имён не должен превращать их в число; числовые поля имеют явно определённые единицы.

- [x] Выполнить исходный `pnpm test` вне песочницы. Результат 2026-09-05: exit 0, полный лог `/private/tmp/nkdk-import-followup-rYXr7J/baseline-tests.log`.
- [x] В `import-profile.test.mjs` добавить case действительного журнала, импортировав существующий `parseProfileSteps`:

  ```js
  const [step] = parseProfileSteps('[nkdk-profile-step] scope="worker" worker=0 step="fromXML PropertyRule exclusive" substep="GroupChildItems" items=3 time=12.5ms rssPeak=42MiB\n')
  assert.equal(step.substep, "GroupChildItems")
  assert.equal(step.time, 12.5)
  assert.equal(step.rssPeak, 42)
  assert.equal(step.items, 3)
  ```

  Добавить в таблицу `TableChildItems`, числоподобное строковое имя `"123"` и нечисловую величину времени: имя остаётся строкой, повреждённое время не становится `NaN`.
- [x] RED: `node --test .agents/skills/import-profile/import-profile.test.mjs`. Получено 12 passed, 2 failed: неверное строковое имя и повреждённые числовые метрики.
- [x] В `parseProfileLine` преобразовывать только известные числовые поля с полностью совпавшим числовым значением/единицей. Сохранить строки `step`, `substep`, `scope`, `operation`, пути и имена независимо от суффикса. Число принимать только при `Number.isFinite`; повреждённую величину сохранять строкой для диагностики, не включать в числовую сумму.

  ```js
  const numeric = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:ms|MiB)?$/u
  const parsed = numeric.test(value) ? Number(value.replace(/(?:ms|MiB)$/u, "")) : undefined
  ```

  Этот разбор применяется только после выбора числового поля, а не ко всем значениям журнала.
- [x] GREEN: весь node:test runner (14 passed); типы и duplicates — exit 0. Обновить разрешённые части архитектуры, описав промежуточные и окончательные данные отдельно.
- [x] Коммит документации и исправления измерителя.
- [ ] Снять baseline compiled MCP: один первый запуск и три повторных с `--runs 4 --concurrency 3`, без параллельных тестов/других импортов. Вход `/Users/nikita/git/round-trip-compact/cf/doc`, выход в существующем пустом подкаталоге `mktemp -d`. Сохранить исходные логи и отчёт. Если импорт падает, сохранить ошибку и стадию: сравнение завершённого нового импорта с незавершённым старым не доказывает ускорения полного импорта. Прежний неуспешный замер 107,84 с не использовать как успешный baseline.

  Попытка 2026-09-05 остановилась на первом запуске: `xml_import_yaml_failed`, `Cannot redefine property: ПутьКДанным`, форма записи регистра `СведенияОПользователях`. Подробности и выполненные проверки сохранены в `docs/superpowers/reports/2026-09-05-import-memory-and-execution.md`. Успешного baseline нет; повторные три запуска не выполнялись. Пользователь согласовал исправление этой ошибки и потребовал проверить отсутствие расхождений полного round-trip `doc` перед продолжением оптимизации.

- [x] Воспроизвести исходный сбой пути в тесте воркера и исключить повторную запись того же значения без отключения смысловой диагностики.
- [x] Сохранить согласованную пользователем неканоническую XML-форму неявного `FillValue` узким `!xml/raw` только этого поля. Например, `xs:dateTime` со значением `0001-01-01T00:00:00` отличается от канонического `xsi:nil="true"`, хотя смысловое поле отсутствует в обоих YAML. Канонический экспорт не менять; контрольный экспорт должен читать окончательное значение/отсутствие YAML, а не подменять его исходным фактом. Точно восстанавливаемые значения, например булево `Ложь`, не получают лишний raw.
- [x] Подтвердить полный round-trip `doc` без расхождений; существующие XML и YAML-эталоны не менять. При необходимости сравнить поведение с develop. Заключительный прогон `final-3`: 24 506 файлов совпадают побайтово после штатного сохранения служебного `Ext/ParentConfigurations.bin` вне YAML-договора; `comparison-final-3-complete.json` в `/private/tmp/nkdk-doc-fix-tnN6gJ`. E2E — 214 passed без обновления эталонов.

## Задача 2. Отбор локальных фактов вместо сохранённого YAML-представления

**Interfaces:** существующие `DirectImportFactsSink.acceptProperty`, `PreparedImportDependencies`, `DependentImportFacts` остаются границами runtime. В новом `importFactSelection.ts` определить `ImportFactSelection` с `accept(fact: Parameters<DirectImportFactsSink["acceptProperty"]>[0]): void` и `finish(): ImportDependencyFacts`. План отбора берётся из существующих зависимых регистраций и `CompiledPropertyPlan`, а не из новых флагов PropertyRule. В `ImportDependencyFacts` остаются только коллекции с конкретными потребителями; поле `proofProperties` не является основанием собирать все свойства.

- [ ] Усилить `preparedDependencies.test.ts`: зависимый `fillValue` сохраняет только тип реквизита; добавление постороннего заголовка и большого соседнего элемента не меняет выбранные факты. Сохранить проверку отсутствующего `valueType`, исходного/окончательного адреса и различия `present: false`/пустого значения.

  ```ts
  expect([...facts.properties.values()]).toEqual([{ item: { Тип: "Строка(10)" }, root: {} }])
  expect(prepareImportDependencies(facts).shouldOmit(candidate, { ЗначениеЗаполнения: "" })).toBe(true)
  expect(prepareImportDependencies(facts).shouldOmit(candidate, { ЗначениеЗаполнения: "новое" })).toBe(false)
  ```

  В `prepareFacts.integration.test.ts` добавить проверку задания с большим независимым свойством: оно не попадает в сохраняемые зависимости, но присутствует в окончательном YAML второго прохода. Ожидание YAML — литерал, не результат старого преобразователя.
- [ ] RED: `pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/preparedDependencies.test.ts metadata/importFromXml/prepareFacts.integration.test.ts --no-isolate` вне песочницы.
- [ ] Перевести сбор на отбор по потребителю при `acceptProperty`; убрать вычисление неиспользуемого `reconstructionFacts.rootPropertyValues`. Различать входы через реальный дискриминант/раздельную функцию, не через фиктивную коллекцию. Для одинаковых адресов сохранить один отделённый от XML неизменяемый массив:

  ```ts
  const yamlPath = [...fact.yamlPath]
  const sourceYamlPath = fact.sourceYamlPath === undefined ? yamlPath : [...fact.sourceYamlPath]
  ```

  При поэлементно равных явно переданных путях также использовать один массив. Полный индекс всех свойств не создавать.
- [ ] Мигрировать потребителей `createPropertyFactsYamlView` в `preparedDependencies`, `validationContribution`, `ownerFacts` и `worker`: прямое чтение выбранных фактов, предметные `item/root` только необходимых зависимостей. Удалить `propertyFactsYamlView.ts` после переноса всех потребителей, сохранив тип факта в `importYamlTypes.ts`. Тесты Proxy заменить проверками отбора и результата; не переносить Proxy в другой модуль.
- [ ] Для формы/BaseForm сохранить входы путей и сравнения основы по §12 спеки, но не три копии формы. Передавать одни факты нескольким потребителям по ссылке; освобождать после последнего чтения и в `finally`. Прогнать `preparedDependencies`, `fillValueImport`, `importConfigurationExtension`, `baseFormNecessity` и worker integration-тесты; типы, duplicates, коммит.

## Задача 3. Единственное структурное дерево XML

**Interfaces:** `XmlDocument`, `XmlElementNode`, `XmlAttributeNode` и `parseXmlDocumentWithSaxes` сохраняют идентичности, порядок и координаты; удаляются только compatibility-поля. Общие функции прямого доступа в `xml/import/document.ts`: `xmlAttributeValue(node: XmlElementNode, name: string): string | undefined`, `xmlTextValue(node: XmlElementNode): string`, существующая `xmlElementChildren`. `xmlTextValue` объединяет непосредственные текстовые узлы, не сериализует детей. Наличие элемента определяется отдельно, не по пустому тексту.

- [ ] Расширить `document.test.ts` и `saxesParser.test.ts`: поведение источника `<Root b="2"><Value/><Value>2</Value></Root>` проверяется через children/attributes/text и исходные диапазоны, не через compatibility. Добавить предметный тест импорта со структурным узлом без compatibility-поля: правило обязано работать.

  ```ts
  const root = parseXmlDocumentWithSaxes('<Root b="2"><Value/><Value>2</Value></Root>').roots[0]!
  expect(xmlAttributeValue(root, "b")).toBe("2")
  expect(xmlElementChildren(root, "Value").map(xmlTextValue)).toEqual(["", "2"])
  expect(xmlElementChildren(root, "Value").map(node => node.occurrence)).toEqual([1, 2])
  ```

- [ ] RED: runtime XML tests и выбранный rules import-test на таком узле. Не ограничиваться проверкой отсутствия поля в исходном тексте программы.
- [ ] По группам перевести потребителей: (а) XML parser/raw/compare и audit, (б) discovery/служебный XML/снимок, (в) property converters и вложенные коллекции. Для каждой группы сначала падающий поведенческий case, затем прямой доступ. Не создавать объект `{ _id, Child, "#text" }` как переходник входного XML. Формат окончательного XML обычного экспорта — отдельный допустимый результат, не compatibility-вход.
- [ ] Удалить `XmlDocument.compatibility`, `XmlElementNode.compatibilityValue`, `importContentFromXML`, `parseXmlWithSaxes` и `xmlAnomaly/compatibilityView.ts` после последнего потребителя. Обновить type guard по реальным признакам структурного узла. Для raw сохранить namespace, mixed content, PI, повторы и исходные ID; представление аномалий не расширять.
- [ ] GREEN: runtime XML suite, rules conversion tests, полные типы; поиск оставшихся символов как дополнительный аудит удаления, не как замена тестам. Duplicates и коммит.

## Задача 4. Разреженный двунаправленный план и общие коллекции

**Interfaces:** расширяется внутренний `CompiledPropertyPlan`, не PropertyRule. Добавить подготовленный `missingXMLProperties: readonly CompiledProperty[]`; существующие `missingYAMLStrategy`, `yamlToXMLOrder`, `xmlImportView` и `yamlOrder` образуют один договор присутствия. `createCompiledRuleExecution`, `createXMLPropertyExecution` и их потребители сохраняют общий экспортный путь и отдельные выходы ordinary/proof.

- [ ] Расширить compiled-property и локальные proof-тесты таблицей состояний: XML отсутствует / XML пуст / XML содержит значение; YAML отсутствует / YAML пуст / YAML содержит значение. В случаях default/evaluate проверить не только YAML, но и лишний/отсутствующий XML.

  ```ts
  const source = parseXmlDocumentWithSaxes('<Root><A/><C/></Root>').roots[0]!
  const [a, c] = xmlElementChildren(source)
  const proof = createLocalXmlProof()
  proof.compare(a!, { name: "A" })
  proof.compare(c!, { name: "C" })
  expect(proof.compare(source, { name: "Root", content: [
    proof.finish(a!), { type: "element", name: "B", occurrence: 1 }, proof.finish(c!),
  ] })).toEqual([{ kind: "presence", path: "/Root[1]/B[1]", ownerPath: "/Root[1]" }])
  ```

  Этот пример уточняет существующий тест `localProof.test.ts`: лишний B не должен создавать ложную перестановку C. Наличие default отдельно проверяется через реальный property converter, а не подменой его выхода в тесте.
- [ ] RED на счётчике вызовов отсутствующих незначимых свойств: на пустом singleton вызываются только действия с наблюдаемым эффектом. Проверить предметные ExtendedTooltip/ContextMenu без частных ветвей в runtime.
- [ ] При компиляции единожды отобрать missing XML действия из существующих default/preserve/evaluate и регистраций типа. В обходе идти по непосредственным присутствующим узлам, а при закрытии — только по `missingXMLProperties`, пропуская выполненные. Обычный экспорт использует те же решения, включая обязательные узлы и контекстные default.
- [ ] Устранить собственные циклы GroupChildItems/TableChildItems/CommandBarChildItems, дублирующие выбор вложенного rule и подготовку контекста: общий кадр коллекции и заранее разрешённые маршруты. Путь — курсор; материализация только для записываемого факта/диагностики. Оболочка родителя использует компактные receipts, не дерево проверенных детей.
- [ ] GREEN на присутствии/порядке/дублях/alias/raw/ID и растущих коллекциях: сравнение значения один раз, закрытие оболочки отдельно, неявные поля и окончательный YAML не меняются после возврата. Типы, duplicates, коммит.

## Задача 5. Проверки у владельца и минимальная двоичная передача

**Interfaces:** новый `importFromXml/localValidation.ts` принимает локальные запросы существующих `ValidationPendingCheck`/`ProjectStatePendingReference` и `ProjectStateQueryPort`, возвращает существующие `ValidationIssue[]`. `validatePendingChecks` и общий resolver переиспользуются, а не копируются. `workerPool.assignmentIdsByWorker` сохраняет владельца задания. Договор `ConfigurationIndexBlockFragment` остаётся предметным; на границе передачи используется существующий binary block codec вместо JSON-конверта.

- [ ] В worker integration-тесте распределить объект-владелец и форму по разным заданиям; проверить известную, отсутствующую и неоднозначную цель при одном и трёх воркерах. Литералы итоговых аннотаций берутся из соответствующих существующих fixtures, а не из вычисленного baseline.

  ```ts
  expect(formYaml).toContain("ПутьКДанным: !xml/invalid БазовыйОбъект.НеизвестнаяТаблица.Колонка")
  expect(result.failed).toEqual([])
  ```

  На реальном принятом двоичном фрагменте проверить отсутствие временных pendingChecks/pendingReferences и наличие общей цели; окончательный вклад должен содержать данные последующей проектной validation.
- [ ] RED: worker/importSession integration-тесты вне песочницы. При тестировании передачи проверять декодированный реальный фрагмент и результаты запроса, не только mock вызова.
- [ ] Хранить запросы, локальные формы, dependency facts и блок восстановления своего файла у его воркера. После публикации общих targets/owners/fields выполнить локальные проверки с общим query port до соответствующей YAML-границы. Сохранить accepted-аномалии, порядок зависимых проверок и подавление повторной диагностики.
- [ ] Удалить централизованный `collectSemanticValidationIssues` как потребитель переданных запросов. Для действительно междокументного алгоритма использовать факты общего индекса и владельца диагностики, а не возвращать все локальные запросы в координатор. Передавать общий минимум reconstruction profile двоично; конечные блоки координатор получает для записи LMDB. Сохранить обычный export и неизвестный raw внутри BaseForm без отдельного файла основы.
- [ ] Удалить внутреннее JSON-кодирование передаваемых фрагментов. Освобождать принятые буферы после объединения и локальные данные в `finally` задания/отмены. Прогнать blockCodec, workerPool, semanticBoundary, extension integration; типы, duplicates, коммит.

## Задача 6. Одна промежуточная публикация

**Interfaces:** `ProjectStateImportSession.commitSharedIndex(): Promise<ProjectStateReadToken>` заменяет `commitWorkingIndex` и `commitSemanticIndex`; без старых псевдонимов. `ProjectStateImportProfilePhase` получает `sharedIndex` вместо двух промежуточных фаз. `createReadToken`, `replaceFinalHashes`, `finalize`, `abort` сохраняют назначение.

- [ ] Переписать существующий сценарий importSession integration: одновременно собрать факт YAML и внешнего ресурса с предварительным хэшем `0n`, затем выполнить один `commitSharedIndex`.

  ```ts
  const firstToken = await session.commitSharedIndex()
  const nextToken = await session.createReadToken()
  expect(firstToken.buffers).toBe(nextToken.buffers)
  expect(firstToken.claim).not.toBe(nextToken.claim)
  ```

  Использовать реальные поля `ProjectStateReadToken` и реальный store; считать фактические сборки через существующую границу builder/profiler. Отдельно проверить read-session старого снимка, отмену, хэши и отсутствие промежуточной записи `project-state.bin`.
- [ ] RED: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/importSession.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts --no-isolate` вне песочницы.
- [ ] До барьера включить `externalFileSemanticStateBatch`, дождаться всех `writeStateFragment`, выполнить один commit, затем открыть накопление окончательных вкладов. Профиль восстановления и все воркеры получают один набор SharedArrayBuffer; меняется только одноразовая claim каждого token. Исключить неявный `currentBuffers()` на каждой пачке.
- [ ] `finalize` сохраняет конечную публикацию, хэши, результаты и чужие компоненты, но не повторяет уже выполненные проверки импорта. Обычная validation проекта продолжает выполнять свой договор. Обновить фазовые метрики и `summarizeImportSteps` на `sharedIndexMs`; не держать aliases прежних фаз ради совместимости.
- [ ] GREEN: все importSession/store/readToken/import tests, типы, duplicates, коммит.

## Задача 7. Прямая запись таблиц в двоичный накопитель

**Interfaces:** новый нейтральный `BinaryRecordBuffer<T>` в runtime получает codec `{ viewLength: number; encode(value: T, view: DataView, offset?: number): void; decode(view: DataView, offset?: number): T }`. Методы: `append(value: T): number`, `read(index: number): T`, `write(index: number, value: T): void`, `copyTo(target: Uint8Array, offset: number): number`, `clear(): void`; свойства `length`, `byteLength`, `capacityBytes`. Кодек structurae остаётся источником формата; размер блока — внутреннее решение, не прикладной лимит.

- [ ] Добавить memory-only тест с codec двух uint32, занесением записей через границу блока, изменением первой записи и чтением последней. Тестовый codec кодирует значения непосредственно, ожидания литеральные.

  ```ts
  expect(buffer.append({ left: 7, right: 9 })).toBe(0)
  buffer.write(0, { left: 11, right: 9 })
  expect(buffer.read(0)).toEqual({ left: 11, right: 9 })
  expect(buffer.copyTo(bytes, 4)).toBe(buffer.byteLength)
  ```

- [ ] RED на новом API; добавить расширение `fragment.test.ts` для повторной identity с обновлением hash, дочерних диапазонов, пустого фрагмента и закрытого writer после discard.
- [ ] Реализовать блоки фиксированного числа записей с ленивым выделением; append сразу вызывает codec, read/write находят блок числовым делением. Проверить целочисленные границы и выход за диапазон до доступа. `copyTo` копирует только занятые диапазоны один раз; не делать concatenation после каждой вставки.
- [ ] Перевести `fragment.ts` с массивов rows/files/diagnostics на этот накопитель. Не удерживать DataView заменённого буфера. `finish` пишет заголовки/каталог и копирует блоки; `discard` очищает строки, числовые таблицы и индексы даже без finish. Расширить существующий механизм attempt rollback согласованным усечением накопителя, если writer участвует в откате; не терять атомарность пробной записи.
- [ ] GREEN: fragment, layouts, factTables, builder, store tests; передача ArrayBuffer с отчуждением в integration; типы, duplicates, коммит. Измерить полезную/резервную ёмкость и копирование, не выдавать их за JS heap.

## Задача 8. Только используемые строки и один итоговый UTF-8-раздел

**Interfaces:** `buildTypedProjectStateSnapshot` сохраняет вход/выход и формат. Новый `Utf8StringArena` предоставляет `intern(value: string): number`, `internBytes(hash: bigint, bytes: Uint8Array): number`, `bytes(id: number): Uint8Array`, `hash(id: number): bigint`, `clear(): void`, `count`. `BinaryStringPoolBuilder` принимает только выбранные строки; старый base-пул не добавляется целиком. Внутренние string ID действительны только с их снимком.

- [ ] В существующем `builder.test.ts` заменить ожидание сохранённого старого ID:

  ```ts
  expect(findString(updatedView, "Catalog.Старая")).toBeUndefined()
  expect(findString(updatedView, "Catalog.Новая")).toBeDefined()
  expect(oldView.stringValue(oldStringId!)).toBe("Catalog.Старая")
  ```

  Расширить tests удаления/last-write-wins: строка заменённого фрагмента отсутствует; общая строка с другим живым потребителем остаётся; все diagnostic/owner/target/field ссылки читаются правильно после перенумерации. Полное удаление файлов оставляет пустой пул; no-op возвращает тот же снимок.
- [ ] RED: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/binary/builder.test.ts --no-isolate`. Должно падать на оставшейся `Catalog.Старая`.
- [ ] В typedBuilder сначала выбрать файлы и пометить достижимые факты/диагностику, затем переназначать только встреченные строковые ссылки. Переиспользовать единый перечень ссылочных полей, который нужен pack/remap, не создавать независимый список с риском расхождения. Отдельно включить вычисленные ключи индексов владельцев. UUID/XML ID копируются как значения.
- [ ] Добавить тесты arena: повторный UTF-8, коллизия hash с разными байтами, пустая строка, кириллица/emoji и ненулевой byteOffset. Реализовать блочные байты и числовые записи вместо Map исходных строк + отдельных Uint8Array. Для строк из принятого immutable фрагмента сборщик может удержать диапазон до единственной итоговой копии, но не `slice` каждого значения.
- [ ] Заполнять окончательный `strings` SharedArrayBuffer непосредственно: header, records, utf8, hash slots. Переиспользовать codec/hash algorithm; убрать цепь отдельных SAB и `packBinaryStringPool` в production builder. Сохранить format validation, collision byte comparison, deterministic ordering и отсутствие decode/encode при объединении.
- [ ] GREEN: весь binary suite, persistence/read sessions, ordinary validation update и export integration; типы, duplicates, коммит. Последовательные замены одного файла не увеличивают пул строк за счёт прошлых версий.

## Задача 9. Настройка числа воркеров

**Interfaces:** нейтральный `resolveWorkerCount(params: { concurrency?: number; workerCount?: number; automatic: () => number }): { count: number; source: "operation" | "project" | "automatic" }` в `packages/runtime/settings/workerCount.ts`. Чтение `.nkdk/project.yaml` выполняет rules-адаптер `readWorkerSettings(projectDir: string): Promise<{ workerCount?: number }>` без зависимости от platform. Platform-схема принимает то же необязательное безопасное целое поле; общий файл без infobase допустим, операции 1С явно проверяют наличие infobase до использования.

- [ ] Memory-only tests приоритетов и границ:

  ```ts
  expect(resolveWorkerCount({ concurrency: 2, workerCount: 6, automatic: () => 3 }))
    .toEqual({ count: 2, source: "operation" })
  expect(resolveWorkerCount({ workerCount: 6, automatic: () => 3 }))
    .toEqual({ count: 6, source: "project" })
  expect(() => resolveWorkerCount({ workerCount: 0, automatic: () => 3 })).toThrow()
  ```

  Табличные invalid: отрицательное, дробное, строка, null, unsafe integer; отсутствие файла/поля использует automatic. Invalid project value не скрывается explicit override. Automatic вызывается только при отсутствии настроек.
- [ ] RED: runtime settings + platform settings tests; rules integration с настоящим файлом только `workerCount: 6`, без infobase.
- [ ] Реализовать общий выбор и безопасную проверку чисел. Rules читает только настройки metadata-пула, не проверяет платформенные секреты и не пишет файл. Верхний общий слой операции передаёт выбранное значение в import/sync/validation/поиск/rename; внутренние пулы не переинтерпретируют его как automatic. Существующие автоматические формулы каждой операции сохранить.
- [ ] Обновить platform тип/схему/JSON-schema/примеры и сервисы importFromInfobase/syncToInfobase/listInfobaseExtensions: недостающий infobase даёт существующий структурированный settings failure, не TypeError. Не логировать содержимое настроек. Профиль отражает count/source; явные 6 не обрезаются до 3, владельцы не меняются между проходами.
- [ ] GREEN: settings tests, runtime operation tests, MCP settings schema/resource и три сервиса 1С, type-check, architecture, duplicates; коммит.

## Задача 10. Полная проверка и независимое ревью

**Interfaces:** публичные import/validation/export и формат отчётов сохраняют смысл; профиль различает проходы и неперекрывающиеся стадии. Отчёт измерений содержит значения, а не обещания.

- [ ] Проверить всю спеку по матрице ниже на конечном коде, включая уже существующие механизмы. Добавить недостающий case в соответствующий существующий тест: FillValue/Тип, CurrentData, absent/empty, defaults, ID/raw-ID, aliases/duplicates, mixed content, порядок XML/YAML, собственная/заимствованная форма, saved/projected BaseForm, accepted-аннотации и отмена.
- [ ] Вынести профильные интервалы без новых обходов данных: чтение/parse каждого прохода, сбор выбранных фактов, подготовка зависимостей, правила, смысловая проверка, локальный proof, сериализация/запись, сборка индекса. Типовые rule timings маркируются pass. GC указывать только если измерен. Счётчики не включать в обычный путь без профилирования.
- [ ] Выполнить полные проверки вне песочницы для LMDB:

  ```bash
  pnpm type-check
  pnpm test
  pnpm test:e2e
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm duplicates -- --base f9c51e1748d6f41cbe2806c90e9bd3c033367b6e
  ```

  XML-фикстуры не обновлять. Все новые YAML-аннотации относительно закреплённого develop перечислить с причиной, соответствующим согласованием и тестом. Исправление runtime не подменять обновлением эталона.
- [ ] Повторить compiled MCP doc в тех же условиях: cold process + три warm, 3 worker; подробную память измерить отдельным запуском `NKDK_PROFILE_MEMORY=1`. Сравнить wall/CPU/RSS/переданные и копируемые байты, retained heap и размеры полезных фактов. Проверить пути удержания после первого прохода: нет XmlDocument, compatibility, Proxy полного YAML. Не суммировать RSS потоков и вложенные интервалы.
- [ ] Выполнить отдельный ordinary export импортированного doc во временный каталог и сопоставить с исходным XML, не перезаписывая источник. Для ordinary export сравнить время/память на одинаковом YAML и числе воркеров. Если baseline doc не завершился, сначала получить сопоставимый корректный baseline; до этого нельзя отмечать критерий ускорения выполненным.
- [ ] По прежнему указанию пользователя в конце выполнить три прогона, сравнить медианы превышающих 50 мс cases, не менять лимиты:

  ```bash
  pnpm test:profile -- --output /private/tmp/nkdk-import-followup-rYXr7J/test-profile-1.json
  pnpm test:profile -- --output /private/tmp/nkdk-import-followup-rYXr7J/test-profile-2.json
  pnpm test:profile -- --output /private/tmp/nkdk-import-followup-rYXr7J/test-profile-3.json
  ```

  Отчёт сохранить в `docs/superpowers/reports/2026-09-05-import-memory-and-execution.md`, указав команды, коммиты, версии, данные, ошибки и разброс.
- [ ] Передать одному независимому review-only агенту spec, этот план, pinned base и worktree. Он читает документы и весь diff с базой, включая коммиты, staging, рабочие и относящиеся к реализации untracked-файлы. Проверяет также соответствие конечного пути всей спеке, даже если механизм существовал до базы доработок.

  ```text
  VERDICT: APPROVED | CHANGES_REQUIRED
  Findings:
  - <severity> <file:line> — <требование>; <расхождение>; <исправление>
  Verification gaps:
  - <недостающая обязательная проверка>
  ```

- [ ] Исправить каждое замечание самостоятельно, проверить и направить тому же агенту полный обновлённый результат. Не менять спеку/план под реализацию; при отсутствующем архитектурном решении спросить пользователя. Одобрение невозможно при невыполненных тестах или непроверенном критерии производительности.
- [ ] После APPROVED повторить финальные проверки. Любое изменение дерева отменяет одобрение. Только для неизменённого одобренного дерева вызвать `superpowers:finishing-a-development-branch`; push/merge/удаление worktree требуют выбранного пользователем способа завершения.

## Покрытие спецификации и порядок

| Раздел спеки | Задачи и защита |
| --- | --- |
| 1: два чтения, no MessagePack/reference | 3, 10; worker integration и аудит оставшихся потребителей. |
| 2–3: окончательное преобразование, минимальные факты | 2, 5; зависимости, локальное владение, освобождение. |
| 3: binary records/UTF-8/используемые строки | 7–8; границы буфера, ссылки и старые читатели. |
| 3: одна промежуточная публикация | 6; реальные build/token/persistence checks. |
| 4–5 и 11: локальные проверки/аномалии один раз | 4–6, 10; общие валидаторы, accepted, без поздней записи YAML. |
| 4: workerCount и корректность профиля | 1, 9–10. |
| 6–8: независимый порядок, освобождение proof, логическое завершение | 3–4, 10; sparse/default/unknown/duplicate и счётчики вложенности. |
| 9: общий исполнитель и отсутствие compatibility | 3–4; оба направления, все потребители, без переходного fallback. |
| 10: измеримое ускорение и память | 1, 10; одинаковые условия, полный успешный результат и ordinary export. |
| 12: форма и BaseForm | 2, 4–5, 10; текущие правила проекции, локальные аномалии, неизменный выбранный источник. |
| 13: финализаторы и архитектура | 1–6, 10; карта каждого потребителя и разрешённое обновление документа. |

Выполнять 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Это один последовательный план доработки импортного потока; независимые deliverables внутри него проверяются и коммитятся отдельно. Не запускать реализацию подагентами. При длительной работе обновлять отметки и краткий журнал; не считать завершённым слой только из-за истечения времени.

## Журнал выполнения

- 2026-09-05: зафиксированы base SHA, worktree, спецификация и разрешение обновить архитектуру. Исходный `pnpm test` завершился кодом 0. Базовый профиль doc завершился с одной ошибкой операции; успешной исходной точки для сравнения полного импорта пока нет. До итоговых замеров требуется установить причину и получить сопоставимый корректный результат.
