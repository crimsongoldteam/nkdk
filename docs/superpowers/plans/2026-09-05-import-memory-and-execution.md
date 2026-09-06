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

Уточнение согласовано пользователем: вместо произвольного `prepareFacts` в
`DependentImportItemHandler` объявить списки YAML-полей `item`/`root`. Для
контекстных зависимостей функция выбора получает идентичность элемента,
владельца и корневое правило, но не YAML. Общий исполнитель предоставляет
выбор зарегистрированных зависимостей и читает только объявленные значения;
отсутствие не подменяется явно пустым значением. Перенести FillValue,
ВводПоСтроке и FormAttribute, убрать старый callback без совместимого пути.
Проверки должны отвергать чтение постороннего поля и подтверждать выбор
зависимостей стандартного реквизита из декларации владельца.

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

- В задаче 3 функциональные опции, состав общего реквизита, заголовки WebSocket, мобильная панель и список пакетов XDTO получили структурный вход. Сохранены повторные заголовки, порядок списков, пустые элементы и прежнее чтение типизированных значений XDTO. Новые проверки сначала дали 7 и 2 падения. 68 целевых тестов, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-small-containers-structural-final-*, nkdk-small-containers-structural-e2e.log). Полный pnpm test после этого слоя отдельно не запускался; последний полный — слой ссылок. Фикстуры не менялись, общий compatibility-путь и окончательное ревью ещё требуют работы.

- В задаче 3 списки выбора, назначения использования и видимость читают структурные контейнеры; имена ролей, UUID и пустое имя не переинтерпретируются. Контроль отсутствующих значений распространён на MetadataValue и FormChoiceList; пустой CDATA не превращается в ноль или пустую дату. Новые случаи сначала дали 8, затем 5 и 3 падения. 409 целевых тестов, 214 e2e, свежие типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-value-containers-structural-final-*, nkdk-value-containers-structural-e2e.log). Последний полный pnpm test — предыдущий слой ссылок (/private/tmp/nkdk-links-lists-structural-full.log); после этого слоя полный набор отдельно не запускался. Эталоны не менялись; весь план и итоговое ревью ещё открыты.

- В задаче 3 структурные ссылки на метаданные, поля и группы команд, коды предопределённых элементов и списки полей читаются напрямую. Для коллекций закреплены прежние отличия отсутствия, пустого одиночного вхождения и пустого элемента среди повторов; сохранён выбор альтернативного имени XML. Новые проверки сначала дали 18 падений, затем ещё два на коллекции MetadataFields. 99 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-links-lists-structural-*). Фикстуры не менялись. Общий исполнитель ещё не переведён полностью, итоговый профиль и независимое ревью не выполнены.

- В задаче 3 рамки, значения стиля, картинки и имена XDTO читаются из структурных узлов. Пустота XML проверяется общим isEmptyXmlElement без сборки текста: атрибуты, дочерние элементы и PI не считаются отсутствием. Падающие тесты выявили подмену PI пустым элементом в новых обработчиках; устранена также потеря типового сужения в диспетчере стиля. 26 runtime-проверок и 1350 целевых rules-тестов, свежий полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-style-presence-*, nkdk-empty-node-green.log; RED: nkdk-style-structural-red.log, nkdk-font-empty-red.log, nkdk-pi-empty-red.log). Эталоны не изменены. Удаление общего compatibility-пути и итоговая проверка всего плана ещё не завершены.

- В задаче 3 строки и системные перечисления используют общие декодеры обычного и атомарного импорта; StringOrNumber, MinMaxValue и коллекции ссылок также принимают XML-узлы напрямую. Новые проверки сначала дали 15 падений; отдельно сохранены прежние различия null на публичных входах строкового преобразования. 87 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-text-structural-*). Эталоны не менялись, общего переключения всех потребителей на структурный XML и окончательного ревью пока нет.

- В задаче 3 обычные числовые, булевы значения и связи параметров получили прямое чтение XML-узлов; скалярные декодеры общие с атомарным преобразованием. Дополнительная сверка пустых элементов с импортом того же XML выявила и исправила подмену отсутствия пустой строкой в новых обработчиках периода, типов, СКД и ссылок. Исправлены также массив вместо единственного обёрнутого значения СКД и сериализация всего узла при ошибке. Все случаи сначала воспроизведены падающими тестами. 1157 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-scalar-empty-*, RED: nkdk-empty-structural-red.log, nkdk-empty-fields-red.log, nkdk-dcs-node-errors-red.log). Фикстуры не изменены; полное удаление compatibility, финальное профилирование и независимое ревью остаются впереди.

- В задаче 3 описание типов читает типы, TypeSet, ID, пространства имён и квалификаторы из структурных узлов. Все 109 существующих примеров дополнены входом с запрещённым compatibility и сначала упали; отдельно закреплены исходное пространство имён, порядок групп типов и повторные ID. 776 целевых проверок до двух дополнений, затем 229 проверок импортера, полный pnpm test, 214 e2e, свежие типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-type-description-structural-*). Фикстуры не изменены. Полное удаление совместимого представления и итоговое независимое ревью ещё не завершены.

- В задаче 3 контейнеры параметров СКД, короткое представление пользовательской настройки и оформление полей читают структурные узлы; значения передаются напрямую, сохранены nil и строковые параметры оформления. Падающие проверки контейнеров и nil исправлены без изменения фикстур. Запрет чтения compatibility в тестах вынесен в общий помощник после обнаружения дубля. Полный pnpm test прошёл; после дополнения проверки пользовательских полей прошли 290 целевых тестов, 214 e2e, типы, duplicates и обе архитектурные проверки (/private/tmp/nkdk-dcs-containers-structural-*). Общий исполнитель ещё не переключён целиком, аудит прямого маршрута и удаление compatibility остаются в работе.

