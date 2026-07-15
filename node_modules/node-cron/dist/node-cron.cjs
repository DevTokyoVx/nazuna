'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var inlineScheduledTask = require('./_shared.cjs');
var path = require('path');
var url = require('url');
var child_process = require('child_process');
var events = require('events');
require('node:crypto');

const tasks = new Map();
class TaskRegistry {
    add(task) {
        if (this.has(task.id)) {
            throw Error(`task ${task.id} already registered!`);
        }
        tasks.set(task.id, task);
        task.on('task:destroyed', () => {
            this.remove(task);
        });
    }
    get(taskId) {
        return tasks.get(taskId);
    }
    remove(task) {
        if (this.has(task.id)) {
            tasks.delete(task.id);
            task.destroy();
        }
    }
    all() {
        return tasks;
    }
    has(taskId) {
        return tasks.has(taskId);
    }
    killAll() {
        tasks.forEach(id => this.remove(id));
    }
}

const validationRegex = /^(?:\d+|\*|\*\/\d+)$/;
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9-*/,#? ]+$/;
function splitFields(resolved) {
    return resolved.replace(/\s{2,}/g, ' ').trim().split(' ');
}
function isValidExpression(expression, min, max) {
    const options = expression;
    for (const option of options) {
        const optionAsInt = parseInt(option, 10);
        if ((!Number.isNaN(optionAsInt) &&
            (optionAsInt < min || optionAsInt > max)) ||
            !validationRegex.test(option))
            return false;
    }
    return true;
}
function isInvalidSecond(expression) {
    return !isValidExpression(expression, 0, 59);
}
function isInvalidMinute(expression) {
    return !isValidExpression(expression, 0, 59);
}
function isInvalidHour(expression) {
    return !isValidExpression(expression, 0, 23);
}
const DAY_OF_MONTH_W_TOKEN = /^(\d{1,2}|L)W$/i;
const DAY_OF_MONTH_OFFSET_TOKEN = /^L-(\d{1,2})$/i;
function isInvalidDayOfMonth(expression) {
    const days = expression.filter((value) => {
        if (value === 'L')
            return false;
        const weekday = DAY_OF_MONTH_W_TOKEN.exec(String(value));
        if (weekday) {
            if (weekday[1] === 'L')
                return false;
            const target = parseInt(weekday[1], 10);
            return target < 1 || target > 31;
        }
        const offset = DAY_OF_MONTH_OFFSET_TOKEN.exec(String(value));
        if (offset) {
            const n = parseInt(offset[1], 10);
            return n < 1 || n > 30;
        }
        return true;
    });
    return !isValidExpression(days, 1, 31);
}
function hasInvalidWModifier(rawDayOfMonth) {
    if (!/w/i.test(rawDayOfMonth))
        return false;
    return rawDayOfMonth.split(',').some((token) => {
        const value = token.trim();
        if (!/w/i.test(value))
            return false;
        return !DAY_OF_MONTH_W_TOKEN.test(value);
    });
}
function isInvalidMonth(expression) {
    return !isValidExpression(expression, 1, 12);
}
function isInvalidWeekDay(expression) {
    const days = expression.filter((value) => !inlineScheduledTask.isNthWeekdayToken(value) && !/^[0-7]L$/.test(value));
    return !isValidExpression(days, 0, 7);
}
const MAX_DAYS_IN_MONTH = {
    1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};
