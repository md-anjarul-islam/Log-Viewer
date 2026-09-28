# Testing without hardware

You don't need a real serial device to try out or develop the app — it ships
with a built-in simulator that behaves like a connected device, on both the
main (command/response) and debug (free-running log) connections.

1. `npm run dev`
2. Open Connection Settings (for the main connection, the debug connection,
   or both — they're independent and both support this).
3. In the **Port** dropdown, pick **`__simulated__` (Log Viewer Simulator)**.
   Baud rate and delimiter can be left at their defaults; they're accepted
   but don't affect the simulator's behavior other than delimiter framing.
4. Click **Connect**.

## Debug logs

As soon as the debug connection is open, the simulator starts free-running a
plausible firmware debug log on its own — no command needed, since a real
debug UART pushes output unprompted. You'll see:

- A boot banner (bootloader, firmware version, subsystem init, Wi-Fi
  association, ready) right after connecting.
- A steady trickle of `DEBUG`/`INFO`/`WARN`/`ERROR` lines across a few
  subsystems (`wifi`, `ble`, `sensors`, `power`, `flash`, `app`) with
  realistic, slightly varying values — good for exercising filtering,
  search, and level-based formatting.
- Occasional multi-line error bursts (an I2C timeout with retries, a Wi-Fi
  drop-and-reconnect).
- A rare simulated watchdog reset that replays the full boot sequence and
  resets the log's uptime counter, so you can see the app handle a device
  "coming back" mid-session.

This is implemented in `src/main/serial/simulation/debugLogGenerator.ts`.

## Command logs

To try the command flow, add or run an existing command ("Run Now"). The
simulator recognizes a handful of common commands (case-insensitive) and
replies the way a real device would, including JSON payloads and multi-line
responses:

| Command                    | Response                                    |
| --------------------------- | -------------------------------------------- |
| `PING`                      | `PONG`                                       |
| `STATUS`                    | JSON status blob (uptime, battery, rssi, …) |
| `VERSION`                   | firmware version string                      |
| `WHOAMI`                    | device id + serial number                    |
| `SENSORS`                   | JSON sensor reading                          |
| `LOG LEVEL <level>`         | ack setting the level                        |
| `REBOOT`                    | `Rebooting...` then `OK`, after a longer delay |
| `CRASH`                     | a multi-line hard-fault dump                 |
| `HELP`                      | the list of supported commands               |

Any other command falls back to looping the exact bytes you sent back as a
received line — enough to confirm the write and read paths round-trip
correctly for custom test commands. Responses also have a small random
chance of coming back as a generic error, arriving late, or not arriving at
all, to exercise error handling and the run-correlation window rather than
only the happy path. This is implemented in
`src/main/serial/simulation/commandResponses.ts`.

No extra software (no virtual serial port drivers, no `socat`) is required —
the simulated device is implemented directly in the app
(`src/main/serial/SimulatedSerialPort.ts` and `src/main/serial/simulation/`)
and is always available in the port list, on any OS.
