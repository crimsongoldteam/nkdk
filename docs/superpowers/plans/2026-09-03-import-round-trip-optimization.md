# Объединённый импорт и локальный round-trip — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans through executing-plans-with-review. Implementation and fixes belong to the primary agent; delegate only the final independent review. Steps use checkbox syntax for tracking.

**Goal:** Ускорить полный XML-импорт без ослабления проверки, повторного контрольного экспорта и позднего изменения итогового YAML.

**Architecture:** Два чтения XML: сбор фактов, затем построение окончательного YAML и локальная проверка общим исполнителем rules. Обычный экспорт использует ту же экспортную политику, но собирает конечный XML; импорт освобождает проверенные фрагменты и сохраняет только состав и порядок непосредственных детей. Зависимости значений, смысловых проверок и основы формы готовы до второго прохода.

**Tech Stack:** TypeScript, существующие пакеты `@nkdk/runtime` и `@nkdk/rules`, Vitest, LMDB, compiled MCP stdio, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-03-import-round-trip-optimization-design.md`.

**Comparison base:** `09518104c82f11c1465816d68e04e8bccba2cb6b`.

**Worktree:** `/Users/nikita/git/nkdk/.worktrees/round-trip-report-mb`, ветка `codex/round-trip-report-mb`.

## Текущий прогресс

- Завершены этапы 1–4 из 11: два чтения без MessagePack, подготовленный порядок YAML, зависимости второго прохода, общий исполнитель экспорта свойства.
- В работе этап 5: готовы маска локальной проверки, поправки собственных скаляров, локальное сохранение неизвестного XML и оформление порядка по найденным расхождениям. Связь всех границ аномалий с общим обходчиком ещё не завершена.
- В этапе 6 общий потребитель умеет освобождать проверенные значения и возвращать компактный вклад вместо XML-поддерева, включая inline и нормализованных детей. Сопоставление референса коллекций индексировано. Подключение рабочего потребителя, все границы аномалий и синтетические дети ещё не завершены.
- Этап 7 частично выполнен: ранняя подготовка name/id, колонок, Settings, вида элемента/типа кнопки и имени singleton. Предопределённые типы, DCS, остальные поздние hooks и этапы 8–10 остаются в работе.
- Этап 11: исходный профиль `doc` снят; итоговые измерения, разбор времени тестов и независимое ревью выполняются в конце.
- Последние проверки: 995 тестов форм/элементов/импорта/экспорта, type-check, architecture, duplicates — успешно. Это не заменяет финальные проверки всего плана.

## Глобальные ограничения

Последнее завершённое дополнение: inline-границы связываются с родителем по свойству и адресу элемента, включая одинаковые скалярные значения и inline-объект уже проверенного ребёнка. В привязках только непрозрачные ключи, без XML-поддеревьев; вклад потребляется один раз. RED/GREEN: 5 вариантов вложенности, 561 тест property/item/collection, type-check, architecture и duplicates прошли. Рабочий proof-потребитель ещё не подключён.

Подбор collection reference индексируется один раз на output/item-rule; устранены повторные unwrap, сканирование identity/key/name и квадратичные проверки состава имён. RED: 100 элементов давали 10 000 unwrap; GREEN: 100. Сохранены отказ от неоднозначной identity, первое совпадение ключа, разделение полиморфных правил/выходов и прежний XML. 566 регрессионных tests, type-check и architecture прошли; duplicates обнаружил повтор тестового наблюдателя, он вынесен в helper, повторные 12 tests, type-check и duplicates прошли.

Вид элемента и явное имя singleton создаются до открытия локального frame. Для кнопок общий кэшированный вариант правила использует ТипКнопки и при импорте, и при обычном экспорте; поздние переименование свойства и клонирование item удалены. RED показал вместо окончательного вида значение Гиперссылка и отсутствие явного имени; GREEN проверяет данные в open/ready и идентичность возвращённого объекта. После proof выполняется только собственное размещение ключей, сохраняющее прежние позиции Вид/Имя, без изменения значений детей. 995 tests, type-check, architecture и duplicates прошли.

Префиксы Type предопределённых элементов выбираются по подготовленному контексту глубины при первом экспорте собственного TypeDescription. Рекурсивный mapItemOutput, повторно переписывавший всех потомков, удалён. Общая политика префикса по пространству имён применяется к canonical/reference QName, но не создаёт объявления там, где их не было; одиночный PredefinedItem сохраняет cfg. Индексный адрес использует общий helper коллекции. RED: наблюдатель Type видел cfg до поздней переписи; GREEN: сразу d4/d6, прежние четыре уровня и составные типы сохранены. 1233 tests, type-check, architecture, duplicates прошли. Перед production-переключением общий импортный frame ещё должен наследовать зарегистрированную подготовку контекста коллекций; рабочий потребитель пока не включён.

Общий импортный frame наследует подготовленный контекст родителя и зарегистрированную подготовку коллекций, включая индексные адреса, external metadata и reference remap. Политика контекста свойства извлечена из обычного экспорта без копии. Подготовка нового collection item отложена до metadata-item адаптера; получение закрытого вклада её не вызывает. RED: внук получал исходный контекст; GREEN: три подготовки для трёх элементов и один экспорт каждого значения. Дополнительный тест реального PredefinedItemCollection подтверждает ранние d4/d6 в импортном frame. 1406 регрессионных tests, дополнительный предметный тест, type-check, architecture и duplicates прошли. Singleton resolveItemName/resolveItemContext, поздний контекстный map дополнительных колонок, синтетические дети и рабочий consumer остаются в работе.

- Спецификация и `.agents/architecture.md` описывают целевой, а не уже реализованный путь.
- Ровно два основных чтения/разбора XML; без MessagePack, альтернативной стратегии, третьего чтения для проверки и полного контрольного дерева.
- Проверенное содержимое детей не преобразуется и не сравнивается повторно родителем. Присутствие, оболочка и порядок проверяются отдельно.
- Обратное преобразование использует действительный YAML и общий обычный экспорт, а не исходный XML как ответ.
- После единственного сравнения допускается оформление аномалии, но не повторный экспорт/сравнение. Возвращённый YAML окончателен, включая порядок и аннотации.
- Не менять существующие XML-фикстуры, идентичности, договор снимка, правила выбора основы, допустимость значений и области применения `!xml`.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей без отдельного согласования.
- Нейтральный исполнитель не знает конкретных видов метаданных; сборка регистраций остаётся в composition.
- Unit-тесты работают в памяти. Файловые, process-, worker- и LMDB-проверки — integration. Проверки LMDB и полный `pnpm test` выполняются вне песочницы.
- Новых зависимостей не требуется. `msgpackr` удаляется, если других потребителей нет; baseline архитектуры не обновляется ради обхода ошибок.
- После каждого слоя: целевые тесты, `pnpm duplicates -- --base 09518104c82f11c1465816d68e04e8bccba2cb6b`, отдельный коммит по навыку `commit`.
- Итоговая проверка времени тестов перенесена в конец по прямому указанию пользователя. Исходный `pnpm test` 2026-09-03 прошёл 4716 cases пакета rules по результату, но завершился кодом 1: пять cases заняли 55.89–76.25 мс при лимите 50 мс. Последующие native/integration не выполнялись. Это не разрешение отключать или повышать лимит.

## Карта файлов и ответственности

| Граница | Файлы |
|---|---|
| Два чтения, жизненный цикл задания | `packages/rules/metadata/importFromXml/worker.ts`, `prepareYaml.ts`, `prepareFacts.ts`, `types.ts`; удалить `packedXmlAssignment.ts` |
| Подготовленные зависимости | новый `packages/rules/metadata/importFromXml/preparedDependencies.ts`; существующие `dependentItems.ts`, `ownerFacts.ts`, `prepareFacts.ts` |
| План и порядок YAML | `packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts`, `yamlPropertyOrder.ts` |
| Общий исполнитель | новый `packages/runtime/metadata/ruleRuntime/property/compiledRuleExecution.ts`; `fromXMLToYAML.ts`, `fromYAMLToXML.ts`, `importYamlTypes.ts`, `fromYAMLToXMLTypes.ts` |
| Общая политика одного экспортируемого свойства | новый `packages/runtime/metadata/ruleRuntime/property/xmlPropertyExecution.ts`; извлечь существующую политику из `fromYAMLToXML.ts` без её копии |
| Локальное сравнение и учёт завершения | новый `packages/runtime/metadata/ruleRuntime/xmlAnomaly/localProof.ts`; существующие `importAudit.ts`, `packages/rules/metadata/importFromXml/anomalyProof.ts`, `xmlProofVerification.ts` |
| Вложенные items/collections и XML-оболочки | `packages/runtime/metadata/ruleRuntime/metadataItem/fromYAMLToXML.ts`, `metadataCollection/fromYAMLToXML.ts`, `formElement/fromYAMLToXML.ts`, `formElement/ruleFactory.ts` |
| Формы и основа | `packages/rules/metadata/forms/clientApplicationForm/{formDataPathContext,baseFormProjection,baseFormProjectionRegistry,baseFormNecessity,baseFormYaml,fromXMLToYAML,fromYAMLToXML,baseForm,importedYamlFinalizer}.ts` |
| Смысловая проверка | новый `packages/rules/metadata/importFromXml/semanticBoundary.ts`; `classifyImportedIssues.ts`, `applyImportedIssueDecisions.ts`, `worker.ts` и существующие общие валидаторы |
| Сведение операции | `packages/rules/metadata/importFromXml/{prepareYaml,worker,controlExport,workerPool}.ts`, `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts` |
| Измерения | `.agents/skills/import-profile/import-profile.mjs`, `.agents/skills/import-profile/import-profile.test.mjs`, существующий runner полного round-trip |

Новые модули выделяются по ответственности, а не создают вторую реализацию существующих политик. Публичные входы `importPropertiesFromXMLToYAML` и `convertPropertiesFromYAMLToXML` остаются совместимыми адаптерами. Добавление внутреннего протокола исполнения не расширяет декларации свойств.

## Задача 1. Два чтения без упакованного XML

**Файлы:** `importFromXml/worker.ts`, `prepareYaml.ts`, `prepareFacts.ts`, `types.ts`, `worker.integration.test.ts`, `packedXmlAssignment.ts`, `packedXmlAssignment.test.ts`, `packages/rules/package.json`, `pnpm-lock.yaml`.

**Интерфейс:** тип `ParsedImportXmlDocument` заменяет `PackedImportXmlInput` на границе чтения; данные остаются `{ input: ImportXmlInput; document: XmlDocument }`. `readImportXmlDocuments` сохраняет параметры `profilePass: "first" | "second"`.

- [x] Изменить существующий integration-тест повторного чтения: убрать `vi.stubEnv("NKDK_IMPORT_XML_STRATEGY", "reread")`. Наблюдаемый договор — штатный запуск читает и разбирает исходный файл один раз на проход, не упаковывает его и выдаёт YAML.

  ```ts
  const { second } = await runAssignmentSecondPass(outputDir, catalogAssignment())
  expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [] })
  expect(lines.filter(line => line.includes('substep="Чтение XML второго прохода"'))).toHaveLength(1)
  expect(lines.some(line => line.includes('substep="MessagePack pack"'))).toBe(false)
  ```

- [x] Запустить тест вне песочницы и увидеть отсутствие второго чтения:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/worker.integration.test.ts -t 'повторно читает XML' --no-isolate
  ```

