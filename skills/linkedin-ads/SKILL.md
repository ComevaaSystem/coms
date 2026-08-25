---
name: linkedin-ads
description: Doctrine LinkedIn Ads 2026 — quand le canal se justifie (seuils d'ACV), ciblage Function+Seniority sans sur-découper, Thought Leader Ads, Lead Gen Forms, enchères manual CPC, spécificités UE (pas de Conversation Ads, pas de ciblage groupes). Déclencher dès qu'il est question de stratégie, structure, audit ou optimisation LinkedIn Ads pour un client, en appui de plan-media. Ne remplace pas le plan — dit comment la plateforme se travaille en 2026.
---

# LinkedIn Ads — doctrine 2026

Matière recoupée en août 2026 (doc officielle, benchmarks Dreamdata/Pettauer Europe,
AJ Wilcox/B2Linked, sources higher ed). **Avant tout arbitrage important, vérifier en
ligne ce qui a bougé.** Ce fichier donne la doctrine et les ordres de grandeur, pas un
état gelé.

Articulation : `plan-media` décide où va le budget ; ce skill dit comment la plateforme
se travaille. Doctrine maison : pas de retargeting — sur LinkedIn, la couche de
familiarité s'obtient par les Thought Leader Ads et la fréquence naturelle d'une
audience moyenne, pas par un étage retargeting.

## D'abord : est-ce que LinkedIn se justifie ?

La question précède toute structure. Les CPC vont de 4-5 € (Europe, large) à 15-20 €
(C-suite étroit) — ça ne se rentabilise pas sur tout.

- **ACV / panier < 5-8 k€ : ne pas y aller.** Meta ou Google feront mieux.
- Zone grise 8-15 k€ : possible avec Lead Gen Forms + offre forte.
- **Sweet spot : ACV 15-150 k€**, cycle 30+ jours.
- Santé : un coût par SQL sain = **3-8 % de l'ACV**.
- Application maison : formations executive/MBA (5-40 k€ de frais) → oui. SaaS PME →
  seulement si l'ACV dépasse ~5-8 k€/an. Recrutement étudiant initial à faibles
  frais → non, Meta est meilleur ; LinkedIn ne vaut que sur les programmes chers ou
  les cibles en poste (alternance, executive, MSc internationaux).
- Sous 1 000 €/mois, le canal ne tourne pas proprement. Plancher utile : une campagne
  à 500-1 000 €/mois.

## Les trois réglages qui décident de 30 % du budget

À faire au setup, TOUJOURS — les deux premiers sont actifs par défaut :

1. **Audience Expansion : OFF.** Le ciblage est la seule raison de payer le premium
   LinkedIn ; l'expansion le dilue.
2. **LinkedIn Audience Network : OFF** sur toute campagne de conversion. −30-40 % de
   CPM mais −50 %+ de qualité de lead.
3. Géo en **« permanent location »**, pas « recent » — sinon on paie les voyageurs.

## Ciblage — « large » se traduit ici en « pas de sur-découpage »

Sur LinkedIn, le critère professionnel EST le produit : la doctrine « large » ne veut
pas dire zéro critère, elle veut dire :

- **UNE audience par campagne, définie par Job Function + Seniority + géo** — le combo
  recommandé par LinkedIn même, plus large et moins cher que les titres (~30 % des
  membres ont des titres non standard). Jamais dix micro-segments par titre.
- Un découpage ne se paie que si chaque cellule garde **50 k+ membres** et ~30 €/jour.
- Taille optimum : **50 000-300 000**. Sous 10 000, le CPM explose (65-120 $ contre
  20-38 $ en large) et l'audience s'épuise. Pour de l'executive France, 30-80 k est
  normal.
- **Company list (ABM)** dès 1 000 entreprises uploadées : la meilleure pratique SaaS.
- **UE : le ciblage par groupes n'existe plus** (DSA, 2024) et **les Conversation/
  Message Ads n'existent plus depuis 2022**. Tout plan qui les contient est du
  recyclage américain.

## Formats 2026

- **Thought Leader Ads = le format dominant.** Posts organiques de dirigeants/employés
  sponsorisés (l'auteur autorise, ça s'amplifie — ça ne se crée pas dans Campaign
  Manager). CTR ×4-6 et CPC divisé par 4-6 vs single image selon les mesures ; en
  higher ed, CTR ×1,7. Photo candide > studio, lien dans le dernier quart du texte, la
  couche organique doit exister D'ABORD. Parfait pour le recrutement : posts du
  directeur de programme, d'alumni, de professeurs. Attention : les CTR spectaculaires
  circulant (17 %) viennent d'agences qui vendent du TLA.
- **Document Ads** : meilleur format lead gen mesuré (~23 % de complétion). 70-80 % du
  volume en UNGATED, gater seulement le mid/bottom funnel, 2-3 pages de preview, que
  des assets à valeur autonome (benchmark, guide) — jamais la plaquette entreprise.
- **Single image** : le cheval de trait, CTR en baisse (0,4-0,65 %, EMEA sous la
  moyenne). 3-4 variantes par campagne.
- **Vidéo** : < 30 s, sous-titres obligatoires.

## Structure et enchères

- À 1 000-3 000 €/mois : **UNE campagne**, une audience, 3-4 créas, Lead Gen Forms.
  À 5 000-10 000 € : 2-3 campagnes dont une couche TLA. Répartition 80 % prouvé /
  20 % test. Sur-découper (6 campagnes de 300 €) = zéro donnée exploitable partout.
- **Manual CPC, toujours, à petit budget.** Maximum Delivery est construit pour
  dépenser le budget, pas pour minimiser le CPL. Démarrer ~30 % sous la fourchette
  suggérée, attendre 2-3 jours, remonter par paliers. Ne passer en Max Delivery que si
  le CTR tient ≥ 0,9 % une semaine — et jamais sur une petite audience qui s'épuise.
- **Accelerate (campagnes IA)** : conçu pour 50 k+ membres, active l'Audience Network
  et l'expansion par défaut. Les −42 % de CPA annoncés viennent de LinkedIn seul, sans
  validation tierce. Classic par défaut ; Accelerate en test encadré seulement.

## Lead Gen Forms vs landing

- LGF : conversion ~13 % vs 2,35 % (5×), CPL −30-50 %. Landing : taux de SQL +20-40 %.
- Arbitrage : LGF pour les contenus (brochure, webinar, étude) ; landing pour
  démo/RDV/candidature où la qualité prime.
- **UNE question qualifiante non pré-remplie** dans chaque LGF (niveau visé, échéance)
  — filtre les curieux sans tuer la conversion.
- **Synchro CRM native dès le jour 1** (HubSpot) : un lead contacté < 5 min convertit
  9× mieux. Un export CSV hebdo détruit la valeur du format. Vérifier que l'origine
  campagne arrive côté CRM (la logique `crm_field_map` de Campaign).

## Mesure — le canal se juge dans le CRM, sur 6-12 mois

- Cycle B2B moyen : 272 jours. Sur un mois isolé, LinkedIn aura TOUJOURS l'air cher et
  improductif — le juger là est l'erreur, pas le canal.
- **Conversions API** : −20 % de CPA, +31 % de conversions attribuées en moyenne.
- **Revenue Attribution Report** : connexion CRM, fenêtre 365 jours, attribution au
  niveau entreprise — fait pour les cycles longs (candidature à N+1 comprise).
- CPL réalistes Europe : 75-150 € en LGF, 100-200 €+ en landing. Executive : 50-120 €
  le lead brochure/événement. « Un CPL de 80 € en SQL bat un CPL de 30 € en déchets. »

## Les erreurs qui coûtent le plus cher, dans l'ordre

1. Audience Network + Expansion laissés actifs (~30 % du budget).
2. Max Delivery dès le lancement.
3. Sur-découper le budget en micro-campagnes.
4. LGF sans question qualifiante ni synchro CRM, ou landing pour un lead magnet.
5. Optimiser au CPL au lieu du pipeline.
6. Recycler un plan US (Conversation Ads, ciblage groupes — inexistants en UE).
7. Ignorer les TLA « parce qu'il n'y a pas d'organique » — c'est la couche à
   construire en premier.
8. Juger le canal sur 30 jours quand le cycle en fait 272.