- В задаче 3 ссылки типов, параметры выбора, связи параметров и значения СКД принимают структурные узлы; повторные значения передаются вложенным преобразователям без новых XML-оболочек. Удалена копия атрибутов шрифта перед импортом. Разбор текста СКД объединён после выявления дубля; новые проверки запрета compatibility сначала упали. 214 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-dcs-structural-*). Фикстуры не изменены. Прямой маршрут коллекций параметров/оформления и его аудит ещё предстоят; старый аудит канонического xsi:type режима сохранён для существующего входа, его нельзя потерять при переключении общего маршрута. Compatibility парсера и общий план остаются незавершёнными.

- В задаче 3 типизированные значения, массивы, значения списков выбора, стандартный период и перечисления СКД умеют читать структурный XML без compatibilityValue. Проверены существующие примеры, пустой массив, nil и ошибки неизвестного типа. Дополнительный тест выявил отличие пустого типизированного варианта периода; прямое чтение исправлено, эталоны не менялись. Полный pnpm test прошёл перед последним уточнением периода; после него прошли 222 целевых теста, 214 e2e, типы, duplicates и обе архитектурные проверки (/private/tmp/nkdk-typed-structural-*). Общая маршрутизация сложных свойств и удаление совместимого представления остаются открытыми; это не итоговая проверка всего плана.

- В задаче 3 преобразователи шрифта и форматированной строки принимают структурный XML-узел: атрибуты читаются напрямую, текстовые вхождения использует общий сборщик локализованных строк. У шрифта убран промежуточный any. Новые тесты на существующих примерах с запрещённым compatibilityValue сначала упали; затем прошли 223 целевых теста, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки (/private/tmp/nkdk-leaf-structural-*). Фикстуры не менялись. Это подготовка вложенных преобразователей; маршрутизация всех сложных значений и удаление compatibility из парсера ещё не завершены, нового замера doc нет.

- В задаче 3 локализованные строки читают v8:item/lang/content из переданного структурного узла и собирают смысловые вхождения без промежуточного XML-объекта. Общий сборщик языков переиспользуется; известные узлы отмечаются в исходной границе свойства. Проверка запрета compatibility корня сначала упала; тест повторов языка дополнен структурным входом и аудитом. 48 целевых проверок до дополнения, затем полный pnpm test (включая дополненный тест), 214 e2e, свежая проверка типов, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-localized-nodes-*). Изолированный целевой запуск старого теста typedXML не имел общей регистрации правил; штатный запуск с --no-isolate прошёл. Фикстуры не менялись. Общий XML-план пока создаёт совместимое значение для этого невложенного типа, хотя его обработчик уже читает узлы; полное удаление compatibility и весь план ещё не завершены.

- В задаче 3 одиночные объекты с зарегистрированным импортным nestedItemRule получают XML-узел напрямую. Экспортного yamlToXMLNestedRule недостаточно: это отдельно закреплено тестом, поскольку оформление полей использует другой импортный обработчик. Сохранено владение оболочкой родительского свойства; одиночные элементы формы читают name/id структурно. Начальные проверки выявили двойного владельца, потерю имени командной панели и ошибочное распространение маршрута на экспортный договор оформления — исправлены без изменения фикстур и без принятия новых raw. 33 целевых проверки договора/объектов, 10 проверок одиночных элементов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-single-nested-contract-*, /private/tmp/nkdk-single-nested-node-singleton.log). Сложные невложенные значения и парсер ещё используют compatibility; полный план не завершён.

- В задаче 2 таблицы YAML-ключ → правило при сравнении основы подготавливаются однократно в контексте операции, не для каждого свойства. Тест 100 свойств сначала показал 40200 чтений определений; после изменения укладывается в границу менее 600. Таблицы не сохраняются глобально между операциями. 47 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-base-rule-map-*). Фикстуры не изменены; это уменьшение повторной работы, не новый замер скорости или RSS на doc. Полный план и независимое ревью остаются открытыми.

- В задаче 2 сравнение вложенных значений основы больше не строит две нормализованные копии: служебные ключи пропускаются при обходе, сравнение заканчивается при первом различии. Отдельные тесты запретили чтение следующего значения и исключённого _id и сначала упали. 46 целевых тестов, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-base-value-compare-*); полный pnpm test проходил на предыдущем слое. Публичная нормализация для других потребителей сохранена; фикстуры не менялись. Два представления фактов в маршруте сравнения с текущей cf ещё остаются.

- В задаче 2 сравнение основы для элементов формы выполняется по одному свойству, без двух полных проекций элемента и без копирования контейнеров ради псевдонима ТипКнопки. Исходный Вид проверяется отдельно, псевдоним значения читается адресно. Два теста ранней остановки сначала упали; порядок проверяемых полей задан по фактическим rules поля ввода и кнопки. После изменения 46 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-base-property-stream-*); матрица кнопок сопоставляет результат с обычными проекциями. Фикстуры не менялись. Нормализованные копии вложенных значений и два представления фактов при наличии текущей cf ещё требуют удаления; итоговое ревью не запускалось.

