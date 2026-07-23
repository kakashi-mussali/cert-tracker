# Cert Tracker

Application de suivi des certificats (dates d'expiration, alertes automatiques)
pour vos applications. Conçue pour un déploiement Vercel en quelques minutes,
sans script de migration à lancer.

## Fonctionnalités

- Tableau de bord avec statut par certificat : **Valide / À surveiller / Urgent / Expiré**
- Seuil d'alerte configurable **par certificat** (nombre de jours avant expiration)
- Vérification automatique quotidienne (tâche cron Vercel)
- Alerte email optionnelle via [Resend](https://resend.com) — l'app fonctionne
  très bien sans, les alertes apparaissent simplement dans le dashboard
- Base de données Postgres auto-initialisée : **aucune commande de migration**
  à exécuter, la table se crée toute seule au premier appel

## Déploiement (5 minutes, aucun code à toucher)

### 1. Déployer le projet

Le plus simple, sans même passer par GitHub :

```bash
npm install -g vercel
cd cert-tracker
vercel
```

Répondez aux quelques questions (nom du projet, dossier…), c'est tout.
Vous pouvez aussi pousser ce dossier sur un repo GitHub puis faire
**Import Project** depuis le dashboard Vercel — les deux fonctionnent.

### 2. Ajouter une base Postgres (2 clics)

Dans le dashboard Vercel → votre projet → onglet **Storage** →
**Create Database** → choisissez **Postgres** (Neon) → **Connect**.

Vercel injecte automatiquement `DATABASE_URL` (et les variantes `POSTGRES_URL*`).
Rien à configurer côté code : `lib/db.ts` les lit automatiquement.

### 3. (Optionnel) Activer les alertes email

Dans **Settings → Environment Variables**, ajoutez :

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Clé API [Resend](https://resend.com) (compte gratuit suffisant) |
| `ALERT_FROM_EMAIL` | Adresse d'expédition vérifiée sur Resend |
| `ALERT_FALLBACK_EMAIL` | Destinataire par défaut si un certificat n'a pas d'email propre |
| `CRON_SECRET` | Chaîne aléatoire, pour sécuriser l'appel cron (recommandé) |

Sans ces variables, l'application fonctionne normalement : les certificats
proches de l'expiration restent visibles et mis en avant dans le dashboard,
seul l'envoi d'email est désactivé.

### 4. Redéployer

Un redéploiement (`vercel --prod` ou via le dashboard) suffit pour que les
nouvelles variables soient prises en compte. La table `certificates` se crée
automatiquement au premier chargement du dashboard ou premier appel API.

## Utilisation

- **Ajouter un certificat** : nom, application, date d'expiration, et le
  nombre de jours avant expiration à partir duquel il doit être signalé.
- Le dashboard classe automatiquement chaque certificat :
  - **Expiré** — date dépassée
  - **Urgent** — ≤ 7 jours (ou moins si le seuil configuré est plus bas)
  - **À surveiller** — dans la fenêtre d'alerte définie
  - **Valide** — au-delà du seuil
- La tâche cron (`/api/cron/check`, tous les jours à 7h UTC — modifiable
  dans `vercel.json`) envoie un email pour chaque certificat en alerte,
  au maximum une fois par 24h.

## Développement local

```bash
npm install
vercel env pull .env.local   # récupère les variables (dont Postgres) depuis Vercel
npm run dev
```

## Structure

```
app/
  page.tsx                     tableau de bord
  api/certificates/            CRUD certificats
  api/cron/check/              vérification + alertes quotidiennes
lib/
  db.ts                        schéma auto-init + requêtes + calcul de statut
  email.ts                     envoi d'alerte via Resend
components/
  CertificateForm.tsx          panneau d'ajout / modification
  StatusPill.tsx, ExpiryBar.tsx  affichage du statut et du compte à rebours
vercel.json                    configuration de la tâche cron
```
