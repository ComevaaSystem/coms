# SCOPE, V1 du repo public

## Objectif

Rendre la methode paid de Quentin (Comevaa) installable par n'importe qui comme un
parcours de skills Claude Code, sur le modele de la G-Stack : un consultant senior en
face de soi, etape par etape, d'un business qu'on decouvre jusqu'aux campagnes qui
tournent. Objectif numero 1 : la notoriete. La boucle : travail client, skill
amelioree, release mensuelle, contenu LinkedIn.

## Vision et positionnement

Turn paid media into a measurable pipeline channel. Le parcours se presente comme
une BOUCLE, pas une liste : comprendre, planifier, travailler la regie, produire la
crea, analyser, et l'analyse re-nourrit la comprehension et le plan. La boucle se
ferme dans le CRM, au cout par etape qualifiee, et ce signal remonte aux regies
(conversion leads, import offline, valeurs par etape). Version lead gen de la vision
The Cirqle (qui mesure en ROAS e-commerce) ; precedent du modele ouvert : Winning by
Design, dont le Bowtie et SPICED sont publies et financent formation et services.

Positionnement : profondeur d'un canal, pas largeur du marketing. Les repos de
skills marketing existants (OpenClaudia, 75 skills generiques ; Eric Siu, tout sauf
le paid) laissent vide le couloir "doctrine paid complete d'un praticien, seuils
chiffres inclus". C'est ce couloir qu'on prend, et la boucle fermee ads vers CRM
sans outil a 1 500 dollars par mois est l'argument.

Doctrine assumee face a Refine Labs : capture par formulaires puis qualification
APRES via la boucle CRM, pas d'ungating dogmatique. On prend leur lucidite de mesure
(l'attribution logicielle sous-compte, le declaratif complete), pas leur doctrine de
capture. La cible "agentic platform" (Cirqle, Omneky vendent leur MCP comme
argument) est le positionnement vise de la phase MCP, apres la V1.

## Public

Tout le spectre : consultant, marketer in-house, dirigeant qui gere son propre compte.
Consequence : les skills parlent du business analyse, jamais du "client". Le mot
client n'apparait pas dans les prompts des skills.

## Langue

Skills et repo en anglais (reecriture, pas traduction : les regles de ton francaises
ont un equivalent anglais a definir par skill). Une skill menee en anglais conduit
l'entretien dans la langue de l'utilisateur. Documents de travail internes en francais.

## Le parcours V1, six etapes

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
6. `steer` : le pilotage, essentiel au metier (decision du 2026-08-26). La
   perception du travail par le client = les leads + ce qu'on lui raconte. Brief
   d'avant-call (chiffres reconcilies, engagements ouverts, questions du jour),
   conduite du rituel hebdo, restitution d'apres-call (decisions, to-dos,
   responsables, dates), narration du travail sur le canal quotidien. Fonde sur le
   bilan des 19 calls reels : tout ce que le consultant delegue a la machine pour
   garder la relation, la performance et la maitrise. A creer.

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

Decide le 2026-08-27 : COMS, Comevaa Open Marketing System. Repo public cible :
github.com/comevaa/coms. Regle d'usage : le sigle vit a l'ecrit (repo, README, site) ;
a l'oral on dit "le systeme Comevaa" ou le nom complet, jamais "COMS" seul (collision
avec "la com'"). Le dossier local garde son nom, le repo public part avec un
historique git neuf de toute facon.

## Hors scope V1

MCP public, monetisation, marketplace de plugins, evals au juge modele, cas client
nomme, skills sectorielles.