- В задаче 3 обычные и дополнительные колонки формы переведены на структурные узлы; оболочка table отмечается отдельно от принадлежащих колонкам узлов. Общий XML-план передаёт узел/узлы напрямую, если существующий договор отдаёт их вложенному обработчику. Тесты одного и двух узлов и колонок сначала упали, затем прошли; полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-owned-nodes-*). Первый объединённый целевой запуск дополнительно захватил unit-тест схем без его штатной регистрации; раздельные целевые проекты и полный штатный запуск прошли. Фикстуры не изменены. Сборщик идентичностей использует строковые атрибуты, их путь не менялся. Парсер и сложные невложенные свойства пока используют compatibility; весь план остаётся незавершённым.

- В задаче 3 специализированные коллекции СКД, команды и реквизиты формы, дочерние элементы и стандартные реквизиты читают переданные XML-узлы напрямую, без compatibilityValue. Объявления пространств имён и единственный тип списка также читаются структурно. Запрещающие чтение compatibility тесты сначала упали; полный pnpm test и 214 e2e прошли (/private/tmp/nkdk-structural-collections-1911-*). После устранения двух дублей общим чтением имён и добавлением элементов повторно прошли 62 целевых теста, типы, duplicates и обе архитектурные проверки (/private/tmp/nkdk-structural-dedup-*). Фикстуры не менялись. Общий исполнитель, дополнительные колонки и парсер ещё используют совместимое представление; полный отказ и независимое итоговое ревью не завершены.

- В задачах 2–4 применение адресных изменений вынесено из YAML-представления в отдельный механизм. Индексируется только набор изменяемых путей, факты просматриваются один раз; повторный facts.find и JSON.stringify адресов удалены. Тест 300 добавлений сначала показал 45450 чтений пути вместо менее 1200. Исправлен также случай set → delete отсутствующего адреса; числовой индекс отличается от строкового ключа при запрещённом JSON.stringify. 59 целевых тестов, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-linear-fact-changes-1848-*). Фикстуры не менялись. Это локальное доказательство сложности, не новый замер doc; весь план и итоговое ревью остаются открытыми.

- В задаче 2 без текущей формы cf не создаются входы сравнения источников BaseForm: источник уже однозначно saved. Имена основы входят в прямой контекст путей; если компонент не допускает такое сравнение, между проходами остаются только факты путей обеих частей и соответствующие отложенные значения. Два усиленных worker-теста сначала выявили два лишних представления и удерживаемые независимые свойства. 54 целевых теста, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-base-retained-path-facts-*). Последний полный pnpm test — предыдущий слой. Фикстуры не менялись; сравнение с существующей cf ещё использует представления, весь план и итоговое ревью не завершены.

- В задаче 2 окончательные пути формы и основы подготавливаются адресными изменениями фактов до создания входов проекции. Общие посетители расчёта используются прежними YAML-операциями и новым сборщиком изменений; предметные решения не дублируются. Два теста собственного/унаследованного корня и запрет финализации YAML-представлений сначала упали, затем 76 целевых тестов прошли. Первый полный запуск остановился только по временным лимитам; повтор без изменения лимитов прошёл, как и 214 e2e, типы, duplicates и обе архитектурные проверки (/private/tmp/nkdk-form-facts-finalization-retry-1835-*). Фикстуры не менялись. Входы проекции пока остаются представлениями фактов; полный отказ от них и итоговое независимое ревью ещё впереди.

- В задаче 2 формы с BaseForm используют тот же прямой расчёт совместимости DataPath по фактам, что обычные формы и сама основа. Два промежуточных YAML-представления устранены; тест сначала показал четыре вызова вместо двух. 54 целевых теста, затем 47 после объединения подготовки тестов, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-base-direct-paths-*). Последний полный pnpm test — предыдущий слой. Фикстуры не менялись; два входа проекции основы ещё требуют переноса, весь план не завершён.

- В задаче 2 дополнения XML-импорта объявляют читаемые YAML-свойства; prepareImportFacts выбирает только эти факты, больше не создавая PropertyFactsYamlView даже для формы расширения. Список зависимостей учитывает состояния свойств, собственные неявные значения и коллекции; отдельный тест исключает независимые контейнеры тела. Регрессия изменения выбранного объекта на месте сначала воспроизведена, затем исправлена без глубокого сравнения/JSON. Полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-augmenter-mutation-*). Фикстуры не менялись. Представления второго прохода для BaseForm ещё остаются; весь план и независимое итоговое ревью не завершены.

- В задаче 2 общий прямой контекст подключён к встроенному телу общей формы без BaseForm. Путь тела берётся из rules, элементы получают относительные адреса; посторонние ветви фактов не участвуют. Тот же отбор сохраняемых локальных фактов действует для общих форм. Проверка тела с префиксом и запрет трёх прежних YAML-представлений сначала упали. После изменения 84 целевых теста, полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-common-form-context-*). BaseForm определяется и в XML свойства, не только в документе body, поэтому формы с основой остаются на ещё не перенесённом маршруте. Фикстуры не изменены. Остаются дополнение форм расширений, подготовка и сравнение основы; независимое итоговое ревью пока не запускалось.

- В задаче 2 вход анализатора зависимых проверок собирается только из проверяемых значений и объявленных item/root-зависимостей. Обычный prepareImportFacts больше не создаёт PropertyFactsYamlView для анализатора и подготовки зависимостей; отдельный потребитель дополнения форм расширений пока сохранён. Проверки запрета чтения соседнего текста и создания полного представления сначала упали, затем 97 целевых тестов и 214 e2e прошли; типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-dependent-validation-facts-*). Существующий тест счётчика представлений усилен с одного вызова до нуля; ожидания данных и диагностики не менялись. Последний полный pnpm test — предыдущий слой. Фикстуры не изменены; полный план и независимое ревью остаются открытыми.

