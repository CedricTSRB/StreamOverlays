TSRB MultiChat fuer OBS (Windows)
================================

Diese Version ist eine OBS-Browser-Dock-Erweiterung, KEIN natives C++ OBS-Plugin.
Sie benoetigt kein Electron und installiert keinen Hintergrunddienst systemweit.

1. ZIP vollstaendig in einen Ordner entpacken (nicht direkt aus dem ZIP starten).
2. Start-MultiChat-OBS.cmd doppelklicken.
3. OBS Studio oeffnen -> Docks -> Benutzerdefinierte Browser-Docks
   (je nach Sprache "Custom Browser Docks").
4. Dock-Name: TSRB MultiChat
   URL: Strg+V (der Launcher kopiert sie automatisch).
5. Nun erscheint MultiChat als andockbare Seitenleiste in OBS.
6. Dort Twitch, TikTok, Kick, YouTube mit jeweils oeffentlichem LIVE-Kanal verbinden.
7. Optional fuer den Stream: Browser-Quelle hinzufuegen, URL aus OBS-OVERLAY-LINK.txt verwenden.
8. Stop-MultiChat-OBS.cmd stoppt den lokalen Chat-Dienst.

Hinweise:
- Facebook/Instagram: KEIN echter Chatimport, da hier keine Integration vorhanden ist.
- Die vier Live-Verbindungen verwenden inoffizielle/oefentliche Schnittstellen; Plattform-Aenderungen
  oder Offline-Streams koennen Verbindungen verhindern.
- Die Erweiterung lauscht ausschliesslich auf 127.0.0.1 und verwendet ein geheimes lokales Token.
- URL/Token nicht oeffentlich teilen. Keine Twitch/TikTok-Passwoerter eingeben.
- Falls OBS meldet, dass Browser-Docks nicht verfuegbar sind: OBS Studio mit Browser-Komponente installieren.
- Diese Fassung muss per Start-MultiChat-OBS.cmd gestartet werden; OBS startet den Dienst noch nicht selbst.
