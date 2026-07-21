interface LogPayload {
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, event: string, payload: LogPayload = {}) {
  const line = {
    level,
    event,
    ts: new Date().toISOString(),
    ...payload,
  };

  const serialized = JSON.stringify(line);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const appLogger = {
  info(event: string, payload?: LogPayload) {
    write('info', event, payload);
  },
  warn(event: string, payload?: LogPayload) {
    write('warn', event, payload);
  },
  error(event: string, payload?: LogPayload) {
    write('error', event, payload);
  },
};