- В задаче 2 finalProperties импорта читаются из окончательных фактов, а не PropertyFactsYamlView. Общий отбор путей получил компактный результат: наличие, вид значения и скаляр/пустой объект без сборки вложенных коллекций. Отдельные падающие тесты закрепили отсутствие чтения прежнего YAML, различие явно сохранённого undefined и отсутствия, а также запрет решений о вложенных полях скаляра/списка/null. 119 целевых проверок до уточнений, затем 43 усиленных, полный pnpm test и 214 e2e прошли; типы, duplicates и обе архитектурные проверки также прошли (/private/tmp/nkdk-final-property-checked-*, /private/tmp/nkdk-final-property-clean-*). Первый полный запуск остановился в очистке временного каталога теста batch с ENOTEMPTY; повтор прошёл. Дубль новых тестовых подготовок устранён общим helper, ожидания не менялись. Фикстуры не менялись. Представление ещё используется анализатором зависимых проверок и формами с основой; весь пункт 2 не завершён.

- В задаче 2 между проходами обычной формы без BaseForm остаются только факты видов элементов, DataPath и их используемых признаков, основного реквизита, плюс отложенные значения по выбранным адресам. Посторонние свойства и контейнеры не сохраняются; выбранные факты передаются локальным потребителям по прежним ссылкам. Unit и worker проверки сначала упали; тест большого комментария подтверждает отсутствие его среди сохраняемых фактов и полную сохранность в YAML второго прохода. 83 целевых проверки, затем 48 усиленных, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-retained-form-*). Последний полный pnpm test относится к предыдущему слою. Формы с основой и общие формы пока не фильтруются; снижение RSS ещё не измерялось.

- В задаче 2 обычная ClientApplicationForm без BaseForm готовит контекст второго прохода напрямую из фактов элементов, путей и основного реквизита. Промежуточные YAML-представления на этом маршруте удалены; сравнение трёх форм и тест воркера подтвердили состав контекста и отсутствие прежнего чтения. E2e выявил устаревшие пути таблиц в индексе первого прохода: отдельный падающий тест закрепил обновление по окончательным фактам без изменения исходного индекса. После исправления полный pnpm test, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-final-form-context-*, /private/tmp/nkdk-final-table-path-e2e.log). Фикстуры не менялись; лишние raw не приняты. Формы с основой и встроенные общие формы ещё используют прежние представления; отбор сохраняемых фактов и остальные пункты плана остаются открытыми.

- В задаче 2 выделен общий prepareFormDataPathContext: его вход — элементы, индекс и основной реквизит, без YAML рабочей формы и без списка запросов с setters. Сохранённая основа может передавать только имена элементов; обычный YAML-вход вызывает тот же расчёт. Новый тест сначала упал; 109 целевых проверок, 214 e2e, типы, duplicates и обе архитектурные проверки прошли (/private/tmp/nkdk-form-context-facts-*). Отдельный полный pnpm test после этого выделения не запускался; последний полный зелёный запуск — предыдущий слой. Подключение выбранных сведений из импортных фактов к новому входу ещё требуется.

- В задаче 2 запросы проверки путей формы собираются из выбранных semanticFacts, без обхода YAML-представления. Общий describeFormDataPath сохраняет прежние признаки и контекст таблицы; сравнение трёх форм подтвердило прежние запросы и их порядок. Общий расчёт несовместимого преобразования пути теперь принимает готовые описания без функций изменения YAML; для BaseForm это удалило ещё два промежуточных представления перед вторым проходом. Проверки запрета YAML-обхода, отсутствия чтения соседнего текста и адресного решения сначала упали. 84 целевых теста, полный pnpm test (/private/tmp/nkdk-path-decisions-full.log), 214 e2e, типы, duplicates и обе архитектурные проверки прошли. Фикстуры не менялись. Контекст рабочей формы и выбор источника основы ещё требуют переноса; весь план и итоговое независимое ревью не завершены.

- В задаче 2 зависимости BaseForm больше не создают PropertyFactsYamlView; отдельный индекс путей основы собирается из её фактов первого прохода и переиспользуется только локально в воркере. Сравнение с обычным индексом выявило пропущенные таблицы без пути: они не имеют metadata-item события, поэтому общий сборщик теперь учитывает существующий факт $formElementKind, не читая его значение. Все три случая сначала воспроизведены падающими тестами. 77 целевых тестов, полный pnpm test (/private/tmp/nkdk-base-index-full.log), 214 e2e, типы, duplicates и обе архитектурные проверки прошли. Фикстуры не менялись. Представления для расчёта путей и выбора источника основы ещё остаются; весь пункт 2 не завершён, сокращение RSS не измерено.

- В задаче 2 вложенный YAML не читается при сборе finalProperties, если правило не сохраняет пустой XML, исходное поле присутствует или уже имеет значение восстановления. Три запрещающих теста сначала обнаружили чтение, после переноса отбора перед обходом 104 целевых теста прошли. Полный повторный pnpm test (/private/tmp/nkdk-final-absence-verified-full.log), 214 e2e, типы, duplicates и обе архитектурные проверки прошли. Первый полный запуск остановился только по времени одного теста (54,78 мс), все 4816 assertions rules прошли; код и лимиты для повтора не менялись. Фикстуры не менялись.

- Выбор полей индекса формы объединён в formDataPathPropertyKind для обычного YAML и прямых фактов импорта. Обработчики больше не содержат двух независимых списков условий для типов, колонок и таблиц. 81 целевой тест, типы, duplicates и архитектура прошли; фикстуры не менялись.