function isImpossibleDayOfMonth(days, months) {
    if (days.some((day) => typeof day !== 'number'))
        return false;
    return !months.some((month) => days.some((day) => day <= MAX_DAYS_IN_MONTH[month]));
}
function validateFields(patterns, executablePatterns) {
    if (isInvalidSecond(executablePatterns[0]))
        throw new Error(`${patterns[0]} is a invalid expression for second`);
    if (isInvalidMinute(executablePatterns[1]))
        throw new Error(`${patterns[1]} is a invalid expression for minute`);
    if (isInvalidHour(executablePatterns[2]))
        throw new Error(`${patterns[2]} is a invalid expression for hour`);
    if (isInvalidDayOfMonth(executablePatterns[3]) || hasInvalidWModifier(patterns[3]))
        throw new Error(`${patterns[3]} is a invalid expression for day of month`);
    if (isInvalidMonth(executablePatterns[4]))
        throw new Error(`${patterns[4]} is a invalid expression for month`);
    if (isInvalidWeekDay(executablePatterns[5]))
        throw new Error(`${patterns[5]} is a invalid expression for week day`);
    if (isImpossibleDayOfMonth(executablePatterns[3], executablePatterns[4]))
        throw new Error(`${patterns[3]} ${patterns[4]} is an impossible day of month for the given month`);
}
const FIELDS = [
    { key: 'second', label: 'second', invalid: isInvalidSecond },
    { key: 'minute', label: 'minute', invalid: isInvalidMinute },
    { key: 'hour', label: 'hour', invalid: isInvalidHour },
    { key: 'dayOfMonth', label: 'day of month', invalid: isInvalidDayOfMonth },
    { key: 'month', label: 'month', invalid: isInvalidMonth },
    { key: 'dayOfWeek', label: 'week day', invalid: isInvalidWeekDay },
];
function validateDetailed$1(pattern) {
    if (typeof pattern !== 'string')
        return { valid: false, errors: [{ field: 'expression', message: 'pattern must be a string' }] };
    const resolved = inlineScheduledTask.resolveNickname(pattern);
    if (!ALLOWED_CHARS_REGEX.test(resolved))
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: 'pattern includes illegal characters' }] };
    const raw = splitFields(resolved);
    if (raw.length !== 5 && raw.length !== 6)
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: `expected 5 or 6 fields but got ${raw.length}` }] };
    const patterns = raw.length === 5 ? ['0', ...raw] : raw;
    const executable = inlineScheduledTask.convertExpression(pattern);
    const errors = [];
    FIELDS.forEach((f, i) => {
        const rawWMisuse = f.key === 'dayOfMonth' && hasInvalidWModifier(patterns[i]);
        if (f.invalid(executable[i]) || rawWMisuse)
            errors.push({ field: f.key, value: patterns[i], message: `${patterns[i]} is a invalid expression for ${f.label}` });
    });
    if (!errors.length && isImpossibleDayOfMonth(executable[3], executable[4])) {
        errors.push({
            field: 'dayOfMonth',
            value: patterns[3],
            message: `${patterns[3]} ${patterns[4]} is an impossible day of month for the given month`,
        });
    }
    if (errors.length)
        return { valid: false, errors };
    return {
        valid: true,
        errors: [],
        fields: {
            second: executable[0],
            minute: executable[1],
            hour: executable[2],
            dayOfMonth: executable[3],
            month: executable[4],
            dayOfWeek: executable[5],
        },
    };
}
function parse$1(pattern) {
    const result = validateDetailed$1(pattern);
    if (!result.valid)
        throw new Error(result.errors[0].message);
    return result.fields;
}
function validate$1(pattern) {
    if (typeof pattern !== 'string')
        throw new TypeError('pattern must be a string!');
    const resolved = inlineScheduledTask.resolveNickname(pattern);
    if (!ALLOWED_CHARS_REGEX.test(resolved))
        throw new TypeError('pattern includes illegal characters!');
    const raw = splitFields(resolved);
    if (raw.length !== 5 && raw.length !== 6)
        throw new Error(`expected 5 or 6 fields but got ${raw.length}`);
    const patterns = raw.length === 5 ? ['0', ...raw] : raw;
    const executablePatterns = inlineScheduledTask.convertExpression(resolved);
    validateFields(patterns, executablePatterns);
}

