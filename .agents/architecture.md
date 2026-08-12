# Архитектура NKDK

Этот файл — монитор текущей архитектуры и явно согласованных целевых схем ближайшей реализации. Он не хранит историю или подробные договоры реализации: история остаётся в git.

## Принципы

| Принцип | Проверяемое следствие |
|---|---|
| XML ↔ YAML без потерь | Поддержанный XML проходит `XML → YAML → XML` без потери содержимого. Если исходную форму нельзя однозначно восстановить, в YAML сохраняется исходный фрагмент XML с пометкой `!xml`. Допустимые места и формы перечислены в [реестре XML-аномалий](xml-anomalies.md). |
| Один канонический YAML | Одному содержимому XML соответствует одна форма YAML. Повторная выгрузка приводит совместимые входные варианты к этой форме; избыточные значения, совпадающие с выводимыми, в неё не входят. |
| Проверка за секунды | Неизменённые YAML повторно не разбираются. Изменённые файлы обрабатываются параллельно, а общие индексы переиспользуются между операциями. |
| YAML содержит только значимое | Очевидные значения выводятся из контекста: например, синоним `Заказ покупателя` для имени `ЗаказПокупателя` и `ПутьКДанным` вида `<ОсновнойРеквизит>.<ИмяЭлемента>`. |
| Архитектура видна целиком | В документе остаются только термины, границы, переиспользование и схемы основных операций. Детали находятся в коде и тестах. |

## Термины

