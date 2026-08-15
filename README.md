# AIcrochetmaster

PWA, die einen YouTube-Häkel-Link (einfügen oder Android-Share) in eine lückenlose Schriftanleitung verwandelt. Mit KI-Headerbild, Motiv- und Hilfekarten, Werkstatt, optionalem Reihenzähler und Materialliste.

Der OpenAI-Key kommt aus der `.env` (`OPENAI_API_KEY`) und gilt für den Container.
In der App unter **Mehr** ist er nur noch optional, falls ein anderer Key genutzt werden soll.

Anleitungen, Fortschritt und Werkstatt liegen im Container (`DATA_DIR`, Docker-Volume `crochet-data`). Nach dem Login sieht jedes Gerät dieselbe Bibliothek. Offline bleibt eine lokale Kopie.

## Zugangsschutz

Hinter einem Reverse-Proxy ist die App sonst öffentlich. Setze in einer `.env` neben der `docker-compose.yml` ein Passwort **oder** eine PIN:

```bash
cp .env.example .env
```

```env
APP_PASSWORD=bitte-aendern
# oder
# APP_PIN=1234

OPENAI_API_KEY=sk-...
```

Ohne gesetztes Geheimnis bleibt Production gesperrt (nur Login-Hinweis). Lokal (`npm run dev`) läuft die App ohne Passwort weiter. Abmelden geht unter **Mehr**.

## Lokal entwickeln

```bash
npm install
npm run dev
```

App: [http://localhost:3010](http://localhost:3010)

`OPENAI_API_KEY` in der `.env` eintragen. Default-Modell: `gpt-4o`, Bild: `gpt-image-1`.
Einen abweichenden Key kannst du optional unter **Mehr** setzen.

## Docker

Lokal bauen und starten:

```bash
docker compose up --build
```

Image von GHCR ziehen (nach dem ersten Push auf `main`):

```bash
docker pull ghcr.io/rolfwalker71-commits/aicrochetmaster:latest
docker compose up
```

Die Bibliothek bleibt im Volume `crochet-data` erhalten, auch wenn das Image neu gezogen wird.

Oder ohne Compose:

```bash
docker run --rm -p 3010:3010 ghcr.io/rolfwalker71-commits/aicrochetmaster:latest
```

Das Image wird bei jedem Push auf `main` und bei Tags `v*` nach [ghcr.io/rolfwalker71-commits/aicrochetmaster](https://github.com/rolfwalker71-commits/AIcrochetmaster/pkgs/container/aicrochetmaster) veröffentlicht.

Falls das Paket privat ist:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Im GitHub-Repo unter **Packages** das Image auf Public stellen, wenn andere ohne Login pullen sollen.

## PWA / Share Sheet

Im Android-Chrome die Seite installieren. Danach erscheint **Häkelmeister** im Teilen-Menü. Die App filtert nicht nur YouTube-Links — ungültige Texte werden in der App abgewiesen.