const daemonPath = path.resolve(path.dirname(__filename), 'daemon.cjs');
class TaskEmitter extends events.EventEmitter {
}
class BackgroundScheduledTask {
    emitter;
    id;
    name;
    cronExpression;
    taskPath;
    options;
    forkProcess;
    stateMachine;
    logger;
    suppressMissedWarning;
    timeMatcher;
    runCount;
    runCoordinator;
    _lastRun = null;
    executing = false;
    killPending = false;
    pendingKillCleanup;
    currentExecution;
    killRequested = false;
    startPromise;
    constructor(cronExpression, taskPath, options) {
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.id = inlineScheduledTask.createID();
        this.name = options?.name || this.id;
        this.emitter = new TaskEmitter();
        this.stateMachine = new inlineScheduledTask.StateMachine('stopped');
        this.timeMatcher = new inlineScheduledTask.TimeMatcher(cronExpression, options?.timezone);
        this.runCount = 0;
        this.on('execution:started', (context) => {
            if (context?.execution?.reason === 'scheduled')
                this.runCount++;
            this.executing = true;
            this.currentExecution = context?.execution;
        });
        this.on('execution:finished', (context) => { this.executing = false; this.currentExecution = undefined; this.recordLastRun(context.execution); });
        this.on('execution:failed', (context) => { this.executing = false; this.currentExecution = undefined; this.recordLastRun(context.execution); });
        this.logger = options?.logger || inlineScheduledTask.logger;
        this.suppressMissedWarning = options?.suppressMissedWarning || false;
        this.runCoordinator = options?.distributed ? inlineScheduledTask.resolveRunCoordinator(options?.runCoordinator) : undefined;
        this.on('task:stopped', () => {
            this.killForkWhenSettled();
            if (this.stateMachine.state !== 'destroyed') {
                this.stateMachine.changeState('stopped');
            }
        });
        this.on('task:destroyed', () => {
            this.killForkWhenSettled();
            this.stateMachine.changeState('destroyed');
        });
    }
    getNextRun() {
        if (this.stateMachine.state !== 'stopped') {
            return this.timeMatcher.getNextMatch(new Date());
        }
        return null;
    }
    getNextRuns(count) {
        const runs = [];
        let from = new Date();
        for (let i = 0; i < count; i++) {
            from = this.timeMatcher.getNextMatch(from);
            runs.push(from);
        }
        return runs;
    }
    match(date) {
        return this.timeMatcher.match(date);
    }
    msToNext() {
        const next = this.getNextRun();
        return next ? next.getTime() - Date.now() : null;
    }
    isBusy() {
        return this.getStatus() === 'running';
    }
    runsLeft() {
        if (this.options?.maxExecutions == null)
            return undefined;
        return Math.max(0, this.options.maxExecutions - this.runCount);
    }
    getPattern() {
        return this.cronExpression;
    }
    lastRun() {
        return this._lastRun;
    }
    recordLastRun(execution) {
        if (!execution)
            return;
        const raw = execution.finishedAt ?? execution.startedAt;
        const date = raw ? new Date(raw) : new Date();
        const lastRun = { date };
        if (execution.error) {
            lastRun.error = execution.error;
        }
        else {
            lastRun.result = execution.result;
        }
        this._lastRun = lastRun;
    }
    killForkWhenSettled() {
        if (!this.forkProcess)
            return;
        if (!this.executing) {
            this.killFork();
            return;
        }
        if (this.killPending)
            return;
        this.killPending = true;
        const onSettled = () => this.killFork();
        this.once('execution:finished', onSettled);
        this.once('execution:failed', onSettled);
        this.pendingKillCleanup = () => {
            this.off('execution:finished', onSettled);
            this.off('execution:failed', onSettled);
        };
    }
    clearPendingKillWait() {
        this.pendingKillCleanup?.();
        this.pendingKillCleanup = undefined;
        this.killPending = false;
    }
    killFork() {
        this.clearPendingKillWait();
        this.killRequested = true;
        this.forkProcess?.kill();
        this.forkProcess = undefined;
    }
    handleUnexpectedExit(code, signal) {
        this.clearPendingKillWait();
        const erro = new Error(`daemon exited unexpectedly (code ${code}, signal ${signal})`);
        this.logger.error(erro);
        if (this.executing) {
            const execution = { id: inlineScheduledTask.createID(), reason: 'scheduled', ...this.currentExecution, error: erro, finishedAt: new Date() };
            this.emitter.emit('execution:failed', this.createContext(new Date(), execution));
        }
        try {
            this.stateMachine.changeState('stopped');
        }
        catch (err) {
            this.logger.error(err);
        }
        const context = this.createContext(new Date());
        context.error = erro;
        this.emitter.emit('task:failed', context);
        this.forkProcess = undefined;
    }
    start() {
        if (this.stateMachine.state === 'destroyed') {
            return Promise.resolve();
        }
        if (this.startPromise) {
            return this.startPromise;
        }
        if (this.forkProcess) {
            return Promise.resolve();
        }
        this.startPromise = this.forkAndStart().finally(() => {
            this.startPromise = undefined;
        });
        return this.startPromise;
    }
    forkAndStart() {
        return new Promise((resolve, reject) => {
            const startTimeout = this.options?.startTimeout ?? 5000;
            const failStart = (error) => {
                clearTimeout(timeout);
                this.killFork();
                reject(error);
            };
            const timeout = setTimeout(() => {
                failStart(new Error(`Start operation timed out after ${startTimeout}ms. The background task file may have failed to load or taken too long to import; ` +
                    `verify it runs on its own and consider increasing the \`startTimeout\` option.`));
            }, startTimeout);
            this.killRequested = false;
            let startSucceeded = false;
            try {
                this.forkProcess = child_process.fork(daemonPath);
                this.forkProcess.on('error', (err) => {
                    failStart(new Error(`Error on daemon: ${err.message}`));
                });
                this.forkProcess.on('exit', (code, signal) => {
                    if (this.killRequested) {
                        this.killRequested = false;
                        return;
                    }
                    if (code !== 0 && signal !== 'SIGTERM') {
                        if (startSucceeded) {
                            this.handleUnexpectedExit(code, signal);
                            return;
                        }
                        const erro = new Error(`node-cron daemon exited with code ${code || signal}`);
                        this.logger.error(erro);
                        failStart(erro);
                    }
                });
                this.forkProcess.on('message', (message) => {
                    if (message.type === 'coordinator:shouldRun') {
                        void this.handleShouldRun(message);
                        return;
                    }
                    if (message.type === 'coordinator:complete') {
                        this.runCoordinator?.onComplete?.(message.key)?.catch?.((err) => this.logger.error('Run coordinator onComplete failed', err));
                        return;
                    }
                    if (message.event === 'daemon:error') {
                        failStart(message.jsonError ? deserializeError(message.jsonError) : new Error('Background task failed to start'));
                        return;
                    }
                    if (message.jsonError) {
                        if (message.context?.execution) {
                            message.context.execution.error = deserializeError(message.jsonError);
                            delete message.jsonError;
                        }
                    }
                    if (message.context?.task?.state) {
                        this.stateMachine.changeState(message.context?.task?.state);
                    }
                    if (message.context) {
                        const execution = message.context?.execution;
                        delete execution?.hasError;
                        const context = this.createContext(new Date(message.context.date), execution, message.context.reason);
                        this.logEvent(message.event, context);
                        this.emitter.emit(message.event, context);
                    }
                });
                this.once('task:started', () => {
                    startSucceeded = true;
                    this.stateMachine.changeState('idle');
                    clearTimeout(timeout);
                    resolve(undefined);
                });
                this.forkProcess.send({
                    command: 'task:start',
                    path: this.taskPath,
                    cron: this.cronExpression,
                    options: serializableOptions(this.options)
                });
            }
            catch (error) {
                failStart(error);
            }
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (this.stateMachine.state === 'destroyed') {
                return resolve(undefined);
            }
            if (!this.forkProcess) {
                this.emitter.emit('task:stopped');
                return resolve(undefined);
            }
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                this.killFork();
                reject(new Error('Stop operation timed out'));
            }, 5000);
            const cleanupAndResolve = () => {
                clearTimeout(timeoutId);
                this.off('task:stopped', onStopped);
                resolve(undefined);
            };
            const onStopped = () => {
                cleanupAndResolve();
            };
            this.once('task:stopped', onStopped);
            this.forkProcess.send({
                command: 'task:stop'
            });
        });
    }
    getStatus() {
        return this.stateMachine.state;
    }
    unref() {
        if (!this.forkProcess)
            return;
        this.forkProcess.unref();
        this.forkProcess.channel?.unref();
    }
    ref() {
        if (!this.forkProcess)
            return;
        this.forkProcess.ref();
        this.forkProcess.channel?.ref();
    }
    destroy() {
        return new Promise((resolve, reject) => {
            if (this.stateMachine.state === 'destroyed') {
                return resolve(undefined);
            }
            if (!this.forkProcess) {
                this.emitter.emit('task:destroyed');
                return resolve(undefined);
            }
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                this.killFork();
                reject(new Error('Destroy operation timed out'));
            }, 5000);
            const onDestroy = () => {
                clearTimeout(timeoutId);
                this.off('task:destroyed', onDestroy);
                resolve(undefined);
            };
            this.once('task:destroyed', onDestroy);
            this.forkProcess.send({
                command: 'task:destroy'
            });
        });
    }
    execute() {
        return new Promise((resolve, reject) => {
            if (!this.forkProcess) {
                return reject(new Error('Cannot execute background task because it hasn\'t been started yet. Please initialize the task using the start() method before attempting to execute it.'));
            }
            const executionId = inlineScheduledTask.createID();
            let timeoutId;
            if (typeof this.options?.executeTimeout === 'number') {
                timeoutId = setTimeout(() => {
                    cleanupListeners();
                    reject(new Error('Execution timeout exceeded'));
                }, this.options.executeTimeout);
            }
            const cleanupListeners = () => {
                if (timeoutId)
                    clearTimeout(timeoutId);
                this.off('execution:finished', onFinished);
                this.off('execution:failed', onFail);
            };
            const onFinished = (context) => {
                if (context.execution?.id !== executionId)
                    return;
                cleanupListeners();
                resolve(context.execution?.result);
            };
            const onFail = (context) => {
                if (context.execution?.id !== executionId)
                    return;
                cleanupListeners();
                reject(context.execution?.error || new Error('Execution failed without specific error'));
            };
            this.on('execution:finished', onFinished);
            this.on('execution:failed', onFail);
            this.forkProcess.send({
                command: 'task:execute',
                executionId
            });
        });
    }
    async handleShouldRun(message) {
        let allowed = false;
        let error;
        try {
            allowed = this.runCoordinator ? await this.runCoordinator.shouldRun(message.key, message.ttlMs) : false;
        }
        catch (err) {
            error = err?.message ?? String(err);
        }
        this.forkProcess?.send({ type: 'coordinator:result', reqId: message.reqId, allowed, error });
    }
    on(event, fun) {
        this.emitter.on(event, fun);
    }
    off(event, fun) {
        this.emitter.off(event, fun);
    }
    once(event, fun) {
        this.emitter.once(event, fun);
    }
    logEvent(event, context) {
        switch (event) {
            case 'execution:missed': {
                const handled = this.emitter.listenerCount('execution:missed') > 0;
                if (!this.suppressMissedWarning && !handled) {
                    this.logger.warn(`missed execution at ${context.date}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
                }
                break;
            }
            case 'execution:overlap':
                if (this.options?.noOverlap) {
                    this.logger.warn('task still running, new execution blocked by overlap prevention!');
                }
                break;
            case 'execution:failed':
                if (context.execution?.error) {
                    this.logger.error(context.execution.error);
                }
                break;
        }
    }
    createContext(executionDate, execution, reason) {
        const localTime = new inlineScheduledTask.LocalizedTime(executionDate, this.options?.timezone);
        const ctx = {
            date: localTime.toDate(),
            dateLocalIso: localTime.toISO(),
            triggeredAt: new Date(),
            task: this,
            execution: execution
        };
        if (reason)
            ctx.reason = reason;
        return ctx;
    }
}
function serializableOptions(options) {
    if (!options)
        return options;
    const { logger: _logger, runCoordinator: _runCoordinator, ...rest } = options;
    return rest;
}
function deserializeError(str) {
    const data = JSON.parse(str);
    const Err = globalThis[data.name] || Error;
    const err = new Err(data.message);
    if (data.stack) {
        err.stack = data.stack;
    }
    Object.keys(data).forEach(key => {
        if (!['name', 'message', 'stack'].includes(key)) {
            err[key] = data[key];
        }
    });
    return err;
}

const moduleFilename = __filename;
const registry = new TaskRegistry();
function schedule(expression, func, options) {
    const task = createTask(expression, func, options);
    let started;
    try {
        started = task.start();
    }
    catch (error) {
        registry.remove(task);
        throw error;
    }
    if (started && typeof started.catch === 'function') {
        started.catch((error) => {
            (options?.logger || inlineScheduledTask.logger).error(`Failed to start scheduled task: ${error?.message ?? error}`);
        });
    }
    return task;
}
function createTask(expression, func, options) {
    parse$1(expression);
    if (options?.distributed && !options.name) {
        throw new Error('`distributed` requires a `name` (it forms the coordination key shared across instances).');
    }
    let task;
    if (func instanceof Function) {
        task = new inlineScheduledTask.InlineScheduledTask(expression, func, options);
    }
    else {
        const taskPath = solvePath(func);
        task = new BackgroundScheduledTask(expression, taskPath, options);
    }
    registry.add(task);
    return task;
}
function solvePath(filePath) {
    if (path.isAbsolute(filePath))
        return url.pathToFileURL(filePath).href;
    if (filePath.startsWith('file://'))
        return filePath;
    const stackLines = new Error().stack?.split('\n');
    if (stackLines) {
        stackLines?.shift();
        const callerLine = stackLines?.find((line) => { return line.indexOf(moduleFilename) === -1; });
        const match = callerLine?.match(/(file:\/\/)?(((\/?)(\w:))?([/\\].+)):\d+:\d+/);
        if (match) {
            const dir = `${match[5] ?? ""}${path.dirname(match[6])}`;
            return url.pathToFileURL(path.resolve(dir, filePath)).href;
        }
    }
    throw new Error(`Could not locate task file ${filePath}`);
}
function validate(expression) {
    try {
        validate$1(expression);
        return true;
    }
    catch (e) {
        return false;
    }
}
const validateDetailed = validateDetailed$1;
const parse = parse$1;
async function shutdown(timeout = 5000) {
    const tasks = registry.all();
    const pending = [];
    for (const task of tasks.values()) {
        const wait = new Promise(resolve => {
            const onSettled = () => {
                task.off('execution:finished', onSettled);
                task.off('execution:failed', onSettled);
                resolve();
            };
            task.once('execution:finished', onSettled);
            task.once('execution:failed', onSettled);
        });
        const busy = task.isBusy();
        Promise.resolve(task.stop()).catch((error) => {
            inlineScheduledTask.logger.error(`Error stopping task "${task.name}" during shutdown: ${error?.message ?? error}`);
        });
        if (busy) {
            pending.push(wait);
        }
    }
    if (pending.length) {
        await Promise.race([
            Promise.allSettled(pending),
            new Promise(r => setTimeout(r, timeout))
        ]);
    }
    for (const task of tasks.values()) {
        Promise.resolve(task.destroy()).catch((error) => {
            inlineScheduledTask.logger.error(`Error destroying task "${task.name}" during shutdown: ${error?.message ?? error}`);
        });
    }
}
const getTasks = registry.all;
const getTask = registry.get;
const nodeCron = {
    schedule,
    createTask,
    validate,
    validateDetailed,
    parse,
    getTasks,
    getTask,
    setLogger: inlineScheduledTask.setLogger,
    setRunCoordinator: inlineScheduledTask.setRunCoordinator,
    shutdown,
};

exports.setLogger = inlineScheduledTask.setLogger;
exports.setRunCoordinator = inlineScheduledTask.setRunCoordinator;
exports.createTask = createTask;
exports.default = nodeCron;
exports.getTask = getTask;
exports.getTasks = getTasks;
exports.nodeCron = nodeCron;
exports.parse = parse;
exports.schedule = schedule;
exports.shutdown = shutdown;
exports.solvePath = solvePath;
exports.validate = validate;
exports.validateDetailed = validateDetailed;
//# sourceMappingURL=node-cron.cjs.map