- [x] Перенести тип документа в `types.ts`; второй проход всегда получает:

  ```ts
  const inputs = await readImportXmlDocuments({ assignment, profiler, profilePass: "second" })
  ```

  Удалить store, packed-profiler, переключатель, put/take/release, счётчики packed bytes. Сохранить pending assignment IDs, очистку состояния при ошибке/dispose и метрики обоих чтений. Первый проход не удерживает `inputs`.
- [x] Удалить unit-тест удалённого codec/store: его договор больше не существует; защитой жизненного цикла остаются integration-тесты worker. Удалить `msgpackr` после проверки потребителей и штатно обновить lockfile.
- [x] Прогнать весь `worker.integration.test.ts`, type-check, проверку дублей; коммит `refactor: :recycle: заменить упаковку XML повторным чтением`.

## Задача 2. Статический порядок YAML и завершение локальной границы

**Файлы:** `compiledPropertyPlan.ts`, `yamlPropertyOrder.ts`, `yamlPropertyOrder.test.ts`, тесты compiled plan в `packages/rules/metadata/ruleRuntime/property/compiledPropertyPlan.test.ts`.

**Интерфейс:** `compileYamlPropertyOrder(keys: readonly string[]): readonly string[]`; `orderYamlRuleProperties(value: Record<string, unknown>, keys: readonly string[]): Record<string, unknown>`. План хранит подготовленные обычные YAML-ключи; дополнительные ключи объединяются по тому же компаратору, а не сортируются вместе со всеми статическими полями.

