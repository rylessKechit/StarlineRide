# 🚗 LuxeRide API Documentation

## Table des Matières

- [🔧 Installation & Configuration](#installation--configuration)
- [🔐 Authentification](#authentification)
- [📍 Endpoints](#endpoints)
  - [Auth](#auth-endpoints)
  - [Bookings](#booking-endpoints)
  - [Drivers](#driver-endpoints)
  - [Payments](#payment-endpoints)
  - [Reviews](#review-endpoints)
- [🌐 WebSocket Events](#websocket-events)
- [📊 Error Handling](#error-handling)
- [🧪 Testing](#testing)

---

## 🔧 Installation & Configuration

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Compte Stripe

### Variables d'environnement (.env)

```bash
# Server
NODE_ENV=development
PORT=6000
FRONTEND_URL=http://localhost:3000

# Database PostgreSQL
DATABASE_URL="postgresql://username@localhost:5432/luxeride"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Sendgrid/SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@luxeride.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

---

## 🔐 Authentification

### Système JWT

L'API utilise des tokens JWT pour l'authentification. Incluez le token dans l'header :

```http
Authorization: Bearer your-jwt-token
```

### Types d'utilisateurs

- **user** : Client final
- **driver** : Chauffeur
- **admin** : Administrateur (futur)

---

## 📍 Endpoints

## Auth Endpoints

### 👤 Inscription Client

```http
POST /api/auth/register/user
```

**Body:**

```json
{
  "email": "client@example.com",
  "phone": "+33123456789",
  "firstName": "John",
  "lastName": "Doe",
  "password": "StrongPassword123!",
  "dateOfBirth": "1990-01-01T00:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": "uuid",
      "email": "client@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "membershipTier": "STANDARD",
      "loyaltyPoints": 0
    },
    "token": "jwt-token"
  }
}
```

### 🚗 Inscription Chauffeur

```http
POST /api/auth/register/driver
```

**Body:**

```json
{
  "email": "driver@example.com",
  "phone": "+33123456789",
  "firstName": "Pierre",
  "lastName": "Martin",
  "password": "StrongPassword123!",
  "dateOfBirth": "1985-01-01T00:00:00.000Z",
  "licenseNumber": "FR123456789",
  "licenseExpiry": "2025-12-31T00:00:00.000Z",
  "experience": 5,
  "languages": ["fr", "en"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Compte chauffeur créé avec succès",
  "data": {
    "driver": {
      "id": "uuid",
      "email": "driver@example.com",
      "firstName": "Pierre",
      "lastName": "Martin",
      "licenseNumber": "FR123456789",
      "status": "OFFLINE",
      "rating": 5.0
    },
    "token": "jwt-token"
  }
}
```

### 🔑 Connexion

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password",
  "userType": "user" // ou "driver"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      /* user data */
    },
    "token": "jwt-token",
    "userType": "user"
  }
}
```

### 👤 Profil Utilisateur

```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "membershipTier": "GOLD",
      "loyaltyPoints": 250,
      "addresses": [...]
    }
  }
}
```

### ✏️ Modifier Profil

```http
PUT /api/auth/profile
Authorization: Bearer {token}
```

**Body:**

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+33987654321",
  "language": "en",
  "currency": "USD"
}
```

### 🔒 Changer Mot de Passe

```http
PUT /api/auth/change-password
Authorization: Bearer {token}
```

**Body:**

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newStrongPassword123!"
}
```

---

## Booking Endpoints

### 🚗 Créer une Réservation

```http
POST /api/bookings
Authorization: Bearer {user-token}
```

**Body:**

```json
{
  "pickupAddress": "1 Rue de Rivoli, 75001 Paris",
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "dropoffAddress": "Tour Eiffel, Paris",
  "dropoffLat": 48.8584,
  "dropoffLng": 2.2945,
  "scheduledFor": "2024-01-15T14:30:00.000Z",
  "vehicleCategory": "BERLINE_EXECUTIVE",
  "passengerCount": 2,
  "specialRequests": "Merci d'attendre devant l'entrée principale"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Réservation créée avec succès",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "pickupAddress": "1 Rue de Rivoli, 75001 Paris",
      "dropoffAddress": "Tour Eiffel, Paris",
      "scheduledFor": "2024-01-15T14:30:00.000Z",
      "estimatedPrice": 25.5,
      "estimatedDuration": 18,
      "estimatedDistance": 4.2,
      "status": "PENDING"
    },
    "availableDrivers": 3
  }
}
```

### 📋 Mes Réservations

```http
GET /api/bookings/my-bookings?status=COMPLETED&limit=10&offset=0
Authorization: Bearer {user-token}
```

**Query Parameters:**

- `status` (optionnel) : PENDING, CONFIRMED, COMPLETED, CANCELLED
- `limit` (optionnel) : Nombre de résultats (défaut: 20)
- `offset` (optionnel) : Décalage (défaut: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "pickupAddress": "...",
        "dropoffAddress": "...",
        "scheduledFor": "...",
        "status": "COMPLETED",
        "finalPrice": 25.5,
        "driver": {
          "firstName": "Pierre",
          "lastName": "Martin",
          "rating": 4.8
        },
        "vehicle": {
          "brand": "Mercedes",
          "model": "Classe E",
          "licensePlate": "AB-123-CD"
        }
      }
    ]
  }
}
```

### ✅ Accepter une Course (Chauffeur)

```http
POST /api/bookings/{bookingId}/accept
Authorization: Bearer {driver-token}
```

**Response:**

```json
{
  "success": true,
  "message": "Course acceptée avec succès",
  "data": {
    "booking": {
      "id": "uuid",
      "status": "DRIVER_ASSIGNED",
      "driver": {
        /* driver info */
      },
      "vehicle": {
        /* vehicle info */
      }
    },
    "clientInfo": {
      "firstName": "John",
      "lastName": "D.",
      "phone": "+33123456789"
    }
  }
}
```

### 🔄 Mettre à Jour Statut

```http
PUT /api/bookings/{bookingId}/status
Authorization: Bearer {token}
```

**Body:**

```json
{
  "status": "DRIVER_ARRIVED",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

**Statuts disponibles:**

- `PENDING` : En attente de chauffeur
- `CONFIRMED` : Confirmée
- `DRIVER_ASSIGNED` : Chauffeur assigné
- `DRIVER_EN_ROUTE` : Chauffeur en route
- `DRIVER_ARRIVED` : Chauffeur arrivé
- `IN_PROGRESS` : Course en cours
- `COMPLETED` : Terminée
- `CANCELLED` : Annulée
- `NO_SHOW` : Client absent

### ❌ Annuler une Réservation

```http
POST /api/bookings/{bookingId}/cancel
Authorization: Bearer {token}
```

**Body:**

```json
{
  "reason": "Changement de programme"
}
```

---

## Driver Endpoints

### 🟢 Mettre à Jour Statut

```http
PUT /api/drivers/status
Authorization: Bearer {driver-token}
```

**Body:**

```json
{
  "status": "AVAILABLE",
  "isOnline": true,
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

**Statuts chauffeur:**

- `OFFLINE` : Hors ligne
- `AVAILABLE` : Disponible
- `BUSY` : Occupé
- `BREAK` : En pause

### 📍 Mettre à Jour Position

```http
PUT /api/drivers/location
Authorization: Bearer {driver-token}
```

**Body:**

```json
{
  "lat": 48.8566,
  "lng": 2.3522,
  "heading": 45,
  "speed": 30
}
```

### 📊 Statistiques Chauffeur

```http
GET /api/drivers/stats?period=month
Authorization: Bearer {driver-token}
```

**Query Parameters:**

- `period` : day, week, month, year

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "period": "month",
      "rides": {
        "total": 45,
        "totalRevenue": 1250.5,
        "averageRevenue": 27.79,
        "totalDistance": 320.5
      },
      "earnings": {
        "gross": 1250.5,
        "commission": 250.1,
        "net": 1000.4
      },
      "rating": {
        "average": 4.7,
        "reviewCount": 38
      }
    }
  }
}
```

### 💰 Revenus Détaillés

```http
GET /api/drivers/earnings?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
Authorization: Bearer {driver-token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "earnings": [
      {
        "period": "2024-01-15",
        "gross": 85.5,
        "commission": 17.1,
        "net": 68.4,
        "rides": 3
      }
    ],
    "total": 1000.4
  }
}
```

### 🚙 Ajouter un Véhicule

```http
POST /api/drivers/vehicles
Authorization: Bearer {driver-token}
```

**Body:**

```json
{
  "brand": "Mercedes",
  "model": "Classe E",
  "year": 2022,
  "color": "Noir",
  "licensePlate": "AB-123-CD",
  "category": "BERLINE_EXECUTIVE",
  "maxPassengers": 4,
  "features": ["WiFi", "Chargeurs USB", "Eau"],
  "hasWifi": true,
  "hasChargers": true,
  "hasAC": true
}
```

### 🚗 Activer/Désactiver Véhicule

```http
PUT /api/drivers/vehicles/{vehicleId}/toggle
Authorization: Bearer {driver-token}
```

**Body:**

```json
{
  "isActive": true
}
```

### 📱 Dashboard Chauffeur

```http
GET /api/drivers/dashboard
Authorization: Bearer {driver-token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "dashboard": {
      "today": {
        "rides": 3,
        "earnings": 95.5
      },
      "week": {
        "rides": 18,
        "earnings": 485.2
      },
      "driver": {
        "status": "AVAILABLE",
        "isOnline": true,
        "rating": 4.8,
        "totalRides": 245
      },
      "activeRide": {
        "id": "uuid",
        "status": "IN_PROGRESS",
        "user": {
          "firstName": "Marie",
          "phone": "+33123456789"
        }
      },
      "pendingRequests": 2
    }
  }
}
```

### 📋 Demandes à Proximité

```http
GET /api/drivers/nearby-requests?radius=10
Authorization: Bearer {driver-token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "booking-uuid",
        "pickupAddress": "Gare du Nord, Paris",
        "dropoffAddress": "CDG Airport",
        "estimatedPrice": 55.0,
        "estimatedDistance": 35.2,
        "distance": 2.5,
        "scheduledFor": "2024-01-15T15:00:00.000Z",
        "user": {
          "firstName": "Sophie",
          "membershipTier": "GOLD"
        }
      }
    ]
  }
}
```

---

## Payment Endpoints

### 💳 Créer Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer {user-token}
```

**Body:**

```json
{
  "bookingId": "booking-uuid",
  "paymentMethod": "CARD"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment Intent créé avec succès",
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "payment-uuid",
    "amount": 25.5,
    "breakdown": {
      "basePrice": 20.0,
      "distancePrice": 10.5,
      "timePrice": 7.5,
      "surcharge": 0.0,
      "discount": 2.5,
      "total": 25.5
    }
  }
}
```

### ✅ Confirmer Paiement

```http
POST /api/payments/confirm
Authorization: Bearer {user-token}
```

**Body:**

```json
{
  "paymentId": "payment-uuid",
  "paymentIntentId": "pi_xxx",
  "tip": 5.0
}
```

### 📊 Historique Paiements

```http
GET /api/payments/history?limit=20&offset=0&status=COMPLETED
Authorization: Bearer {user-token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 30.5,
        "tip": 5.0,
        "status": "COMPLETED",
        "method": "CARD",
        "paidAt": "2024-01-15T16:30:00.000Z",
        "booking": {
          "pickupAddress": "...",
          "dropoffAddress": "...",
          "completedAt": "2024-01-15T16:25:00.000Z"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "hasMore": true
    }
  }
}
```

### 💸 Remboursement

```http
POST /api/payments/refund
Authorization: Bearer {token}
```

**Body:**

```json
{
  "paymentId": "payment-uuid",
  "reason": "Course annulée par le chauffeur",
  "amount": 25.5
}
```

### 🧮 Calculer Prix

```http
POST /api/payments/calculate-price
Authorization: Bearer {user-token}
```

**Body:**

```json
{
  "bookingId": "booking-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "priceBreakdown": {
      "basePrice": 20.0,
      "distancePrice": 10.5,
      "timePrice": 7.5,
      "surcharge": 0.0,
      "discount": 2.5,
      "total": 25.5
    },
    "membershipTier": "GOLD"
  }
}
```

---

## Review Endpoints

### ⭐ Créer un Avis

```http
POST /api/reviews
Authorization: Bearer {user-token}
```

**Body:**

```json
{
  "bookingId": "booking-uuid",
  "overallRating": 5,
  "punctualityRating": 5,
  "cleanlinessRating": 4,
  "professionalismRating": 5,
  "vehicleRating": 4,
  "comment": "Excellent service, chauffeur très professionnel et véhicule impeccable !"
}
```

### 💬 Répondre à un Avis (Chauffeur)

```http
POST /api/reviews/{reviewId}/respond
Authorization: Bearer {driver-token}
```

**Body:**

```json
{
  "response": "Merci beaucoup pour votre retour positif ! Ce fut un plaisir de vous conduire."
}
```

### 📋 Avis d'un Chauffeur

```http
GET /api/reviews/driver/{driverId}?limit=10&rating=5&sortBy=recent
```

**Query Parameters:**

- `limit` : Nombre d'avis
- `rating` : Filtrer par note (1-5)
- `sortBy` : recent, rating_high, rating_low

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "overallRating": 5,
        "comment": "Excellent service !",
        "createdAt": "2024-01-15T16:30:00.000Z",
        "driverResponse": "Merci !",
        "user": {
          "name": "Sophie D.",
          "membershipTier": "GOLD"
        },
        "booking": {
          "completedAt": "2024-01-15T16:25:00.000Z",
          "estimatedDistance": 12.5
        }
      }
    ],
    "stats": {
      "totalReviews": 85,
      "averageRating": 4.7,
      "averagePunctuality": 4.8,
      "averageCleanliness": 4.6,
      "averageProfessionalism": 4.9,
      "averageVehicle": 4.5
    },
    "ratingDistribution": [
      { "rating": 5, "count": 65 },
      { "rating": 4, "count": 15 },
      { "rating": 3, "count": 3 },
      { "rating": 2, "count": 1 },
      { "rating": 1, "count": 1 }
    ]
  }
}
```

### 📊 Statistiques Détaillées Chauffeur

```http
GET /api/reviews/driver/{driverId}/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "driver": {
      "name": "Pierre Martin",
      "currentRating": 4.7,
      "totalRides": 245
    },
    "globalStats": {
      "totalReviews": 85,
      "averageRating": 4.7,
      "averagePunctuality": 4.8,
      "averageCleanliness": 4.6,
      "averageProfessionalism": 4.9,
      "averageVehicle": 4.5
    },
    "monthlyTrend": [
      {
        "month": "2024-01-01T00:00:00.000Z",
        "reviewCount": 15,
        "averageRating": 4.8
      }
    ],
    "keywordAnalysis": {
      "topKeywords": [
        { "word": "professionnel", "count": 25 },
        { "word": "ponctuel", "count": 20 },
        { "word": "propre", "count": 18 }
      ],
      "sentiment": {
        "positive": 78,
        "negative": 2,
        "neutral": 5,
        "total": 85
      }
    }
  }
}
```

### 🚨 Signaler un Avis

```http
POST /api/reviews/{reviewId}/report
Authorization: Bearer {token}
```

**Body:**

```json
{
  "reason": "Contenu inapproprié"
}
```

**Raisons disponibles:**

- Contenu inapproprié
- Spam
- Faux avis
- Harcèlement
- Discrimination
- Autre

---

## 🌐 WebSocket Events

### Connexion

```javascript
import io from "socket.io-client";

const socket = io("ws://localhost:6000", {
  auth: {
    token: "your-jwt-token",
  },
});
```

### Events Client

#### 📍 Suivre un Chauffeur

```javascript
socket.emit("track_driver", driverId);

socket.on("driver_location", (data) => {
  console.log("Position chauffeur:", data.location);
});
```

#### 💬 Rejoindre une Course

```javascript
socket.emit("join_ride", bookingId);

socket.on("new_message", (data) => {
  console.log("Nouveau message:", data.message);
});
```

### Events Chauffeur

#### 🟢 Se Mettre Disponible

```javascript
socket.emit("driver_available", {
  location: { lat: 48.8566, lng: 2.3522 },
});

socket.on("new_ride_request", (data) => {
  console.log("Nouvelle demande:", data);
});
```

#### 📍 Envoyer Position

```javascript
socket.emit("location_update", {
  lat: 48.8566,
  lng: 2.3522,
  heading: 45,
  speed: 30,
});
```

### Events Communs

#### 📱 Notifications

```javascript
socket.on("booking_status_update", (data) => {
  console.log("Statut mis à jour:", data.status);
});

socket.on("payment_received", (data) => {
  console.log("Paiement reçu:", data.amount);
});

socket.on("new_review", (data) => {
  console.log("Nouvel avis:", data.rating);
});
```

---

## 📊 Error Handling

### Format de Réponse d'Erreur

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

### Codes d'Erreur HTTP

- `400` : Bad Request (données invalides)
- `401` : Unauthorized (token manquant/invalide)
- `403` : Forbidden (accès refusé)
- `404` : Not Found (ressource non trouvée)
- `409` : Conflict (conflit de données)
- `429` : Too Many Requests (rate limiting)
- `500` : Internal Server Error

### Erreurs Communes

#### Token Expiré

```json
{
  "success": false,
  "message": "Token expiré"
}
```

#### Validation Échouée

```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    {
      "field": "password",
      "message": "Le mot de passe doit contenir au moins 8 caractères"
    }
  ]
}
```

---

## 🧪 Testing

### Exemples avec cURL

#### Inscription

```bash
curl -X POST http://localhost:6000/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+33123456789",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!"
  }'
```

#### Connexion

```bash
curl -X POST http://localhost:6000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "userType": "user"
  }'
```

#### Créer Réservation

```bash
curl -X POST http://localhost:6000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pickupAddress": "1 Rue de Rivoli, Paris",
    "pickupLat": 48.8566,
    "pickupLng": 2.3522,
    "dropoffAddress": "Tour Eiffel, Paris",
    "dropoffLat": 48.8584,
    "dropoffLng": 2.2945,
    "scheduledFor": "2024-01-15T14:30:00.000Z"
  }'
```

### Collection Postman

Importez cette collection dans Postman pour tester facilement tous les endpoints :

```json
{
  "info": {
    "name": "LuxeRide API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:6000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 📋 Catégories de Véhicules

```javascript
const VEHICLE_CATEGORIES = {
  BERLINE_EXECUTIVE: "Berline Exécutive",
  SUV_LUXE: "SUV Luxe",
  VAN_PREMIUM: "Van Premium",
  SUPERCAR: "Supercar",
  ELECTRIC_PREMIUM: "Électrique Premium",
};
```

## 🏆 Niveaux de Fidélité

```javascript
const MEMBERSHIP_TIERS = {
  STANDARD: "Standard (0% réduction)",
  GOLD: "Gold (5% réduction)",
  PLATINUM: "Platinum (10% réduction)",
  VIP: "VIP (15% réduction)",
};
```

## 💳 Méthodes de Paiement

```javascript
const PAYMENT_METHODS = {
  CARD: "Carte bancaire",
  PAYPAL: "PayPal",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
  CORPORATE: "Compte entreprise",
};
```

---

## 🚀 Déploiement

### Variables de Production

```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:password@prod_host:5432/luxeride_prod
JWT_SECRET=super_secure_production_secret
STRIPE_SECRET_KEY=sk_live_...
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 6000
CMD ["npm", "start"]
```

---

## 📞 Support

Pour toute question sur l'API :

- 📧 Email : dev@luxeride.com
- 📚 Documentation : https://docs.luxeride.com
- 🐛 Issues : https://github.com/luxeride/backend/issues

---

**LuxeRide API v1.0** - Documentation générée automatiquement
