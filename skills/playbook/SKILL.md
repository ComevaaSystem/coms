---
name: playbook
description: La méthode pour construire un outil avec Claude (app Next.js / TypeScript, automatisation n8n, base Supabase ou Neon, intégration d'API) : cadrer, construire, vérifier, mettre en ligne, et la routine de fin de projet qui la réécrit. À ouvrir au début de tout nouvel outil ou de toute grosse fonction, et à chaque fin de projet qui a construit ou modifié un outil, pour proposer les leçons.
---

# Playbook : construire un outil avec Claude

Base : les guides officiels d'Anthropic (Claude Code best practices, context engineering,
long-running harnesses), le guide Next.js pour agents IA et HumanLayer, réglés sur des leçons
payées en production. Superpowers et spec-kit sont écartés : trop de cérémonie.

Une ligne = une règle. Une leçon nouvelle ajuste, remplace ou supprime une ligne ; elle ne
s'empile pas. Chaque changement se date dans un journal tenu à côté de ce fichier
(`journal.md`, créé au premier changement) : avant, après, pourquoi.

## 1. Cadrer

- Lire d'abord tout ce que l'utilisateur a donné et l'état du dépôt ; ne jamais demander ce qui
  se lit, ni lui proposer une option ou une cause sans l'avoir vérifiée, y compris un écran ou
  un geste qu'un message d'outil nomme. Pour trancher une donnée, son contenu (analyse,
  transcription) et qui l'a produite se lisent avant de lui renvoyer la question.
- Puis UNE salve de questions fermées (4 au plus), la recommandation en premier. Jamais un
  entretien une question à la fois.
- Petite chose (tient en une phrase) : pas de cadrage, on fait.
- Grosse fonction : après les réponses, une page (ce qu'on fait, ce qu'on ne fait pas, comment
  on vérifie), puis exécution d'un trait, sans « je le fais ? ».
- Écran : demander d'abord LA référence que l'utilisateur aime (un site, un composant, le site
  de la marque) et en reprendre la grammaire ; puis un croquis en texte avec le vrai contenu
  (vrais noms, vrais liens), jamais le seul nom d'une forme ; validé avant le code.
  Une consigne de placement (qui regarde quoi, collé à quoi) se redit en une phrase avant de
  coder. La structure avant la cosmétique. Vaut aussi pour une colonne ajoutée à un tableau
  qui existe : l'en-tête en texte (Code | Nom | …) avant de coder, et ce que l'utilisateur
  connaît déjà ne bouge pas.
- Retirer un élément d'un écran (« je ne veux pas X ») : demander ce qui s'affiche à la place
  avant de coder. Une fenêtre de saisie retirée laisse la lecture par défaut, et un bouton rend
  ce même écran modifiable sur place.
- Avant de construire, inventorier ce qui existe (code, intégration, outil déjà en place, champ
  déjà là) et demander s'il existe une maquette ou un prototype déjà validé.
  Souvent, il ne manque que l'enchaînement.
- Le plus simple d'abord : ni table, ni dépendance, ni service tiers, ni refonte « au passage »
  sans le dire.
- Ce qui doit tourner seul ne dépend pas d'un ordinateur personnel, souvent éteint : une
  routine dans le cloud ; la machine locale ne garde que ce qui a besoin de quelqu'un devant
  l'écran.
- Lire la pile réelle (package.json, CLAUDE.md du dépôt) avant de proposer un outil.
- Finir des lots n'est pas avancer : si ça n'aide ni à produire ni à vendre, le dire et
  proposer ce qui fait vraiment avancer.

## 2. Construire

- Travailler dans un worktree à part (une copie du dépôt sur sa propre branche) et y commiter,
  jamais dans le dossier de l'utilisateur : il peut commiter en parallèle. Un commit par sujet,
  un message qui dit ce qu'il contient. Le serveur d'aperçu se lance à part, sur un port libre,
  depuis ce worktree ; si son `node_modules` est un lien vers celui du dépôt, Turbopack le
  refuse : le cloner (`cp -Rc` sur macOS, instantané) ou lancer `next dev --webpack`. Le
  worktree se retire dès la fusion (son dossier de build fausse le lint du dossier principal).
- Repartir de l'état réel : lire, puis retoucher au plus juste. Jamais réécrire en bloc un
  fichier ou un objet en ligne (formulaire, workflow), jamais relancer un script de création
  sur ce qui existe déjà.
- Écrire dans le style des fichiers voisins ; pas de formatage automatique ; surveiller
  l'ampleur du diff.