- [x] Расширить существующий тест порядка случаем входа `Комментарий`, `Тип`, `Заголовок`, `Вид` и локальной аннотации на исходном объекте:

  ```ts
  expect(Object.keys(ordered)).toEqual(["Заголовок", "Вид", "Тип", "Комментарий"])
  expect(ordered).toBe(source)
  expect(snapshotXmlAnomalyAnnotations(ordered, annotations).entries)
    .toEqual([expect.objectContaining({ key: "Комментарий" })])
  ```

  Отдельно проверить переиспользование порядка планом при нескольких экземплярах и новую ревизию реестра. Не менять порядок элементов коллекций.
- [x] Получить RED на новом API через `pnpm --filter @nkdk/runtime exec vitest run metadata/ruleRuntime/property/yamlPropertyOrder.test.ts`.
- [x] Выделить существующий русский компаратор; сортировать статические ключи только при компиляции плана. Собирать возвращаемый объект внутри текущего item, сохраняя property descriptors и объектную идентичность для таблицы аннотаций.
- [x] Применить подготовленный порядок в импортном адаптере вместо сортировки обычных ключей каждого экземпляра; прогнать тесты property import и порядка, duplicates; коммит.

## Задача 3. Готовые зависимости второго прохода

**Файлы:** `prepareFacts.ts`, `preparedDependencies.ts`, `worker.ts`, `dependentItems.ts`, `prepareFacts.integration.test.ts`, `fillValueImport.integration.test.ts`; `commonObjects/metadataPath/toYAML.ts` и текущие финализаторы.

**Интерфейс:** подготовка зависимостей принадлежит координатору/воркеру перед преобразованием, а не `PropertyRule`. Новый `PreparedImportDependencies` предоставляет lookup по логическому адресу item и property key. Значения lookup — окончательные данные типа, owner, локальных индексов и зависимых свойств; не XML-деревья и не полные YAML объектов.

- [x] Расширить существующие cases `FillValue` и `CurrentData` двумя исходными порядками соседних полей; литералы ожиданий — одинаковое окончательное значение, отсутствие поздних изменений. Для `ВводПоСтроке` использовать существующие случаи implicit/explicit из `inputByStringRules.test.ts`.

  ```ts
  expect(importedValue).toEqual(expectedYamlValue)
  expect(serializedAfterDiagnostics).toBe(serializedAtItemCompletion)
  ```

  `expectedYamlValue` брать из существующего literal case, а не вычислять текущим финализатором. Наблюдение завершения — через границу исполнителя, не через тестовый метод production-класса.
- [x] Запустить целевые tests и увидеть позднее изменение либо отсутствие готового контекста.
- [x] Сохранять факты по адресу при первом проходе и подготовить lookup после индексов. Передавать в преобразователь готовые факты вместо очереди финализации. Перенести существующие вычисления зависимых значений в эту границу, не менять resolver/допустимость.
- [x] Удалить соответствующие вызовы поздних финализаторов только после GREEN cases с теми же результатами; не удалять остальные финализаторы механически. Целевые тесты, type-check, duplicates, коммит.

## Задача 4. Общая экспортная политика одного свойства

**Файлы:** `xmlPropertyExecution.ts`, `fromYAMLToXML.ts`, `fromYAMLToXMLTypes.ts`; существующие `fromYAMLToXML.test.ts`, `implicitValueYAMLContract.test.ts`, `finalizeExportedXML.test.ts` в rules.

**Интерфейс:** объект исполнения одного item предоставляет `execute(property: CompiledProperty): void` и `finish(): YAMLToXMLResult`. Параметры создания включают прежние `ConvertPropertiesFromYAMLToXMLParams` и источник `YAMLPropertySource`. Методы синхронные; уже выполненные свойства не запускаются повторно.

- [x] Добавить case обычного XML `A, C`, где правило отсутствующего YAML создаёт `B`; проверить XML `A, B, C`, empty/absent, namespace/attribute/default/implicit. Использовать простой локальный MetadataItemRule из существующего теста, не новые предметные rules.
- [x] Получить RED на поэлементном вызове общего исполнения; все старые whole-item assertions остаются.
- [x] Извлечь из текущего property-loop **одну** реализацию фильтрации tags, reference/indexed/adopted defaults, atomic conversion, nested selection, `writeXMLValue` и required parents. Адаптер обычного экспорта вызывает её в `plan.yamlToXMLOrder`:

  ```ts
  for (const property of plan.yamlToXMLOrder) item.execute(property)
  return item.finish()
  ```

  Источник `raw/has` читает действительный YAML с аннотациями; facts используются для зависимостей, но не подменяют экспортируемое значение исходным XML.
- [x] Проверить прежний обычный экспорт и количество вызовов на property; duplicates, коммит. На этой промежуточной стадии импорт ещё использует прежнюю проверку и не считается оптимизированным.

