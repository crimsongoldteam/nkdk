# Диагностика времени round-trip-yaml

## Контекст

`round-trip-yaml` сейчас показывает только итоговые ошибки и diff. При длинных прогонах непонятно, где тратится время: в чтении XML/YAML, преобразованиях модели, записи файлов, копировании внешних файлов или в shell-операциях самого skill.

Нужна штатная диагностика в CLI `nkdk import` и `nkdk sync`, а `round-trip-yaml.sh` должен использовать ее и дополнительно мерить свои собственные операции.

## Цели

- Добавить флаг `--timing` в `nkdk import` и `nkdk sync`.
- В первой версии собирать агрегаты, без полного списка объектов и форм.
- Разделить время файловых операций, преобразований и копирования без преобразования.
- Разделить копирование по направлению:
  - `XML -> YAML-проект`;
  - `YAML-проект -> XML`.
- Для `round-trip-yaml.sh` отдельно замерить операции вне CLI:
  - `git restore` XML-репозитория;
  - очистку временного YAML-каталога;
  - очистку временного XML-каталога;
  - сохранение reference-only файлов;
  - замену активного XML-каталога результатом временного XML;
  - поиск diff-файлов;
  - чтение полного diff для выбранных файлов.

## Не цели первой версии

- Не выводить время по каждому объекту, форме или макету.
- Не добавлять JSON-отчет.
- Не менять формат обычного вывода без `--timing`.
- Не менять семантику import/sync и round-trip.

## Подход

В core добавить необязательный `TimingCollector`. CLI создает collector только при `--timing` и передает его в `syncConfigurationFromXML` / `syncConfigurationToXML`. Без `--timing` collector не создается, поэтому обычный путь остается без заметных расходов и без нового вывода.

Collector хранит агрегаты по ключам: суммарное время, количество операций и направление, если оно важно. Для параллельной обработки суммарное время дочерних операций может быть больше wall time стадии; поэтому в выводе нужно явно различать:

- `total wall time` стадии import/sync;
- накопленное время категорий внутри стадии.

## Метрики CLI

### Общие стадии

- `import.total`: полный wall time `nkdk import`;
- `sync.total`: полный wall time `nkdk sync`.

### Файловые операции

Для `import`:

- `fs.read.xml`: чтение основного XML;
- `fs.read.xmlExternal`: чтение внешних XML-файлов из `filePath`;
- `fs.write.yaml`: запись `Свойства.yaml`, `Форма.yaml`, `Конфигурация.yaml`;
- `fs.write.yamlExternal`: запись внешних файлов YAML-проекта, полученных из модели или внешнего XML.

Для `sync`:

- `fs.read.yaml`: чтение YAML;
- `fs.read.xmlReference`: чтение reference XML, включая внешний reference XML;
- `fs.write.xml`: запись основного XML;
- `fs.write.xmlExternal`: запись внешних XML-файлов.

### Преобразования

Для `import`:

- `convert.xmlParse`: XML-текст -> XML-объект;
- `convert.xmlToModel`: XML-объект -> модель;
- `convert.modelToYaml`: модель -> YAML-объект;
- `convert.yamlStringify`: YAML-объект -> YAML-текст.

Для `sync`:

- `convert.yamlParse`: YAML-текст -> YAML-объект;
- `convert.yamlToModel`: YAML-объект -> модель;
- `convert.referenceXmlParse`: reference XML-текст -> XML-объект;
- `convert.referenceXmlToModel`: reference XML-объект -> модель;
- `convert.modelToXml`: модель -> XML-объект;
- `convert.xmlStringify`: XML-объект -> XML-текст.

### Копирование без преобразования

Копирование учитывается отдельно от чтения/записи XML/YAML, потому что это поток байтов без преобразования модели.

Для `XML -> YAML-проект`:

- `copy.toYamlProject.module`: модули;
- `copy.toYamlProject.template`: шаблоны;
- `copy.toYamlProject.binary`: bin/picture/help/ws и прочие байтовые файлы.