- В задаче 2 предварительный и окончательный индекс путей формы строятся напрямую из выбранных фактов через существующий createFormDataPathMetadataCollector. Полное YAML-представление не используется для этого индекса; общий сборщик сохраняет правила типов, колонок и таблиц, динамический список имеет прежний приоритет над Тип независимо от XML-порядка. Проверка запрета прежнего YAML-входа сначала упала; 74 целевых теста, полный pnpm test (/private/tmp/nkdk-form-index-facts-full.log), 214 e2e, типы, архитектура и duplicates прошли. Фикстуры не менялись. Полное представление формы ещё используется для запросов проверки путей и подготовки основы между проходами.

- В задаче 2 индекс принятых фактов создаёт списки только для заявленных property-границ, не для всех промежуточных префиксов каждого листа. Повторное чтение propertyKey больше не растёт с глубиной пути: тест глубины 200 сначала показал 206 чтений, после изменения проходит ограничение меньше 12. Порядок событий и отсутствие чтения незаявленных значений сохранены. 102 целевых теста, полный pnpm test (/private/tmp/nkdk-accepted-facts-full.log), 214 e2e, типы, архитектура и duplicates прошли. Фикстуры не менялись; отбор при самом сборе и полный отказ от представлений форм остаются в работе.

- В задаче 4 добавлен missingXMLProperties общего CompiledPropertyPlan. Действия отсутствующего XML выбираются при компиляции и переиспользуются источниками с разными tags; общий предикат сохраняет прежние default/implicit и исключение отключённых/внешних свойств. Новый тест сначала упал; 290 целевых тестов, полный pnpm test (/private/tmp/nkdk-missing-xml-plan-full.log), 214 e2e, типы, архитектура и duplicates прошли. Счётчики пустого singleton и объединение специализированных коллекций ещё не завершены; ускорение второго прохода этим изменением не измерено.

- В задаче 3 удалён неиспользуемый projectXmlAuditReference и его отдельный тест: поиск подтвердил отсутствие рабочих потребителей. Больше нет дополнительного построителя reference XML из compatibilityValue в yamlProjection. Действующие локальные proof/остатки не менялись; 133 теста XML-аудита, типы, архитектура и duplicates прошли. Остальные compatibility-потребители ещё требуют миграции.

- В задаче 2 подготовка объявленных item/root-зависимостей при наличии фактов больше не читает YAML-представление. Отбираются окончательные semanticFacts, исходные адреса сохраняют ссылки на выбранные значения. Адресный отбор строит дерево только запросов и применяет выбранные факты по глубине: отдельное поле и отдельный пустой контейнер имеют приоритет над родительским значением. Эти случаи сначала воспроизведены падающими тестами; два прежних unit-входа дополнены явными фактами, ожидания не изменены. 105 целевых тестов, полный pnpm test (/private/tmp/nkdk-direct-dependencies-verified-full.log), 214 e2e, типы, обе архитектурные проверки и duplicates прошли. Фикстуры не менялись. Подготовка finalProperties и анализ зависимых проверок ещё читают представление; весь пункт 2 пока не закрыт.

- В задаче 2 удалён PropertyFactsYamlView из validationContribution. Сборщики ссылочных элементов явно объявляют нужные YAML-свойства и читают их через общий договор; импорт выбирает только эти значения и Тип из фактов, обычная проверка читает собственный YAML. Отбор ownerFactRole переиспользует тот же материализатор выбранных свойств без Proxy и дерева всего документа. Запрещающая проверка сначала упала; 37 целевых тестов, полный pnpm test (/private/tmp/nkdk-no-validation-view-full.log), 214 e2e, типы, архитектура и duplicates прошли. Фикстуры не менялись. Полное представление ещё остаётся в подготовке зависимых значений и форм; общий отказ от compatibility и итоговый профиль не завершены.

- В задаче 2 сведения ownerFactRole собираются напрямую из выбранных фактов; посторонние значения и YAML-представление владельца не читаются. Логические адреса строятся из событий metadata с общим для обычной проверки алгоритмом выбора адреса. Сохранены порядок rules и сегменты, объявленные коллекцией: проверки регистра расчёта и куба воспроизвели оба отличия до исправления. 34 целевых теста, 214 e2e, типы, архитектура, duplicates и полный pnpm test прошли (/private/tmp/nkdk-direct-facts-full.log). После кэширования позиций свойств повторены 34 теста, типы и duplicates. Фикстуры не менялись. Полное представление в validationContribution ещё требуется сборщикам ссылочных элементов; его удаление продолжается.

- В задаче 2 сокращена подготовка фактов: независимые значения не требуют вычисления адреса при финализации, при отсутствии изменений возвращается исходный массив; изменяемые проекции копируются только в окончательном проходе. Для обычного справочника число построений PropertyFactsYamlView внутри подготовки уменьшено с трёх до одного; проверка формы переиспользует уже выбранные факты. Неизменённые независимые скаляры корня больше не удерживаются в finalProperties, изменённые значения и необходимые данные восстановления сохранены. Обычная форма без выбранного XML-дополнения не запускает фиктивную augmentation: тест воспроизвёл восемь лишних фактов из-за повторного чтения Proxy. Все три новые проверки сначала упали; итоговые 102 целевых теста, 214 e2e, типы, архитектура, duplicates и полный pnpm test прошли (/private/tmp/nkdk-noop-form-facts-full.log). Фикстуры не менялись. Полный отказ от PropertyFactsYamlView и отбор фактов форм для основы остаются незавершёнными; сокращение RSS пока не измерено.

