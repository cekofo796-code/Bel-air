# BEL-AIR — Boutique en ligne (Firebase)

Site e-commerce en HTML/CSS/JavaScript vanilla, avec **Firebase** comme base de données (Firestore) et système de connexion admin (Authentication). Le site reste hébergeable gratuitement sur GitHub Pages : Firebase joue le rôle de "backend" sans que tu aies de serveur à gérer.

## 1. Structure du projet

```
BEL-AIR/
├── index.html, products.html, product.html, cart.html, checkout.html, admin.html
├── css/style.css
├── js/
│   ├── firebase-config.js   ← configuration de ton projet Firebase
│   ├── config.js            ← numéro WhatsApp, nom de la boutique
│   ├── main.js, products.js, product.js, cart.js, checkout.js, admin.js
└── images/logo.png
```

## 2. Configuration Firebase déjà en place

Le fichier `js/firebase-config.js` contient déjà la configuration de ton projet Firebase (`bel-air-shop-1ea5d`). Si un jour tu changes de projet Firebase, remplace les valeurs de `firebaseConfig` par celles de ton nouveau projet (Console Firebase → ⚙️ Paramètres du projet → Vos applications).

## 3. Créer ton compte administrateur

La connexion à `admin.html` utilise **Firebase Authentication** (plus de mot de passe en dur dans le code) :

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) → ton projet → **Build → Authentication → Users**.
2. Clique **"Add user"**, renseigne ton e-mail et un mot de passe.
3. Utilise ces identifiants pour te connecter sur `admin.html`.

Tu peux créer plusieurs comptes admin de cette façon, ou changer le mot de passe à tout moment depuis cette page.

## 4. Sécuriser Firestore (important avant mise en ligne définitive)

Par défaut, Firestore démarre en **mode test** (accès ouvert à tout le monde, expire après 30 jours). Va dans **Build → Firestore Database → Règles** et remplace le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /meta/orderCounter {
      allow read, write: if true;
    }

    match /meta/seed {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Ce que ça fait :
- Tout le monde peut **voir** les produits et **créer** une commande (nécessaire pour que les clients puissent commander sans se connecter).
- Seul un admin connecté peut **ajouter/modifier/supprimer** un produit, ou **consulter/modifier/supprimer** une commande.

Clique **"Publier"** après avoir collé ces règles.

## 5. Ajouter des produits

Deux façons :

- **Produits de démonstration** : connecte-toi sur `admin.html`, dans le tableau de bord un bouton **"Charger les produits de démo"** apparaît tant qu'aucun produit n'existe. Il ajoute 8 produits d'exemple.
- **Tes propres produits** : onglet **Produits** → **"+ Ajouter un produit"** → sélectionne une image depuis ton téléphone/ordinateur (elle est automatiquement redimensionnée et enregistrée dans Firestore), renseigne nom, description, prix, catégorie.

## 6. Modifier le numéro WhatsApp

Dans `js/config.js` :

```js
const WHATSAPP_NUMBER = "243983016575";
```

## 7. Gérer les commandes

1. Un client ajoute des produits au panier, remplit ses informations sur `checkout.html`, clique **"Commander via WhatsApp"**.
2. La commande est enregistrée dans Firestore et un message pré-rempli s'ouvre dans WhatsApp.
3. Dans l'admin, onglet **Commandes**, clique **"Voir"** pour consulter le détail et changer le statut (`Nouvelle`, `En cours`, `Confirmée`, `Livrée`, `Annulée`), ou 🗑 pour la supprimer.

## 8. Publier les mises à jour sur GitHub Pages

Le site étant déjà sur GitHub Pages, il te suffit de remplacer les fichiers modifiés dans ton dépôt (via "Add file → Upload files" ou en éditant chaque fichier directement sur GitHub) pour que le site en ligne se mette à jour automatiquement en 1-2 minutes.

## Notes importantes

- Les produits et commandes sont maintenant partagés entre tous les visiteurs (contrairement à l'ancienne version LocalStorage) : c'est une vraie base de données en ligne.
- Le panier, lui, reste propre à chaque visiteur/appareil (LocalStorage).
- Les images sont stockées directement dans Firestore (en base64, redimensionnées automatiquement à 900px max) plutôt que dans Firebase Storage, pour éviter d'avoir à lier une carte bancaire (Storage nécessite désormais le plan payant Blaze, même pour un usage gratuit).
