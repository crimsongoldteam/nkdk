# Partial Sync Operation Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Расширить слоистый partial e2e операциями изменения, порядка, форм, текстовых макетов, внешних файлов и расширения по собственным и заимствованным объектам.

**Architecture:** Новые файлы матрицы объявляют только переходы `before -> after`, зависимости и принадлежность слою. Общие построители безопасно формируют цепочки YAML/текст/двоичных изменений; универсальный блочный исполнитель из первого плана не получает условий по metadata-типам.

**Tech Stack:** TypeScript, существующие NKDK e2e-фикстуры, Vitest, MCP partial ZIP, семантическое сравнение XML/YAML.

## Global Constraints

- Этот план выполняется только после `2026-08-15-layered-partial-sync-engine.md`.
- Не изменять существующие XML-фикстуры; они остаются источником истины.
- Переименование объектов, детей, форм и макетов не входит.
- Каждый слой имеет явно выбранный `probeOperationKey`; остальные операции идут одним массовым блоком.
- Каждый созданный корневой и подчинённый объект получает хотя бы одно безопасное изменение свойства.
- Формы и текстовые макеты проверяются и отдельным удалением, и удалением вместе с владельцем.
- Удаление заимствованного владельца из расширения не должно менять `cf`.
- Расширение синхронизируется только как `cfe/Расширение_All`.
- Базовый коммит для дублей: `83c40f5e4`; он предшествует обоим планам реализации.

---

### Task 1: Построители декларативных переходов

**Files:**
- Create: `e2e/partial-sync/matrix/change-builders.ts`
- Create: `e2e/partial-sync/matrix/change-builders.test.ts`

**Interfaces:**
- Produces: `replaceYamlLine`, `appendYamlSection`, `replaceText`, `replaceBinary`, `chainChanges`.

- [x] **Step 1: Написать падающие тесты точных переходов**

```ts
expect(replaceYamlLine({ path, contents: "Комментарий: Старый\n", key: "Комментарий", value: "Новый" }))
  .toEqual({ path, before: "Комментарий: Старый\n", after: "Комментарий: Новый\n" })
expect(() => replaceYamlLine({ path, contents, key: "Нет", value: "X" }))
  .toThrow("Не найдена единственная YAML-строка")
expect(chainChanges(first, second)).toEqual([first, second])
```

- [x] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix/change-builders.test.ts`

- [x] **Step 3: Реализовать строгие построители**

Построители не разбирают YAML семантически: они требуют единственное точное
место замены и возвращают полные байты `before/after`. `chainChanges` проверяет,
что `after` предыдущего перехода побайтово равен `before` следующего для того же
пути. Двоичные значения копируются в новые `Uint8Array`.

- [x] **Step 4: Запустить тест и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix/change-builders.test.ts`

```bash
git add e2e/partial-sync/matrix/change-builders.ts e2e/partial-sync/matrix/change-builders.test.ts
git commit -m "test: :white_check_mark: добавить переходы матрицы"
```

### Task 2: Корень конфигурации и свойства корневых объектов

**Files:**
- Create: `e2e/partial-sync/matrix/configuration-operations.ts`
- Create: `e2e/partial-sync/matrix/root-property-operations.ts`
- Modify: `e2e/partial-sync/matrix/root-objects.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Consumes: `replaceYamlLine`, `rootObjectDeclarations`.
- Produces: слои `cf:configuration`, `cf:root-properties`, `cf:structural-properties`.

- [x] **Step 1: Добавить проверки полноты изменений**

```ts
expect(rootPropertyOperations.map(({ targetKey }) => targetKey).toSorted())
  .toEqual(rootObjectDeclarations.map(({ key }) => key).toSorted())