Для `YAML-проект -> XML`:

- `copy.toXml.module`: модули;
- `copy.toXml.template`: шаблоны;
- `copy.toXml.binary`: bin/picture/help/ws и прочие байтовые файлы.

Если точная классификация файла недоступна на уровне общей операции, первая версия относит его к `binary`.

## Метрики round-trip-yaml.sh

Skill добавляет собственные замеры поверх CLI:

- `runner.restoreXmlRepo`: `git -C "$NKDK_XML_REPO" restore .`;
- `runner.clearYamlDir`: удаление и создание временного YAML-каталога;
- `runner.clearXmlTmpDir`: очистка временного XML-каталога;
- `runner.importCommand`: запуск `nkdk import --timing`;
- `runner.syncCommand`: запуск `nkdk sync --timing`;
- `runner.preserveReferenceOnly`: копирование reference-only файлов;
- `runner.replaceXmlDir.clear`: очистка активного XML-каталога;
- `runner.replaceXmlDir.move`: перенос результата из временного XML-каталога;
- `runner.diffNameOnly`: `git diff --name-only`;
- `runner.diffFullRead`: чтение полного diff для файлов, которые попали в отчет.

Эти метрики печатаются отдельной таблицей, чтобы не смешивать их с внутренними метриками CLI.

## Формат вывода

После обычной строки `Готово: ...` при `--timing` CLI печатает компактную таблицу:

```text
=== TIMING import ===
category                         count  time
import.total                         1  12.340s
fs.read.xml                       1024   1.230s
convert.xmlToModel                1024   4.560s
fs.write.yaml                     1024   0.980s
copy.toYamlProject.module          120   0.450s
```

`round-trip-yaml.sh` после прогона каталога печатает:

```text
=== TIMING round-trip-yaml runner ===
category                         count  time
runner.restoreXmlRepo                1   0.420s
runner.clearYamlDir                  1   0.800s
runner.importCommand                 1  12.900s
runner.syncCommand                   1  18.200s
runner.diffNameOnly                  1   1.100s
```

При `--all-configs` таблицы печатаются для каждого активного каталога. В конце можно добавить суммарную таблицу runner по всем каталогам, если это не усложнит первую реализацию; отсутствие общей таблицы не считается недоделкой первой версии.

## Архитектура

Добавить небольшой модуль диагностики в core, например `metadata/diagnostics/timing.ts`:

- тип ключей метрик;
- `TimingCollector`;
- helper `measure(name, fn)`;
- форматирование таблицы для CLI.

Collector передается через параметры верхнеуровневых функций и дальше в orchestration:

- `syncConfigurationFromXML`;
- `syncConfigurationToXML`;
- `convertAppliedObjectFromXML`;
- `syncAppliedObjectToXML`;
- обработчики `syncExternalFromXML` / `syncExternalToXML`, где нужно учитывать копирование.

Для синхронных функций root IO использовать синхронный `measureSync`, чтобы не переводить их на async только ради метрик.

## Ошибки и частичные результаты

Если `import` или `sync` завершается с ошибками, CLI все равно печатает собранные метрики перед завершением команды. Это важно для диагностики медленных падений.

Если ошибка произошла до создания collector или до запуска стадии, таблица может отсутствовать.

## Проверка

- Unit-тесты collector: суммирование времени, счетчиков и форматирование.
- CLI-тесты: `import --timing` и `sync --timing` печатают таблицу, обычные команды не печатают.
- Узкие тесты core: переданный collector получает хотя бы основные категории чтения/записи/преобразования на маленькой фикстуре.
- Для закрытия задачи прогнать `pnpm test`.

## Открытые расширения

- `--timing-json <file>` для машинного сравнения прогонов.
- `--timing-top N` для самых долгих объектов, форм и макетов.
- Разделение `binary` на более точные классы, если текущие обработчики могут надежно назвать тип файла.
