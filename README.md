# Textanalyse

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Inhaltsverzeichnis

- [Textanalyse](#textanalyse)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Kurzbeschreibung](#kurzbeschreibung)
  - [Herunterladen relevanter Sachen](#herunterladen-relevanter-sachen)
    - [Node.Js installieren](#nodejs-installieren)
    - [Angular Cli installieren](#angular-cli-installieren)
    - [Projektabhängigkeiten Installieren](#projektabhängigkeiten-installieren)
    - [Projekt starten](#projekt-starten)
  - [Fragen und Anregungen](#fragen-und-anregungen)

## Kurzbeschreibung

This Project is for the course Datenbasierte Methoden und Softwaredesign und kombiniert hierbei die Methoden von Datenbasierte Methoden und die Softwarestruktur und Arbeitsweise von Softwaredesign. Mehr dazu in der Angular App unter dem Reiter Dokumentation.

Wie man die Angular App startet und alle zugehärigen Sachen runterlädt sind in folgendem beschrieben.

## Herunterladen relevanter Sachen

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

### Projekt starten

Entweder durch das Vorgefertigte NPM-Skript im Projekt welches in dem package.json liegt oder durch den Angular-Befehl

```bash
ng serve
ng serve -o (startet direkt die Webapp in einem Webbrowser)
```

sobald der Server läuft, öffne den Browser und navigiere zu `http://localhost:4200/`. Die Anwendung wird automatisch ne geladen, solbald Sie eine der Dateien des source-codes ändern.

## Fragen und Anregungen

Bei Fragen, Anregungen, Kritik, usw. meldet euch gerne bei einem von unseren Developern:

[Oskar Klöpfer](http://github.com/Docterpanzen)

[Can Kal](http://github.com/BaeroBaer)
