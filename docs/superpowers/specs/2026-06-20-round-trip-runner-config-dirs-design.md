# Единый выбор конфигураций для round-trip runner-ов

## Цель

Все shell runner-ы round-trip должны одинаково понимать `NKDK_XML_DIR`:

- если `NKDK_XML_DIR` указывает на один XML-дамп конфигурации, проверяется только он;
- если `NKDK_XML_DIR` указывает на корень с несколькими XML-дампами, runner собирает дочерние конфигурационные каталоги первого уровня по алфавиту;
- без `--all-configs` runner останавливается на первом значимом результате;
- с `--all-configs` runner проходит все найденные конфигурации.

Это поведение должно быть общим для:

- `.agents/skills/round-trip-xml/round-trip.sh`;
- `.agents/skills/round-trip-yaml/round-trip.sh`;
- `.agents/skills/round-trip-yaml-fast/round-trip.sh`;
- `.agents/skills/round-trip-yaml-1c/round-trip.sh`.

## Общий механизм

Нужно вынести общий shell-helper, например:

`.agents/skills/_shared/round-trip-config-dirs.sh`

В helper входят:

- `KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")`;
- `is_config_dir <path>`;
- `collect_run_dirs <root>`;
- `sanitize_path_segment <value>`;
- `config_rel_path <active-dir> <xml-repo>`.

Runner-ы подключают helper через `source` и больше не держат собственные копии этих функций. Это убирает расхождения между пробегами и делает будущие изменения списка признаков конфигурации точечными.

## Поведение runner-ов

### round-trip-xml

Текущее поведение уже целевое: `collect_run_dirs`, `--all-configs`, остановка на первом actionable diff. Изменение должно быть механическим: заменить локальные функции на helper без изменения протокола вывода.

### round-trip-yaml

Текущее поведение уже целевое: `collect_run_dirs`, `--all-configs`, остановка на первом diff, отдельные YAML/XML temp каталоги для каждой конфигурации. Изменение должно быть механическим: заменить локальные функции на helper без изменения протокола вывода.

### round-trip-yaml-fast

Нужно добавить тот же выбор каталогов:

- поддержать `--all-configs`;
- собрать `RUN_DIRS` через общий helper;
- запускать CLI `round-trip-yaml-fast` для каждого `RUN_XML_DIR`;
- без `--all-configs` остановиться на первом каталоге, где есть `diffs > 0` или `errors > 0`;
- с `--all-configs` пройти все каталоги и накопить результаты.

Вывод должен сохранять текущие блоки `CHECKED`, `DIFF_COUNT`, `ERROR_COUNT`, но они должны отражать выбранный режим:

- single без `--all-configs`: показатели активного каталога;
- `--all-configs`: суммарные показатели по всем каталогам;
- selected/triage diff должен содержать свой `ACTIVE_XML_DIR`, чтобы путь не склеивался с неправильным каталогом.

Если каталогов не найдено, fast должен падать с тем же сообщением, что остальные runner-ы: `в NKDK_XML_DIR (...) не найдено конфигурационных каталогов`.

### round-trip-yaml-1c

Нужно добавить `--all-configs` и использовать общий helper:

- без `--all-configs` поведение остаётся одно-конфигурационным: берётся первый найденный каталог из `RUN_DIRS`;
- с `--all-configs` runner последовательно проходит все `RUN_DIRS`;
- для каждого каталога отдельно вычисляются `YAML_DIR` и `TMP_XML_DIR`;
- файловая база `NKDK_1C_DB_PATH` очищается и создаётся заново перед загрузкой каждого каталога;
- при ошибке import/sync/create-infobase/ibcmd runner печатает диагностический блок с текущим `ACTIVE_XML_DIR`, `YAML_DIR`, `TMP_XML_DIR` и останавливается.

При успешном `--all-configs` вывод должен сообщить, сколько каталогов проверено.

## Протокол ошибок

Ошибки отсутствия конфигурационных каталогов должны быть одинаковыми у всех runner-ов.

Для `round-trip-yaml-fast` `errors > 0` от CLI считаются значимым результатом диагностики, а не техническим падением wrapper-а. Wrapper должен продолжать структурированный вывод, если CLI напечатал `=== ROUND_TRIP_YAML_FAST ===`.

Для `round-trip-yaml-1c` первая ошибка загрузочной цепочки остаётся стоп-событием даже в `--all-configs`, потому что дальше результат может зависеть от состояния файловой базы и временных каталогов.

## Тестирование

Проверки должны быть shell-level или smoke-level:

- `round-trip-yaml-fast` на `NKDK_XML_DIR=/home/nikita/git/round-trip` больше не должен давать `checked: 0`; он должен выбрать первый конфигурационный каталог или при `--all-configs` пройти все;
- `round-trip-yaml-fast --all-configs` должен показывать суммарный `CHECKED` и корректный `ACTIVE_XML_DIR` у diff'ов;
- `round-trip-yaml-1c` без `--all-configs` должен выбирать первый найденный каталог из корня;
- `round-trip-yaml-1c --all-configs` должен проходить несколько каталогов последовательно до первой ошибки или полного успеха;
- существующие `round-trip-xml` и `round-trip-yaml` не должны менять пользовательский протокол.

Полный `pnpm test` не обязателен для shell-only изменения, но нужно запускать точечные smoke-команды runner-ов, которые не требуют внешней 1С. Для `round-trip-yaml-1c` достаточно проверки `--help` и проверки выбора каталогов через изолируемый shell-level тест или dry-run, если он будет добавлен в плане реализации.
