export const IPC = {
  APP_GET_VERSION: 'app:getVersion',

  COMMANDS_LIST: 'commands:list',
  COMMANDS_CREATE: 'commands:create',
  COMMANDS_UPDATE: 'commands:update',
  COMMANDS_DELETE: 'commands:delete',
  COMMANDS_CHANGED: 'commands:changed',
  COMMANDS_RUN_NOW: 'commands:runNow',
  COMMANDS_EXPORT: 'commands:export',
  COMMANDS_IMPORT: 'commands:import',

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

  // Debug connection: a second, independent serial link to the same
  // hardware (e.g. a dedicated debug/logging UART). Port enumeration is
  // shared with the main connection (SERIAL_LIST_PORTS) since it's a
  // property of the host, not of either connection.
  SERIAL_DEBUG_CONNECT: 'serial:debug:connect',
  SERIAL_DEBUG_DISCONNECT: 'serial:debug:disconnect',
  SERIAL_DEBUG_STATUS: 'serial:debug:status',
  SERIAL_DEBUG_GET_STATUS: 'serial:debug:getStatus',
  SERIAL_DEBUG_GET_AUTO_RECONNECT: 'serial:debug:getAutoReconnect',
  SERIAL_DEBUG_SET_AUTO_RECONNECT: 'serial:debug:setAutoReconnect',

  LOGS_STREAM: 'logs:stream',
  LOGS_QUERY: 'logs:query',
  LOGS_EXPORT: 'logs:export',
  LOGS_CLEAR_ALL: 'logs:clearAll',
  LOGS_CLEAR_OLDER_THAN: 'logs:clearOlderThan',
  LOGS_CLEARED: 'logs:cleared',

  DEBUG_LOGS_STREAM: 'debugLogs:stream',
  DEBUG_LOGS_QUERY: 'debugLogs:query',
  DEBUG_LOGS_CLEAR_ALL: 'debugLogs:clearAll',
  DEBUG_LOGS_CLEAR_OLDER_THAN: 'debugLogs:clearOlderThan',
  DEBUG_LOGS_CLEARED: 'debugLogs:cleared'
} as const