expect(configurationOperations.map(({ key }) => key)).toEqual([
  "configuration:comment",
  "configuration:command-interface",
])
```

Проверить представителей структурных изменений: длина строкового реквизита,
тип `Строка(10) -> Справочник.<тестовый справочник>`, обязательность,
индексирование и ссылка регистратора/бизнес-процесса.

- [x] **Step 2: Запустить matrix test и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [x] **Step 3: Добавить безопасную мутацию в декларацию каждого корня**

Расширить `RootObjectDeclaration` полем
`propertyChanges: readonly ScenarioFileChange[]`. Для directory- и file-root
построителей добавлять `Комментарий: До изменения` в создаваемое состояние и
формировать переход к `Комментарий: После изменения`. Для типов, где правило
не принимает комментарий, использовать существующее безопасное скалярное поле
полной NKDK-фикстуры и закрепить его отдельным случаем в `matrix.test.ts`.

- [x] **Step 4: Объявить операции корня конфигурации и структурные представители**

Изменить комментарий `Конфигурация.yaml`, внешний файл интерфейса команд и
пять перечисленных структурных свойств. Все ссылки должны указывать на уже
созданные тестовые объекты и иметь явные `dependsOn`.

- [x] **Step 5: Запустить тесты матрицы и плана**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

- [x] **Step 6: Проверить дубли и зафиксировать слой**

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: изменять свойства корневых объектов"
```

### Task 3: Свойства и порядок подчинённых объектов

**Files:**
- Create: `e2e/partial-sync/matrix/child-property-operations.ts`
- Create: `e2e/partial-sync/matrix/order-operations.ts`
- Modify: `e2e/partial-sync/matrix/children.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: изменение каждого `ChildDeclaration` и порядок четырёх классов коллекций.

- [x] **Step 1: Добавить проверку покрытия всех 76 детей**

```ts
expect(childPropertyOperations.map(({ targetKey }) => targetKey).toSorted())
  .toEqual(childDeclarations.map(({ key }) => key).toSorted())
expect(new Set(orderOperations.map(({ collectionKind }) => collectionKind)))
  .toEqual(new Set(["attributes", "register-fields", "commands", "values"]))
```

- [x] **Step 2: Запустить matrix test и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [x] **Step 3: Добавить `propertyChanges` детям**

Расширить `ChildDeclaration` тем же полем. Использовать безопасный `Синоним`
для metadata-полей, команд, значений и контейнеров; для URL, методов, операций,
параметров, каналов и функций использовать их существующее текстовое поле из
соответствующей полной e2e NKDK-фикстуры. Тест требует непустой переход у
каждой декларации.

- [x] **Step 4: Объявить операции порядка**

Создать по два элемента в выбранных коллекциях и отдельным переходом поменять
их порядок: реквизиты/табличные части, измерения/ресурсы, команды,
перечисления/предопределённые элементы. UUID и содержимое элементов не менять.

- [x] **Step 5: Запустить тесты и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: изменять дочерние коллекции"
```

### Task 4: Жизненный цикл форм и текстовых макетов

**Files:**
- Replace: `e2e/partial-sync/matrix/forms.ts`
- Create: `e2e/partial-sync/matrix/templates.ts`
- Modify: `e2e/partial-sync/matrix/types.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: операции формы, её содержимого, текстового макета и двух видов удаления.

- [x] **Step 1: Описать ожидаемые операции формы и макета тестом**

```ts
expect(formLifecycleKinds).toEqual([
  "create", "add-attribute", "add-command", "add-elements", "change-properties",
  "change-module", "remove-content", "remove-form-only", "remove-owner-with-form",
])
expect(templateLifecycleKinds).toEqual([
  "create", "change-text", "remove-template-only", "remove-owner-with-template",
])
```

- [x] **Step 2: Запустить matrix test и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [x] **Step 3: Разделить создание формы и изменения содержимого**

Минимальная форма остаётся у всех 18 владельцев. На справочнике-представителе
последующими переходами добавить реквизит, команду, обработчик, обычное поле,
группу и таблицу; затем изменить порядок/свойства и удалить содержимое, сохранив
форму. Отдельные владельцы используются для удаления одной формы и удаления
владельца с формой.

- [x] **Step 4: Добавить текстовые макеты**

Использовать NKDK-представление текстового макета из существующей e2e-фикстуры.
Один владелец проходит create/change/remove-template-only; второй удаляется с
неудалённым макетом. Никаких табличных или двоичных макетов в этот слой не
добавлять.

- [x] **Step 5: Запустить тесты, проверить дубли и зафиксировать**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: проверить формы и текстовые макеты"
```

### Task 5: Модули, зависимые и внешние файлы

