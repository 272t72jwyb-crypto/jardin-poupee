# Déployer Le jardin de poupée avec Git

Le jeu est un site statique : aucun serveur applicatif, base de données, compte ChatGPT ou clé API n'est nécessaire. Tous les décors et sons du jeu sont inclus ; les sons sont synthétisés dans le navigateur. Les polices Google sont facultatives et remplacées par les polices système si elles ne sont pas accessibles.

## 1. Récupérer le dépôt

Décompresse l'archive téléchargée. Elle contient :

- `le-jardin-de-poupee/` : les fichiers prêts à modifier, avec ce guide ;
- `le-jardin-de-poupee.bundle` : le dépôt Git autonome, avec un premier commit et la branche `main`.

Dans le dossier contenant le fichier `.bundle`, ouvre un terminal et lance :

```sh
git clone le-jardin-de-poupee.bundle le-jardin-de-poupee-git
cd le-jardin-de-poupee-git
git remote remove origin
```

Le dossier `le-jardin-de-poupee-git` devient ton dossier de travail. Le `.bundle` n'est plus nécessaire pour les mises à jour.

Si tu préfères partir du dossier de fichiers sans utiliser le bundle : ouvre un terminal dans `le-jardin-de-poupee`, lance `git init -b main`, puis `git add .` et `git commit -m "Première version du jeu"`.

## 2. Envoyer le jeu dans ton dépôt distant

Crée un dépôt distant **vide** auprès de ton hébergeur Git, sans README prérempli. Remplace `URL_DE_TON_DEPOT` ci-dessous par l'adresse de ce dépôt :

```sh
git remote add origin URL_DE_TON_DEPOT
git push -u origin main
```

Utilise tes identifiants Git habituels si ton hébergeur les demande. Aucun identifiant n'est inclus dans cette archive.

## 3. Publier sur ton site internet

### Si ton hébergeur propose un déploiement depuis Git

Connecte ton dépôt et configure :

| Réglage | Valeur |
| --- | --- |
| Branche | `main` |
| Type de projet | Site statique / aucun framework |
| Commande de construction | Aucune |
| Dossier à publier | `dist` |

Les fichiers sont déjà prêts à servir. Tu peux installer le jeu à la racine d'un domaine ou dans un sous-dossier, par exemple `/le-jardin-de-poupee/` : tous les chemins du jeu sont relatifs.

### Si tu disposes d'un accès SSH avec Git sur ton serveur

Clone le dépôt dans un dossier situé hors de la racine publique :

```sh
git clone URL_DE_TON_DEPOT le-jardin-de-poupee
```

Configure ensuite ton hébergement pour servir le sous-dossier `le-jardin-de-poupee/dist`. Si tu conserves un site existant, associe ce dossier à l'emplacement réservé au jeu, sans remplacer la racine de ton site.

Si ton hébergeur ne permet pas de choisir le dossier public, copie seulement **le contenu de `dist`** dans le dossier public réservé au jeu. Ne publie pas le dépôt `.git`, les tests ou le bundle.

Le serveur doit servir les fichiers `.mjs` comme JavaScript (`text/javascript` ou `application/javascript`). Si tu vois une erreur de type MIME dans la console du navigateur :

- Apache : ajoute `AddType text/javascript .mjs` dans la configuration autorisée pour le jeu, ou demande à ton hébergeur de le faire.
- Nginx : ajoute `mjs` à l'entrée JavaScript du bloc `types` de la configuration existante, puis fais vérifier et recharger cette configuration.

## 4. Essayer le jeu sur ton ordinateur

Si Python 3 est installé, lance depuis le dossier du dépôt :

```sh
python3 -m http.server 8080 --directory dist
```

Ouvre ensuite `http://localhost:8080`. N'ouvre pas directement `index.html` par double-clic : les modules JavaScript ont besoin d'un serveur HTTP ou HTTPS.

## 5. Mettre le jeu à jour

Depuis ton dossier de travail, après tes modifications :

```sh
git add .
git commit -m "Mise à jour du jeu"
git push
```

Un hébergeur connecté à Git peut republier automatiquement. Sur un serveur que tu gères en SSH, exécute `git pull --ff-only` dans le dépôt, puis recopie le contenu de `dist` si ton installation utilise une copie séparée.

## Vérifications facultatives pour le développement

Si Node.js est installé :

```sh
node test-engine.mjs
node test-birds.mjs
node test-loss.mjs
```

Node.js n'est pas nécessaire sur le serveur de production. Le jeu s'exécute dans le navigateur et le son commence après une interaction.
