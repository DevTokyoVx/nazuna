'use strict';

var url = require('url');
var inlineScheduledTask = require('./_shared.cjs');
require('events');
require('node:crypto');

const DEFAULT_REPLY_TIMEOUT_MS = 5000;
class IpcRunCoordinator {
    channel;
    replyTimeoutMs;
    pending = new Map();
    constructor(channel, replyTimeoutMs = DEFAULT_REPLY_TIMEOUT_MS) {
        this.channel = channel;
        this.replyTimeoutMs = replyTimeoutMs;
        this.channel.on('message', (message) => {
            if (message?.type !== 'coordinator:result')
                return;
            const resolve = this.pending.get(message.reqId);
            if (resolve) {
                this.pending.delete(message.reqId);
                resolve(message);
            }
        });
    }
    shouldRun(key, ttlMs) {
        const reqId = inlineScheduledTask.createID();
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pending.delete(reqId);
                reject(new Error(`Run coordinator reply timed out after ${this.replyTimeoutMs}ms`));
            }, this.replyTimeoutMs);
            this.pending.set(reqId, (result) => {
                clearTimeout(timeoutId);
                if (result.error)
                    reject(new Error(result.error));
                else
                    resolve(result.allowed);
            });
            this.channel.send?.({ type: 'coordinator:shouldRun', key, ttlMs, reqId });
        });
    }
    onComplete(key) {
        this.channel.send?.({ type: 'coordinator:complete', key });
        return Promise.resolve();
    }
}

async function startDaemon(message) {
    const script = await importTaskModule(message.path);
    const options = { ...(message.options || {}), logger: inlineScheduledTask.noopLogger };
    if (options.distributed) {
        options.runCoordinator = new IpcRunCoordinator(process);
    }
    const task = new inlineScheduledTask.InlineScheduledTask(message.cron, script.task, options);
    task.on('task:started', (context => sendEvent('task:started', context)));
    task.on('task:stopped', (context => sendEvent('task:stopped', context)));
    task.on('task:destroyed', (context => sendEvent('task:destroyed', context)));
    task.on('execution:started', (context => sendEvent('execution:started', context)));
    task.on('execution:finished', (context => sendEvent('execution:finished', context)));
    task.on('execution:failed', (context => sendEvent('execution:failed', context)));
    task.on('execution:missed', (context => sendEvent('execution:missed', context)));
    task.on('execution:overlap', (context => sendEvent('execution:overlap', context)));
    task.on('execution:maxReached', (context => sendEvent('execution:maxReached', context)));
    task.on('execution:skipped', (context => sendEvent('execution:skipped', context)));
    if (process.send)
        process.send({ event: 'daemon:started' });
    task.start();
    return task;
}
async function importTaskModule(path) {
    try {
        return await import(path);
    }
    catch (firstError) {
        try {
            return await import(url.fileURLToPath(path));
        }
        catch {
            throw firstError;
        }
    }
}
function sendEvent(event, context) {
    const message = { event: event, context: safelySerializeContext(context) };
    if (context.execution?.error) {
        message.jsonError = serializeError(context.execution?.error);
    }
    if (process.send)
        process.send(message);
}
function serializeError(err) {
    const plain = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...Object.getOwnPropertyNames(err)
            .filter(k => !['name', 'message', 'stack'].includes(k))
            .reduce((acc, k) => {
            acc[k] = err[k];
            return acc;
        }, {})
    };
    return JSON.stringify(plain);
}
function safelySerializeContext(context) {
    const safeContext = {
        date: context.date,
        dateLocalIso: context.dateLocalIso,
        triggeredAt: context.triggeredAt
    };
    if (context.reason) {
        safeContext.reason = context.reason;
    }
    if (context.task) {
        safeContext.task = {
            id: context.task.id,
            name: context.task.name,
            state: context.task.getStatus()
        };
    }
    if (context.execution) {
        safeContext.execution = {
            id: context.execution.id,
            reason: context.execution.reason,
            startedAt: context.execution.startedAt,
            finishedAt: context.execution.finishedAt,
            hasError: !!context.execution.error,
            result: context.execution.result
        };
    }
    return safeContext;
}
function bind() {
    let task;
    process.on('message', async (message) => {
        switch (message.command) {
            case 'task:start':
                try {
                    task = await startDaemon(message);
                }
                catch (error) {
                    if (process.send)
                        process.send({ event: 'daemon:error', jsonError: serializeError(error) });
                }
                return task;
            case 'task:stop':
                if (task)
                    task.stop();
                return task;
            case 'task:destroy':
                if (task)
                    task.destroy();
                return task;
            case 'task:execute':
                if (!task) {
                    sendEvent('execution:failed', {
                        date: new Date(),
                        dateLocalIso: new Date().toISOString(),
                        triggeredAt: new Date(),
                        execution: { id: message.executionId ?? inlineScheduledTask.createID(), reason: 'invoked', error: new Error('Cannot execute: no task loaded') }
                    });
                    return task;
                }
                try {
                    await task.execute(message.executionId);
                }
                catch (error) {
                    inlineScheduledTask.logger.debug('Daemon task:execute failed:', error);
                }
                return task;
        }
    });
    process.on('disconnect', () => process.exit(0));
}
bind();

exports.bind = bind;
exports.startDaemon = startDaemon;
//# sourceMappingURL=daemon.cjs.map
