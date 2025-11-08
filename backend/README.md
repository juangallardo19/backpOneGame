# 🎮 ONE Online Backend

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen?logo=spring)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-Academic-yellow)

**ONE Online** is a multiplayer card game backend developed with **Spring Boot**, featuring real-time gameplay via **WebSockets**, **OAuth2 authentication** (Google & GitHub), and comprehensive implementation of **11 design patterns** and **5 custom data structures** for academic purposes.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Design Patterns](#-design-patterns)
- [Data Structures](#-data-structures)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [WebSocket Events](#-websocket-events)
- [Game Rules](#-game-rules)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Gameplay
- 🃏 **Complete ONE card game** implementation (108 cards)
- 👥 **2-4 players** per game (including AI bots)
- 🤖 **Smart AI bots** with strategic decision-making
- ⚡ **Real-time gameplay** with WebSocket communication
- 🔄 **Turn-based system** with circular turn order
- 🎲 **Special cards**: Skip, Reverse, Draw Two, Wild, Wild Draw Four
- 🏆 **Win conditions** and scoring system
- ⏱️ **Configurable turn timer** (30-120 seconds)

### 🔐 Authentication & Security
- 🔑 **JWT authentication** for stateless sessions
- 🌐 **OAuth2 integration** (Google & GitHub)
- 🔒 **BCrypt password hashing**
- 🛡️ **Spring Security** configuration
- 🚫 **CORS protection** with configurable origins

### 🎮 Room Management
- 🏠 **Create public/private rooms**
- 🔢 **6-character unique room codes**
- 👤 **Room leader controls** (kick players, start game)
- 🤖 **Add/remove bots** (max 3 bots per room)
- 🔄 **Auto-reconnection system** with temporary bots
- 📊 **Real-time room status** updates

### 📊 Ranking & Statistics
- 🏅 **Global TOP 100 leaderboard**
- 📈 **Player statistics** (wins, games played, win rate)
- 📜 **Game history** tracking
- 🔥 **Win streaks** and achievements
- 💯 **Points system** (100, 200, or 500 points to win)

### 🎨 Advanced Features
- 💬 **Real-time chat** in game rooms
- 😀 **Emotes system**
- ↩️ **Undo/Redo** functionality (Command pattern)
- 🔄 **Game state management** (Lobby → Playing → GameOver)
- 📝 **Game move history** with bidirectional navigation
- 🎯 **Strategic bot AI** with decision tree

---

## 🛠️ Tech Stack

### Backend Framework
- **Java 21** - Latest LTS version
- **Spring Boot 3.5.7** - Modern enterprise framework
- **Gradle** - Build automation tool

### Core Dependencies
- **Spring Data JPA** - Database abstraction layer
- **Spring Security** - Authentication & authorization
- **Spring WebSocket** - Real-time bidirectional communication
- **Spring OAuth2 Client** - Google & GitHub integration
- **Spring Validation** - Input validation

### Database & Migrations
- **PostgreSQL 15** - Relational database
- **Flyway** - Database version control and migrations

### Security & Authentication
- **JWT (jjwt 0.12.6)** - JSON Web Tokens for stateless auth
- **BCrypt** - Password hashing algorithm
- **OAuth2** - Third-party authentication

### Utilities
- **Lombok** - Reduce boilerplate code
- **SLF4J** - Logging facade
- **Hypersistence Utils** - Hibernate enhancements for JSON support

### Testing
- **JUnit 5** - Unit testing framework
- **Spring Security Test** - Security testing utilities
- **Spring Boot Test** - Integration testing support

---

## 🎨 Design Patterns

This project implements **11 design patterns** as part of its academic objectives:

### Creational Patterns (5)

#### 1️⃣ **Singleton** - `GameManager`
```java
GameManager manager = GameManager.getInstance();
manager.addRoom(room);
```
**Purpose**: Single instance managing all active game rooms and sessions.

#### 2️⃣ **Factory Method** - `CardFactory`
```java
Card card = CardFactory.createCard(CardType.WILD, CardColor.NONE, 0);
List<Card> deck = CardFactory.createStandardDeck(); // 108 cards
```
**Purpose**: Centralized card creation without exposing instantiation logic.

#### 3️⃣ **Abstract Factory** - `CardSetFactory`
```java
List<Card> redCards = CardSetFactory.createRedCards(); // 25 red cards
List<Card> wildCards = CardSetFactory.createWildCards(); // 8 wild cards
```
**Purpose**: Create families of related cards (all cards of one color).

#### 4️⃣ **Builder** - `RoomBuilder`, `GameConfigBuilder`
```java
Room room = new RoomBuilder()
    .withLeader(player)
    .withMaxPlayers(4)
    .withPrivate(true)
    .build();
```
**Purpose**: Fluent API for constructing complex objects step-by-step.

#### 5️⃣ **Prototype** - `GameStatePrototype`
```java
GameState clonedState = gameState.clone();
```
**Purpose**: Clone game states for undo/replay functionality.

### Structural Patterns (2)

#### 6️⃣ **Adapter** - `BotPlayerAdapter`
```java
BotPlayerAdapter adapter = new BotPlayerAdapter(bot, session);
Card chosen = adapter.makeMove(topCard);
```
**Purpose**: Make Bot compatible with Player interface for polymorphic handling.

#### 7️⃣ **Decorator** - `CardDecorator`
```java
Card decoratedCard = new EffectDecorator(baseCard, Effect.DOUBLE_POINTS);
```
**Purpose**: Dynamically add effects and power-ups to cards.

### Behavioral Patterns (4)

#### 8️⃣ **Observer** - `GameObserver`, `WebSocketObserver`
```java
gameSession.addObserver(new WebSocketObserver(sessionId));
gameSession.notifyCardPlayed(player, card);
```
**Purpose**: Real-time notifications to all players via WebSocket.

#### 9️⃣ **Strategy** - `BotStrategy`
```java
Card chosenCard = botStrategy.chooseCard(bot, topCard, session);
```
**Purpose**: Encapsulate bot AI algorithms (strategic card selection).

#### 🔟 **State** - `GameState` (Lobby, Playing, GameOver)
```java
gameSession.transitionTo(new PlayingState());
```
**Purpose**: Manage game state transitions and behavior.

#### 1️⃣1️⃣ **Command** - `PlayCardCommand`, `DrawCardCommand`
```java
GameCommand command = new PlayCardCommand(player, card, session);
command.execute();
command.undo(); // Undo functionality
```
**Purpose**: Encapsulate actions for undo/redo functionality.

---

## 📊 Data Structures

This project implements **5 custom data structures**:

### 1️⃣ **LinkedList** (Singly Linked)
**Purpose**: Player card hands (dynamic size, frequent additions/removals)
```java
LinkedList<Card> hand = new LinkedList<>();
hand.add(card);
```

### 2️⃣ **DoublyLinkedList** (Bidirectional)
**Purpose**: Game move history (navigate forward and backward)
```java
DoublyLinkedList<GameMove> history = new DoublyLinkedList<>();
history.forwardIterator(); // → → →
history.backwardIterator(); // ← ← ←
```

### 3️⃣ **CircularDoublyLinkedList** (⭐ Critical!)
**Purpose**: Turn order management with Reverse card support
```java
CircularDoublyLinkedList<Player> turnOrder = new CircularDoublyLinkedList<>();
turnOrder.getNext(); // Advances turn
turnOrder.reverse(); // Reverse card!
turnOrder.skip(); // Skip card!
```

### 4️⃣ **DecisionTree** (Tree Graph)
**Purpose**: Bot AI decision-making with lookahead
```java
DecisionTree<GameState> tree = new DecisionTree<>(3); // depth 3
DecisionNode<GameState> bestMove = tree.findBestMove();
```

### 5️⃣ **PlayerRelationGraph** (Graph)
**Purpose**: Track player interactions (who targeted whom)
```java
PlayerRelationGraph<String> graph = new PlayerRelationGraph<>();
graph.addInteraction(player1, player2, InteractionType.DRAW_TWO);
```

---

## 🏗️ Architecture

The project follows **Clean Architecture** principles with clear separation of concerns:

```
com.oneonline.backend/
├── config/              # Spring configuration (Security, CORS, OAuth2, WebSocket)
├── controller/          # REST API endpoints & WebSocket controllers
│   ├── AuthController
│   ├── RoomController
│   ├── GameController
│   ├── RankingController
│   └── WebSocketGameController
├── model/
│   ├── entity/         # JPA entities (database)
│   │   ├── User
│   │   ├── PlayerStats
│   │   ├── GameHistory
│   │   └── GlobalRanking
│   ├── domain/         # In-memory game objects
│   │   ├── Card (NumberCard, WildCard, etc.)
│   │   ├── Player, BotPlayer
│   │   ├── Room, GameSession
│   │   └── Deck
│   └── enums/          # Enumerations
│       ├── CardType, CardColor
│       ├── GameStatus, RoomStatus
│       └── PlayerStatus
├── repository/         # JPA repositories (data access)
│   ├── UserRepository
│   ├── PlayerStatsRepository
│   ├── GameHistoryRepository
│   └── GlobalRankingRepository
├── service/            # Business logic
│   ├── auth/          # Authentication services
│   ├── game/          # Game logic services
│   ├── bot/           # Bot AI services
│   └── ranking/       # Ranking & statistics
├── pattern/            # Design pattern implementations
│   ├── creational/    # Singleton, Factory, Builder, Prototype
│   ├── structural/    # Adapter, Decorator
│   └── behavioral/    # Observer, Strategy, State, Command
├── datastructure/      # Custom data structures
│   ├── LinkedList
│   ├── DoublyLinkedList
│   ├── CircularDoublyLinkedList
│   ├── DecisionTree
│   └── PlayerRelationGraph
├── dto/                # Data Transfer Objects
│   ├── request/       # API request DTOs
│   └── response/      # API response DTOs
├── security/           # Security configuration
│   ├── JwtAuthFilter
│   ├── JwtTokenProvider
│   ├── OAuth2SuccessHandler
│   └── CustomUserDetailsService
├── exception/          # Exception handling
│   ├── GlobalExceptionHandler
│   └── Custom exceptions
└── util/               # Utility classes
    ├── CodeGenerator
    ├── PasswordUtil
    └── ValidationUtils
```

---

## 🚀 Getting Started

### Prerequisites
- ☕ **Java 21** (or higher)
- 🐘 **PostgreSQL 15** (or higher)
- 🏗️ **Gradle 8.0+** (included via wrapper)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/juangallardo19/OneOnlineBackend.git
cd OneOnlineBackend
```

2. **Configure database** (see [Configuration](#-configuration))

3. **Build the project**
```bash
./gradlew clean build
```

4. **Run the application**
```bash
./gradlew bootRun
```

The server will start on `http://localhost:8080`

---

## ⚙️ Configuration

### Database Setup

1. **Create PostgreSQL database**
```sql
CREATE DATABASE oneonline_db;
CREATE USER oneonline_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE oneonline_db TO oneonline_user;
```

2. **Update `application.properties`**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/oneonline_db
spring.datasource.username=oneonline_user
spring.datasource.password=your_secure_password
```

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/oneonline_db
DATABASE_USER=oneonline_user
DATABASE_PASSWORD=your_secure_password

# JWT Secret (IMPORTANT: Change in production!)
# Generate with: openssl rand -base64 64
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRATION=86400000          # 24 hours
JWT_REFRESH_EXPIRATION=604800000 # 7 days

# OAuth2 - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth2 - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=8080
```

### OAuth2 Setup

#### Google OAuth2
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8080/oauth2/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth2
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:8080/oauth2/callback/github`
4. Copy Client ID and Client Secret to `.env`

### Flyway Migrations

Database migrations are automatically applied on startup. Migration files are in:
```
src/main/resources/db/migration/
├── V1__Create_users_table.sql
├── V2__Create_player_stats_table.sql
├── V3__Create_game_history_table.sql
└── V4__Create_global_ranking_table.sql
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login with credentials | ❌ |
| GET | `/oauth2/authorize/google` | Google OAuth2 login | ❌ |
| GET | `/oauth2/authorize/github` | GitHub OAuth2 login | ❌ |
| POST | `/api/auth/refresh` | Refresh JWT token | ✅ |
| GET | `/api/auth/me` | Get current user info | ✅ |

### Room Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/rooms` | Create new room | ✅ |
| GET | `/api/rooms/public` | List public rooms | ✅ |
| POST | `/api/rooms/{code}/join` | Join room by code | ✅ |
| DELETE | `/api/rooms/{code}` | Delete room (leader only) | ✅ |
| POST | `/api/rooms/{code}/bots` | Add bot to room | ✅ |
| DELETE | `/api/rooms/{code}/bots/{botId}` | Remove bot | ✅ |
| POST | `/api/rooms/{code}/kick/{playerId}` | Kick player (leader only) | ✅ |

### Game Actions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/game/{sessionId}/start` | Start game | ✅ |
| POST | `/api/game/{sessionId}/play` | Play a card | ✅ |
| POST | `/api/game/{sessionId}/draw` | Draw a card | ✅ |
| POST | `/api/game/{sessionId}/one` | Call "ONE" | ✅ |
| GET | `/api/game/{sessionId}/state` | Get game state | ✅ |
| POST | `/api/game/{sessionId}/undo` | Undo last move | ✅ |
| POST | `/api/game/{sessionId}/catch-one/{playerId}` | Catch player without ONE | ✅ |

### Rankings & Statistics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ranking/global` | Global TOP 100 leaderboard | ✅ |
| GET | `/api/ranking/stats/{userId}` | Player statistics | ✅ |
| GET | `/api/ranking/history/{userId}` | Player game history | ✅ |

---

## 🔌 WebSocket Events

Connect to: `ws://localhost:8080/ws/game/{sessionId}`

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `PLAY_CARD` | `{playerId, cardId}` | Play a card |
| `DRAW_CARD` | `{playerId}` | Draw a card |
| `CALL_ONE` | `{playerId}` | Call "ONE" |
| `SEND_MESSAGE` | `{playerId, message}` | Send chat message |
| `SEND_EMOTE` | `{playerId, emoteId}` | Send emote |

### Server → Client Events

| Event | Description |
|-------|-------------|
| `PLAYER_JOINED` | Player joined room |
| `PLAYER_LEFT` | Player left room |
| `GAME_STARTED` | Game has started |
| `CARD_PLAYED` | Player played a card |
| `CARD_DRAWN` | Player drew cards |
| `ONE_CALLED` | Player called "ONE" |
| `ONE_PENALTY` | Player penalized for not calling ONE |
| `TURN_CHANGED` | Turn advanced to next player |
| `DIRECTION_REVERSED` | Turn direction reversed |
| `PLAYER_SKIPPED` | Player's turn was skipped |
| `COLOR_CHANGED` | Wild card color chosen |
| `GAME_ENDED` | Game finished with winner |
| `PLAYER_DISCONNECTED` | Player disconnected |
| `PLAYER_RECONNECTED` | Player reconnected |

---

## 🃏 Game Rules

### Card Distribution (108 cards total)
- **Number cards (0-9)**: 76 cards
  - One 0 per color: 4 cards
  - Two of each 1-9 per color: 72 cards
- **Skip cards**: 8 cards (2 per color)
- **Reverse cards**: 8 cards (2 per color)
- **Draw Two (+2) cards**: 8 cards (2 per color)
- **Wild cards**: 4 cards
- **Wild Draw Four (+4) cards**: 4 cards

### How to Play
1. Each player starts with **7 cards**
2. Top card is placed face-up to start discard pile
3. Players take turns in order (clockwise by default)
4. On your turn, you must:
   - **Play a card** that matches the color OR number of the top card
   - **Play a special card** (Skip, Reverse, Draw Two)
   - **Play a Wild card** (any time)
   - **Draw a card** if you can't play

### Special Cards
- **Skip** 🚫 - Next player loses their turn
- **Reverse** 🔄 - Direction of play reverses
- **Draw Two** (+2) - Next player draws 2 cards and loses turn
- **Wild** 🎨 - Play on any color, choose new color
- **Wild Draw Four** (+4) - Choose new color, next player draws 4 cards

### Calling "ONE"
- When you have **exactly 1 card left**, you must call "ONE"
- If you forget, any player can catch you
- **Penalty**: Draw 2 cards if caught

### Winning
- First player to **0 cards** wins the round
- Points are calculated based on remaining cards in opponents' hands
- First player to reach target points (100, 200, or 500) wins the game

---

## 🗄️ Database Schema

### users
```sql
id              BIGSERIAL PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
nickname        VARCHAR(50) UNIQUE NOT NULL
password_hash   VARCHAR(255)
auth_provider   VARCHAR(20)          -- LOCAL, GOOGLE, GITHUB
profile_picture VARCHAR(500)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### player_stats
```sql
id              BIGSERIAL PRIMARY KEY
user_id         BIGINT REFERENCES users(id)
total_wins      INTEGER DEFAULT 0
total_games     INTEGER DEFAULT 0
win_rate        DECIMAL(5,2)
current_streak  INTEGER DEFAULT 0
updated_at      TIMESTAMP DEFAULT NOW()
```

### game_history
```sql
id              BIGSERIAL PRIMARY KEY
room_code       VARCHAR(6)
winner_id       BIGINT REFERENCES users(id)
player_ids      BIGINT[]
duration_minutes INTEGER
created_at      TIMESTAMP DEFAULT NOW()
```

### global_ranking
```sql
id              BIGSERIAL PRIMARY KEY
user_id         BIGINT REFERENCES users(id)
rank            INTEGER
total_wins      INTEGER
points          INTEGER
updated_at      TIMESTAMP DEFAULT NOW()
```

---

## 👨‍💻 Development

### Project Structure Highlights

#### Services Layer
- **GameEngine**: Orchestrates all game logic
- **TurnManager**: Manages turn order and turn transitions
- **CardValidator**: Validates if cards can be played
- **EffectProcessor**: Applies card effects (Skip, Reverse, etc.)
- **OneManager**: Manages "ONE" calls and penalties
- **BotStrategy**: AI decision-making for bots
- **RoomManager**: Manages game rooms

#### Key Classes
- **GameSession**: Represents an active game
- **Player**: Human player in a game
- **BotPlayer**: AI player (extends Player)
- **Card**: Base card class with specific implementations
- **Deck**: Card deck with draw and shuffle functionality
- **Room**: Game room containing players

### Code Quality
- ✅ Lombok for reduced boilerplate
- ✅ SLF4J logging throughout
- ✅ JavaDoc comments for public APIs
- ✅ Input validation with Spring Validation
- ✅ Global exception handling
- ✅ Thread-safe collections where needed

---

## 🧪 Testing

### Run Tests
```bash
./gradlew test
```

### Test Coverage
```bash
./gradlew jacocoTestReport
```
Report generated in: `build/reports/jacoco/test/html/index.html`

### Integration Tests
```bash
./gradlew integrationTest
```

---

## 🚀 Deployment

### Build for Production
```bash
./gradlew clean build -Pprod
```

### Run Production Build
```bash
java -jar build/libs/oneonline-backend-0.0.1-SNAPSHOT.jar
```

### Docker Deployment (Optional)
```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
docker build -t oneonline-backend .
docker run -p 8080:8080 oneonline-backend
```

### Environment Configuration
Make sure to set all environment variables in production:
- ✅ Change `JWT_SECRET` to a secure random value
- ✅ Use production database credentials
- ✅ Configure OAuth2 with production callback URLs
- ✅ Set `FRONTEND_URL` to your frontend domain
- ✅ Enable HTTPS in production

---

## 📝 License

This project is developed for **academic purposes** as part of a university software engineering course.

**Academic License** - This project demonstrates:
- ✅ Design patterns implementation
- ✅ Custom data structures
- ✅ Clean architecture principles
- ✅ Enterprise Spring Boot development
- ✅ Real-time communication
- ✅ OAuth2 authentication
- ✅ Database design and migrations

---


## 🙏 Acknowledgments

- Spring Boot team for excellent framework
- Anthropic Claude for code assistance
- ONE card game for inspiration
- University professors for guidance

---

## 📞 Support

For questions or issues:
1. Check existing documentation
2. Review code comments and JavaDoc
3. Open an issue on GitHub
4. Contact author via email

---

<div align="center">

Made with ❤️ for Software Engineering Course

**⭐ Star this repo if you find it helpful!**

</div>
