export const IPC = {
  APP_GET_VERSION: 'app:getVersion',

  COMMANDS_LIST: 'commands:list',
  COMMANDS_CREATE: 'commands:create',
  COMMANDS_UPDATE: 'commands:update',
  COMMANDS_DELETE: 'commands:delete',
  COMMANDS_CHANGED: 'commands:changed',
  COMMANDS_RUN_NOW: 'commands:runNow',

  CATEGORIES_LIST: 'categories:list',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  CATEGORIES_CHANGED: 'categories:changed',

  SERIAL_LIST_PORTS: 'serial:listPorts',
  SERIAL_CONNECT: 'serial:connect',
  SERIAL_DISCONNECT: 'serial:disconnect',
  SERIAL_STATUS: 'serial:status',
  SERIAL_GET_STATUS: 'serial:getStatus',
  SERIAL_GET_AUTO_RECONNECT: 'serial:getAutoReconnect',
  SERIAL_SET_AUTO_RECONNECT: 'serial:setAutoReconnect',

  LOGS_STREAM: 'logs:stream',
  LOGS_QUERY: 'logs:query',
  LOGS_EXPORT: 'logs:export',
  LOGS_CLEAR_ALL: 'logs:clearAll',
  LOGS_CLEAR_OLDER_THAN: 'logs:clearOlderThan',
  LOGS_CLEARED: 'logs:cleared'
} as const
