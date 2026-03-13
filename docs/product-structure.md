Structure fonctionnelle du produit — V1
1. Vision produit

L’application est un outil de suivi d’activité destiné à un cambiste qui effectue des transactions rapides dans la journée.
La priorité absolue de la V1 est :

enregistrer rapidement une transaction

retrouver facilement un client

visualiser l’activité du jour et son évolution

L’application ne doit pas être pensée comme un logiciel administratif lourd, mais comme un outil opérationnel rapide, orienté terrain.

2. Priorités produit V1

Les priorités de cette version sont classées par ordre d’importance :

Priorité 1 — Saisie rapide

L’utilisateur doit pouvoir enregistrer une transaction en quelques secondes.

Priorité 2 — Gestion simple des clients

L’utilisateur doit pouvoir créer, rechercher et réutiliser rapidement un client existant.

Priorité 3 — Dashboard utile

L’utilisateur doit voir immédiatement :

le nombre de transactions

le nombre de clients

le volume du jour

l’évolution par rapport à la veille

Priorité 4 — Historique exploitable

L’utilisateur doit pouvoir retrouver facilement les transactions passées.

3. Pages de la V1
3.1 Dashboard

Rôle :

page d’accueil principale

vue synthétique de l’activité

Contenu attendu :

KPI du jour

variation par rapport à hier

variation sur 7 jours

graphique activité

graphique volume

top clients

accès rapide vers nouvelle transaction

Composants attendus :

cartes KPI

badge de tendance

graphiques simples

bloc “clients fréquents” ou “transactions récentes”

3.2 Nouvelle transaction

Rôle :

page la plus importante de l’application

pensée pour une saisie rapide

Contenu attendu :

champ de recherche client

bouton de création rapide d’un nouveau client

choix du type d’opération

saisie montant

éventuellement taux et montants selon le modèle retenu

bouton de validation visible

retour visuel de succès

Contraintes UX :

peu de champs

grand focus sur rapidité

pas de surcharge visuelle

optimisée mobile

3.3 Clients

Rôle :

consulter et gérer les clients

Contenu attendu :

liste des clients

barre de recherche

bouton créer client

accès au détail d’un client

Informations à afficher dans la liste :

nom

téléphone si disponible

nombre de transactions

volume total

dernière activité

3.4 Détail client

Rôle :

voir l’historique et l’importance d’un client

Contenu attendu :

informations du client

nombre total de transactions

volume total

date dernière transaction

liste des transactions associées

3.5 Historique des transactions

Rôle :

consulter les opérations déjà enregistrées

Contenu attendu :

liste paginée ou chargement progressif

filtres par date

filtres par client

filtres par type

affichage clair des montants et dates

4. User flows principaux
Flow 1 — Enregistrer une transaction pour un client existant

l’utilisateur ouvre la page de nouvelle transaction

il recherche le client

il sélectionne le client

il choisit le type d’opération

il saisit le montant

il valide

l’application confirme l’enregistrement

Objectif :
ce flow doit être le plus rapide du produit.

Flow 2 — Enregistrer une transaction pour un nouveau client

l’utilisateur ouvre la page de nouvelle transaction

il ne trouve pas le client

il clique sur “nouveau client”

il crée rapidement le client

il revient à la transaction

il complète la transaction

il valide

Objectif :
ce flow doit rester simple et court.

Flow 3 — Consulter la performance du jour

l’utilisateur ouvre le dashboard

il voit les KPI du jour

il voit la variation par rapport à hier

il consulte la courbe des derniers jours

il identifie rapidement si l’activité baisse ou augmente

Flow 4 — Rechercher l’activité d’un client

l’utilisateur ouvre la page clients

il recherche un client

il ouvre sa fiche

il consulte son historique

5. Règles métier V1
Gestion des clients

un client peut exister sans téléphone

le nom est obligatoire

un client peut avoir plusieurs transactions

un client doit être réutilisable facilement dans les futures transactions

Gestion des transactions

une transaction est liée à un client

une transaction possède un type d’opération

une transaction doit avoir une date

une transaction doit avoir un montant valide supérieur à zéro

les indicateurs du dashboard dépendent directement des transactions enregistrées

Dashboard

les KPI du dashboard sont calculés automatiquement

aucune saisie manuelle ne doit être nécessaire pour les statistiques

les comparaisons journalières doivent gérer les cas où il n’y a pas de données la veille

6. KPI minimums de la V1

Le dashboard doit calculer au minimum :

nombre de transactions du jour

nombre de clients distincts du jour

volume total du jour

évolution du nombre de transactions vs hier

évolution du nombre de clients vs hier

évolution du volume vs hier

activité sur 7 jours

top clients sur la période récente

7. Principes UX obligatoires

mobile-first

interface sobre et professionnelle

priorité à la vitesse de saisie

gros boutons et champs lisibles

pas de formulaire long

navigation simple

feedback clair après action

éviter les animations inutiles

pas de complexité métier non demandée en V1

8. Hors périmètre V1

Ne pas développer dans la V1 :

comptabilité complète

gestion avancée de rôles

multi-agences

exports complexes

impression avancée

notifications automatiques

moteur de prévision

intégrations externes

9. Critères de réussite V1

La V1 sera considérée réussie si :

un client peut être créé facilement

une transaction peut être enregistrée rapidement

le dashboard affiche des données cohérentes

l’historique est consultable

l’interface reste simple et utilisable sur mobile

le produit semble professionnel et non expérimental

10. Ordre recommandé de développement

fondation technique

base de données

gestion clients

saisie transaction

historique

dashboard

responsive et polish UI