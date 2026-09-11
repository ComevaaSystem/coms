---
name: google-ads
description: Doctrine Google Ads 2026 — structure de compte par budget, Search vs Performance Max vs Demand Gen, AI Max, enchères et seuils de données, mesure européenne (Consent Mode v2, enhanced conversions, import CRM). Déclencher dès qu'il est question de stratégie, structure, audit ou optimisation Google Ads pour un client, en appui de plan-media. Ne remplace pas le plan — dit comment la plateforme se travaille en 2026.
---

# Google Ads — doctrine 2026

Matière recoupée en août 2026 (doc officielle Google, étude Optmyzr sur 503 comptes,
praticiens). **Les plateformes bougent : avant tout arbitrage important, vérifier en
ligne ce qui a changé depuis** — nouvelles échéances, bêtas sorties, seuils modifiés.
Ce fichier donne la doctrine et les ordres de grandeur, pas un état gelé.

Articulation : `plan-media` décide où va le budget ; ce skill dit comment le compte se
structure et se pilote. La doctrine maison prime : **jamais de retargeting** (y compris
un ad group « first-party » dans Demand Gen), audiences larges, le tri se fait après le
clic.

## La structure, par budget mensuel

Le socle : **Brand Search + Non-brand Search, budgets séparés** — objectifs et enchères
radicalement différents, c'est la seule séparation non négociable. Pour le lead gen, le
Search reste le canal primaire ; PMax et Demand Gen sont des couches, jamais des
remplaçants.

- **2–5 k€/mois** : Brand + 1 à 2 campagnes non-brand consolidées. Ni PMax, ni Demand
  Gen. La consolidation n'est pas un choix esthétique : le smart bidding a besoin de
  ~30 conversions/mois PAR campagne pour converger, et trop de campagnes = aucune n'y
  arrive jamais.
- **5–15 k€/mois** : + AI Max en expérience sur le non-brand mature ; PMax SEULEMENT si
  l'import de conversions qualifiées tourne (voir plus bas), avec exclusion de marque.
- **15–30 k€/mois** : + Demand Gen si de vraies créas vidéo existent ; tROAS avec
  valeurs par étape CRM ; test d'incrémentalité PMax via Experiments.

Ce qui est mort : SKAGs, segmentation par match type/geo/device (le smart bidding veut
des données agrégées), DSA (absorbé par AI Max, migration automatique février 2027),
exact match comme stratégie par défaut.

## Mots-clés

- **Broad match + smart bidding est viable à trois conditions réunies** : smart bidding
  actif, ~30+ conv/mois par campagne, négatifs revus chaque semaine. Une condition
  manque, c'est l'hémorragie.
- La réponse est **hybride** : broad pour la découverte, exact pour les termes prouvés à
  CPC élevé (requêtes formation concurrentielles : cas typique écoles).
- **Négatifs structurels dès le lancement**, pas curatifs : emploi/salaire/gratuit/avis/
  définition, concurrents selon stratégie. Les 2-3 premières semaines de broad sont
  chaotiques par construction.
- **Search Partners : décoché par défaut** (+33-50 % de coût par conversion).
- **Recommandations auto-appliquées : désactivées au setup** — elles activent du broad
  en douce.

## Enchères

