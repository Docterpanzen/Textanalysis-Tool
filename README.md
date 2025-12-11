# Textanalyse

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Inhaltsverzeichnis

- [Textanalyse](#textanalyse)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Kurzbeschreibung](#kurzbeschreibung)
  - [Frontend Abhängigkeiten installieren und starten](#frontend-abhängigkeiten-installieren-und-starten)
    - [Node.Js installieren](#nodejs-installieren)
    - [Angular Cli installieren](#angular-cli-installieren)
    - [Projektabhängigkeiten Installieren](#projektabhängigkeiten-installieren)
    - [Projekt starten (frontend)](#projekt-starten-frontend)
  - [Backend Abhängigkeiten installieren und starten](#backend-abhängigkeiten-installieren-und-starten)
    - [1. Wechsle den Ordner zu backend](#1-wechsle-den-ordner-zu-backend)
    - [2. installiere Projektabhängigkeiten über den PDM-Packetmanager](#2-installiere-projektabhängigkeiten-über-den-pdm-packetmanager)
    - [3. Service starten](#3-service-starten)
  - [API-Spezifikation](#api-spezifikation)
    - [1. Texte-API](#1-texte-api)
    - [2. Analyse über Datenbank-IDs](#2-analyse-über-datenbank-ids)
  - [Datenbank](#datenbank)
    - [Tabelle `texts`](#tabelle-texts)
    - [Tabelle `analysis_runs`](#tabelle-analysis_runs)
    - [Tabelle `analysis_run_texts`](#tabelle-analysis_run_texts)
    - [Tabelle `clusters`](#tabelle-clusters)
    - [Tabelle `cluster_assignments`](#tabelle-cluster_assignments)
    - [Wie die Tabellen zusammenhängen](#wie-die-tabellen-zusammenhängen)
  - [Fragen und Anregungen](#fragen-und-anregungen)

## Kurzbeschreibung

This Project is for the course Datenbasierte Methoden und Softwaredesign und kombiniert hierbei die Methoden von Datenbasierte Methoden und die Softwarestruktur und Arbeitsweise von Softwaredesign. Mehr dazu in der Angular App unter dem Reiter Dokumentation.

Wie man die Angular App startet und alle zugehärigen Sachen runterlädt sind in folgendem beschrieben.

## Frontend Abhängigkeiten installieren und starten

### Node.Js installieren

Lade Node.Js herunter was die Laufzeitumgebung von JavaScript ist. Dies ist notwendig, damit man JavaScript und die ganze Angular App compilieren und auch außerhalb von der Webapp starten kann. [NodeJs](https://nodejs.org/) kann hier runtergeladen werden oder direkt in Windows PowerShell runtergeladen werden. Es geht hierbei auch similar mit Linux oder allen Unix-basierten Systemen, die Skripte müssen allerdings direkt auf der OpenJs oder NodeJs Seite nachgeschaut werden.

PowerShell Skript:

```bash
winget install OpenJS.NodeJS.LTS
```

Prüfen:

```bash
node -v
npm -v
```

### Angular Cli installieren

```bash
npm install -g @angular/cli
```

Prüfen:

```bash
ng version
```

### Projektabhängigkeiten Installieren

```bash
npm install

npm i
```

### Projekt starten (frontend)

Entweder durch das Vorgefertigte NPM-Skript im Projekt welches in dem package.json liegt oder durch den Angular-Befehl

```bash
ng serve
ng serve -o (startet direkt die Webapp in einem Webbrowser)
```

sobald der Server läuft, öffne den Browser und navigiere zu `http://localhost:4200/`. Die Anwendung wird automatisch ne geladen, solbald Sie eine der Dateien des source-codes ändern.

## Backend Abhängigkeiten installieren und starten

### 1. Wechsle den Ordner zu backend

```bash
cd backend
```

### 2. installiere Projektabhängigkeiten über den PDM-Packetmanager

```bash
pdm install
```

### 3. Service starten

```bash
pdm run uvicorn textanalyse_backend.main:app --reload --port 8000
```

oder über das automatische Script im backend-Ordner, welches in der pyproject.toml gespeichert ist:

```bash
pdm run api
```

Pyproject.toml:

```pyproject.toml
[tool.pdm.scripts]
test = {cmd = "pdm run pytest"}
api = {cmd = "pdm run uvicorn textanalyse_backend.main:app --reload --port 8000"}
```

Backend läuft unter folgendem Port

```bash
http://localhost:8000
```

## API-Spezifikation

### 1. Texte-API

`POST /texts` – neuen Text speichern in dem Upload Tab

Request-Body (JSON):

```json
{
  "name": "beispiel.txt",
  "content": "Vollständiger Textinhalt ..."
}
```

Response (`201 Created`):

```json
{
  "id": 1,
  "name": "beispiel.txt",
  "content": "Vollständiger Textinhalt ...",
  "created_at": "2025-12-09T20:30:00"
}
```

`GET /texts` – Liste aller Texte

Optional mit Query-Parametern:

- `limit` (Standard 50)
- `offset` (Standard 0)
- `search` (Filter nach Name oder Inhalt)

Beispiel:

```text
GET /texts?limit=20&offset=0&search=schule
```

Response (`200 OK`):

```json
[
  {
    "id": 1,
    "name": "beispiel.txt",
    "content": "...",
    "created_at": "2025-12-09T20:30:00"
  },
  {
    "id": 2,
    "name": "bericht.txt",
    "content": "...",
    "created_at": "2025-12-09T20:35:00"
  }
]
```

`GET /texts/{id}` – einzelnen Text laden

Beispiel:

```text
GET /texts/1
```

Response (`200 OK`):

```json
{
  "id": 1,
  "name": "beispiel.txt",
  "content": "Vollständiger Textinhalt ...",
  "created_at": "2025-12-09T20:30:00"
}
```

---

### 2. Analyse über Datenbank-IDs

**POST** `/analyze/byIds`

Frontend-Nutzung: wird von der Seite **Textanalyse** verwendet. Hier wählt der Nutzer gespeicherte Texte aus der DB aus; es werden nur die IDs übertragen.

Request:

```json
{
  "text_ids": [1, 2, 6],
  "options": {
    "vectorizer": "tfidf",
    "maxFeatures": 5000,
    "numClusters": 3,
    "useDimReduction": true,
    "numComponents": 100,
    "useStopwords": true,
    "stopwordMode": "de_en"
  }
}
```

Response (`200 OK`):

```json
{
  "clusters": [
    {
      "id": 0,
      "documentNames": ["test1.txt", "test3.txt"],
      "topTerms": ["analyse", "daten", "modell"],
      "wordCloudPng": "<base64-png>"
    },
    {
      "id": 1,
      "documentNames": ["test2.txt"],
      "topTerms": ["schule", "lernen", "projekt"],
      "wordCloudPng": "<base64-png>"
    }
  ],
  "vocabularySize": 542
}
```

Die Struktur der `options` entspricht exakt dem Interface `TextAnalysisOptions` im Frontend (`vectorizer`, `maxFeatures`, `numClusters`, `useDimReduction`, `numComponents`, `useStopwords`, `stopwordMode`).

---

## Datenbank

Die Anwendung nutzt **SQLite** als eingebettete, dateibasierte Datenbank. Die Datei wird automatisch erzeugt, sobald das Backend startet – es ist kein separater DB-Server notwendig.

Alle Tabellen im aktuellen Schema im Überblick:

### Tabelle `texts`

Enthält jeden hochgeladenen Text.

| Spalte       | Typ        | Beschreibung                       |
| ------------ | ---------- | ---------------------------------- |
| `id`         | INTEGER PK | Primärschlüssel                    |
| `name`       | TEXT       | Anzeigename / Dateiname des Textes |
| `content`    | TEXT       | Vollständiger Textinhalt           |
| `created_at` | DATETIME   | Zeitpunkt des Uploads              |

---

### Tabelle `analysis_runs`

Speichert eine Analyse-Konfiguration und die globalen Metadaten eines Durchlaufs.

| Spalte              | Typ        | Beschreibung                                  |
| ------------------- | ---------- | --------------------------------------------- |
| `id`                | INTEGER PK | Primärschlüssel                               |
| `created_at`        | DATETIME   | Zeitpunkt der Analyse                         |
| `vectorizer`        | TEXT       | Art der Vektorisierung (`bow`, `tf`, `tfidf`) |
| `num_clusters`      | INTEGER    | Anzahl der Cluster (k)                        |
| `use_dim_reduction` | BOOLEAN    | Ob Dimensionsreduktion verwendet wurde        |
| `num_components`    | INTEGER    | Ziel-Dimensionen bei SVD                      |
| `language`          | TEXT       | Sprache / Stopword-Mode (z. B. `de`, `en`)    |
| `description`       | TEXT       | Freitext-Beschreibung (optional)              |

---

### Tabelle `analysis_run_texts`

Verknüpft eine Analyse mit den beteiligten Texten (m:n-Beziehung).

| Spalte            | Typ        | Beschreibung                   |
| ----------------- | ---------- | ------------------------------ |
| `id`              | INTEGER PK | Primärschlüssel                |
| `analysis_run_id` | INTEGER FK | Verweis auf `analysis_runs.id` |
| `text_id`         | INTEGER FK | Verweis auf `texts.id`         |

---

### Tabelle `clusters`

Speichert die Cluster eines Analyse-Durchlaufs.

| Spalte            | Typ        | Beschreibung                              |
| ----------------- | ---------- | ----------------------------------------- |
| `id`              | INTEGER PK | Primärschlüssel                           |
| `analysis_run_id` | INTEGER FK | Zugehörige Analyse (`analysis_runs.id`)   |
| `cluster_index`   | INTEGER    | Laufende Nummer des Clusters (0..k-1)     |
| `top_terms`       | TEXT       | Wichtige Wörter des Clusters (als String) |
| `size`            | INTEGER    | Anzahl der zugeordneten Texte             |

---

### Tabelle `cluster_assignments`

Enthält die Zuordnung "Text gehört zu Cluster X".

| Spalte       | Typ        | Beschreibung              |
| ------------ | ---------- | ------------------------- |
| `id`         | INTEGER PK | Primärschlüssel           |
| `cluster_id` | INTEGER FK | Verweis auf `clusters.id` |
| `text_id`    | INTEGER FK | Verweis auf `texts.id`    |

---

### Wie die Tabellen zusammenhängen

1. **`texts`** enthält die Rohtexte.
2. Ein Analyse-Lauf wird in **`analysis_runs`** angelegt.
3. Die Zuordnung "welche Texte wurden analysiert" steht in **`analysis_run_texts`**.
4. Die bei der Analyse gefundenen Cluster liegen in **`clusters`**.
5. Welche Texte in welchem Cluster gelandet sind, steht in **`cluster_assignments`**.

Damit lassen sich Analysen später reproduzieren, vergleichen und im Dashboard statistisch auswerten.

---

## Fragen und Anregungen

Bei Fragen, Anregungen, Kritik, usw. meldet euch gerne bei einem von unseren Developern:

[Oskar Klöpfer](http://github.com/Docterpanzen)

[Can Kal](http://github.com/BaeroBaer)