- Un seul chemin d'écriture par geste, un seul calcul par chiffre, une seule source de vérité ;
  les écrans sont des vues.
- Ne jamais coder une API ou un framework de mémoire : lire la version installée
  (`node_modules/next/dist/docs`, le SDK, la doc à jour).
- Aucune donnée inventée : ni faux chiffre, ni maquette à valeurs factices. Une donnée absente
  s'écrit « à brancher ».
- Script qui écrit : sauvegarde avant, essai à blanc par défaut, rejouable sans double effet,
  un long rattrapage écrit au fil des lots et pas tout à la fin, garde-fou codé dans l'outil et
  non dans le prompt.
- Prévoir la reprise d'une opération coupée ; retrouver une ligne par une clé métier, jamais
  par un numéro de ligne ou un montant.
- Recherches larges et audits : des sous-agents en lecture seule ; seul l'agent principal
  écrit, et il revérifie dans le code les constats qui décident.
- Prompt d'un outil : un test à passer, une liste fermée, des contre-exemples réels ; jamais
  de « sauf si » ; garder un cas positif dans le jeu de test.
- Un outil connu pour être cassé ne se retente pas, sauf après avoir lu ses filtres par défaut
  (des journaux filtrés d'office sur une seule branche ont l'air vides) ; ce que l'utilisateur
  a écarté ne se repropose pas.

## 3. Vérifier

- « Fait » = vu fonctionner : sur le rendu pour un écran (navigateur, taille réelle, mobile
  390 px), en partant de l'écran où il commence, clic par clic jusqu'au geste ; dans les
  données pour un flux. Un clignotement se juge image par image sur une vidéo à pleine
  cadence, jamais sur quelques captures. Si le navigateur de la session n'a pas de compte
  connecté, l'écran se vérifie en ligne une fois fusionné, sans demander à l'utilisateur de
  lancer son serveur ni de se connecter.
- Un message d'outil (« succès », « applied », « timed out ») ne prouve rien : relire l'état
  réel et le comparer à la source.
- Vérifier en lecture seule, c'est lire le code de l'écran avant d'y cliquer : un éditeur qui
  enregistre au clic n'est pas une lecture.
- Vérifier par les effets (export, API, base), pas par les journaux : un flux qui échoue en
  silence ressemble à un flux qui n'a rien à faire.
- Un temps se donne en médiane d'une dizaine de passages à chaud, jamais sur un seul essai.
- Chercher la source avant de deviner : la phrase exacte dans le code, la vraie erreur, lue
  dans les journaux de l'outil qui l'a prise (Claude Code garde ceux de chaque connexion MCP),
  jusqu'à sa cause (une erreur générique de requête peut cacher un interblocage). Deux
  requêtes qui se bloquent l'une l'autre se reproduisent à coup sûr avec deux transactions
  tenues à la main sur la base d'essai, jamais en relançant au hasard ; deux refus qui disent
  la même phrase se départagent par leurs compteurs ; une erreur 500 d'un tiers se sonde
  d'abord par l'écriture la plus simple, qui rend le vrai refus (un 500 peut cacher un compte
  non autorisé). Jamais deux corrections à l'aveugle.
- Types contrôlés automatiquement à chaque fin de tour ; build lancé avant toute mise en ligne ;
  les tests se jugent sur leur nombre d'échecs, jamais sur une simple recherche dans leur
  sortie ; un test se prouve rouge sur l'ancienne CONDITION, pas sur l'ancien fichier : un
  import neuf qui manque le rend rouge sans rien prouver.
