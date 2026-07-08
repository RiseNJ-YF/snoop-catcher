SNOOP CATCHER — DESKTOP APP (Electron)
======================================

One-time setup: install Node.js from https://nodejs.org (the "LTS" button).

Then open a terminal / command prompt IN THIS FOLDER and run:

  1) npm install        (downloads Electron — a few minutes, one time)
  2) npm start          (launches the app)

To create a real installer with the app icon:

  3) npm run dist       (installer/app lands in the new "dist" folder)
        - Windows -> Snoop Catcher Setup .exe
        - Mac     -> a .dmg
        - Linux   -> an .AppImage
     (You get the installer for whatever computer you run this on.)

HOW IT BEHAVES
--------------
- It's the same Snoop Catcher you tuned — enroll your face, set a trigger zone,
  pick Range/Precision, adjust the sliders. Your settings are remembered.
- Camera permission is granted automatically inside the app.
- Closing the window does NOT quit it — it keeps running in the system tray
  (near the clock). Right-click the tray icon for Show / Start at login / Quit.
- "Start at login" makes it launch with your computer = always-on.
- When it catches someone, the window jumps to the front so you see the face.

NOTES
-----
- First run needs internet once (it downloads the face-detection models).
- Everything runs locally; no images or video ever leave your computer.
