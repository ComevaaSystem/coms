---
name: meta-ads
description: Doctrine Meta Ads 2026 — consolidation du compte, audiences larges Advantage+, la créa comme ciblage (Andromeda), signal CAPI et Conversion Leads, lead gen instant forms vs landing. Déclencher dès qu'il est question de stratégie, structure, audit ou optimisation Meta/Facebook/Instagram Ads pour un client, en appui de plan-media. Ne remplace pas le plan — dit comment la plateforme se travaille en 2026.
---

# Meta Ads — doctrine 2026

Matière recoupée en août 2026 (Meta Engineering, Jon Loomer, études d'agences,
doc officielle). **Avant tout arbitrage important, vérifier en ligne ce qui a bougé**
— Meta change plus vite que les trois autres régies réunies. Ce fichier donne la
doctrine et les ordres de grandeur, pas un état gelé.

Articulation : `plan-media` décide où va le budget ; ce skill dit comment le compte se
structure et se pilote. La doctrine maison — **audiences larges, voire intérêt en
suggestion, jamais de retargeting** — est ALIGNÉE avec l'état de l'art 2026 et avec la
position officielle de Meta. Ne pas la rediscuter, l'appliquer.

## Le renversement de la période : la créa EST le ciblage

Depuis Andromeda (le moteur déployé fin 2025), le système lit le CONTENU de l'annonce
pour prédire à qui la montrer. Conséquences mesurées :

- Un manque de diversité créative se paie en CPM sur le compte entier.
- Un concept s'épuise en **2-3 semaines** (contre 6+ en 2024).
- **15-20 créas actives par ad set**, en CONCEPTS réellement différents (angle,
  émotion, format) — l'algo groupe les variantes cosmétiques comme une seule entité.
- Le mix gagnant : statique simple + vidéo verticale courte + carrousel. L'UGC filmé
  au téléphone bat toujours le léché, mais le statique fait son retour. Les Reels
  fatiguent ~40 % plus vite que le Feed.
- Résumé praticien : « 80 % creative ops, 20 % media buying ». L'énergie économisée
  sur le ciblage se réinvestit intégralement en volume/diversité créa et en signal.

Fatigue — rafraîchir quand les trois seuils composent : fréquence > 3,5 sur 7 jours ET
engagement −25 % ET coût par résultat +30 %.

## Structure : consolidation radicale

- **3-5 campagnes TOTAL par compte**, 1-3 ad sets par campagne. Une campagne par
  objectif réel et mandat budgétaire, pas une par hypothèse d'audience.
- La diversité se met dans les CRÉAS, pas dans les ad sets. Test Meta : 1 ad set ×
  25 créas = +17 % de conversions à −16 % de coût vs 5 ad sets × 5 créas.
- **Learning : ~50 événements d'optimisation / 7 jours / ad set.** Budget hebdo par
  ad set ≈ CPA cible × 50. À 2 000 €/mois avec un CPL à 15 €, UN seul ad set de
  prospection est mathématiquement viable ; à 30 k€, 3-5.
- Des ad sets qui se chevauchent sont dédupliqués dans l'enchère : zéro reach en plus,
  que de l'auto-concurrence. Segmenter reste légitime pour : géos économiquement
  distinctes, tests isolés, verticales réglementées.
- Sous CBO, le CPA d'ad set n'est pas fiable : **mesurer au niveau campagne**.
- Advantage+ leads/sales est le défaut recommandé — mais le reporting plateforme
  d'Advantage+ sur-attribue (~12 points vs incrémental mesuré) : le juger sur le CRM,
  pas sur Ads Manager.

## Audiences

- **Advantage+ audience sans suggestions** bat le detailed targeting et les lookalikes
  en volume ET en qualité (mesuré). Les intérêts et lookalikes ne servent plus que de
  SUGGESTIONS de démarrage sur un compte froid — le « voire intérêt » de la doctrine.
- **Le retargeting ne s'ajoute jamais** — et pas par principe : le broad sert DÉJÀ les
  audiences chaudes automatiquement, un étage séparé cannibalise, ~60 % de ses
  conversions sont non incrémentales (lift tests), et sous 1 000 personnes un pool
  n'apprend rien. À nos budgets, c'est redondant ET non mesurable.
- **Exclusions ≠ retargeting** : exclure clients existants et leads déjà soumis reste
  la règle. Une liste clients uploadée sert de seed de signal, pas de cible.
- **Garde-fou lead gen sur du broad** : Meta chasse le lead facile — vu 70 % du budget
  parti sur les 55+. Sur des cibles jeunes (étudiants), poser l'âge max en contrôle et
  surveiller le breakdown par âge chaque semaine. Non négociable.

## Signal et optimisation

- **Pixel + CAPI ensemble, dédupliqués par `event_id`** — l'hybride capte 90-98 % des
  événements contre 60-80 % pour le pixel seul. Event Match Quality cible > 6/10.
  Le setup CAPI un clic existe depuis 2026 : l'excuse technique a disparu.
- **Optimiser sur un événement qui produit ≥ 50 occurrences/semaine.** Un événement
  rare = Learning Limited à vie ; remonter d'un cran dans le funnel tant que le volume
  ne suit pas.
- **Conversion Leads** (le vrai levier CRM) : renvoyer les étapes HubSpot (SQL, RDV)
  via CAPI et optimiser sur l'étape aval au lieu du lead brut. Prérequis : instant
  forms, ~50 leads/semaine, étape cible atteinte par 1-40 % des leads sous 28 jours,
  upload au moins quotidien. Atteignable dès ~10-15 k€/mois en B2C. C'est exactement
  la boucle que Campaign prépare avec `stagesAtOrBeyond`.
- **Ce qui reset le learning** (durci en 2026) : budget ±20 %, bid strategy, audience,
  ajout de créas, changement d'événement. Scaling : +20-25 % tous les 3-4 jours max.
  L'erreur la plus chère : « réparer » une campagne dans ses premiers jours.

## Lead gen : formulaire ou landing

- Instant forms gagnent au CPL, la landing gagne au coût par opportunité QUALIFIÉE.
  Piège documenté : CPL affiché 8 £, coût réel par conversation qualifiée 80-120 £
  (40 % des leads ne se souviennent pas d'avoir soumis).
- Réglages qui sauvent la qualité d'un instant form : variante **Higher Intent**
  (+15-25 % de conversion lead→RDV pour +10-20 % de CPL), 1-3 questions qualifiantes,
  jamais plus de 5 champs.
- Landing page justifiée si elle convertit > 15 %.
- **Speed-to-lead est un levier client, pas média** : contact < 5 min = 9× plus de
  qualification. À mettre dans les attentes du portail, pas dans les réglages.
- Ordres de grandeur CPL 2026 : B2C froid 4-18 €, services locaux 8-35 €, B2B froid
  25-75 €, prise de RDV 60-150 €.

## Les erreurs qui coûtent le plus cher, dans l'ordre

1. La segmentation par intérêts / multi-ad-sets (la structure 2019-2022) — fragmente
   le signal, rien ne sort du learning.
2. Un étage retargeting à petit budget — non incrémental, redondant, inapprenant.
3. Toucher aux campagnes pendant le learning.
4. Optimiser le CPL au lieu du coût par lead QUALIFIÉ — sans boucle CRM, l'algo
   apprend à trouver des remplisseurs de formulaires.
5. 5 créas recyclées pendant 2 mois — pénalité CPM sous Andromeda.
6. Pixel seul sans CAPI.
7. Événement d'optimisation trop rare pour le budget.
8. Broad sans surveillance des breakdowns démographiques.
9. Croire le reporting Advantage+ sur parole.
