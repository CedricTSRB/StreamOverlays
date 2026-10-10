# Goal Overlays – Twitch Overlay Designer

Ein eigenständiger, kostenlos hostbarer Webseiten-Prototyp für Twitch-Overlay-Gestaltung. Keine Base44-Abhängigkeit. Alle Dateien selbst bearbeiten.

## Bereits eingebaut
- Professionelles responsives Dashboard ohne Neon als Standard-Oberfläche
- Sieben verschiedene Overlay-Designs: Neon, Glas, Fill, Sharp, Outline, Transparent, Eigenes Bild
- Live-Vorschau, unabhängige Akzentfarbe, eigener Titel, Bildhintergrund
- Getrennte Abo- und Follower-Ziele mit aufwärts laufenden Zählern
- Test-Buttons für neue Follows und Subs (kein Twitch-Zugriff erforderlich)
- Countdown-Timer (12, 24, 48 oder eigene Stunden), Start/Pause/Reset
- OBS-Browser-Links für einzelne Widgets oder das komplette Overlay
- Lokale Speicherung in deinem Browser ohne Account
- Separates StreamElements-Custom-Widget mit Twitch-Sessionwerten und Follower-/Subscriber-Events unter `streamelements/`

## Wichtige Grenze: Synchronisierung
Die GitHub-Pages-Webseite ist **statisch**. Sie zeigt manuell eingestellte Testwerte. Der Link nach OBS enthält einen **Schnappschuss** der Einstellungen; spätere Dashboard-Änderungen und Counter-Updates in einem anderen Browser synchronisieren sich nicht automatisch. Die lokale Uhr kann im OBS-Overlay per Rechtsklick > Interagieren > Timer Start/Pause/Reset gesteuert werden; die unabhängige Timer-Instanz in deinem normalen Browser wird nicht mitgesteuert.

**Echte Twitch-Follows und Subs** sind über das separate **StreamElements-Custom-Widget** vorgesehen; dafür muss StreamElements mit Twitch verbunden und der Code einmal ins Custom Widget eingefügt werden. Dieses Widget übernimmt seine Zielwerte aus StreamElements-Feldern, nicht aus den GitHub-Pages-Einstellungen. Es ist vorbereitet, aber ohne echten Kanal noch nicht live getestet.

## Webseite kostenlos auf GitHub Pages veröffentlichen
Das Repository heißt [CedricTSRB/StreamOverlays](https://github.com/CedricTSRB/StreamOverlays).
Unter **Settings → Pages → Build and deployment** kann die Veröffentlichung aus dem Branch `main` und dem Ordner `/(root)` aktiviert werden.
Wenn GitHub Pages aktiv ist, ist die übliche URL `https://cedrictsrb.github.io/StreamOverlays/`; im Repository unter **Settings → Pages** steht die tatsächliche Adresse.

## Für mehrere Streamer: eigene Live-Daten ohne gemeinsames Konto
Die Webseite steht jedem Besucher offen, auch Tausenden gleichzeitig. Sie verwaltet aber **keine Twitch-Anmeldungen** und keine Zugangsdaten. Für **echtes Live-Tracking** richtet jeder Streamer sein eigenes StreamElements-Custom-Widget ein und verwendet **seinen eigenen StreamElements-Overlay-Link** in OBS.
Das Widget greift auf die Sessiondaten genau dieses StreamElements-Kanals zu; Daten anderer Nutzer werden nicht vermischt.
Der Webseitenbereich **OBS & Integration → Live-Follower & Abos mit StreamElements** enthält eine Anleitung und vier Kopierbuttons für HTML, CSS, JS und FIELDS.
Wichtig: Die bisherigen **GitHub-OBS-Links für Abo-/Follower-Ziele** bleiben ohne diesen separaten Live-Overlay-Link **statisch**. Es gibt noch kein vollautomatisches Twitch-OAuth-Onboarding innerhalb dieser GitHub-Pages-Seite.
Teile niemals Twitch-, StreamElements-API-Tokens oder private Overlay-URLs öffentlich.

## Live-Verbindung mit StreamElements einrichten
1. Twitch in [StreamElements](https://streamelements.com/) verbinden.
2. Unter **My Overlays** ein Overlay erstellen und ein **Custom Widget** hinzufügen.
3. Widget → **Open Editor**: In der Webseite unter **OBS & Integration → Live-Follower & Abos** die vier Code-Teile über die Kopierbuttons übernehmen; alternativ die Dateien aus `streamelements/` öffnen und in die gleichnamigen Tabs **HTML**, **CSS**, **JS**, **FIELDS** einfügen.
4. Änderungen speichern, im Widget-Editor Ziele und Stil einstellen.
5. Das StreamElements-Overlay in OBS als **Browser-Quelle** einfügen. Dann kommen die Zähler aus der Twitch/StreamElements-Session.
6. Timer in der StreamElements-Widget-Bedienung über die Buttons in den FIELDS starten/pausieren oder zurücksetzen. Er wird über den StreamElements-Store gespeichert.

### Besonderheit von Zielen
Das StreamElements-Widget zählt wahlweise **Sessionwerte** (seit Sessionbeginn) oder **Gesamtzahlen**. Im Widget unter `Werte zählen` auswählen. Zusätzliche Startwerte ermöglichen individuelle Kampagnenziele. Gift Subs und Resubs werden gemäß den von StreamElements gelieferten `subscriber-session`-Zahlen verarbeitet. Prüfe den gewünschten Zählmodus bei deinem Stream.

Technische Referenzen:
- https://docs.streamelements.com/overlays/events
- https://docs.streamelements.com/overlays/session-data
- https://docs.streamelements.com/overlays/custom-widget
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Lokal benutzen
`index.html` per Doppelklick im Browser öffnen. Für verlässlich nutzbare OBS-Links bitte erst auf GitHub Pages veröffentlichen.
