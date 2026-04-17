# CORRUPTIO - Données des personnages

Bundle complet des 14 fiches personnages pour intégration dans le jeu.

## Contenu du dossier

```
corruptio_data/
├── personnages.json          # Toutes les données structurées
├── README_CLAUDE_CODE.md     # Ce fichier
└── portraits/                # 14 portraits 600x600px JPG
    ├── maire.jpg
    ├── journaliste.jpg
    ├── juge.jpg
    ├── commissaire.jpg
    ├── inspecteur.jpg
    ├── parrain.jpg
    ├── banquier.jpg
    ├── espionne.jpg
    ├── detective.jpg
    ├── lobbyiste.jpg
    ├── femme_affaires.jpg
    ├── magnat_medias.jpg
    ├── influenceuse.jpg
    └── activiste.jpg
```

## Structure du JSON

```json
{
  "meta": {
    "jeu": "CORRUPTIO - Porto Mendacio",
    "axes_competences": ["Influence", "Argent", "Secrets", "Réputation", "Charisme", "Intuition"],
    "echelle_stats": "0-100",
    "camps": { ... }
  },
  "personnages": [
    {
      "id": "maire",
      "numero_dossier": "01",
      "nom_complet": "Gérard Lemalain",
      "surnom": "Le Caméléon",
      "role": "MAIRE",
      "camp": "ordre",
      "difficulte": 3,
      "citation": "Je suis là pour le bien commun et vous servir.",
      "objectif_secret": "Plus d'influence que tous au tour 10 + au moins 1 élection remportée",
      "stats": {
        "influence": 60,
        "argent": 40,
        "secrets": 30,
        "reputation": 65,
        "charisme": 85,
        "intuition": 55
      },
      "identite_cachee": false,
      "fichier_portrait": "portraits/maire.jpg"
    },
    ...
  ]
}
```

## Direction artistique commune

### Fiche personnage — style "carte à jouer premium"

**Palette de fond unifiée (vert émeraude) :**
- Fond carte : `linear-gradient(180deg, #142820 0%, #0a1812 100%)` avec `radial-gradient(ellipse at top, rgba(106, 184, 150, 0.1) 0%, transparent 60%)` en overlay
- Bordure carte : `1px solid #2e4238`
- Accent principal : `#6ab896` (vert émeraude)
- Accent secondaire : `#9dd4b8` (vert tendre pour highlights)
- Texte principal : `#e6f0ea`
- Texte secondaire : `rgba(230, 240, 234, 0.55)`

**Palette radar (6 axes - couleurs distinctes) :**
| Axe | Couleur | Hex |
|-----|---------|-----|
| Influence | Cyan | `#4FC3F7` |
| Argent | Jaune or | `#FFD54F` |
| Secrets | Violet | `#BA68C8` |
| Réputation | Vert menthe | `#81C784` |
| Charisme | Corail | `#FF8A65` |
| Intuition | Rose | `#F06292` |

### Éléments de gabarit (identiques pour tous les personnages)
- Ornements aux 4 coins (arabesques + points)
- Numéro de carte en filigrane (top-right, opacité 0.05)
- Blason décoratif derrière le radar (cercles + points cardinaux)
- Cadre circulaire du portrait avec anneau pointillé
- Lignes dorées dégradées en haut et en bas de la carte

### Cas spécial — Espionne (identité classifiée)
Si `identite_cachee: true` :
- Remplacer portrait par silhouette avec "?"
- Nom → `? ? ? ? ?`
- Surnom → `« Identité classifiée »`
- Citation → `Information restreinte — dossier scellé.`
- Radar → flouté avec overlay "CLASSIFIÉ"
- Objectif → reste visible

## Pour Claude Code

Commande type pour intégrer dans le jeu :

```
Intègre les personnages du fichier corruptio_data/personnages.json dans
mon jeu CORRUPTIO. Pour chaque personnage :
1. Crée un composant React FichePersonnage qui respecte la direction
   artistique décrite dans README_CLAUDE_CODE.md
2. Charge les portraits depuis corruptio_data/portraits/{id}.jpg
3. Gère le cas identite_cachee pour l'Espionne
4. Affiche un radar hexagonal avec les 6 compétences aux couleurs définies
```

## Référence visuelle

Voir `fiches_personnages.html` pour le rendu visuel de référence des 14 fiches.
