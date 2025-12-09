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
    - [4. API-Verbindung](#4-api-verbindung)
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

Backend läuft unter folgendem Port

```bash
http://localhost:8000
```

### 4. API-Verbindung

Die API ruft anschließend folgende Route im Backend auf:

```bash
POST http://localhost:8000/analyze
```

```bash
{
  "documents": [
    { "name": "doc1.txt", "content": "..." },
    { "name": "doc2.txt", "content": "..." }
  ],
  "options": {
    "vectorizer": "tfidf",
    "maxFeatures": 5000,
    "numClusters": 5,
    "useDimReduction": true,
    "numComponents": 100
  }
}
```

Die Antwort lautet dann:

```bash
{
  "clusters": [
    {
      "id": 0,
      "documentNames": ["doc1.txt"],
      "topTerms": ["...", "..."]
    }
  ],
  "vocabularySize": 1234
}
```

## Fragen und Anregungen

Bei Fragen, Anregungen, Kritik, usw. meldet euch gerne bei einem von unseren Developern:

[Oskar Klöpfer](http://github.com/Docterpanzen)

[Can Kal](http://github.com/BaeroBaer)