- В задаче 3 импорт структурного metadata-item без выбранного augmenter и выбор имени элемента коллекции больше не читают compatibilityValue родителя. Два теста с запретом промежуточного представления сначала упали; затем 90 проверок объектов/коллекций/воркера и 111 проверок с PropertyState прошли. Имена из атрибутов и заданных xmlParents читаются по структурным узлам; прежний вход сложных augmenters и обработчиков ещё не удалён. 214 e2e, типы, архитектура, duplicates и полный pnpm test прошли (/private/tmp/nkdk-structural-items-full.log); фикстуры не менялись.

- В задаче 3 родитель свойства читается как структурный XML-узел без compatibilityValue; обычные текстовые значения и их повторения читаются напрямую с прежним учётом проверенного содержимого. Проверки с запрещённым чтением compatibilityValue сначала упали, затем прошли. 27 runtime-тестов, 166 проверок свойств/воркера, 214 e2e, типы, архитектура и duplicates прошли; полный pnpm test завершился с exit 0 (/private/tmp/nkdk-structural-scalar-full.log). Сложные значения ещё требуют миграции; полный отказ от compatibility и итоговое измерение памяти не завершены.

- В задаче 2 preparedDependencies больше не использует createPropertyFactsYamlView: выбранные proof-значения строятся по адресам непосредственно, исходный/окончательный адреса разделяют один результат. Проверка однократного чтения и идентичности сначала упала; отдельно воспроизведены и исправлены потери явного undefined и скалярных тегов при копировании контейнера. 102 целевых теста, затем 31 проверка значений и 75 проверок с воркером прошли; итоговые e2e — 214, полный pnpm test — exit 0 (/private/tmp/nkdk-proof-direct-final-full.log), типы, архитектура и duplicates прошли. Остаются другие потребители полного представления фактов в prepareFacts, validationContribution и worker; задача 2 ещё не завершена.

- В задаче 3 удалены неиспользуемые readRawConfigurationXML, readConfigurationChildObjectsFromXML, отдельный файловый обход buildConfigurationChildObjects и прямой writer конфигурации. prepareConfigurationXML и построитель children из выбранных записей проекта больше не принимают reference XML/список reference-имён. Рабочий порядок сохраняет configurationChildObjectsFromIndex; тест интерфейсов переведён на этот механизм с прежним ожидаемым порядком. Устаревший файловый тест заменён проверками действующего построителя, XML-фикстуры не тронуты. 13 целевых тестов, 214 e2e, типы, архитектура, границы unit-тестов и duplicates прошли.

- Продолжение задачи 3: реестр языков и оба чтения Help.xml переведены на структурные узлы; общий xmlElementsAtUniquePath сохраняет единственность промежуточных родителей и повторы конечных узлов. Чтение языка с запрещённым старым импортёром сначала упало, после перехода прошло. Проверены 20 runtime-тестов, 30 сценариев языков/discovery и 13 сценариев справки/импорта форм; типы, архитектура, duplicates и 214 e2e прошли. Старое XML-представление в парсере пока не удалено; измеримое сокращение удерживаемой памяти этим слоем не заявляется.

- Начата задача 3: добавлены прямые xmlAttributeValue/xmlTextValue, распознавание структурного узла больше не требует compatibilityValue. Договор import descriptor переведён на XmlElementNode без прежнего входа Record; выбор компонента, имя, режим расширения, наличие BaseForm и manifest страниц читаются по структуре. Проверка descriptor с запрещающим чтение compatibility getter сначала упала, затем прошла. Runtime XML/structure — 100 тестов; компоненты/discovery/расширения — 37; discovery/worker — 61; e2e — 214 без изменения эталонов; типы, архитектура, duplicates и полный pnpm test (лог /private/tmp/nkdk-structural-discovery-full.log) прошли. Парсер и оставшиеся преобразователи ещё используют compatibility; задача 3 целиком не завершена.

- В задаче 2 proofProperties больше не сохраняет обычные независимые смысловые поля. Остались XML-only значения, отключённый fromXML и необходимые reconstructionValue; это ещё не полный отказ от YAML Proxy и всех semanticFacts. Внешний QueryText проверяется по значению текущего второго прохода, не по сохранённой копии. Регрессия общих форм показала недостающую финализацию фактов внешнего XML item и перекрытие окончательного значения другой проекцией того же адреса; подготовка исправлена до единственного proof, включая контекст общей формы. Отдельные проверки CurrentData и QueryText сначала воспроизвели ошибки, затем прошли; 100 целевых тестов, 44 теста воркера, 214 e2e без изменения эталонов, типы, архитектура и duplicates прошли. Полный pnpm test завершился с exit 0 (лог /private/tmp/nkdk-selected-proof-full.log); итоговые измерения и независимое ревью всего плана остаются впереди.

- В задаче 5 полный configurationFragment остаётся в dependencyFacts своего задания и передаётся для записи только после второго прохода. Промежуточная передача содержит двоичные адреса и признаки наличия UUID/идентичности: значения UUID/XML ID, xmlValue, children и пути файлов туда не входят. Воркер больше не получает descriptor временной LMDB и не читает собственный блок обратно. Общий профиль использует минимальную проекцию также при обычном экспорте; UUID для заимствования берутся из сохранённой основы. Упаковщик размещён в projectState/binary, без новых исключений архитектурных проверок. Проверены 113 сценариев worker/координатора/расширений, затем 61 проверка профиля и границ; последние e2e — 214 passed, типы, обе архитектурные проверки и duplicates прошли. Полный запуск сначала обнаружил исправленную границу двоичного слоя, последующий остановился на прежнем временном лимите localProof (78 мс); полный зелёный результат пока не подтверждён. Измерения doc после слоя ещё не снимались.

