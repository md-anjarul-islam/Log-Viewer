Objective: Build a hardware's log viewer application

Description: A log viewer application that communicates with the hardware via serial protocol. The application will allow user to run the commands from it's GUI that will directly go to the hardware via serial protocol. and will receive the response (log) and stream the logs in the GUI.

To make it more user friendly, the application will allow user to create commands which will have these properties
- command name (a string)
- actual command (a string)
- enabled/disabled (boolean)
- a schedule interval time to run (if user wants to run that automatically/periodically.)

Besides running automaticallly, user may want to run a command instantly.

All the logs will be collected and streamed to the GUI. The logs can be filtered by commands, timestamp etc.


Tech stack:

Option A: Browser based GUI with a NodeJS server. This requires
- a nodejs server (express/next)
- a front-end site (React possibly)
- a database (sqlite recommended)
- scheduler (setinterval or cron). setinterval is enough

Option B: Desktop application by ElectronJS. This requires
- An electron based app
not that much idea

Features required:
1. Command management
    - Create command (name, command, schedule, enable/disable)
    - Update/Delete command

2. View logs
    - View all logs (streamed)
    - Filter logs (by command, timestamp)
    - Clear logs (All, Older than X days)
    - Log formatter (text, json)

UX requirement:
- The logs must be nicely presented (consider beautiful formatting)
- Show streamed logs nicely (No UI jumping, will be smooth auto scrolling)
- Responsive design (consider desktop screen)
