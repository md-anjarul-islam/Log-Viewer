export const IPC = {
  APP_GET_VERSION: 'app:getVersion',

  COMMANDS_LIST: 'commands:list',
  COMMANDS_CREATE: 'commands:create',
  COMMANDS_UPDATE: 'commands:update',
  COMMANDS_DELETE: 'commands:delete',
  COMMANDS_CHANGED: 'commands:changed',
  COMMANDS_RUN_NOW: 'commands:runNow',

  SERIAL_LIST_PORTS: 'serial:listPorts',
  SERIAL_CONNECT: 'serial:connect',
  SERIAL_DISCONNECT: 'serial:disconnect',
  SERIAL_STATUS: 'serial:status',
  SERIAL_LINE: 'serial:line'
} as const