- При построении общего вклада формы больше не создаётся неиспользуемое PropertyFactsYamlView: достаточно её адреса и уже выбранных ссылок. Новая проверка сначала упала на чтении semanticFacts, затем вместе с worker прошли 45 тестов. Другие потребители полного представления ещё подлежат миграции.

- В задаче 5 индекс путей формы больше не передаётся в общий промежуточный снимок: проверки используют локальный formDataPathIndex, постоянная проекция записывается с окончательным YAML. Удалена неиспользуемая обёртка formValidation. Регрессия сначала подтвердила прежнюю передачу и сохранение лишней обёртки; 68 целевых тестов, 214 e2e, типы и duplicates прошли. Полный отбор reconstruction profile ещё не выполнен.

- Измеритель задачи 1 сохраняет исходный stderr каждого прогона в отдельном файле и сообщает его путь также при ошибке или прерывании MCP. JSON содержит пути, а не копии журналов. Все 17 проверок измерителя и валидация навыка прошли; это не новый замер doc и не восполнение отсутствующих исходных журналов старого baseline.

- В задаче 2 выбранный typeProperty больше не восстанавливается через YAML Proxy: одно выбранное значение строится прямой записью, его элементы читаются однократно. Исходный и окончательный адреса ведут к одному результату без копии. Защищены пустые элементы массива, неизменность входного контейнера и обычная обработка ключа __proto__. Связанные проверки — 93 passed, после уточнения адресов — 67 passed; e2e — 214 passed; типы, архитектура и duplicates прошли. Последние полные запуски не считаются зелёными: функциональные проверки прошли, но discovery и затем открытие LMDB превысили временные лимиты на фоне других тестов/сборок. Лимиты не менялись; полный набор требуется повторить. Остальные потребители PropertyFactsYamlView остаются в работе.

- Следующий слой задачи 5: транспорт reconstruction fragments переведён с JSON на двоичный NKDKCIF7 с непосредственными блоками BlockV1. При приёме блоки последовательно объединяются без повторного encode/decode и общего массива разобранных фрагментов; равенство строк/children проверяется без stringify. Старый текстовый конверт не поддерживается. Проверены Unicode, усечение каждого префикса, лишние байты, недоверенные длины, неизвестные поля и запрет частичного результата после повреждённой передачи. Configuration-index suite — 78 passed; полный набор — 8972 passed, 2 прежних skipped; e2e — 214 passed; типы и duplicates прошли. Формат сохранённых BlockV1 и сами XML/YAML-эталоны не менялись. Отбор общего минимума reconstruction profile и остальные незавершённые пункты остаются в работе.

- Продолжена задача 5: pendingReferences/pendingChecks первого прохода остаются в своём воркере и отсутствуют в передаваемом двоичном фрагменте. Проверка использует общий индекс; удалены collectSemanticValidationIssues, передача решений обратно воркерам и повторная dependency-проверка finalize. Локальные проверки не трактуют контекст владельца DataPath как отдельную ссылку: разрешение пути само проверяет необходимые метаданные, а ошибка относится к использующему их полю. Три новых случая защищают локальный реквизит, неизвестный корень и реально отсутствующие метаданные. В тесте общего индекса добавлены ранее отсутствовавшие данные базового объекта — ожидание корректного пути не менялось. Полный набор — 8965 passed, 2 прежних skipped; e2e — 214 passed без правок эталонов; типы, обе архитектурные проверки, 14 тестов измерителя и duplicates прошли. JSON-конверт reconstruction fragments, полный отбор фактов и единый исполнитель ещё не завершены; весь план не закрыт.

- В задаче 6 реализован единый commitSharedIndex вместо commitWorkingIndex/commitSemanticIndex без псевдонимов. Внешние файловые цели включаются до барьера; несколько read tokens используют одни буферы и разные claims, промежуточный снимок не сохраняется на диск. Проверены принятая, но ещё не начатая запись и отмена во время фиксации: барьер дожидается записи, отмена не позволяет вновь открыть сессию. Профиль и import-profile переведены на sharedIndexMs. Полный набор до дополнительного случая отмены — 8962 passed, 2 прежних skipped; e2e — 214 passed. Последняя защита отмены проверена 110 связанными тестами; типы, обе архитектурные проверки, 14 тестов измерителя, его валидация и duplicates прошли. Удаление централизованной смысловой проверки и повторной проверки в finalize ещё относится к незавершённой части задач 5–6; слой не означает завершение всего плана.

- Следующий слой задачи 2: для sibling-зависимостей metadataTarget отбираются только факты объявленного typeProperty, включая его служебные контейнеры. Посторонние значения не читаются даже при наличии потребителя соседнего типа. Четыре новых табличных случая защищают одиночный тип, составной тип, пустой список и список с пустым элементом; сначала воспроизведены лишнее чтение и потеря формы списка при неполном отборе контейнера. Полный набор — 8961 passed, 2 прежних skipped; e2e — 214 passed; типы, архитектура и duplicates прошли. YAML Proxy для выбранных значений пока остаётся, как и другие потребители PropertyFactsYamlView; задача целиком не закрыта.

- Продолжен отбор задачи 2: индекс исходных адресов содержит только кандидатов зависимых свойств; без кандидатов этот обход пропускается. Служебные факты контейнеров больше не публикуются как запрашиваемые свойства proof, но участвуют в восстановлении составных значений. Представление соседних полей не строится без потребителя. Усилены три существующих теста, каждый сначала воспроизвёл лишнюю работу. Полный набор — 8957 passed, 2 прежних skipped; e2e — 214 passed без изменения эталонов; типы, обе архитектурные проверки и duplicates прошли. Это частичный слой: полный отбор при acceptProperty и удаление PropertyFactsYamlView ещё не выполнены. Подробности — в отчёте измерений.