**Files:**
- Create: `e2e/partial-sync/matrix/module-operations.ts`
- Create: `e2e/partial-sync/matrix/external-file-operations.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: слои текстовых, XML- и двоичных файлов и проверку сохранности спутников.

- [x] **Step 1: Написать проверку классов внешних файлов**

```ts
expect(externalFileOperations.map(({ payloadKind }) => payloadKind).toSorted())
  .toEqual(["binary", "html", "rights-xml", "ws-or-xdto"])
expect(moduleOperations.map(({ moduleKind }) => moduleKind).toSorted())
  .toEqual(["command", "common", "form", "object"])
```

- [x] **Step 2: Запустить matrix test и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [x] **Step 3: Объявить операции модулей**

Изменить объектный, общий и модуль формы. Для команды выполнить
add/change/remove module без удаления команды. Добавить переход свойства
владельца после создания команд, форм и макетов; итоговый полный импорт должен
подтвердить, что неизменённые спутники сохранились.

- [x] **Step 4: Объявить внешние файлы**

Использовать существующие bytes из e2e NKDK-фикстур как `before`: `Rights.xml`,
`Справка/ru.html`, файл общей картинки и `WSDefinition.xml` либо файл пакета
XDTO. `after` должен быть валидным минимальным изменением того же формата.

- [x] **Step 5: Запустить тесты и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: изменить внешние файлы объектов"
```

### Task 6: Собственные объекты расширения

**Files:**
- Create: `e2e/partial-sync/matrix/extension/configuration.ts`
- Create: `e2e/partial-sync/matrix/extension/own.ts`
- Create: `e2e/partial-sync/matrix/extension/layers.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Produces: изменение корня `cfe/Расширение_All` и полный жизненный цикл двух собственных владельцев.

- [x] **Step 1: Написать проверку собственного жизненного цикла**

Потребовать изменение комментария и интерфейса команд расширения, затем
create/change для объекта, реквизита, табличной части, команды,
формы, текстового макета и модуля; отдельное удаление формы/макета и удаление
другого владельца с ними.

- [x] **Step 2: Запустить matrix test и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [x] **Step 3: Объявить изменения корня расширения**

Создать две операции над `cfe/Расширение_All/Конфигурация.yaml`: изменение
`Комментарий` и изменение `КомандныйИнтерфейс`. Состояния брать из импортируемой
e2e-фикстуры; операция интерфейса добавляет и затем удаляет ссылку только на
существующий объект расширения.

- [x] **Step 4: Создать декларации собственных объектов**

Использовать уникальные имена `ПроверкаЧастичнойСинхронизацииРасширение...` и
структуру существующих `*Ext` объектов фикстуры. Все операции имеют
`componentPath: "cfe/Расширение_All"`; ссылки разрешены только на уже
существующие `cf` или более ранние собственные объекты.

- [x] **Step 5: Добавить слои удаления**

Первый владелец теряет форму и макет отдельно. У второго форма и макет остаются
до удаления владельца. Затем удалить оставшиеся добавления в обратном порядке.

- [x] **Step 6: Запустить тесты, проверить дубли и зафиксировать**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: проверить собственные объекты расширения"
```

### Task 7: Заимствованные объекты расширения

**Files:**
- Create: `e2e/partial-sync/matrix/extension/borrowed.ts`
- Modify: `e2e/partial-sync/matrix/extension/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`

**Interfaces:**
- Consumes: существующие `cf` справочник и его форма/макет.
- Produces: borrow/change/add/remove и доказательство сохранности `cf`.

- [ ] **Step 1: Написать проверку заимствованных операций**

```ts
expect(borrowedOperationKinds).toEqual(expect.arrayContaining([
  "borrow-owner", "change-property-state", "change-reference",
  "add-own-attribute", "add-own-command", "extend-borrowed-form",
  "add-own-form", "add-own-template", "remove-extension-additions",
  "remove-borrowed-owner",
]))
```

