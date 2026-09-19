# Paws & Play: 3D Pet Daycare — Subproject Guidelines

## Overview
A charming, cozy 3D animal daycare simulation game built with Three.js and Web Audio API. Pet owners drop off their beloved dogs, cats, and bunnies for daycare care. Players feed them delicious meals, give bubbly spa baths, play fetch with tennis balls, guide them through agility courses, snuggle them, and tuck them in for cozy naps. Happy owners return to reward players with coins, 5-star reviews, and tips to upgrade and expand the daycare!

## Core Mechanics
- **Customer Drop-Off & Pick-Up**: Owners walk in through reception, ring the service bell, and introduce their pet's personality and needs. At pick-up time, they return to evaluate their pet's happiness and pay coins with a 1-5 star review.
- **Pet Needs Engine**:
  - 🍖 Hunger: Feed crunchy kibble or tasty treats.
  - 💧 Thirst: Refill fresh water bowls.
  - 🧼 Cleanliness: Give bubble baths in the grooming tub or brush their coats.
  - 🎾 Fun / Play: Throw tennis balls in the yard for dogs, wave feather wands for cats, or run agility courses.
  - 💤 Energy: Rest on plush cushions to regain stamina with sweet dreams (Zzz).
  - ❤️ Love & Affection: Pet them anytime for purrs, tail wags, and floating hearts.
- **Daycare Economy & Upgrades**:
  - Earn coins from satisfied owners and daily shifts.
  - Upgrade facilities: Gourmet Auto-Feeders, Hydro-Jet Bubble Tubs, Agility Yard Deluxe, Cat Castle Scratchers, Daycare Capacity Expanders, and Cute Pet Accessories (bows, party hats, bandanas).
- **Cross-Platform Controls**:
  - Full Keyboard & Mouse (WASD / Arrows to move, Mouse look / click to interact, 1-6 tool hotbar, E to interact).
  - Mobile / Touch friendly: Virtual joystick, tap-to-move, quick-action buttons, and hotbar drawer.

## Architecture Standards
- Built entirely with Three.js WebGL and procedural Web Audio API synthesis.
- Zero external asset dependencies to guarantee instant loads and zero 404s.
- Fixed-step loop with time delta clamping (`Math.min(dt, 0.1)`).
- DPR clamped to `Math.min(window.devicePixelRatio, 2)`.
- Pre-allocated scratch vectors and reusable math objects to prevent garbage collection hiccups.