- Обычный экспорт профильного doc на `16055036b` проверен без reference и без игнорирования ошибок validation: MCP вернул 21697 успешных результатов, 0 errors/0 warnings. После штатного переноса служебного ParentConfigurations.bin побайтово совпали все 24506 файлов; исходная выгрузка не изменялась. Полный отчёт и команды — в отчёте измерений. Остальные задачи плана и его независимое ревью остаются открытыми.

- Из задачи 4 проверен случай `<A/><B/><C/>` при исходном `<A/><C/>`: текущий local proof уже выдаёт только presence для B, без ложного order. Добавлен буквальный регрессионный тест; 17 local proof-тестов прошли. Это не завершает разреженный двунаправленный исполнитель: отсутствующие свойства и общие вложенные коллекции ещё требуют работы.

- Задача 9: добавлены общий `resolveWorkerCount`, чтение настроек metadata-пула и подключение на границе runtime к import/sync/validation/поиску/rename. Явный параметр выше проектного; исходные автоматические формулы не менялись. Неверное проектное значение не скрывается override. `infobase` стал необязательным для общего файла, три сервиса 1С отдельно проверяют его наличие. Схема и примеры обновлены; профиль импорта показывает источник в строке «Число воркеров: ...», число — в items. Интеграция с настоящим project.yaml подтверждает передачу 6 и override 2 без запуска пула при ошибке настройки. Полный набор: 8956 passed, 2 прежних skipped; e2e: 214 passed; типы, архитектура и duplicates прошли. Эти изменения не входили в промежуточный профиль `fb7152faf`.

- Завершён следующий слой задачи 8: `Utf8StringArena` использует числовые записи и общие блоки, JS-строки кодируются в переиспользуемую рабочую область. Неизменяемые готовые диапазоны удерживаются без slice/decode/encode до финализации. Строковый раздел и хэш-слоты записываются сразу в один итоговый буфер; `packBinaryStringPool` удалён вместе с потребителями прежней цепи копирования. После finish освобождаются диапазоны, повторное использование закрытого builder отвергается. Сохранены обновление снимков, Unicode, коллизии и двоичный формат. Полный `pnpm test`: 8935 passed, 2 прежних skipped; e2e: 214 passed; типы, архитектура и duplicates прошли. Профиль doc после этих изменений ещё не выполнен; весь план не завершён.

- Числовые таблицы фрагмента переведены на `BinaryRecordBuffer`: кодирование при append, ленивые блоки, копирование только занятой части при finish. Обновление identity/hash сохранено; закрытие освобождает строки и таблицы также при discard/ошибке. На тестовых 8500 записях полезно 68000 байт, выделено 69632, скопировано 68000; это ёмкость буфера, не JS heap. Пройдены 3 теста накопителя, 129 binary-тестов, типы, обе архитектурные проверки и duplicates. Полный набор перед дополнительными тестами прошёл (8930 тестов, 2 прежних пропуска), e2e — 214. Итоговые профильные замеры и полное ревью ещё предстоят.

- Пользователь поручил продолжать автономно и откладывать вопросы, требующие его решения. Такие пункты не считаются выполненными и не подменяются предположениями. Независимая часть задачи 8 (только живые строки) выполнена отдельно от незавершённого отбора фактов: используются уже выбранные файлы и строки таблиц; перенумерация строк происходит в существующем проходе записи. Старые читатели и формат сохранены. Три регрессии сначала упали; после исправления 128 binary-тестов, типы, архитектура и duplicates прошли. Накопитель UTF-8 и устранение промежуточных копий ещё не выполнены.

- 2026-09-05: зафиксированы base SHA, worktree, спецификация и разрешение обновить архитектуру. Исходный `pnpm test` завершился кодом 0. Базовый профиль doc завершился с одной ошибкой операции; успешной исходной точки для сравнения полного импорта пока нет. До итоговых замеров требуется установить причину и получить сопоставимый корректный результат.
- 2026-09-05: после `99dd00783` выполнены четыре успешных compiled MCP импорта doc с тремя воркерами. Во всех 9937 успешных заданий, 0 ошибок, 83 предупреждения; медиана повторных запусков 105,824 с, пиковый RSS 5135,1 MiB. Подробности и ограничение сохранения исходных строк профиля указаны в отчёте; итогового сравнения ускорения ещё нет.
- 2026-09-05: выполнена часть задачи 2 — удалена неиспользуемая коллекция `reconstructionFacts.rootPropertyValues`; различение входов использует реальные `semanticFacts`. Сборщик отделяет входные массивы путей и переиспользует одну копию при равных адресах. Новые тесты сначала упали (3 проверки путей и 1 проверка лишней коллекции), затем прошли 18 runtime и 50 rules tests; type-check и duplicates завершились успешно. Полный отбор зависимостей и удаление YAML Proxy не выполнены, задача 2 целиком не отмечена завершённой.
- Уточнение задачи 2 согласовано пользователем: `DependentImportItemHandler` теперь явно описывает item/root-зависимости. Например, `fillValue` читает `Тип`, а стандартный код — несколько свойств владельца. Прежний `prepareFacts` удалён; функция выбора получает только контекст, без YAML. Новые поля `PropertyRule` не добавлены. Это снимает блокировку договора, но не завершает перенос остальных потребителей `PropertyFactsYamlView`.