Séquence : Max Conversions sans cible → tCPA une fois 30+ conv/mois → cible posée sur le
CPA RÉEL constaté, jamais le CPA rêvé (l'écart étrangle la diffusion). En dessous de
~15 conv/mois : CPC manuel ou Max Clicks encadré.

- **Une seule conversion primaire** (le lead qualifié) ; micro-conversions en
  observation. Des objectifs mal alignés routent 30-50 % du budget vers du bruit.
- **tROAS n'a de sens qu'avec des valeurs différenciées** (lead ≠ SQL ≠ RDV), importées
  du CRM. Sans valeurs, rester en tCPA — tROAS serait du théâtre.
- Attribution, comptage (one per click en lead gen) et fenêtres IDENTIQUES entre
  actions, sinon les campagnes ne se comparent pas.

## Performance Max — les quatre conditions

Sans les quatre, s'abstenir :

1. **Exclusion de marque** — réglage par défaut, jamais optionnel. La cannibalisation de
   marque est le premier poste de gaspillage PMax en lead gen : l'algo chasse les
   conversions les moins chères (la marque), le ROAS affiché monte, l'incrémental
   baisse. Mesuré (Optmyzr, 503 comptes) : 91 % des comptes ont un chevauchement
   PMax/Search, et quand un écart existe, Search gagne ~2 fois plus souvent.
2. **Négatifs préventifs** (mêmes listes que Search — plafond passé à 10 000).
3. **Import de conversions offline/qualifiées branché.** PMax lead gen sans feedback CRM
   = volume élevé, qualité poubelle. Unanime.
4. **Channel reporting surveillé** (dispo depuis 2025) : il dit enfin où part la dépense
   Search/Display/YouTube/Gmail/Maps. Rappel maison : côté API, PMax ne rend des lignes
   qu'au grain campagne — d'où une seconde lecture au grain campagne dans tout import.

Asset groups : ne PAS dupliquer par audience (les perfs convergent vers la moyenne).
Les audience signals sont des suggestions, pas du ciblage : une liste customer match de
vrais convertis bat douze segments in-market. Remonter en exact dans Search tout terme
convertisseur trouvé dans les Search Term Insights de PMax.

## AI Max for Search

Successeur naturel de « broad + smart bidding » sur un compte mature (30+ conv/mois,
tracking propre). Exige le smart bidding. À tester en expérience contrôlée, jugée sur
les conversions QUALIFIÉES sur un cycle complet. Poser les contrôles AVANT d'activer :
brand exclusions et géo, sinon l'URL expansion envoie le trafic n'importe où. Échéance :
les DSA et le broad campaign-level migrent automatiquement vers AI Max en février 2027.

## Demand Gen

YouTube/Discover/Gmail/Maps — le seul canal visuel Google avec vrai contrôle d'audience
et reporting par placement. Creative-led : sans assets vidéo forts, résultats faibles
quels que soient les réglages. Seuil pratique : ≥ 10-15 k€/mois de budget total client.
Doctrine maison : **prospection seule** — pas d'ad group remarketing, même si la
littérature le recommande. Depuis mars 2026 les lookalikes deviennent des signaux IA
(plus un gating strict) : le ciblage « contrôlé » l'est moins qu'avant.

## La mesure — le chantier prioritaire en Europe

C'est le socle, AVANT toute sophistication d'enchères :

- **Consent Mode v2 en Advanced** — sans lui, pas d'enhanced conversions et le smart
  bidding tourne aveugle. En France (fort taux de refus), les petits comptes passent
  sous le seuil du modeling : argument de plus pour consolider.
- **Enhanced conversions for leads** : l'e-mail hashé remplace le GCLID comme clé,
  récupère 30-50 % de l'attribution détruite par les bannières.
- **Import CRM avec valeurs par étape** : la boucle cible est HubSpot → étapes du cycle
  de vie → upload offline avec valeurs → tROAS. C'est exactement le coût par SQL que
  la boucle CRM calcule ; l'écart mesuré sur un compte réel (un facteur douze entre
  deux campagnes, au coût par SQL) est invisible pour Google sans cet import.
- **Échéance technique : depuis le 15 juin 2026, les uploads offline passent par la
  Data Manager API** (bloqués dans la Google Ads API). Toute intégration neuve la cible.

## Les erreurs qui coûtent le plus cher, dans l'ordre

1. Micro-conversions en objectif primaire (30-50 % du budget sur du bruit).
2. PMax lead gen sans exclusion de marque ni import offline.
3. Broad sans négatifs ni seuil de conversions.
4. Trop de campagnes pour le budget — aucune ne converge. 100 leads à 50 € = 5 000 €
   minimum, pas 1 000.
5. Search Partners laissé coché.
6. tCPA fantaisiste posé trop tôt.
7. Consent Mode v2 absent ou en Basic.
8. Fenêtres d'attribution incohérentes entre actions.