Иерархия схем NKDK: [операция](#term-operation) → [процесс](#term-process) → [подпроцесс](#term-subprocess) или [задача](#term-task). Внутри процесса используются понятия [BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/): подпроцесс можно раскрыть подробнее, задача на текущей схеме неделима.

| Термин | Значение |
|---|---|
| <a id="term-operation"></a>Операция | Команда пользователя с законченным результатом: импорт, проверка, синхронизация, переименование или поиск ссылок. Запускает один процесс. |
| <a id="term-process"></a>Процесс | Полный ход выполнения операции от входных данных до результата. Состоит из подпроцессов и задач. |
| <a id="term-subprocess"></a>Подпроцесс | Именованная часть процесса, которую можно раскрыть отдельной схемой и переиспользовать в разных процессах. |
| <a id="term-task"></a>Задача | Наименьшая показанная единица работы. На текущем уровне схема не раскрывает её внутреннее устройство. |
| <a id="term-worker-run"></a>Запуск воркера | Граница выполнения нескольких задач одним воркером над одним элементом или пачкой. Это способ выполнения, а не уровень иерархии. |
| <a id="term-project"></a>Проект | YAML-представление конфигурации и связанные внешние файлы. |
| <a id="term-component"></a>Компонент | Самостоятельная часть проекта: `cf`, `cfe/<Имя>`, `erf/<Имя>` или `epf/<Имя>`. |
| <a id="term-rules"></a>Правила | Декларативное описание соответствия XML, модели, YAML, структуры файлов и схем. |
| <a id="term-topology"></a>Топология | Составленная из правил карта YAML, XML и внешних файлов компонента. |
| <a id="term-runtime"></a>Среда метаданных | Собранные для одного процесса правила, проверки, операции, состояние проекта и набор воркеров. |
| <a id="term-state"></a>Состояние проекта | Восстанавливаемые хэши, результаты проверки отдельных файлов и общие индексы всего проекта. В памяти публикуется неизменяемыми общими буферами. |
| <a id="term-snapshot"></a>Снимок компонента | Двоичный результат импорта или синхронизации: хэши файлов и сведения, необходимые для точного восстановления XML. |
| <a id="term-pending-sync"></a>Ожидающее состояние синхронизации | ZIP, снимок-кандидат и устойчивая фаза доставки `prepared`, `transferring` или `applied`, которая защищает информационную базу от опасной повторной загрузки. |
| <a id="term-file-check"></a>Проверка файла | Проверка синтаксиса, JSON Schema и правил, зависящих только от одного YAML. |
| <a id="term-reference-check"></a>Проверка связей | Проверка межфайловых ссылок по общему индексу всего проекта. |

## Карта компонентов

```mermaid
flowchart TD
  mcp["@nkdk/mcp<br/>(публичные инструменты и ответы)"]
  platform["@nkdk/platform<br/>(сеансы и команды 1С)"]
  rules["@nkdk/rules<br/>(правила метаданных и предметные обработчики)"]
  runtime["@nkdk/runtime<br/>(общие механизмы XML, YAML, ошибок и индексов)"]

  mcp --> platform
  mcp --> rules
  rules --> runtime

  rules --> metadataRuntime["MetadataRuntime<br/>(среда выполнения метаданных)"]
  metadataRuntime --> operations["MetadataRuntime<br/>import · validation · sync · metadata<br/>(операции)"]
  metadataRuntime --> projectState["ProjectStateService<br/>(состояние проекта)"]
  metadataRuntime --> workers["MetadataWorkerPoolHandle<br/>(набор воркеров)"]
  metadataRuntime --> registry["RuleRegistrySet<br/>(собранные правила)"]

  registry --> topology["RuleRegistrySet.resourceTopology<br/>(топология файлов)"]
  registry --> schemas["MetadataRuntime.schemas<br/>(JSON Schema)"]
  registry --> conversion["RuleRegistrySet.execution<br/>(выполнение правил XML ↔ YAML)"]

  operations --> projectState
  operations --> workers
  workers --> projectState
  workers --> conversion
```

Общие механизмы не знают о конкретных объектах метаданных. Предметные правила зависят от общих механизмов, а не наоборот. Все правила и обработчики связываются в одном месте при запуске.

| Пакет | Ответственность в частичной синхронизации с информационной базой |
|---|---|
| `@nkdk/rules` | Актуализация Проекта, план XML, ZIP, снимок-кандидат и переходы ожидающего состояния |
| `@nkdk/platform` | Сессия агента, staging ZIP, команда 1С, результат передачи и `platform.log` |
| `@nkdk/mcp` | Последовательность публичной операции и преобразование результата в MCP-ответ |

## Переиспользование

| Подпроцесс | [Импорт](#operation-import) | [Проверка](#operation-validation) | [Полная<br/>синхронизация](#operation-full-sync) | [Частичная синхронизация<br/>с информационной базой](#operation-partial-sync) | [Переименование](#operation-rename) | [Поиск<br/>ссылок](#operation-find-references) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| [Подготовка топологии](#term-topology) | ● | ● | ● | ● | ● | ● |
| [Проверка YAML и подготовка вклада в индекс](#subprocess-yaml-index) | ● | ● | ● | ● | ● | ● |
| Публикация [состояния проекта](#term-state) | ● | ● | ● | ● | ● | ● |
| [Проверка связей проекта](#subprocess-reference-check) | ● | ● | ● | ● | ● | ● |
| [Актуализировать проект](#subprocess-refresh) |  | ● | ● | ● | ● | ● |
| Сверка со [снимком компонента](#term-snapshot) |  |  | ● | ● |  |  |
| Подготовка выгрузки XML |  |  | ● | ● |  |  |
| YAML → XML |  |  | ● | ● |  |  |

## Обозначения схем

```mermaid
flowchart LR
  common[["Переиспользуемый<br/>подпроцесс"]]

  subgraph job["Воркер"]
    direction LR
    read["Задача"] --> parse["Задача"] --> result["Задача"]
  end

  common --> job
  style job stroke-dasharray: 7 5
```

- двойная рамка — [подпроцесс](#term-subprocess), переиспользуемый в нескольких процессах; крупные подпроцессы раскрываются отдельно;
- пунктирная рамка — [граница одного запуска воркера](#term-worker-run);
- прямоугольник — [задача](#term-task);
- до четырёх последовательных задач схема идёт слева направо, от пяти — сверху вниз.

<a id="subprocess-yaml-index"></a>

## Общие подпроцессы

### Проверить YAML и подготовить вклад в индекс

```mermaid
flowchart TD
  prepared["Получить подготовленный YAML"]
  schema["Проверить синтаксис<br/>и JSON Schema"]
  rules["Выполнить проверки<br/>для вида файла"]
  synonym["Проверить, что очевидный синоним<br/>не записан явно"]
  values["Проверить имена элементов формы<br/>и другие локальные правила"]
  facts["Собрать объекты, поля, ссылки,<br/>пути данных и значения заполнения"]
  contribution["Сформировать локальные ошибки<br/>и вклад файла в общий индекс"]

  prepared --> schema --> rules --> synonym --> values --> facts --> contribution
```

<a id="subprocess-reference-check"></a>

### Проверить связи проекта

```mermaid
flowchart TD
  index["Получить общий индекс<br/>и отложенные проверки"]
  references["Проверить ссылки<br/>на объекты и значения"]
  owners["Найти владельцев и их поля"]
  dataPaths["Проверить пути данных"]
  fillValues["Проверить значения заполнения<br/>с учётом типов"]
  required["Проверить обязательные поля<br/>объектов расширения"]
  structured["Проверить структуру форм<br/>и других составных документов"]
  diagnostics["Сформировать межфайловые<br/>ошибки и предупреждения"]

  index --> references --> owners --> dataPaths --> fillValues --> required --> structured --> diagnostics
```

<a id="subprocess-refresh"></a>

### Актуализировать проект

Этот [подпроцесс](#term-subprocess) приводит [состояние проекта](#term-state) в соответствие с файлами и возвращает ошибки и предупреждения.

```mermaid
flowchart TD
  topology[["Подготовить топологию проекта"]]
  state["Прочитать сохранённые хэши<br/>и результаты проверки"]

  subgraph validationJob["Воркер"]
    direction TD
    readFile["Прочитать файл"] --> hash["Вычислить хэш"] --> changed{"Файл изменился?"}
    changed -- "нет" --> unchanged["Вернуть сохранённый результат"]
    changed -- "да" --> parseYaml["Один раз разобрать YAML"] --> local[["Проверить YAML и подготовить<br/>вклад в индекс"]]
  end

  merge["Обновить временные индекс<br/>и состояние проекта"]
  dependency[["Проверить связи проекта"]]
  publish[["Опубликовать состояние проекта"]]
  diagnostics["Вернуть ошибки<br/>и предупреждения"]

  topology --> state --> validationJob --> merge --> dependency --> publish --> diagnostics
  style validationJob stroke-dasharray: 7 5
```

↳ [Проверка YAML и подготовка вклада в индекс — подробная схема](#subprocess-yaml-index)

↳ [Проверить связи проекта — подробная схема](#subprocess-reference-check)

## [Операции](#term-operation)

<a id="operation-import"></a>

### Импорт XML → YAML

```mermaid
flowchart TD
  root["Прочитать корневой XML"]
  target["Определить вид и путь компонента"]
  preflight["Проверить целевой каталог<br/>и отсутствие незавершённой синхронизации"]
  topology[["Подготовить топологию проекта"]]
  extension{"Импортируется расширение?"}
  refresh[["Актуализировать проект"]]
  session["Открыть временное<br/>состояние импорта"]
  discover["Найти XML и внешние файлы<br/>и сформировать задания"]

  subgraph first["Воркер"]
    direction TD
    readXml["Прочитать XML"] --> toModel["Разобрать XML<br/>и построить модель"] --> toYaml["Преобразовать модель в YAML"]
    toYaml --> ready{"Можно завершить<br/>без общего индекса?"}
    ready -- "да" --> serialize1["Сформировать текст YAML"] --> local1[["Проверить YAML и подготовить<br/>вклад в индекс"]] --> write1["Записать YAML"]
    ready -- "нет" --> defer["Сохранить незавершённый YAML<br/>и предварительный вклад в индекс"]
    write1 --> firstResult["Вернуть файлы<br/>и части состояния"]
    defer --> firstResult
  end

  firstErrors{"Есть ошибки?"}
  snapshotFragments["Собрать сведения из XML<br/>для снимка компонента"]
  index["Записать вклады и зафиксировать<br/>рабочий индекс первого прохода"]

  subgraph second["Воркер"]
    direction TD
    pending{"Остался незавершённый YAML?"}
    pending -- "нет" --> skip["Вернуть пустой результат"]
    pending -- "да" --> readIndex["Прочитать рабочий индекс"] --> resolve["Уточнить отложенные значения"] --> serialize2["Сформировать текст YAML"] --> local2[["Проверить YAML и подготовить<br/>вклад в индекс"]] --> write2["Записать YAML<br/>и окончательный вклад"]
  end

  secondErrors{"Есть ошибки?"}
  files["Объединить списки<br/>созданных файлов"]
  external["Передать внешние файлы<br/>и вычислить их хэши"]
  externalState["Добавить внешние файлы<br/>во временное состояние"]
  snapshot["Собрать снимок компонента"]
  dependencies[["Проверить связи проекта"]]
  writeSnapshot["Записать снимок компонента"]
  publish[["Опубликовать состояние проекта"]]
  result["Вернуть результат импорта,<br/>ошибки и предупреждения"]
  abort["Отменить временное состояние<br/>и закрыть воркеры"]
  failure["Вернуть ошибки импорта"]

  root --> target --> preflight --> topology --> extension
  extension -- "нет" --> session
  extension -- "да" --> refresh --> session
  session --> discover --> first --> firstErrors
  firstErrors -- "нет" --> snapshotFragments --> index --> second --> secondErrors
  secondErrors -- "нет" --> files --> external --> externalState --> snapshot --> dependencies --> writeSnapshot --> publish --> result
  firstErrors -- "да" --> abort
  secondErrors -- "да" --> abort
  abort --> failure
  style first stroke-dasharray: 7 5
  style second stroke-dasharray: 7 5
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)

↳ [Проверка YAML и подготовка вклада в индекс — подробная схема](#subprocess-yaml-index)

↳ [Проверить связи проекта — подробная схема](#subprocess-reference-check)

<a id="operation-validation"></a>

### Проверка проекта

```mermaid
flowchart LR
  request["Принять запрос"] --> refresh[["Актуализировать проект"]] --> result["Вернуть ошибки<br/>и предупреждения"]
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)

↳ [Проверка YAML и подготовка вклада в индекс — подробная схема](#subprocess-yaml-index)

↳ [Проверить связи проекта — подробная схема](#subprocess-reference-check)

<a id="operation-full-sync"></a>

### Полная синхронизация YAML → XML

```mermaid
flowchart TD
  validate[["Актуализировать проект"]]
  target[["Сверить компонент<br/>с его снимком"]]
  plan[["Построить план<br/>выгрузки XML"]]

  subgraph fullSyncJob["Воркер"]
    direction LR
    readYaml["Прочитать YAML"] --> toXml[["Преобразовать YAML → XML"]] --> writeXml["Записать XML"] --> fragment["Вернуть фрагмент снимка"]
  end

  external["Передать внешние файлы"]
  check["Проверить полноту<br/>записанных файлов"]
  snapshot[["Атомарно записать<br/>новый снимок компонента"]]

  validate --> target --> plan --> fullSyncJob --> external --> check --> snapshot
  style fullSyncJob stroke-dasharray: 7 5
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)

<a id="operation-partial-sync"></a>

### Частичная синхронизация с информационной базой

```mermaid
flowchart TD
  request["@nkdk/mcp<br/>Принять sync_to_infobase"]
  phase{"Фаза ожидающего<br/>состояния?"}

  subgraph preparePackage["@nkdk/rules · подготовка пакета"]
    direction TD
    validate[["Актуализировать проект"]]
    target[["Сверить компонент<br/>с его снимком"]]
    changes["Найти изменения<br/>относительно снимка"]
    work{"Есть изменения<br/>или migration?"}
    impact["Расширить выборку<br/>по топологии и ссылкам"]
    plan[["Построить план<br/>выгрузки XML"]]

    subgraph partialSyncJob["Воркер"]
      direction LR
      readYaml["Прочитать YAML"] --> toXml[["Преобразовать YAML → XML"]] --> document["Вернуть XML-документы"] --> fragment["Вернуть фрагмент снимка"]
    end

    archive["Потоково записать ZIP<br/>и load.lst"]
    prepared["Сохранить снимок-кандидат<br/>и фазу prepared"]

    validate --> target --> changes --> work
    work -- "да" --> impact --> plan --> partialSyncJob --> archive --> prepared
  end

  noChanges["@nkdk/mcp<br/>Вернуть unchanged"]
  transferring["@nkdk/rules<br/>Атомарно записать transferring"]
  load["@nkdk/platform<br/>Передать ZIP агенту,<br/>загрузить и записать журнал"]
  outcome{"Результат передачи?"}
  retry["@nkdk/rules<br/>Вернуть prepared"]
  unknown["Сохранить transferring<br/>и запретить повтор"]
  applied["@nkdk/rules<br/>Атомарно записать applied"]
  publish[["@nkdk/rules<br/>Проверить пакет и снимки,<br/>опубликовать кандидат"]]
  result["@nkdk/mcp<br/>Вернуть результат"]

  request --> phase
  phase -- "нет пакета или prepared" --> validate
  phase -- "transferring" --> unknown --> result
  phase -- "applied" --> publish --> result
  work -- "нет" --> noChanges
  prepared --> transferring --> load --> outcome
  outcome -- "явный отказ" --> retry --> result
  outcome -- "неизвестен" --> unknown
  outcome -- "успех" --> applied --> publish
  style partialSyncJob stroke-dasharray: 7 5
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)

<a id="operation-rename"></a>

### Переименование

```mermaid
flowchart TD
  refreshBefore[["Актуализировать проект"]]
  target["Найти переименовываемый объект"]
  references["Получить его ссылки<br/>из общего индекса"]
  affected["Прочитать только<br/>затронутые YAML"]
  plan["Подготовить изменения<br/>и проверить новое имя"]
  write{"Запись разрешена?"}
  preview["Вернуть план изменений"]
  apply["Записать файлы"]
  refreshAfter[["Актуализировать проект"]]
  result["Вернуть изменённые файлы<br/>и переписанные ссылки"]

  refreshBefore --> target --> references --> affected --> plan --> write
  write -- "нет" --> preview
  write -- "да" --> apply --> refreshAfter --> result
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)
<a id="operation-find-references"></a>

### Поиск ссылок

```mermaid
flowchart LR
  refresh[["Актуализировать проект"]] --> target["Найти объект"] --> references["Прочитать ссылки<br/>из общего индекса"] --> result["Вернуть внешние ссылки"]
```

↳ [Актуализировать проект — подробная схема](#subprocess-refresh)
