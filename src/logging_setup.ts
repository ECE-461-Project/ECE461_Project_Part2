import {createLogger, transports, Logger} from 'winston';

declare global {
  // eslint-disable-next-line no-var
  var logger: Logger;
}

function get_log_file(): string {
  const filename = process.env.LOG_FILE;
  if (filename !== undefined) {
    return filename;
  }
  throw new Error('LOG_FILE is not defined');
}

function get_level(): string {
  const level = process.env.LOG_LEVEL;
  if (level !== undefined) {
    const level_num = Number(level);
    if (level_num === 0) {
      return 'silent';
    }
    if (level_num === 1) {
      return 'info';
    }
    if (level_num === 2) {
      return 'debug';
    }
  }
  throw new Error('LOG_LEVEL is not defined');
}

export function create_logger() {
  const level = get_level();
  if (level === 'silent') {
    globalThis.logger = createLogger({
      transports: [],
      level: 'error',
      silent: true,
    });
  } else {
    globalThis.logger = createLogger({
      transports: [new transports.File({filename: get_log_file()})],
      level: level,
    });
  }
}