## Задача 5. Локальная проверка и логическое завершение XML

**Файлы:** `xmlAnomaly/localProof.ts`, новый `localProof.test.ts` в runtime; `importAudit.ts`, `anomalyProof.ts`, `xmlProofVerification.ts`.

**Интерфейс:** `createLocalXmlProof` создаётся на XML-документ задания. Граница получает конкретный `XmlElementNode`/attribute, локальный контрольный фрагмент и текущую YAML-границу; возвращает результат сравнения и компактный вклад состава/порядка. Хранилище завершения отделено от claim-аудита и от исходных nodes.

- [x] Добавить in-memory cases: известный child + неизвестный сосед; изменение child text; лишний экспортируемый узел; duplicate; отсутствующий/пустой узел; перестановка direct children. На дереве `Root/Item/Value` child сравнивается один раз, родитель не посещает его text.

  ```ts
  expect(comparedValues).toEqual(["Root/Item/Value"])
  expect(structuralDifferences).toEqual([{ kind: "extra", name: "B" }])
  expect(sourceDocument).toEqual(originalDocument)
  ```

  Счётчики передаются только инструментированному consumer; исходный документ копируется исключительно в тесте для проверки неизменности.
- [x] Получить RED, реализовать прямую привязку source node и завершение собственных частей. Claim/recognition не равны proof. Для direct children хранить идентификатор/имя/вхождение/позицию/наличие, без значений.
- [ ] Перенести существующие локализацию и оформление аномалий на локальный вход: не запускать `resolveExportedProofPath` по полному документу, не собирать большой экспортируемый документ ради вызова старой функции. При annotation завершать фрагмент без второго экспорта.
- [ ] Расширить проверки растущими коллекциями и вложенностью: число value comparisons равно числу значений, а не глубине × числу значений. Целевые тесты, type-check, duplicates, коммит.

## Задача 6. Общая рекурсия и два потребителя XML

**Файлы:** `compiledRuleExecution.ts`, `fromXMLToYAML.ts`, `fromYAMLToXML.ts`, `metadataItem/fromYAMLToXML.ts`, `metadataCollection/fromYAMLToXML.ts`, `importYamlTypes.ts`.

**Интерфейс:** внутренний frame общего item содержит готовый plan, контекст, источник (`XML` или `YAML`) и consumer (`output` или `proof`). XML-адаптер подаёт найденные свойства в исходном порядке; YAML-адаптер — в экспортном. Вложенные calls идут через тот же executor, а не запускают полный экспорт полученного child YAML.

- [x] На существующих metadata item/collection tests включить импортный consumer и проверить три элемента с вложенным item: каждый child fromXML/toYAML/fromYAML/toXML вызван ровно по одному разу; обычный экспорт даёт прежний literal XML.
- [ ] Получить RED. Перенести recursion/context/collection entry matching в общий frame. Для обычного экспорта consumer удерживает конечные children; для proof consumer принимает, сравнивает и освобождает каждый child, возвращая только его структурный вклад.
- [ ] Учитывать `normalizeYAML`, `normalizeItemYAML`, выбор item rule/context, external metadata, reference remap, raw items и отсутствующие singleton **до** исполнения принадлежащих им значений. Не использовать повторное преобразование parent для вычисления wrappers.
- [ ] Выполнять missing/default/evaluate rules при закрытии item, пропуская уже исполненные. После локальных аномалий закрывать состав/порядок и возвращать окончательный YAML по задаче 2.
- [ ] Тесты nested/raw/aliases/duplicates/sparse/default/ID, type-check, duplicates, коммит. Параллельный legacy-путь допустим только до переключения операции в задаче 10, не в готовой реализации.

## Задача 7. Предметные XML-оболочки без поздней правки детей

**Файлы:** `formElement/{ruleFactory,fromYAMLToXML}.ts`, `forms/commonObjects/{formAttribute/rules,formCommand/types}.ts`, `commonObjects/predefinedItem/types.ts`, `commonObjects/dataCompositionSystem/{appearanceFields/rules,structureItemGroup/types,structureItemGroup/collection/types,orderItemFields/types}.ts`, `forms/elements/popup/extendedTooltip.ts`.

**Интерфейс:** существующие зарегистрированные преобразователи предоставляют решения для собственной оболочки и своих значений до единственного сравнения. Нейтральный frame получает подготовленное решение через регистрацию; ни itemType switch, ни новые BasePropertyRule-поля не требуются.

- [ ] Расширить существующие тесты named singleton, form attribute/command ID, predefined type prefixes, appearance shorthand и popup tooltip наблюдением ordinary/proof consumer. Ожидаемый XML сохраняется; descendants не выдаются повторно после parent hook.
- [ ] Получить RED; заменить операции `transformOutput`/`mapItemOutput`, которые переписывают уже готовые children, поэлементным применением тех же предметных решений. Собственные `_name`, `_id`, namespace/type, wrapper и default должны быть окончательны до сравнения.
- [ ] Применять те же решения в обычном экспорте. Удалить поздние hooks после миграции всех их потребителей; не сохранять fallback со сборкой полного контрольного дерева. Сохранить резервирование исходных и raw-ID до генерации новых.
- [ ] Целевые предметные тесты плюс formXmlIdAssignment tests, type-check, duplicates, коммит.

## Задача 8. Смысловая валидация до единственного сравнения

**Файлы:** `semanticBoundary.ts`, `classifyImportedIssues.ts`, `applyImportedIssueDecisions.ts`, `worker.ts`; существующие `validation/metadataRuleValidator.test.ts`, `yamlFactExtractor.fillValue.test.ts`, `applyImportedIssueDecisions.test.ts`.

**Интерфейс:** локальная валидация получает окончательное смысловое значение, ready dependencies и текущую YAML-границу; возвращает diagnostics и предусмотренные аннотации до `execute(property)`. Общие валидаторы проекта переиспользуются, а не копируются.