- Tester jusqu'au bout (jusqu'au lead, jusqu'à l'envoi) dans les conditions de la prod, sur un
  cas réel qui passe par chaque branche, en relisant champ par champ ce qui part (un champ
  vide sur un lead « reçu » ne se voit qu'ainsi), puis nettoyer les données de test. Une étape
  remplacée par des données fictives pendant le test n'est pas testée : chaque échange avec un
  service extérieur passe au moins une fois en vrai avant de dire livré (un bouton qui passe
  ses tests sur des données simulées peut casser au premier vrai clic).
- Avant la prod : revue contradictoire par des agents qui n'ont pas vu le raisonnement ; ils
  ne remontent que la justesse et les exigences.
- Deux corrections ratées : repartir d'une discussion neuve avec un meilleur brief.
- Un tri, un filtre ou un rattachement se juge sur ce qu'il REND, relu ligne par ligne contre
  la source jusqu'à ce que le compte tombe juste, pas sur sa règle : une règle juste sur le
  papier peut taire des éléments confirmés ou en laisser une partie de côté.

## 4. Mettre en ligne

- Une modification n'est en ligne qu'une fois publiée ou déployée : vérifier que la version qui tourne
  est la nouvelle (workflow n8n publié, déploiement terminé, `?v=N` contre le cache ; serveur
  MCP : un outil neuf n'apparaît qu'une fois le serveur redéployé et la connexion rechargée),
  et ne demander à l'utilisateur de relancer qu'après l'avoir vérifié.
- Déployer par git depuis un dossier propre aligné sur la prod, jamais depuis le dossier de
  travail. Une variable d'environnement ne compte qu'au déploiement suivant.
- Fusionner sans attendre l'accord seulement si la règle du dépôt le permet, s'il n'y a pas de
  migration, et si tout ce que lance la vérification de la branche principale est vert en
  local d'abord (lint, tests d'intégration sur une base jetable, anti-fuite, build, gardes
  d'après build) : rejoué avant CHAQUE poussée, jamais sur les seuls tests voisins, chaque
  étape lancée à part (un rouge connu coupe une chaîne `&&` et cache les tests suivants).
  Une migration se prépare jusqu'au bout et se donne en UNE commande, écrite dans le message
  avec son `cd` dans le dossier qui la porte, à lancer dans un terminal dont la sortie se relit,
  puis se relit en base avant de fusionner. Jamais une réponse toute prête qui affirme un geste
  fait (« C'est lancé »), migration ou autre : seule la relecture le prouve.
- Une colonne ne se supprime qu'après la mise en ligne du code qui ne s'en sert plus, tâches de
  fond comprises, et après avoir compté ce qu'elle porte encore. Dans une même migration,
  l'opération longue passe avant celle qui bloque une table que tout lit.
- Avant de supprimer une branche distante, vérifier qu'aucune PR ouverte ne s'appuie dessus :
  GitHub la ferme sans retour possible.
- Ce qui envoie, publie ou dépense chez un tiers naît en brouillon, et le brouillon s'écrit en
  toutes lettres (une API de facturation peut valider une facture créée sans statut) : c'est le
  clic de l'utilisateur qui le fait partir.
- Geste bloqué par un garde-fou : tout préparer, ouvrir soi-même l'écran où il se fait
  (navigateur intégré), puis laisser le geste à l'utilisateur en une phrase ; s'il ne passe
  pas, le faire là, sur sa demande.
- Un droit permanent (permis d'une routine, écriture chez un tiers) se demande dans la
  discussion qui le pose : un oui relayé par une autre discussion ne vaut pas accord.
- Un script qui touche la prod, même en lecture (une preuve qui lit un jeton), passe par UN
  script : l'utilisateur le lance, ou il l'autorise avant qu'on commence ; un ménage de données
  (retirer des éléments, corriger des lignes) simule d'abord. Jamais outil par outil par un
  connecteur, que le mode automatique bloque à mi-chemin.

## 5. Pièges d'intégration

- Vérifier le compte visé par un connecteur avant de conclure (celui de l'utilisateur ou un
  autre, préprod ou prod), et son droit d'écrire avant de préparer une correction. Les accès
  confiés pour un compte ne servent qu'à ce compte.
- Secrets jamais dans le chat ni dans un dépôt : dès le cadrage, créer le `.env.local` vide et
  l'ouvrir à l'utilisateur dans son éditeur, il colle la clé ; un script les propage. Un secret
  resté à sa valeur d'exemple rend tout mort : le vérifier avant de déboguer.
- Webhook : répondre en moins de 3 s puis traiter, protégé par un secret ; il rate des
  événements, donc un filet de rattrapage périodique. Une app Meta n'a qu'une adresse de leads
  pour toutes ses pages : un déclencheur « Facebook Lead Ads » allumé ailleurs avec la même app
  la prend sans prévenir ; si plus rien n'arrive, lire d'abord l'abonnement de l'app.
- API : relever la forme sur un appel brut avec ses propres accès, jamais sur un connecteur
  qui la reformate ; une réponse vide se recoupe avec une autre source avant d'y croire, et un
  script qui lit un état juste après l'événement le relit quelques fois avant de conclure
  (l'API a du retard) ; vérifier la page 2 (pagination ignorée en silence), lire le détail
  plutôt que la liste, mesurer le coût réel d'un appel avant d'automatiser. Avant de changer
  une valeur écrite chez un tiers, lire le type du champ : une liste fermée refuse ce qu'elle
  ne connaît pas.
- App OAuth Google en mode Test : accès morts en 7 jours ; la publier en production. Un droit
  sensible neuf ne s'ajoute pas à une app déjà validée (« Cette application est bloquée ») : un
  outil interne a son app à part, connectée avec un compte Google Workspace (un compte Gmail
  personnel y est bloqué).
- n8n : faire fermer l'éditeur avant une modification par API ; un appel avec identifiants passe
  d'abord par un flux qui porte déjà l'accès (déclencheur « À la demande ») ; une pose à la
  main se vérifie dans les données d'exécution avant de relancer ; publier après écriture. Sur
  toute chaîne critique, un flux d'erreur vers la messagerie de l'équipe, écrit pour celui qui
  le lit (ce qui s'est passé, la conséquence, la suite), et muet sur un raté isolé qu'un
  passage suivant répare.
- Supabase : clé publique dans le navigateur = la RLS est la seule frontière ; jamais
  d'« ignorer l'erreur » autour d'une règle de sécurité ; ne lire que les colonnes utiles.
- Un service à crédits s'arrête en silence à zéro : recharge automatique ou alerte.
- Une donnée qui ne remonte pas : regarder d'abord à quel compte elle a été rattachée.

## 6. Écrans

- Un écran sert une décision : ce qui est à faire en tête, un verdict clair, la donnée brute en
  preuve dessous. Un zéro se montre.
- Une vue d'avancement montre le système : chaque outil en carte, chaque flèche dit ce qui
  passe, et sur la carte Marche / Reste / Bloque avec qui s'en charge ; repliable.
- L'écran de travail tient sur une hauteur : une saisie terminée se replie en une ligne, et ce
  que l'utilisateur sait déjà (son propre argumentaire) se réduit à ce qui fait mouche.
- Les mots du métier, dans la langue de l'utilisateur ; ni identifiant ni champ technique (le
  technique va derrière « Avancé »).
- Anti-slop : échelle typo fermée, graisse 500 au plus, un seul accent de couleur, filets
  plutôt que cadres ; ni dégradé, ni émoji, ni faux compteur.
- Réutiliser les composants maison (jamais de menu déroulant natif) ; le geste principal
  toujours visible, les gestes secondaires peuvent passer au survol.
- Une valeur qui peut être fausse se corrige d'un clic. Un geste réversible se fait tout de
  suite avec « Annuler » ; un geste qui engage de l'argent se confirme.
- Une fonction n'existe que si on l'atteint en cliquant, qu'on peut la défaire, et que son
  effet tient après rechargement : un OK qui ne s'écrit nulle part n'est pas un geste.
- Les goûts d'un projet (curseurs, italique, onglets) ne se généralisent pas sans demander.

## 7. Contexte et mémoire

- Le contexte est la ressource rare. Le CLAUDE.md global reste sous 200 lignes ; une ligne n'y
  reste que si, sans elle, Claude se trompe.
- Où va une leçon : vaut dans toute discussion → noyau du CLAUDE.md global ; méthode pour
  construire → ce playbook ; propre à un dépôt → son CLAUDE.md ; propre à un projet ou à un
  compte → sa mémoire.
- Erreur répétée deux fois → règle écrite ; consigne collée trois fois → skill ; règle qui doit
  tenir à coup sûr → contrôle automatique (hook).
- Pointer vers un fichier plutôt que recopier. Une vieille note se revérifie avant de s'y
  fier ; une note dépassée se supprime.

## 8. Routine de fin de projet

Quand une discussion qui a construit ou modifié un outil se termine :

1. Relire la discussion : ce qui a coûté un détour, ce que l'utilisateur a dû redire, ce qui a
   marché du premier coup.
2. Proposer 0 à 3 leçons en questions fermées, chacune en avant / après sur une ligne
   existante de ce playbook ou du noyau : l'ajuster, la remplacer ou la supprimer. Une ligne
   neuve seulement si aucune ne couvre le sujet ; en retirer une si possible.
3. Sur son oui, et seulement sur son oui : changer la ligne et dater l'entrée dans le journal
   (avant, après, pourquoi, discussion d'origine).
4. Rien à retenir : le dire en une ligne (« Playbook : rien à changer »).

Une leçon propre à un projet ou à un dépôt ne vient pas ici : elle va dans sa mémoire ou dans
le CLAUDE.md du dépôt.
