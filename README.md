# Le jardin de poupée

Jeu web en français, sans serveur applicatif ni dépendance JavaScript externe.

Le dossier `dist` peut être servi par n’importe quel hébergement web statique. Pour un essai local : `python3 -m http.server 8080 --directory dist`, puis ouvrir `http://localhost:8080`.

Commandes : flèches gauche/droite, A/D ou Q/D ; sur écran tactile, glisser dans le jardin ou maintenir les boutons fléchés. P ou Échap met en pause. Le son démarre après une interaction avec le jeu et peut être coupé avec le bouton musical. Le jeu se met en pause quand l’onglet perd le focus.

Trois vies. Fleurs : 1, étoiles : 2, nounours guimauve au chocolat : 3, bouches : 4, cœurs : 8, Gode : 12, gag ball : 50. Chaque objet manqué retire une vie. La fréquence et la vitesse augmentent progressivement. Le jardin alterne jour et nuit, avec oiseaux, chat et particules de cerisier. Les mouvements décoratifs sont réduits si le navigateur signale une préférence pour moins d’animations.

La logique de collecte utilise une intersection continue du trajet avec la ligne du panier, pour éviter de traverser le panier entre deux images. `node test-engine.mjs` vérifie les règles principales aux dimensions téléphone et ordinateur.

Les illustrations sont produites pour ce projet à partir des maquettes validées. Le cadrage mobile possède son propre décor. Les personnages sont animés à partir d’une planche d’illustrations et de transformations 2D.

Aucune donnée personnelle ni score n’est transmis ou stocké par le jeu. Les polices Google sont optionnelles et disposent de polices de remplacement système.

Les oiseaux suivent un cycle de vol, atterrissage, repos et départ. Leurs pattes sont ancrées aux branches de chacun des quatre décors, et ils reprennent leur vol pendant les transitions. Les poses ailes hautes et basses sont alignées sur le corps. `node test-birds.mjs` vérifie les atterrissages, les transitions et l’absence de téléportation.

Probabilités par lancer : fleurs 32,30 %, étoiles 23,75 %, nounours 17,10 %, bouches 12,35 %, cœurs 6,65 %, Gode 2,85 %, gag ball 5 %. Chaque tirage est indépendant.

À chaque vie perdue, le jeu se fige deux secondes pendant les sanglots du personnage et une mélodie originale au piano synthétisé et notes cristallines. Les cadeaux, le panier et le décor restent immobiles ; la partie reprend ensuite, ou affiche le résultat après la dernière vie. La pause manuelle ou le changement d’onglet suspend également cette séquence et son audio.

Chaque palier de 100 points franchi rend une vie manquante, sans dépasser trois vies.

Après la perte de la dernière vie et les deux secondes de pleurs, un score final strictement supérieur à 100 déclenche une scène romantique. Une des six scènes animées et une des quinze phrases sont choisies indépendamment au hasard. La scène reste affichée jusqu’à « Rejouer » ou « Voir le résultat ». Le bouton de pause et la préférence système de réduction des animations sont pris en compte. Les animations utilisent huit poses dessinées par scène, avec oiseaux et pétales animés.

Pour ajouter une phrase, complète le tableau `ROMANTIC_PHRASES` de `dist/romance-data.mjs`. Lors de sa publication, renouvelle les paramètres de version des modules concernés pour éviter de conserver une ancienne liste en cache.

Tests des scènes : `node test-romance.mjs` et `node test-romance-motion.mjs`.