- [ ] Проверить обратимый XML со смысловой ошибкой `singleOnly`: дополнительный элемент получает `!xml/invalid` до обратного преобразования. Обычный XML без ошибки остаётся без тега; пометка не отменяет прочие ограничения.
- [ ] Получить RED на порядке вызовов и позднем изменении YAML. Перенести существующие checks на ближайшую готовую границу; межфайловые решения приходят из готовых индексов. Объектная проверка не повторяет уже завершённые child checks.

  ```ts
  const semantic = validateBoundary(value, readyDependencies)
  applyBoundaryDecisions(semantic)
  frame.execute(property)
  ```

  В этом фрагменте `validateBoundary` и `applyBoundaryDecisions` — локальные адаптеры существующих классификации и применения, определяемые в `semanticBoundary.ts`, без собственной системы тегов.
- [ ] Убрать цикл `validateAndApplyImportedIssues` из worker после переноса всех его решений. Сериализация/схемная проверка могут диагностировать, но не менять итог. Внутренние ошибки не превращать в XML-аннотации.
- [ ] Целевые тесты семантики, type-check, duplicates, коммит.

## Задача 9. Форма расширения и BaseForm

**Файлы:** перечисленные модули `forms/clientApplicationForm`, `prepareFacts.ts`, `preparedDependencies.ts`, `prepareYaml.ts`, `worker.ts`; tests `baseFormNecessity`, `baseFormProjection`, `baseFormYaml`, `formDataPathContext`, `importConfigurationExtension.integration`.

**Интерфейс:** отдельно адресованные facts рабочей формы и основы, общий подготовленный контекст зависимостей и выбор `saved | projected` до второго прохода. Вложенный BaseForm frame использует тот же разобранный документ; при `projected` экспортируемый источник — проекция текущей cf, не копия исходного BaseForm.

- [ ] Добавить case равных проекций с неизвестным XML-узлом BaseForm: файл основы не нужен, но unknown XML должен быть выявлен. Сохранить existing cases Width 20/99, hierarchy, commands/attributes/parameters и технических полей.
- [ ] Добавить проверку одного чтения файла формы на каждый проход и отсутствия третьего импорта основы. Проверить historical path `Старое.Значение`, новые колонки, own/inherited roots, missing/empty path.
- [ ] Получить RED. Выделить общие правила отбора из `baseFormProjection`/registry; сравнивать соответствующие значения по facts с ранним выходом при значимом отличии, без двух полных YAML-проекций и normalize-копий.
- [ ] Подготовить current cf, saved names и export identity context между проходами. Во втором проходе выбрать действующий путь сразу; BaseForm обработать nested frame и вернуть отдельный финальный YAML только для `saved`.
- [ ] Удалить поздние compact/materialize и full-base candidate сравнения после проверки эквивалентности decisions. Не переключать источник после proof; не пропускать proof для отсутствующего файла основы.
- [ ] Целевые tests, type-check, duplicates, коммит.

## Задача 10. Переключить операцию и убрать отдельный полный proof

**Файлы:** `importFromXml/{prepareYaml,worker,controlExport,anomalyProof,xmlProofVerification,workerPool}.ts`, `fullSyncToXml/xmlAnomalyAssignment.ts`, integration tests импорта и полного экспорта.

**Интерфейс:** второй проход возвращает окончательные YAML, annotations, diagnostics, state contributions и external writes. Полного control-export callback и последующего semantic rewrite больше нет; обычный sync сохраняет публичный договор.

- [ ] Расширить существующий worker integration-case: production import строит итог с локальным proof, отсутствие повторного source read/serialization и unchanged YAML после диагностики. Проверить disposal, ошибки задания, публикацию state только по действующему договору.
- [ ] Получить RED; соединить готовые зависимости, общий frame, локальную семантику и запись. Удалить старый full proof runtime и связанные только с ним caches/метрики/test-only hooks; перенести его регрессионные cases на новый публичный путь, не удалять защиту сценариев.
- [ ] Проверить отсутствие накопления generated XML в parent и скрытого old-control fallback. Сохранить внешние файлы, XML-default variants, UUID-аннотации, raw ID и точный порядок.
- [ ] Полный `pnpm type-check`, `pnpm test`, обе архитектурные команды, duplicates; исправлять ошибки реализации, не изменять baseline ограничений. Коммит.

## Задача 11. Измерения и независимое итоговое ревью

**Файлы:** результаты в `/Users/nikita/git/round-trip-reports`, runner профиля и его агрегатор при необходимости удаления старых packed-метрик; итоговые отметки этого плана.

- [ ] До изменения production-кода снять базовый compiled профиль `doc`: один первый запуск и три повторных, 3 worker. Использовать временный каталог, возвращённый `mktemp -d`, не очищать пользовательский XML. Команда runner:

  ```bash
  node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-import-before.aKF4E1/yaml --runs 4 --concurrency 3 --json
  ```

  Каталог создан через `mktemp -d`; JSON исходного запуска — `/private/tmp/nkdk-import-before.aKF4E1/baseline.json`. При повторении задачи использовать новый уникальный каталог, не очищать этот результат. Сборка вне измерения. Сохранить SHA, версии, вход, длительности, RSS, diagnostics. Подробный CPU-profile отделить от benchmark времени.
- [ ] После реализации повторить в тех же условиях. Сравнить медиану/разброс, CPU/wall, RSS и обычный экспорт; не суммировать worker time с wall time. Проверить удержание памяти и счётчики на растущих коллекциях, включая массовые аномалии, defaults и порядок.
- [ ] Выполнить e2e XML → YAML → XML на существующих fixtures, включая расширение. Отдельный обычный экспорт итогового YAML обязан подтвердить восстановление XML: импорт не делает вторую проверку после аннотации.
- [ ] По указанию пользователя в конце выполнить три последовательных прогона профиля времени тестов, разобрать устойчивые превышения без изменения лимитов:

  ```bash
  pnpm test:profile -- --output reports/test-profile/current.json
  pnpm test:profile -- --output reports/test-profile/current.json
  pnpm test:profile -- --output reports/test-profile/current.json
  ```

