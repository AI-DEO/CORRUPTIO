# README — CORRUPTIO Data (Pour Claude Code)

## Contexte du projet
CORRUPTIO est un jeu de plateau politique multijoueur en ligne (2-6 joueurs) se déroulant à Porto Mendacio, une ville fictive corrompue. Le jeu tourne autour de 14 personnages jouables avec des rôles, capacités spéciales et portraits uniques.

## Ce que contient ce dossier

- `personnages.json` — Fiches complètes des 14 personnages
- `portraits/` — Portraits JPG de chaque personnage (format ~60-80 KB chacun)

## Instructions pour Claude Code

### Tâche principale
Intègre les 14 personnages définis dans `personnages.json` dans le jeu CORRUPTIO existant.

### Où intégrer les personnages
- **Données** : `shared/` — types TypeScript et données partagées
- **Backend** : `server/` — logique de jeu, validation des actions
- **Frontend** : `client/src/` — composants UI, affichage des portraits et fiches

### Charte graphique
- Palette sombre et politique (noir, rouge bordeaux, or)
- Style "dossier confidentiel / corruption urbaine"
- Les portraits doivent apparaître dans la sélection de personnage et pendant la partie

### Structure attendue dans le code
```typescript
interface Personnage {
  id: string;
    nom: string;
      titre: string;
        faction: string;
          capaciteSpeciale: string;
            description: string;
              portrait: string; // chemin vers /data/corruptio_data/portraits/
                stats: {
                    influence: number;
                        corruption: number;
                            popularite: number;
                              };
                              }
                              ```

                              ### Commande de départ
                              ```
                              Lis personnages.json dans data/corruptio_data/, puis intègre ces 14 personnages dans le jeu en respectant la charte graphique et la structure TypeScript existante. Les portraits sont dans data/corruptio_data/portraits/.
                              ```
