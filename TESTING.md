# Testing without hardware

You don't need a real serial device to try out or develop the app — it ships
with a built-in simulator that behaves like a connected device.

1. `npm run dev`
2. Open Connection Settings (for the main connection, or the debug
   connection — both support this).
3. In the **Port** dropdown, pick **`__simulated__` (Log Viewer Simulator)**.
   Baud rate and delimiter can be left at their defaults; they're accepted
   but don't affect the simulator's behavior other than delimiter framing.
4. Click **Connect** — the simulator sits idle until you send something.
5. To try the command flow, add or run an existing command ("Run Now"). The
   simulator echoes the exact bytes you sent back shortly after, which the
   app correlates to that command run just like it would a real response —
   a quick way to confirm the write and read paths both work end to end.

No extra software (no virtual serial port drivers, no `socat`) is required —
the simulated device is implemented directly in the app
(`src/main/serial/SimulatedSerialPort.ts`) and is always available in the
port list, on any OS.
