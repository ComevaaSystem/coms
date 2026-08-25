# SCOPE, V1 du repo public

## Objectif

Rendre la methode paid de Quentin (Comevaa) installable par n'importe qui comme un
parcours de skills Claude Code, sur le modele de la G-Stack : un consultant senior en
face de soi, etape par etape, d'un business qu'on decouvre jusqu'aux campagnes qui
tournent. Objectif numero 1 : la notoriete. La boucle : travail client, skill
amelioree, release mensuelle, contenu LinkedIn.

## Public

Tout le spectre : consultant, marketer in-house, dirigeant qui gere son propre compte.
Consequence : les skills parlent du business analyse, jamais du "client". Le mot
client n'apparait pas dans les prompts des skills.

## Langue

Skills et repo en anglais (reecriture, pas traduction : les regles de ton francaises
ont un equivalent anglais a definir par skill). Une skill menee en anglais conduit
l'entretien dans la langue de l'utilisateur. Documents de travail internes en francais.

## Le parcours V1, cinq etapes

1. `understand` : comprendre le business. Grille d'entretien (qui achete, structure de
   l'offre, dispatch, focus, budget, ressources), onboarding inclus. La vitrine du
   repo, le "run this first". A creer depuis entretien-structure.
2. `media-plan` : decider la strategie. Descendante de plan-media, sans dependance a
   Campaign. Reecriture complete (inversion de personne, anglais).
3. Doctrines regie : `meta-ads`, `google-ads`, `linkedin-ads`. Reecriture anglais et
   anonymisation, structure conservee.
4. Briefs crea : `static-briefs`, `ugc-briefs`. Reecriture anglais et anonymisation.
5. `analyze` : lire les comptes apres lancement, decisions monitorees, la boucle
   d'optimisation. A creer depuis la methode d'audit existante.

Chaque skill tourne seule sur les documents fournis par l'utilisateur. Aucune
dependance au MCP Comevaa en V1.

## Public contre prive

Tout ce qui est savoir est public. Tout ce qui est etat (memoire client, historique,
automatisations, le MCP Campaign) est produit, et reste prive. Le MCP est hors V1 :
son ouverture se decide apres la sortie du repo et l'usage reel des skills.

## Licence

MIT. Le savoir public est le marketing, le moat est l'etat qui ne se copie pas.

## Scrub, bloquant en CI

La publication est refusee si un fichier contient : nom de client reel ou derive, nom
de personne, domaine ou URL cliente, montant en euros issu d'un compte reel, verbatim
de livrable client, date d'incident nomme, identifiant de compte publicitaire. Les
exemples pedagogiques se reecrivent sur des cas fictifs. Les ordres de grandeur
sectoriels sources publiquement restent.

## Releases

Format G-Stack : fichier VERSION, changelog narratif mensuel, tags git, install en une
commande. Le changelog raconte ce que le travail du mois a appris : c'est la matiere
du post LinkedIn de release.

## Evals V1

Regles fermees seulement, en CI : pas de promesse sans fait, pas de retargeting
propose, questions posees avant production, regles de ton. Les jugements de gout
restent humains. Evals au juge modele : V2.

## README

100 % anonyme : chiffres agreges sans nom de client. Pas de cas client nomme pour le
moment. Reecus personnels : la methode montree en demo sur un cas fictif.

## Nom du repo

Non decide. Placeholder de travail jusqu'a la decision, aucun engagement public avant.

## Hors scope V1

MCP public, monetisation, marketplace de plugins, evals au juge modele, cas client
nomme, skills sectorielles.