- [ ] **Step 2: Запустить matrix test и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts`

- [ ] **Step 3: Построить заимствованное состояние по существующей фикстуре**

В качестве образца использовать
`e2e/fixtures/nkdk/cfe/Расширение_All/Справочник/СправочникПолный/Свойства.yaml`
с `!изменять` и `ПринадлежностьОбъекта: Заимствованный`. Не копировать объект
фикстуры целиком: объявить минимальное состояние для тестового `cf` справочника,
сохранив UUID и допустимые property states.

- [ ] **Step 4: Добавить собственные расширения заимствованного владельца**

Последовательно добавить реквизит, команду, собственную форму, текстовый макет
и расширение заимствованной формы реквизитом, командой, элементом и модулем.
Изменить одно metadata-ссылочное свойство на другой существующий тестовый
объект `cf`.

- [ ] **Step 5: Добавить оба удаления и контроль основной конфигурации**

Сначала удалить собственные форму/макет отдельно. На другом заимствованном
владельце удалить запись владельца из расширения вместе с оставшимися формой и
макетом. Итоговое сравнение `cf` является обязательным доказательством, что
базовые объекты не удалены.

- [ ] **Step 6: Запустить тесты и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts e2e/partial-sync/steps.test.ts`

```bash
git add e2e/partial-sync/matrix
git commit -m "test: :white_check_mark: проверить заимствованные объекты"
```

### Task 8: Полнота слоёв и окончательный порядок удаления

**Files:**
- Modify: `e2e/partial-sync/matrix/index.ts`
- Modify: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix.test.ts`
- Modify: `e2e/partial-sync/plan.test.ts`

**Interfaces:**
- Consumes: все операции Tasks 2–7.
- Produces: единый упорядоченный план без потерянных или повторных операций.

- [ ] **Step 1: Добавить проверку принадлежности ровно одному слою**

```ts
const counts = operationLayerMembership(partialSyncMatrix.layers)
expect([...counts.values()].every((count) => count === 1)).toBe(true)
expect([...counts.keys()].toSorted()).toEqual(allDeclaredOperationKeys.toSorted())
```

Также проверить, что отдельные удаления форм/макетов предшествуют удалению их
владельцев, а владельцы с оставшимися детьми удаляются отдельными операциями.

- [ ] **Step 2: Запустить тест и исправить только декларативный порядок**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts`

Expected: PASS после устранения всех пропусков/повторов; production-исполнитель
не должен получать исключений по конкретным типам.

- [ ] **Step 3: Проверить дубли и зафиксировать сборку матрицы**

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/matrix e2e/partial-sync/matrix.test.ts e2e/partial-sync/plan.test.ts
git commit -m "test: :white_check_mark: собрать полную слоистую матрицу"
```

### Task 9: Полная проверка и замер

**Files:**
- Verify only; при обнаруженном дефекте изменить только владеющий им модуль и добавить узкий регрессионный тест.

**Interfaces:**
- Produces: подтверждённая матрица и фактический отчёт времени.

- [ ] **Step 1: Запустить быстрые проверки partial-sync**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync`

- [ ] **Step 2: Выполнить обязательные проверки проекта**

Run: `pnpm type-check`

Run outside sandbox: `pnpm test`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 83c40f5e4`

Expected: все команды завершаются с кодом 0.

- [ ] **Step 3: Запустить полный автономный сценарий**

Run outside sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test' --mode standalone-server --reset
```

Expected: все блоки возвращают `synchronized -> unchanged`, итоговые `cf` и
`cfe/Расширение_All` совпадают, а один платформенный сеанс остаётся открытым до
итоговой проверки. Сохранить из `logs/timings.json` общее время,
время платформы, validation и checkpoint; сравнить с диагностической целью
7–12 минут без превращения времени в причину падения.

- [ ] **Step 4: Запустить полный агентный сценарий**

Использовать отдельный новый каталог сценария и `--mode designer-agent`.
Выполнить полный сценарий, поскольку CLI не имеет режима частичного завершения.
Проверить `reusedConnection: true` после первого обращения и совпадение обоих
компонентов в итоговой выгрузке.

- [ ] **Step 5: Зафиксировать только регрессионные исправления**

Каждый найденный платформой дефект сначала воспроизвести узким тестом, затем
исправить и создать отдельный `fix: :bug:` коммит. Не перезапускать полный
массив после дефекта, если продолжение в том же живом сеансе возможно. После
потери сеанса попытаться продолжить с контрольной копии, но при отказе нового
автономного сервера использовать новый каталог и `--reset`: согласованность
копии работающей файловой базы не гарантируется.