- [ ] Выполнить все финальные проверки: `pnpm type-check`, `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules`, `pnpm test:architecture`, `pnpm duplicates -- --base 09518104c82f11c1465816d68e04e8bccba2cb6b`. Tests с LMDB вне песочницы. Не объявлять ускорение без измеримого выигрыша за пределами разброса.
- [ ] Передать одному независимому review-only агенту spec, этот план, base SHA и worktree. Он читает весь diff с base, committed/staged/unstaged и относящиеся к реализации untracked. Договор ответа: `VERDICT: APPROVED | CHANGES_REQUIRED`, Findings с нарушенным требованием и Verification gaps.
- [ ] Исправить все замечания самостоятельно, повторить затронутые проверки и направить полный обновлённый diff тому же ревьюеру. Нет лимита раундов или самоодобрения.
- [ ] После APPROVED выполнить финальные проверки; любое изменение файлов отменяет одобрение. Только для неизменённого одобренного дерева переходить к `superpowers:finishing-a-development-branch`, не выполнять merge/push без выбранного пользователем варианта.

## Покрытие спецификации

| Раздел спецификации | Задачи |
|---|---|
| 1: два чтения | 1, 11 |
| 2–3: объединение и зависимости | 3, 4, 6, 10 |
| 4–5: локальная единственная проверка | 5, 6, 8, 10 |
| 6: окончательный YAML и порядки | 2, 3, 5, 6, 8, 9 |
| 7–8: память и исключение проверенных частей | 5, 6, 7, 11 |
| 9: общий исполнитель | 4, 6, 7, 10 |
| 10: производительность | 2–7, 10, 11 |
| 11: смысловая валидация | 3, 8, 10 |
| 12: форма и основа | 3, 7, 9, 11 |
| 13: существующие финализаторы | 3, 7, 8, 9, 10 |

## Порядок выполнения

Сначала базовый benchmark из задачи 11, пока production-код равен base SHA. Затем задачи 1–10 по порядку; задача 11 закрывает измерения и review gate. Слои проверяются и коммитятся отдельно, но задача не считается выполненной по сумме частичных проверок без итогового APPROVED.

## Журнал выполнения

