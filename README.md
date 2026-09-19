# Paws & Play: 3D Pet Daycare 🐶🐱🐰🐹🍊✨

A cozy, charming 3D animal daycare simulation game built with **Three.js** and the **Web Audio API**.

Care for puppies, kittens, bunnies, guinea pigs, and a giant capybara! Feed delicious kibble, draw warm bubble baths in the clawfoot tub, play fetch with tennis balls in the backyard, cradle pets in your arms, tuck them into plush donut beds for sweet naps, and restock your supplies at the rustic timber Supply Cabin.

---

## 🌟 Key Features

- **🐾 Diverse Pet Companions**:
  - **Dogs** (Corgi & Golden Retriever): Eager fetchers and friendly tail waggers.
  - **Cats** (Calico): Playful stalkers who love feather wands and climbing the cat tree.
  - **Bunnies** (Dutch Lop): Gentle hop-around friends with twitching ears.
  - **Guinea Pigs** (Abyssinian): Adorable squeaking critters that love fresh veggies.
  - **Giant Capybara ("Yuzu")**: Serene, friendly capybara with a smoothly rounded head and a balanced orange on top.

- **🤲 Pick Up & Carry System**:
  - Cradle any pet directly in your arms with natural cradling poses and gentle walking bobs.
  - Hand-feed, groom, or wave toys to pets while carrying them.
  - Context-aware placement: Walk up to the clawfoot bathtub, pet beds, or cat tree and press `[E]` (or tap) to place them into the station!

- **🪵 Supply Cabin ("Paws & Pantry")**:
  - Handcrafted rustic log cabin in the backyard with stacked horizontal cedar logs and dovetail corner notches.
  - Vaulted cedar shingle roof and a fieldstone chimney emitting drifting smoke puffs.
  - Covered front porch with a warm flickering amber lantern and carved signboard.
  - Free, instant restocking for all tools (kibble bowls, water jugs, bath sponges, tennis balls, feather wands).

- **❤️ Realistic Pet Needs Engine**:
  - **🍖 Hunger**: Fill feeding bowls or hand-feed crunchy kibble.
  - **💧 Thirst**: Keep fresh water carboys topped off.
  - **🧼 Cleanliness**: Warm bubble baths in the grooming tub or coat brushing.
  - **🎾 Fun & Play**: Throw tennis balls in the yard for dogs or wave feather wands for cats.
  - **💤 Energy**: Tuck sleepy pets into plush donut beds for sweet dreams (`Zzz`).
  - **💖 Love & Snuggles**: Pet them anytime for purrs, barks, tail wags, and floating hearts.

- **🏪 Customer System & Upgrades**:
  - Pet owners visit reception to drop off their companions with personalized notes.
  - Satisfied owners return at pick-up time, leaving generous coin tips and 5-star reviews.
  - Invest coins in the **Daycare Upgrades Store** for party hats, auto-feeders, hydro-jet spas, and expanded capacity.

- **📱 Fully Cross-Platform (Desktop & iPad / Mobile)**:
  - **Desktop**: Full keyboard (WASD / Arrows), mouse look perspective, hotbar keys `1`–`6`, and `[E]` / `[Space]` action keys.
  - **iPad / Tablet / Touch**: Responsive virtual joystick, tap-to-select hotbar, and floating contextual action button (`🐾 ACTION` / `🤲 PUT DOWN` / `🧺 RESTOCK`).

- **⚡ Zero External Asset Dependencies**:
  - 100% procedural 3D Three.js geometry, procedural Canvas textures, and procedural Web Audio API synthesis.
  - Instantaneous load times with zero external 3D model or audio file dependencies.

---

## 🎮 Controls Reference

| Action | Desktop (Keyboard & Mouse) | iPad / Mobile Touch |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | Left Virtual Joystick |
| **Look Around** | Move Mouse (direct perspective) | Swipe on right side of screen |
| **Zoom In / Out** | Mouse Scroll Wheel | Two-finger pinch gesture |
| **Select Tool** | Number keys `1`–`6` or Click Hotbar | Tap Hotbar slot at bottom |
| **Interact / Action** | `E`, `Space`, or Left Click | Tap `🐾 ACTION` floating button |
| **Pick Up Pet** | Equip `[1] Hands` & press `E` near pet | Equip `Hands` & tap `🐾 ACTION` |
| **Put Down Pet** | Press `E` or `Space` while carrying | Tap `🤲 PUT DOWN` button |
| **Restock Supplies** | Walk to Supply Cabin & press `E` | Walk to Supply Cabin & tap `🧺 RESTOCK` |
| **Quick Modals** | Click HUD buttons (Store, Cabin, Guide) | Tap HUD icon buttons |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer recommended)
- `npm`

### Installation
```bash
git clone git@github.com:MingatGames/pet-daycare.git
cd pet-daycare
npm install
```

### Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to start playing.

### Production Build
```bash
npm run build
npm run preview
```

### Automated Gameplay Testing
Run headless browser verification using Puppeteer:
```bash
npm run test
```

---

## 🏗️ Project Structure

```text
.
├── index.html            # Main game entry point and UI overlay markup
├── package.json          # Project dependencies and npm scripts
├── vite.config.js        # Vite build & development server configuration
├── AGENTS.md             # Subproject architecture and development guidelines
├── README.md             # Project documentation (this file)
├── test-pet-daycare.js   # Automated Puppeteer test suite
└── src/                  # Game engine modules
    ├── main.js           # Game initialization, Three.js loop, and state
    ├── world.js          # Daycare cottage, stations, backyard & Supply Cabin geometry
    ├── player.js         # Caretaker controller, camera follow, iPad touch controls
    ├── pets.js           # Pet AI, species geometry, animations, and needs engine
    ├── interactions.js   # Tool interactions, pet carry/bath/feed logic, particle bursts
    ├── owners.js         # Customer reception AI, dialogue, and 5-star reviews
    ├── store.js          # Daycare upgrades and economy manager
    ├── textures.js       # Procedural canvas textures (wood floors, wallpaper, logs)
    ├── audio.js          # Procedural Web Audio API sound synthesis
    └── ui.js             # DOM HUD overlays, modals, hotbar badges, notifications
```

---

## 📄 License
Private project. All rights reserved.
