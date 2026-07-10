# MCP persistent validation pool на Piscina

## Контекст

`nkdk.validate_project` в MCP сейчас вызывает `core.validateProject(...)`. Для полного YAML-проекта core создаёт validation worker pool, прогревает схемы в worker threads, выполняет first/second pass и затем закрывает pool. Поэтому каждый MCP-вызов заново платит стоимость запуска workers и компиляции validation schema cache.

После перехода validation worker на compact YAML facts проектные данные внутри worker очищаются после second pass. Это делает возможным безопасное переиспользование самих workers между MCP-вызовами, если не сохранять `workerState`, object table, snapshots и pending references между проверками.

## Цель

Сделать MCP-режим validation быстрее на повторных вызовах за счёт постоянного общего pool на процесс MCP-сервера.

Ограничения:

- постоянный pool нужен только MCP-серверу;
- CLI остаётся одноразовым и не держит workers после завершения команды;
- общий pool один на MCP-сервер, не отдельный на `projectDir`;
- проектные данные не должны протекать между вызовами;
- управление workers переносится с ручного `worker_threads` на Piscina.

## Дизайн

Core получает явный объект жизненного цикла, например `ValidationWorkerPoolHandle`. Он создаётся с `concurrency`, лениво запускает Piscina pool, прогревает каждый worker задачей `init`, а затем предоставляет метод полной validation для проекта.

`validateProject(...)` остаётся публичной одноразовой функцией. Для CLI и существующих вызовов её поведение сохраняется: создать pool, проверить проект, закрыть pool. Для MCP добавляется отдельная точка входа в core, которая создаёт долгоживущий handle и закрывается только при остановке MCP-сервера.

Piscina worker вместо `parentPort.on("message")` экспортирует обработчик задачи. Типы задач остаются теми же по смыслу:

- `init`: создать schema cache и сохранить rulesSnapshot внутри worker;
- `firstPass`: прочитать назначенные YAML-файлы и вернуть compact facts/diagnostics;
- `secondPass`: принять shared snapshot, проверить pending references и form checks, затем очистить worker-local project state.

Для гарантированного прогрева всех потоков pool отправляет `concurrency` задач `init`. Последующие validation-запуски не повторяют `init`, пока handle жив. Если context или concurrency изменятся, caller создаёт новый handle.

## MCP-жизненный цикл

MCP-сервер держит один общий validation handle в service layer. Первый вызов `nkdk.validate_project` создаёт handle с default concurrency из core. Следующие вызовы переиспользуют тот же handle.

При завершении stdio-сервера MCP вызывает `close()` у handle. Если отдельного shutdown hook в SDK недостаточно, закрытие можно повесить на `SIGINT`, `SIGTERM`, `beforeExit` и нормальный путь `runStdioServer`.

## Ошибки и состояние

Если validation-задача падает, ошибка возвращается через текущий `toolError("core_error", ...)`. Сам handle не должен молча оставаться в поломанном состоянии после фатальной ошибки worker pool: для ошибок Piscina pool закрывается, ссылка сбрасывается, следующий MCP-вызов создаёт новый pool.

Внутри worker после second pass вызывается очистка `workerState`. First pass всегда начинает с пустого `workerState`. Schema cache и rulesSnapshot остаются между вызовами.

## Тестирование

Нужны focused tests:

- core: pool на Piscina переиспользует workers и не компилирует schema cache повторно на втором запуске;
- core: после второй проверки worker не удерживает project state;
- MCP service: два последовательных вызова используют один validation handle;
- MCP/server: shutdown закрывает handle;
- существующие validation и MCP тесты остаются зелёными.

Полная проверка перед завершением: `pnpm test`, плюс ручной MCP-замер `nkdk.validate_project` на `/Users/nikita/git/nkdk-yaml`.