- Базовый benchmark: 4 успешных terminal result, 3 worker, Node.js 26.4.0, pnpm 10.33.0; время 133573 / 137567 / 149227 / 153507 мс, пиковый RSS 3680 МиБ. Каждый прогон: 9937 заданий, 3 ошибки и 1 предупреждение в диагностической сводке. Результаты и хэши 22182 выходных файлов: `/Users/nikita/git/round-trip-reports/import-optimization-2026-09-03-aKF4E1/before.json` и `before-yaml-manifest.json`.
- Задача 1: RED — штатное второе чтение отсутствовало (ожидалось 1 событие, получено 0); GREEN — 39 integration-тестов worker. `pnpm type-check`, `pnpm test:architecture` и проверка новых дублей прошли. Прямой `msgpackr` удалён; транзитивную зависимость LMDB не удаляем.
- Уточнение пути теста задачи 2 при чтении кода: существующий набор compiled plan расположен в `compiledPropertyPlan.test.ts`, а не `propertyRuleRegistrySet.test.ts`; договор и объём задачи не меняются.
- Задача 2: RED — отсутствовали подготовленный YAML-порядок и API размещения ключей; GREEN — 3 runtime-теста порядка и 93 tests compiled plan/property import. Проверены независимость XML/YAML-порядка, отсутствие сортировки статических ключей экземпляра, пропущенные/дополнительные ключи и сохранение аннотаций. `pnpm type-check`, `pnpm test:architecture`, duplicates прошли.
- Задача 3: введены адресуемые компактные факты зависимостей (тип реквизита, необходимые свойства владельца и длины полей ввода); XML и полные YAML не удерживаются. Второй проход получает owner cache и индекс путей до импорта. Удалены поздний вызов нормализации FillValue в worker и регистрация финализатора ВводПоСтроке; при готовых зависимостях DataPath не попадает в очередь финализации. Основа и совместимость путей расширений остаются задачей 9. RED: отсутствовал API, затем отсутствовали факты ВводПоСтроке. GREEN: 188 целевых тестов в штатном `--no-isolate`, type-check, architecture, duplicates. Отдельный запуск dependentItems с изоляцией не разделял контекст реестра с test runner; штатный режим проходит без изменения тестовой инфраструктуры. Уточнён путь существующих implicit/explicit cases: `inputByStringRules.test.ts`, не `dependentItems.test.ts`.
- Задача 4: общий `createXMLPropertyExecution` вынесен в `xmlPropertyExecution.ts`; прежний вход экспорта вызывает тот же исполнитель по подготовленному XML-порядку. RED: отсутствовал API. GREEN: 190 тестов обычного экспорта, implicit/default, финализаторов и compiled plan; type-check, architecture и duplicates прошли. Дополнительно проверены однократность исполнения свойства, XML отсутствующего YAML в позиции B и неизменность результата повторного finish. Полная контрольная проверка импорта пока не переключена.
- Задача 5, промежуточный слой: `createLocalXmlProof` хранит отдельную маску по ID исходного документа; значения детей и атрибутов-свойств сравниваются один раз, родитель принимает компактные подтверждения и проверяет только собственные части/состав/порядок. После callback оформления аномалии повторная проверка запрещена. RED/GREEN покрывают также повторный структурный вклад атрибута и завершение атрибутов неизвестной PI. 46 тестов local proof/audit/projection, type-check, architecture, duplicates прошли; линейность счётчика проверена при 8/256 значениях и глубине 1/3/64. Перенос реального оформления аномалий и подключение потребителя к импорту ещё не выполнены; задача 5 не завершена.
- Продолжение задачи 5: общий код проекции получил локальный вход без спуска в известного ребёнка и преждевременного `#order`. Порядок детей/атрибутов оформляется отдельно из готовых различий; собственные текст/атрибуты получают поправку по исходному узлу, без повторного сравнения. Прямое применение raw сохраняет смысловой invalid/important и защищает UUID-аннотацию. Построение краткого порядка одноимённых элементов стало линейным: на 128 элементах 128 чтений атрибутов вместо 16512. RED/GREEN и отдельный обычный экспорт покрывают новые случаи; прошли 98 runtime-тестов, 92 tests anomalyProof/xmlProofVerification/prepareYaml, type-check, architecture, duplicates. Общий обходчик и рабочий путь импорта ещё не подключены к этим локальным входам.
- Задача 5, следующий слой: скалярная граница различает отсутствующий, пустой и изменённый XML, оформляет лишний default через существующий `$xml: null` и возвращает родителю только исправленный структурный вклад. Поправка отсутствующего смыслового поля включается в итоговый YAML. Представление собственных значений и группировка ChildItems используют общие функции обычного экспорта без чтения содержимого детей; неизвестный контейнер не поглощается скалярной поправкой. RED/GREEN: 182 runtime-теста и 183 регрессионных теста rules; type-check, architecture, duplicates прошли. Подключение всего обходчика остаётся впереди, задачу 5 целиком не закрываем.
- Стык задач 5–6: общий экспорт получил синхронные события свойства и вложенного item, без второй реализации defaults/контекстов/выбора коллекций. `finish` исполняет оставшиеся свойства один раз; обычный вход выполняет тот же единственный цикл. Компактные вклады детей размещаются по заранее вычисленным позициям плана, не сортируются по порядку прихода и не содержат XML-значений. RED/GREEN покрывают лишний default, порядок обработки C/A, три вложенных item (по одному fromYAML/toXML и сравнению каждого значения), запрет повтора после сбоя и изменения закрытого порядка. 184 runtime-теста, 265 tests rules, type-check, architecture, duplicates прошли. События пока наблюдают обычный собираемый XML: до переноса поздних hooks и подключения импортного драйвера это не конечный proof-потребитель и не завершение задачи 6.
- Продолжение задачи 6: добавлен внутренний порт второго XML-прохода после успешной попытки свойства и до перехода к следующему. В тесте реальные compiled-пары выполняются как import C → export C → import A → export A; локальный порядок оформляется до возврата YAML. Порт передаётся во вложенные runtime-адаптеры, не открывается в режиме facts и не получает отклонённые попытки; его ошибки не превращаются в raw-кандидаты. Архитектурная проверка выявила цикл типов через XMLImportPlanEntry; прежняя отметка об её успехе была ошибочной. Порт упрощён до propertyKey, без зависимости от XML import plan. Повторно прошли 238 tests import/export/prepareYaml/worker, type-check, architecture (0 циклов) и duplicates. Порт пока соединён с proof тестовым потребителем простых свойств; рабочий worker не переключён, поздние нормализации и оболочки ещё требуют переноса.
- Подготовка оболочки metadata item: XMLRoot, атрибуты корня и xsi:type доступны общему исполнению до дочерних свойств. Обычный экспорт применяет эту же оболочку; повторная очистка reference XML устранена. RED подтвердил поздний вызов rootAttributes, GREEN — 161 тест item/property/collection, type-check, architecture и duplicates. Это перенос общей оболочки, не завершение предметных hooks формы и не переключение worker.
- Локальное оформление скаляров дополнено порядком атрибутов: их восстановление в конец учитывается при единственном сравнении порядка; отдельный #order не появляется, если вставка уже даёт исходный порядок. Без смыслового YAML сохраняется полный собственный скаляр, с ним — только поправка. Устранена потеря дочерних терминалов при поправке оболочки родителя; поправка собственных значений совместима с независимым терминалом порядка атрибутов той же границы. RED/GREEN: 189 runtime-тестов и 92 регрессионных tests proof/import, type-check, architecture, duplicates прошли. Границы raw не расширены на детей, повторного proof нет.
- Общий XML-исполнитель теперь возвращает декларативный порядок и при исполнении C/A/B: RED обнаружил C/A/B вместо A/B/C. Подготовленный план переставляет только собственные ключи и оболочки, не читает готовые значения детей и не сортирует экземпляры. Для штатного последовательного экспорта дополнительный обход вообще не запускается; пустые обязательные контейнеры сохраняют прежнюю позицию. Общая перестановка дескрипторов переиспользуется XML и YAML. GREEN: 4 runtime-теста, 244 tests import/property/item/collection, type-check, architecture, duplicates.
- Потребитель общего экспорта может заменить проверенное значение компактным вкладом до записи и вернуть вклад всей границы при её закрытии. Готовые вложенные items подключаются к той же рекурсии без повторных fromYAML/toXML; тест полного XML-драйвера на трёх элементах хранит только вклады, проверяет также оболочку коллекции и считает ровно три сравнения. Отдельно закрыта ошибка вложенных open/ready/finish: она больше не превращается родительской попыткой импорта в raw-кандидат. RED/GREEN, 243 tests import/export/prepareYaml/worker, type-check, architecture, duplicates прошли. Пока это протокол и тестовый потребитель; рабочий общий frame и предметные политики остаются в работе.
- Добавлен `compiledRuleExecution.ts`: общий frame сам управляет готовыми свойствами, закрытием и однократной передачей ребёнка. Его хранилище содержит типизированные вклады корней и внешние записи, но не контрольные XML-поддеревья; тестовый код управления кадрами удалён в пользу этого модуля. Незавершённые XML-финализаторы не пропускаются: frame отвергает закрытие до переноса их зависимостей. RED/GREEN: 310 tests driver/property/item/collection/prepareYaml/worker, type-check, architecture и duplicates. Пока поддерживается передача уже подготовленных объектных child YAML; inline/нормализованные/синтетические дети, все предметные оболочки и рабочая сборка потребителя ещё требуют переноса.
- Ссылки с owner:type получают тип из принятых фактов первого прохода до ready: короткое имя и исключение ссылки при составном типе больше не требуют позднего изменения YAML. Факты именованных коллекций сохраняют отдельно исходный адрес обхода и итоговый YAML-путь; сборщик участвует в откате попыток, поэтому отброшенные значения не попадают в зависимости. RED/GREEN: оба порядка Type/ChoiceForm, составной тип, именование и откат; 208 тестов import/collection/prepareFacts/prepareYaml/worker, type-check и architecture прошли. Проверка дублей обнаружила повтор тестового rules — он вынесен в общий helper; повторные 93 теста, type-check и duplicates прошли. Это подготовка зависимостей, не завершение общего proof-потребителя или переключение worker.
- Локальное завершение контейнера оформляет только собственные значения и порядок; наличие ребёнка передаётся отдельному владельцу по прямой привязке, без raw всего контейнера и поиска по полному документу. Учтена позиция восстанавливаемого неизвестного узла: RED обнаружил потерю order при Unknown перед Known, GREEN учитывает добавление узла в единственном сравнении. Проверены отдельный обычный merge и неизменность готового child YAML; 146 runtime-тестов, 164 tests import/proof, type-check, architecture и duplicates прошли. Сборка рабочего потребителя всех границ, PI/mixed/raw-локализация и предметные hooks остаются в работе.
- Подготовка metadata item отделена от исполнения свойств и переиспользуется обычным экспортом и импортным frame: контекст, очищенный reference и XML-оболочка доступны потребителю заранее. Внутренний mapping импортного inline-item не оборачивается повторно. Получение готового ребёнка перенесено перед обычным metadata-item адаптером: RED для item/collection обнаружил повторный вызов rootAttributes и переобёртку маркера, GREEN сохраняет его тождество. 216 tests property/item/collection, type-check, architecture и duplicates прошли. Нормализации публичного child YAML, предметные map/transformOutput и финальная сборка proof-потребителя пока не завершены.
- Начат перенос предметных оболочек: зарегистрированное решение `prepareXMLItemOutput` обрабатывает только собственные атрибуты, не получает XML детей и не может добавлять их через результат. Обычный экспорт и локальный consumer используют одну функцию применения решения. `FormCommands` переведён с позднего mapItemOutput; порядок name/id и резервирование ID сохранены. Frame получает подготовку от родительского правила, а при передаче закрытого ребёнка она не запускается снова (три подготовки и три применения на три item). Проверка типов обнаружила старую копию conditional-типа реестра — удалена в пользу общего importExportFunction, вместе с as any. RED/GREEN: 2 runtime-теста, 258 tests property/registry/ID/commands, type-check, architecture, duplicates прошли. Остальные предметные оболочки и поздние изменения YAML остаются в работе.
- Та же подготовка name/id и резервирования ID вынесена в общий helper и применена к `FormAttributeColumns`: поздний mapItemOutput удалён. RED подтвердил отсутствие ранней подготовки колонок; GREEN — 140 целевых tests команд, реквизитов и экспорта свойств, type-check, architecture и duplicates. Специальные Settings реквизитов и дополнительные колонки пока не перенесены.
- Подготовка собственных атрибутов перенесена также для коллекций элементов и singleton, включая PopupExtendedTooltip, GanttChartFieldTable и специальный ID автокомандной панели. map коллекции теперь лишь оборачивает готовый объект XML-тегом и не обходит его; поздние singleton transformOutput удалены. RED подтвердил отсутствие подготовки, промежуточная проверка выявила две ручные регистрации нового обработчика — они подключены. GREEN: 366 tests свойств/элементов/ID, type-check, architecture и duplicates. Перенос Settings, обработки inline/нормализованных детей и рабочего proof-потребителя продолжается; служба подтверждения первой попытки коммита вернула техническую ошибку 404, данные остались в worktree.
- Связь с завершённой XML-границей переживает штатное копирование YAML при нормализации item/collection: переносится только непрозрачная идентичность, без ссылки на исходный YAML или контрольный XML. RED: обе нормализации теряли готового ребёнка; GREEN: каждый из трёх вложенных items по-прежнему преобразуется и сравнивается один раз, повторное получение запрещено. 225 tests driver/property/item, type-check, architecture и duplicates прошли. Первая попытка коммита вновь встретила техническую ошибку службы подтверждений; inline-скаляры и синтетические дети ещё не покрыты.
- Обычные и дополнительные колонки FormAttribute перенесены из позднего присваивания YAML в зарегистрированные импортные правила. RED: при завершении реквизита колонки отсутствовали. Уточнена принадлежность оболочки AdditionalColumns и атрибута table через общий compatibility view, не потребляющий готовые колонки; известные дубли ERP остаются структурно учтёнными. Регрессионный тест порядка подтвердил договор спецификации: размещение YAML-ключей выполняется после оформления структурных аномалий, до возврата item, без повторной проверки XML; промежуточная попытка перенести его раньше отменена. GREEN: 303 tests import/export/ID/prepareFacts/prepareYaml, type-check, architecture и duplicates. Поздняя фильтрация ТипЗначения и Settings, а также собственная inline-граница AdditionalColumns ещё требуют переноса.
- FormAttribute.valueType получает компактное решение о единственном СпискеЗначений из первого прохода через существующий реестр зависимостей. Во втором проходе ТипЗначения окончателен уже в ready, даже при Settings перед Type; поздний delete остаётся только для старого входа без подготовленных зависимостей. Канонический пустой Settings перенесён из mapItemOutput в существующий defaultValue правила TypeDescription; теперь его видит write самого свойства. name/id реквизитов переведены на общую раннюю подготовку. RED/GREEN: 350 tests реквизитов, зависимостей, import/export/ID/prepareFacts/prepareYaml, type-check, architecture и duplicates. При сборке рабочего потребителя ещё нужно обеспечить экспортные межполевые зависимости до ready (в частности пустой Settings до ещё не импортированного Type), не подменяя source.raw/has данными фактов.
