Cahier des charges – Dashboard de suivi d’activité pour cambiste
1. Contexte du projet
L’application a pour objectif de permettre à un cambiste (opérateur de change manuel CFA / Naira) de suivre facilement son activité quotidienne sans ralentir son travail.
Dans cette activité, les transactions sont nombreuses et rapides. L’outil doit donc permettre :
d’enregistrer une transaction en quelques secondes


de suivre le nombre de clients


de suivre le volume des transactions


de visualiser l’évolution de l’activité dans le temps


d’identifier les périodes de croissance ou de baisse


L’application doit remplacer un carnet manuel ou un tableau Excel par une interface simple, rapide et visuelle.

2. Objectifs du système
Les objectifs principaux sont :
Simplifier l’enregistrement des transactions


Suivre l’activité quotidienne


Analyser l’évolution des performances


Suivre les clients réguliers


Permettre une prise de décision basée sur les données


Le système doit fournir une vision claire de :
l’activité du jour


l’évolution par rapport aux jours précédents


les clients les plus actifs



3. Contraintes importantes
Le système doit respecter plusieurs contraintes liées à la réalité du métier.
Rapidité d’utilisation
Une transaction doit pouvoir être enregistrée en moins de 5 secondes.
Simplicité
Le nombre de champs à remplir doit être minimal.
Accessibilité
L’interface doit être utilisable sur :
téléphone


tablette


ordinateur


Lisibilité
Les indicateurs doivent être visibles en un coup d’œil.

4. Utilisateurs du système
Utilisateur principal
Le cambiste.
Objectifs utilisateur
enregistrer les transactions


suivre les clients


consulter les statistiques


comprendre l’évolution de son activité



5. Fonctionnalités principales
5.1 Gestion des clients
Le système doit permettre de gérer une liste de clients.
Fonctions :
Créer un client
 Modifier un client
 Rechercher un client
 Voir l’historique d’un client
Informations stockées :
Nom ou surnom


Numéro de téléphone (optionnel)


Date de création


Nombre total de transactions


Volume total traité


Objectif :
Permettre de fidéliser les clients et suivre les plus actifs.

5.2 Enregistrement des transactions
Fonction principale de l’application.
Chaque transaction doit contenir :
Client


Type d’opération


Achat de Naira


Vente de Naira


Montant


Date (automatique)


Optionnel :
Note


Objectif :
Permettre une saisie rapide et efficace.

5.3 Historique des transactions
Le système doit permettre de consulter :
les transactions du jour


les transactions par date


les transactions d’un client


Fonctions :
filtre par date


filtre par client


consultation détaillée



5.4 Dashboard (tableau de bord)
Le dashboard est la page principale.
Il affiche les indicateurs clés de l’activité.
Indicateurs du jour :
nombre de transactions


nombre de clients


volume total des transactions


Comparaison :
évolution par rapport à hier


évolution par rapport à la semaine précédente


Objectif :
Permettre de voir rapidement si l’activité :
augmente


diminue


reste stable



6. Indicateurs de performance (KPI)
Le système doit calculer automatiquement :
Activité
Nombre de transactions aujourd’hui
 Nombre de transactions hier
 Évolution en pourcentage
Clients
Nombre de clients aujourd’hui
 Nouveaux clients
 Clients réguliers
Volume
Volume total du jour
 Volume moyen par transaction

7. Visualisations
Le dashboard doit inclure :
Graphique 7 jours
Nombre de transactions par jour.
Graphique volume
Volume des transactions sur une période.
Top clients
Classement des clients les plus actifs.

8. Architecture des pages
L’application comprendra les pages suivantes :
Dashboard
Vue générale de l’activité.
Nouvelle transaction
Saisie rapide d’une transaction.
Clients
Liste des clients enregistrés.
Historique
Liste des transactions.

