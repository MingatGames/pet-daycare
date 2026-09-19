import * as THREE from 'three';

export class InteractionManager {
  constructor(scene, audio, world, petManager, player = null) {
    this.scene = scene;
    this.audio = audio;
    this.world = world;
    this.petManager = petManager;
    this.player = player;

    // Active ball for fetch
    this.activeBall = null;
    this.ballVelocity = new THREE.Vector3();

    // Particle pools
    this.particles = [];
    this.particleGeo = new THREE.SphereGeometry(0.08, 6, 6);

    // Heart texture sprite material
    this.heartTexture = this.generateHeartTexture();
  }

  generateHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ff4d6d';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 32, 32);

    return new THREE.CanvasTexture(canvas);
  }

  // ====================================================
  // CARE ACTIVITIES & TOOL USE
  // ====================================================

  useTool(toolType, playerPos, playerDir, player = this.player) {
    const activePlayer = player || this.player;

    // 1. Check if player is at the Supply Cabin (Paws & Pantry) in the backyard
    const cabinStation = this.world.stations.supplyCabin;
    if (cabinStation && playerPos.distanceTo(cabinStation.pos) < cabinStation.radius) {
      return this.handleCabinRestock(playerPos, activePlayer);
    }

    // 2. Enforce supply charges for consumable pet care tools
    if (toolType !== 'HANDS' && activePlayer && activePlayer.hasSupply && !activePlayer.hasSupply(toolType)) {
      const supplyName = activePlayer.supplies?.[toolType]?.name || toolType;
      return {
        success: false,
        message: `Out of ${supplyName}! Visit the Supply Cabin in the backyard to restock 🪵🧺`
      };
    }

    const targetPet = this.petManager.getClosestPet(playerPos, 3.2);

    switch (toolType) {
      case 'HANDS':
        return this.handleHandsInteraction(playerPos, targetPet, activePlayer);

      case 'FOOD': {
        const res = this.handleFoodInteraction(playerPos, targetPet, activePlayer);
        if (res && res.success && activePlayer.consumeSupply) activePlayer.consumeSupply('FOOD');
        return res;
      }

      case 'WATER': {
        const res = this.handleWaterInteraction(playerPos, targetPet, activePlayer);
        if (res && res.success && activePlayer.consumeSupply) activePlayer.consumeSupply('WATER');
        return res;
      }

      case 'GROOM': {
        const res = this.handleGroomInteraction(playerPos, targetPet, activePlayer);
        if (res && res.success && activePlayer.consumeSupply) activePlayer.consumeSupply('GROOM');
        return res;
      }

      case 'BALL': {
        const res = this.handleBallThrow(playerPos, playerDir);
        if (res && res.success && activePlayer.consumeSupply) activePlayer.consumeSupply('BALL');
        return res;
      }

      case 'FEATHER': {
        const res = this.handleFeatherInteraction(playerPos, targetPet, activePlayer);
        if (res && res.success && activePlayer.consumeSupply) activePlayer.consumeSupply('FEATHER');
        return res;
      }

      default:
        return null;
    }
  }

  // 1. Hands: Pick Up, Carry, & Context-Aware Placement
  handleHandsInteraction(playerPos, pet, player = this.player) {
    // A. If currently carrying a pet: PUT DOWN / PLACE INTO STATION
    if (player && player.carriedPet) {
      const carried = player.carriedPet;

      // Smart Placement Check 1: Bathtub (within 2.8m)
      const tubStation = this.world.stations.bathTub;
      if (tubStation && playerPos.distanceTo(tubStation.pos) < 2.8) {
        const tubCenter = tubStation.pos.clone().add(new THREE.Vector3(0, 0.45, 0));
        player.dropPet(tubCenter);
        carried.state = 'bathing';
        carried.needs.cleanliness = 100;
        carried.needs.happiness = Math.min(100, carried.needs.happiness + 35);
        this.audio.playSplash();
        this.spawnBubbles(tubCenter.clone().add(new THREE.Vector3(0, 0.2, 0)));
        this.spawnHeartBurst(tubCenter.clone().add(new THREE.Vector3(0, carried.height + 0.3, 0)));

        if (carried.species === 'capybara') {
          if (this.audio.playZenChime) this.audio.playZenChime();
          this.spawnFloatingText('+60 Hot Citrus Spa ♨️🍊✨', tubCenter.clone().add(new THREE.Vector3(0, 0.8, 0)), '#ff7b00');
          return {
            success: true,
            message: `Placed ${carried.name} into the warm citrus spa bath! Pure tranquility! ♨️🍊`
          };
        }

        this.spawnFloatingText('+60 Bubble Bath Spa 🧼✨', tubCenter.clone().add(new THREE.Vector3(0, 0.8, 0)), '#48cae4');
        return {
          success: true,
          message: `Placed ${carried.name} into the clawfoot bathtub for a warm bubbly wash! 🧼✨`
        };
      }

      // Smart Placement Check 2: Pet Bed (within 2.5m)
      if (this.world.petBeds && this.world.petBeds.length > 0) {
        const nearestBed = this.world.petBeds.find(b => !b.isOccupied && playerPos.distanceTo(b.pos) < 2.5);
        if (nearestBed) {
          nearestBed.isOccupied = true;
          carried.currentBed = nearestBed;
          carried.state = 'sleeping';
          carried.needs.energy = Math.min(100, carried.needs.energy + 40);
          carried.needs.happiness = Math.min(100, carried.needs.happiness + 25);

          const bedPos = nearestBed.pos.clone().add(new THREE.Vector3(0, 0.16, 0));
          player.dropPet(bedPos);
          this.audio.playSnuggle();
          this.spawnHeartBurst(bedPos.clone().add(new THREE.Vector3(0, carried.height + 0.2, 0)));
          this.spawnFloatingText('+40 Cozy Nap 💤💖', bedPos.clone().add(new THREE.Vector3(0, carried.height + 0.6, 0)), '#b5e2fa');

          return {
            success: true,
            message: `Tucked ${carried.name} into the cozy plush donut bed for a sweet nap! 💤🐾`
          };
        }
      }

      // Smart Placement Check 3: Cat Scratching Tree (within 2.6m if cat)
      const catTree = this.world.stations.catTree;
      if (carried.species === 'cat' && catTree && playerPos.distanceTo(catTree.pos) < 2.6) {
        const perchPos = catTree.pos.clone().add(new THREE.Vector3(0, 1.25, 0));
        player.dropPet(perchPos);
        carried.state = 'idle';
        carried.needs.play = Math.min(100, carried.needs.play + 35);
        carried.needs.happiness = Math.min(100, carried.needs.happiness + 30);
        this.audio.playPurr();
        this.spawnHeartBurst(perchPos.clone().add(new THREE.Vector3(0, carried.height + 0.2, 0)));
        this.spawnFloatingText('+40 Cat Tree Perch 🐾🌳', perchPos.clone().add(new THREE.Vector3(0, carried.height + 0.6, 0)), '#2a9d8f');

        return {
          success: true,
          message: `Placed ${carried.name} on the cat scratching tree perch! High-five purrs! 🐱🌳`
        };
      }

      // Default Ground / Yard Placement
      const forward = player.getForwardDirection ? player.getForwardDirection() : new THREE.Vector3(0, 0, 1);
      const dropPos = playerPos.clone().add(forward.multiplyScalar(0.75));
      dropPos.y = 0;
      player.dropPet(dropPos);
      this.audio.playSnuggle();
      this.spawnFloatingText(`Gently set down ${carried.name} 🐾`, dropPos.clone().add(new THREE.Vector3(0, carried.height + 0.3, 0)), '#7f5539');

      return {
        success: true,
        message: `Gently set down ${carried.name} on the floor. 🐾`
      };
    }

    // B. If NOT carrying a pet: PICK UP THE CLOSEST PET
    if (!pet) return { success: false, message: 'Walk closer to a pet to pick them up into your arms!' };

    if (player && player.pickUpPet) {
      player.pickUpPet(pet);
    } else {
      pet.isHeld = true;
      pet.state = 'held';
    }

    // Free bed if pet was sleeping
    if (pet.currentBed) {
      pet.currentBed.isOccupied = false;
      pet.currentBed = null;
    }

    pet.needs.happiness = Math.min(100, pet.needs.happiness + 20);
    pet.needs.play = Math.min(100, pet.needs.play + 10);

    this.audio.playSnuggle();
    if (pet.species === 'dog') this.audio.playBark();
    else if (pet.species === 'cat') this.audio.playPurr();
    else if (pet.species === 'guinea_pig') {
      if (this.audio.playWheek) this.audio.playWheek();
      else this.audio.playSqueak();
      if (pet.triggerPopcorn) pet.triggerPopcorn();
    }
    else if (pet.species === 'capybara') {
      if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
      this.spawnFloatingText('+20 Picked Up 🍊💖', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#ff7b00');
      return {
        success: true,
        message: `Picked up ${pet.name}! Carrying in your arms 🍊 (Press [E] or tap ACTION to place down)`
      };
    }
    else this.audio.playSqueak();

    this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
    this.spawnFloatingText('+20 Picked Up 🐾💖', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#ff4d6d');

    return {
      success: true,
      message: `Picked up ${pet.name}! Carrying in your arms 🐾 (Press [E] or tap ACTION to place down)`
    };
  }

  // 2. Food: Treat or Refill Bowls
  handleFoodInteraction(playerPos, pet, player = this.player) {
    if (player && player.carriedPet) {
      const carried = player.carriedPet;
      carried.needs.hunger = Math.min(100, carried.needs.hunger + 40);
      carried.needs.happiness = Math.min(100, carried.needs.happiness + 20);
      this.audio.playMunch();
      this.spawnKibbleCrumbs(carried.root.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
      this.spawnFloatingText('+40 Treat in Arms! 🍖✨', carried.root.position.clone().add(new THREE.Vector3(0, carried.height + 0.5, 0)), '#f4a261');
      return {
        success: true,
        message: `Hand-fed delicious treats to ${carried.name} in your arms! 🍖💖`
      };
    }

    // Check if near food bowl station
    const bowlDist = playerPos.distanceTo(this.world.stations.foodBowl.pos);
    if (bowlDist < 3.2) {
      this.audio.playMunch();
      this.spawnKibbleCrumbs(this.world.stations.foodBowl.pos.clone().add(new THREE.Vector3(0, 0.4, 1.1)));
      this.spawnFloatingText('+40 Feeder Full 🍖', this.world.stations.foodBowl.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#f4a261');

      // Feed all nearby pets
      this.petManager.pets.forEach(p => {
        if (p.root.position.distanceTo(this.world.stations.foodBowl.pos) < 5.0) {
          p.needs.hunger = Math.min(100, p.needs.hunger + 40);
          p.needs.happiness = Math.min(100, p.needs.happiness + 15);
        }
      });

      return { success: true, message: 'Refilled the Kibble Feeder! Pets can eat delicious crunchy chow.' };
    }

    if (pet) {
      pet.needs.hunger = Math.min(100, pet.needs.hunger + 35);
      pet.needs.happiness = Math.min(100, pet.needs.happiness + 12);
      this.audio.playMunch();
      if (pet.species === 'guinea_pig') {
        if (this.audio.playWheek) this.audio.playWheek();
        if (pet.triggerPopcorn) pet.triggerPopcorn();
      } else if (pet.species === 'capybara') {
        if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
        this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
        this.spawnFloatingText('+35 Yuzu Snack 🍊✨', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#ff7b00');
        return { success: true, message: `Hand-fed delicious fresh fruits to ${pet.name}! (+Fullness)` };
      }
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
      this.spawnFloatingText('+35 Munch! 🍖', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#f4a261');
      return { success: true, message: `Hand-fed delicious treats to ${pet.name}! (+Fullness)` };
    }

    return { success: false, message: 'Walk up to a hungry pet or the Food Feeder bowl.' };
  }

  // 3. Water: Refill Water Bowl
  handleWaterInteraction(playerPos, pet, player = this.player) {
    if (player && player.carriedPet) {
      const carried = player.carriedPet;
      carried.needs.thirst = Math.min(100, carried.needs.thirst + 40);
      carried.needs.happiness = Math.min(100, carried.needs.happiness + 20);
      if (this.audio.playWaterPour) this.audio.playWaterPour();
      else this.audio.playDrink();
      this.spawnWaterStream(carried.root.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
      this.spawnFloatingText('+40 Drink in Arms! 💧✨', carried.root.position.clone().add(new THREE.Vector3(0, carried.height + 0.5, 0)), '#48cae4');
      return {
        success: true,
        message: `Gave fresh water to ${carried.name} in your arms! Refreshed! 💧💖`
      };
    }
    const bowlDist = playerPos.distanceTo(this.world.stations.waterBowl.pos);
    if (bowlDist < 3.2) {
      if (this.audio.playWaterPour) this.audio.playWaterPour();
      else this.audio.playDrink();
      this.spawnWaterStream(this.world.stations.waterBowl.pos.clone().add(new THREE.Vector3(0, 0.9, -1.1)));
      this.spawnFloatingText('+45 Fresh Water! 💧', this.world.stations.waterBowl.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#48cae4');

      this.petManager.pets.forEach(p => {
        if (p.root.position.distanceTo(this.world.stations.waterBowl.pos) < 5.0) {
          p.needs.thirst = Math.min(100, p.needs.thirst + 45);
        }
      });
      return { success: true, message: 'Refilled fresh, cool drinking water for the daycare!' };
    }

    if (pet) {
      pet.needs.thirst = Math.min(100, pet.needs.thirst + 35);
      if (this.audio.playWaterPour) this.audio.playWaterPour();
      else this.audio.playDrink();
      this.spawnWaterStream(pet.root.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
      this.spawnFloatingText('+35 Refreshed! 💧', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#48cae4');
      return { success: true, message: `Gave a fresh bowl of water to ${pet.name}!` };
    }

    return { success: false, message: 'Walk to the Water Station or near a pet to give water.' };
  }

  // 4. Grooming: Bathe in Tub or Brush Coat
  handleGroomInteraction(playerPos, pet, player = this.player) {
    if (player && player.carriedPet) {
      const carried = player.carriedPet;
      // If near bathtub, automatically place into tub for full spa bath!
      const tubDist = playerPos.distanceTo(this.world.stations.bathTub.pos);
      if (tubDist < 2.8) {
        return this.handleHandsInteraction(playerPos, null, player);
      }
      carried.needs.cleanliness = Math.min(100, carried.needs.cleanliness + 35);
      carried.needs.happiness = Math.min(100, carried.needs.happiness + 20);
      this.audio.playSplash();
      this.spawnBubbles(carried.root.position.clone().add(new THREE.Vector3(0, carried.height * 0.5, 0)));
      this.spawnFloatingText('+35 Coat Groom 🧼✨', carried.root.position.clone().add(new THREE.Vector3(0, carried.height + 0.6, 0)), '#4cc9f0');
      return {
        success: true,
        message: `Groomed and brushed ${carried.name}'s coat in your arms! ✨🧼`
      };
    }

    const tubDist = playerPos.distanceTo(this.world.stations.bathTub.pos);

    if (pet && (tubDist < 3.8 || playerPos.distanceTo(pet.root.position) < 2.5)) {
      pet.needs.cleanliness = 100;
      pet.needs.happiness = Math.min(100, pet.needs.happiness + 25);

      this.audio.playSplash();

      if (pet.species === 'capybara') {
        if (this.audio.playZenChime) this.audio.playZenChime();
        if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
        this.spawnBubbles(pet.root.position.clone().add(new THREE.Vector3(0, pet.height * 0.5, 0)));
        this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.3, 0)));
        this.spawnFloatingText('+60 Hot Citrus Spa ♨️🍊✨', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.7, 0)), '#ff7b00');

        return {
          success: true,
          message: `Gave ${pet.name} a blissful hot citrus spa bath with an orange on its head! Absolute tranquility! ♨️🍊`
        };
      }

      this.spawnBubbles(pet.root.position.clone().add(new THREE.Vector3(0, pet.height * 0.5, 0)));
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.3, 0)));
      this.spawnFloatingText('+50 Sparkle Clean! 🧼✨', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.7, 0)), '#4cc9f0');

      return {
        success: true,
        message: `Gave ${pet.name} a warm, bubbly spa bath! Squeaky clean & fragrant! ✨🧼`
      };
    }

    return { success: false, message: 'Walk near a pet or bring them to the Bubble Bath Tub to wash them!' };
  }

  // 5. Ball: Throw Tennis Ball for Dogs to Fetch
  handleBallThrow(playerPos, playerDir) {
    if (this.activeBall) {
      this.scene.remove(this.activeBall);
      this.activeBall = null;
    }

    // Create Tennis Ball Mesh
    const ballGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xccff00, // Vibrant neon tennis ball
      roughness: 0.8
    });
    this.activeBall = new THREE.Mesh(ballGeo, ballMat);
    this.activeBall.castShadow = true;
    this.activeBall.position.copy(playerPos).add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(playerDir, 0.8);
    this.scene.add(this.activeBall);

    // Initial throw impulse
    this.ballVelocity.copy(playerDir).multiplyScalar(10.5);
    this.ballVelocity.y = 4.2;

    if (this.audio.playSqueakToy) this.audio.playSqueakToy();
    else this.audio.playBounce();

    this.spawnFloatingText('Fetch! 🎾', playerPos.clone().add(new THREE.Vector3(0, 1.8, 0)), '#a7c957');

    // Alert nearest dog to fetch
    const dogs = this.petManager.pets.filter(p => p.species === 'dog');
    if (dogs.length > 0) {
      const fetchDog = dogs[0];
      fetchDog.state = 'playing_fetch';
      fetchDog.stateTimer = 10;
      this.petManager.carriedBall = this.activeBall;
    }

    return { success: true, message: 'Threw the tennis ball! Watch the dogs dash and fetch! 🎾' };
  }

  // 6. Feather Wand: Play with Kittens & Guinea Pigs
  handleFeatherInteraction(playerPos, pet, player = this.player) {
    if (player && player.carriedPet) {
      const carried = player.carriedPet;
      carried.needs.play = Math.min(100, carried.needs.play + 35);
      carried.needs.happiness = Math.min(100, carried.needs.happiness + 20);
      this.audio.playMeow();
      this.spawnHeartBurst(carried.root.position.clone().add(new THREE.Vector3(0, carried.height, 0)));
      this.spawnFloatingText('+35 Tickle Play! 🪶✨', carried.root.position.clone().add(new THREE.Vector3(0, carried.height + 0.6, 0)), '#f72585');
      return {
        success: true,
        message: `Playfully tickled ${carried.name} with the feather wand in your arms! 🪶💖`
      };
    }

    if (pet && pet.species === 'cat') {
      pet.needs.play = Math.min(100, pet.needs.play + 40);
      pet.needs.happiness = Math.min(100, pet.needs.happiness + 20);
      this.audio.playMeow();
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
      this.spawnFloatingText('+40 Playful! 🪶', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#f72585');
      return { success: true, message: `Waved the feather wand with ${pet.name}! Playful pounce! 🪶` };
    } else if (pet && pet.species === 'guinea_pig') {
      pet.needs.play = Math.min(100, pet.needs.play + 35);
      pet.needs.happiness = Math.min(100, pet.needs.happiness + 20);
      if (this.audio.playWheek) this.audio.playWheek();
      if (pet.triggerPopcorn) pet.triggerPopcorn();
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
      this.spawnFloatingText('+35 Popcorn! 🍿🐹', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#ff70a6');
      return { success: true, message: `Playful tickles with ${pet.name}! Popcorning with glee! 🍿` };
    } else if (pet && pet.species === 'capybara') {
      pet.needs.play = Math.min(100, pet.needs.play + 30);
      pet.needs.happiness = Math.min(100, pet.needs.happiness + 15);
      if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
      this.spawnHeartBurst(pet.root.position.clone().add(new THREE.Vector3(0, pet.height, 0)));
      this.spawnFloatingText('+25 Zen Curiosity 🪶🍊', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#ff7b00');
      return { success: true, message: `${pet.name} calmly watched the feather wand with zen curiosity! 🪶` };
    } else if (pet) {
      pet.needs.play = Math.min(100, pet.needs.play + 25);
      this.spawnFloatingText('+25 Playful! 🪶', pet.root.position.clone().add(new THREE.Vector3(0, pet.height + 0.6, 0)), '#f72585');
      return { success: true, message: `Played with ${pet.name}!` };
    }

    return { success: false, message: 'Approach a pet to play with the feather wand.' };
  }

  // ====================================================
  // PARTICLE EMITTERS & PHYSICS
  // ====================================================

  spawnHeartBurst(pos) {
    for (let i = 0; i < 6; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: this.heartTexture,
        transparent: true,
        opacity: 1.0
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.4, 0.4, 0.4);
      sprite.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.6
      ));

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        1.2 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      );

      this.scene.add(sprite);
      this.particles.push({ mesh: sprite, vel, life: 1.4, maxLife: 1.4 });
    }
  }

  spawnBubbles(pos) {
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xcaf0f8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 14; i++) {
      const bubble = new THREE.Mesh(this.particleGeo, bubbleMat);
      const s = 0.6 + Math.random() * 0.8;
      bubble.scale.set(s, s, s);
      bubble.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.9,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.9
      ));

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        1.0 + Math.random() * 2.0,
        (Math.random() - 0.5) * 1.8
      );

      this.scene.add(bubble);
      this.particles.push({ mesh: bubble, vel, life: 1.6, maxLife: 1.6 });
    }
  }

  spawnKibbleCrumbs(pos) {
    const crumbMat = new THREE.MeshStandardMaterial({ color: 0x8b5e34, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const crumb = new THREE.Mesh(this.particleGeo, crumbMat);
      crumb.scale.set(0.5, 0.5, 0.5);
      crumb.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        1.5 + Math.random() * 1.2,
        (Math.random() - 0.5) * 1.5
      );
      this.scene.add(crumb);
      this.particles.push({ mesh: crumb, vel, life: 0.8, maxLife: 0.8, isGravity: true });
    }
  }

  // Cascading Water Pouring Droplets
  spawnWaterStream(pos) {
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x48cae4, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 18; i++) {
      const drop = new THREE.Mesh(this.particleGeo, waterMat);
      drop.scale.set(0.35, 0.5, 0.35);
      drop.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        0.3 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.25
      ));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -2.5 - Math.random() * 1.8,
        (Math.random() - 0.5) * 0.5
      );
      this.scene.add(drop);
      this.particles.push({ mesh: drop, vel, life: 0.45, maxLife: 0.45 });
    }
  }

  // Floating 3D Text Billboards
  spawnFloatingText(text, pos, color = '#ffffff', stroke = '#222222') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 5;
    ctx.strokeText(text, 128, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.9, 0.48, 1.0);
    sprite.position.copy(pos);
    this.scene.add(sprite);

    const vel = new THREE.Vector3(0, 1.3, 0);
    this.particles.push({ mesh: sprite, vel, life: 1.3, maxLife: 1.3 });
  }

  // 7. Supply Cabin: Restock All Pet Care Items
  handleCabinRestock(playerPos, player = this.player) {
    if (!player) return null;
    const res = player.restockAllSupplies ? player.restockAllSupplies() : { replenished: true };

    if (this.audio.playRestockChime) {
      this.audio.playRestockChime();
    } else if (this.audio.playBell) {
      this.audio.playBell();
    }

    const cabinStation = this.world.stations.supplyCabin;
    const sparklePos = cabinStation ? cabinStation.pos.clone().add(new THREE.Vector3(0, 1.2, 0)) : playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.spawnSparkleBurst(sparklePos);
    this.spawnFloatingText('🧺 Restocked All Supplies! 🍖💧🧼🎾✨', sparklePos.clone().add(new THREE.Vector3(0, 0.9, 0)), '#52b788');

    return {
      success: true,
      message: '🧺 Restocked all supplies at the Supply Cabin! Full bowls, fresh jugs, & tennis balls! ✨'
    };
  }

  // Sparkling Restock Particles Burst
  spawnSparkleBurst(pos) {
    const sparkleColors = [0xffd166, 0x06d6a0, 0x118ab2, 0xff70a6, 0xffeedd];
    for (let i = 0; i < 22; i++) {
      const c = sparkleColors[i % sparkleColors.length];
      const mat = new THREE.MeshBasicMaterial({ color: c });
      const star = new THREE.Mesh(this.particleGeo, mat);
      star.scale.set(0.45, 0.45, 0.45);
      star.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.9,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.9
      ));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3.2,
        2.2 + Math.random() * 2.4,
        (Math.random() - 0.5) * 3.2
      );
      this.scene.add(star);
      this.particles.push({ mesh: star, vel, life: 1.0, maxLife: 1.0, isGravity: true });
    }
  }

  update(dt) {
    // Update active ball physics
    if (this.activeBall) {
      this.ballVelocity.y -= 9.8 * dt; // Gravity
      this.activeBall.position.addScaledVector(this.ballVelocity, dt);

      // Ground bounce
      if (this.activeBall.position.y <= 0.18) {
        this.activeBall.position.y = 0.18;
        if (Math.abs(this.ballVelocity.y) > 0.8) {
          this.ballVelocity.y = -this.ballVelocity.y * 0.55;
          this.ballVelocity.x *= 0.75;
          this.ballVelocity.z *= 0.75;
          this.audio.playBounce();
        } else {
          this.ballVelocity.set(0, 0, 0);
        }
      }

      // If dogs are playing fetch, set their target to the ball
      this.petManager.pets.forEach(p => {
        if (p.state === 'playing_fetch') {
          p.targetPos.copy(this.activeBall.position);
          if (p.root.position.distanceTo(this.activeBall.position) < 0.6) {
            // Dog caught the ball!
            p.needs.play = 100;
            p.needs.happiness = Math.min(100, p.needs.happiness + 25);
            this.audio.playBark();
            this.spawnHeartBurst(p.root.position.clone().add(new THREE.Vector3(0, p.height, 0)));
            this.spawnFloatingText('Good Catch! 🎾', p.root.position.clone().add(new THREE.Vector3(0, p.height + 0.6, 0)), '#a7c957');
            // Bring ball back to player
            p.state = 'wander';
          }
        }
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.isGravity) p.vel.y -= 9.8 * dt;

      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
