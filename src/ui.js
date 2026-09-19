import * as THREE from 'three';

export class UIManager {
  constructor(store, player, petManager, ownerManager, interactions, audio) {
    this.store = store;
    this.player = player;
    this.petManager = petManager;
    this.ownerManager = ownerManager;
    this.interactions = interactions;
    this.audio = audio;

    // Elements
    this.hudClock = document.getElementById('hud-clock');
    this.hudCoinsVal = document.getElementById('hud-coins-val');
    this.hudRepVal = document.getElementById('hud-rep-val');
    this.hudPetCount = document.getElementById('hud-pet-count');
    this.petsDrawer = document.getElementById('pets-drawer');
    this.receptionAlert = document.getElementById('reception-alert');
    this.receptionAlertMsg = document.getElementById('reception-alert-msg');
    this.interactPrompt = document.getElementById('interact-prompt');

    // Modals
    this.dialogueModal = document.getElementById('dialogue-modal');
    this.storeModal = document.getElementById('store-modal');
    this.cabinModal = document.getElementById('cabin-modal');
    this.helpModal = document.getElementById('help-modal');

    // Cabin modal elements
    this.cabinSuppliesList = document.getElementById('cabin-supplies-list');

    // Dialogue modal elements
    this.dialogueAvatar = document.getElementById('dialogue-avatar');
    this.dialogueOwnerName = document.getElementById('dialogue-owner-name');
    this.dialogueSpeech = document.getElementById('dialogue-speech');
    this.dialoguePetIcon = document.getElementById('dialogue-pet-icon');
    this.dialoguePetName = document.getElementById('dialogue-pet-name');
    this.dialoguePetDetails = document.getElementById('dialogue-pet-details');
    this.dialogueAcceptBtn = document.getElementById('dialogue-accept-btn');
    this.dialogueDeclineBtn = document.getElementById('dialogue-decline-btn');

    // Store grid
    this.storeGrid = document.getElementById('store-grid');

    // Hotbar and Touch Action references for dynamic carrying state
    this.slotHands = document.querySelector('.hotbar-slot[data-tool="HANDS"]');
    this.touchActionBtn = document.getElementById('touch-action-btn');
    this.touchActionLabel = document.querySelector('.touch-action-label');
    this.touchActionIcon = document.querySelector('.touch-action-icon');

    this.setupEventListeners();
    this.renderStore();
    this.updateHotbarBadges();
  }

  setupEventListeners() {
    // Hotbar selection with touch pointerdown support
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach(slot => {
      let lastSlotTime = 0;
      const selectSlot = (e) => {
        const now = Date.now();
        if (now - lastSlotTime < 180) return;
        lastSlotTime = now;
        slots.forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        const tool = slot.getAttribute('data-tool');
        this.player.setTool(tool);
        this.audio.playBounce();
      };
      slot.addEventListener('pointerdown', selectSlot);
      slot.addEventListener('touchstart', selectSlot, { passive: true });
      slot.addEventListener('click', selectSlot);
    });

    // Touch Action Button (iPad / Tablet)
    const touchActionBtn = document.getElementById('touch-action-btn');
    if (touchActionBtn) {
      let lastActionTime = 0;
      const onTouchAction = (e) => {
        const now = Date.now();
        if (now - lastActionTime < 320) return; // Prevent double-fire from pointerdown + click or touchstart + pointerdown
        lastActionTime = now;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        this.handlePlayerAction();
        this.audio.playBounce();
      };
      touchActionBtn.addEventListener('pointerdown', onTouchAction);
      touchActionBtn.addEventListener('touchstart', onTouchAction, { passive: false });
      touchActionBtn.addEventListener('click', onTouchAction);
    }

    // Quick Action Buttons
    document.getElementById('btn-reception')?.addEventListener('click', () => {
      this.player.pos.set(0, 0, 5.5);
      this.player.mesh.position.copy(this.player.pos);
      this.audio.playBell();
    });

    document.getElementById('btn-cabin')?.addEventListener('click', () => {
      this.player.pos.set(8.5, 0, -6.8);
      this.player.facingAngle = Math.PI;
      this.player.mesh.position.copy(this.player.pos);
      if (this.audio.playRestockChime) this.audio.playRestockChime();
      else this.audio.playBell();
      this.openCabinModal();
    });

    document.getElementById('cabin-close-btn')?.addEventListener('click', () => {
      this.cabinModal.style.display = 'none';
    });

    document.getElementById('cabin-restock-btn')?.addEventListener('click', () => {
      this.player.restockAllSupplies();
      if (this.audio.playRestockChime) this.audio.playRestockChime();
      this.showToast('🧺 Restocked All Supplies at the Cabin! ✨');
      this.interactions.spawnSparkleBurst(this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
      this.renderCabinModal();
      this.updateHotbarBadges();
    });

    document.getElementById('btn-store')?.addEventListener('click', () => {
      this.openStore();
    });

    document.getElementById('store-close-btn')?.addEventListener('click', () => {
      this.storeModal.style.display = 'none';
    });

    document.getElementById('btn-help')?.addEventListener('click', () => {
      this.helpModal.style.display = 'flex';
    });

    document.getElementById('help-close-btn')?.addEventListener('click', () => {
      this.helpModal.style.display = 'none';
    });

    document.getElementById('btn-camera')?.addEventListener('click', () => {
      this.player.cameraYaw += Math.PI / 4;
    });

    // Reception Alert Click
    this.receptionAlert?.addEventListener('click', () => {
      this.player.pos.set(0, 0, 5.5);
      this.player.mesh.position.copy(this.player.pos);
      this.showCustomerDialogue();
    });

    // Dialogue Modal buttons
    document.getElementById('dialogue-close-btn')?.addEventListener('click', () => {
      this.dialogueModal.style.display = 'none';
    });

    this.dialogueDeclineBtn?.addEventListener('click', () => {
      this.dialogueModal.style.display = 'none';
    });

    this.dialogueAcceptBtn?.addEventListener('click', () => {
      this.handleDialogueAction();
    });

    // Space or E key to interact with repeat debounce
    let lastKeyTime = 0;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' || e.code === 'Space') {
        const now = Date.now();
        if (now - lastKeyTime < 240) return;
        lastKeyTime = now;
        this.handlePlayerAction();
      }
    });

    // Canvas click or tap to interact or approach pets (Raycasting)
    const raycaster = new THREE.Raycaster();
    const tapCoord = new THREE.Vector2();

    const handleCanvasTap = (clientX, clientY) => {
      if (!this.player || !this.player.camera) {
        this.handlePlayerAction();
        return;
      }

      tapCoord.x = (clientX / window.innerWidth) * 2 - 1;
      tapCoord.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(tapCoord, this.player.camera);

      // Check raycast against pets
      const petRoots = this.petManager.pets.map(p => p.root);
      const intersects = raycaster.intersectObjects(petRoots, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        let hitPet = null;
        for (const p of this.petManager.pets) {
          p.root.traverse(child => {
            if (child === hit.object) hitPet = p;
          });
          if (hitPet) break;
        }

        if (hitPet) {
          const dist = this.player.pos.distanceTo(hitPet.root.position);
          if (dist < 3.2) {
            this.handlePlayerAction();
          } else {
            // Walk toward pet
            const targetPos = hitPet.root.position.clone().add(new THREE.Vector3(0, 0, 1.2));
            this.player.pos.copy(targetPos);
            this.player.mesh.position.copy(this.player.pos);
            this.showToast(`Walked to ${hitPet.name}! 🐾`);
            this.audio.playSnuggle();
            if (!this.player.carriedPet && this.player.currentTool === 'HANDS') {
              this.handlePlayerAction();
            }
          }
          return;
        }
      }

      // Default world interaction
      this.handlePlayerAction();
    };

    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.addEventListener('click', (e) => {
        handleCanvasTap(e.clientX, e.clientY);
      });
    }
  }

  showCustomerDialogue() {
    const customer = this.ownerManager.activeCustomer;
    if (!customer) return;

    this.dialogueModal.style.display = 'flex';
    this.dialogueAvatar.textContent = customer.data.avatar || '🧑';

    if (customer.mode === 'dropoff') {
      this.dialogueOwnerName.textContent = customer.data.ownerName;
      this.dialogueSpeech.textContent = `"${customer.data.dropoffGreeting}"`;
      const spec = customer.data.petSpec;
      this.dialoguePetIcon.textContent = spec.species === 'dog' ? '🐶' : (spec.species === 'cat' ? '🐱' : (spec.species === 'guinea_pig' ? '🐹' : (spec.species === 'capybara' ? '🍊' : '🐰')));
      this.dialoguePetName.textContent = `${spec.name} (${spec.breed})`;
      this.dialoguePetDetails.textContent = `Hunger: ${spec.hunger}% • Cleanliness: ${spec.cleanliness}% • Energy: ${spec.energy}%`;
      this.dialogueAcceptBtn.textContent = 'Accept Pet! 🐾';
      this.dialogueAcceptBtn.style.display = 'inline-block';
    } else {
      // Pick up mode
      const pet = customer.petRef;
      this.dialogueOwnerName.textContent = `${customer.data.ownerName} (Pick-Up)`;
      this.dialogueSpeech.textContent = `"I'm back to pick up ${pet ? pet.name : 'my pet'}! How did they do today?"`;
      if (pet) {
        this.dialoguePetIcon.textContent = pet.species === 'dog' ? '🐶' : (pet.species === 'cat' ? '🐱' : (pet.species === 'guinea_pig' ? '🐹' : (pet.species === 'capybara' ? '🍊' : '🐰')));
        this.dialoguePetName.textContent = `${pet.name} • Happiness: ${pet.needs.happiness}%`;
        this.dialoguePetDetails.textContent = `Hunger: ${Math.round(pet.needs.hunger)}% • Clean: ${Math.round(pet.needs.cleanliness)}% • Play: ${Math.round(pet.needs.play)}%`;
      }
      this.dialogueAcceptBtn.textContent = 'Return Pet & Collect Review! ⭐';
    }
  }

  handleDialogueAction() {
    const customer = this.ownerManager.activeCustomer;
    if (!customer) {
      this.dialogueModal.style.display = 'none';
      return;
    }

    if (customer.mode === 'dropoff') {
      const pet = this.ownerManager.acceptActiveCustomerPet();
      this.dialogueModal.style.display = 'none';
      this.receptionAlert.style.display = 'none';
      if (pet) {
        this.showToast(`Welcomed ${pet.name} to the daycare! 🐾`);
      }
    } else {
      // Complete pickup
      const result = this.ownerManager.completePickup(customer.petRef);
      this.store.addCoins(result.coins);
      this.store.recordReview(result.stars);

      this.dialogueModal.style.display = 'none';
      this.receptionAlert.style.display = 'none';

      this.showToast(`⭐ ${result.stars} Stars! Earned ${result.coins} Coins!`);
    }
  }

  handlePlayerAction() {
    const playerPos = this.player.pos;

    // 1. Check if near Reception Counter and customer is waiting
    if (playerPos.distanceTo(this.ownerManager.scene.position.clone().add(new THREE.Vector3(0, 0, 7.5))) < 3.2) {
      if (this.ownerManager.activeCustomer && this.ownerManager.activeCustomer.state === 'waiting_at_desk') {
        this.showCustomerDialogue();
        return;
      }
    }

    // 2. Check if near Supply Cabin in the backyard
    const cabinStation = this.interactions?.world?.stations?.supplyCabin;
    if (cabinStation && playerPos.distanceTo(cabinStation.pos) < cabinStation.radius) {
      const result = this.interactions.handleCabinRestock(playerPos, this.player);
      if (result && result.message) {
        this.showToast(result.message);
      }
      this.updateHotbarBadges();
      return;
    }

    // 3. Otherwise execute tool interaction
    const dir = this.player.getForwardDirection();
    const result = this.interactions.useTool(this.player.currentTool, playerPos, dir, this.player);
    if (result && result.message) {
      this.showToast(result.message);
    }
    this.updateHotbarBadges();
  }

  openCabinModal() {
    this.renderCabinModal();
    if (this.cabinModal) this.cabinModal.style.display = 'flex';
  }

  renderCabinModal() {
    if (!this.cabinSuppliesList || !this.player || !this.player.supplies) return;
    this.cabinSuppliesList.innerHTML = '';

    const supplies = this.player.supplies;
    for (const key of Object.keys(supplies)) {
      const item = supplies[key];
      const row = document.createElement('div');
      row.className = 'cabin-supply-row';
      const isEmpty = item.current === 0;
      row.innerHTML = `
        <div class="cabin-supply-left">
          <div class="cabin-supply-icon">${item.icon}</div>
          <div>
            <div class="cabin-supply-name">${item.name}</div>
            <div style="font-size: 12px; color: #7f5539;">Capacity: ${item.max} charges per restock</div>
          </div>
        </div>
        <div class="cabin-supply-count ${isEmpty ? 'empty' : ''}">${item.current} / ${item.max}</div>
      `;
      this.cabinSuppliesList.appendChild(row);
    }
  }

  updateHotbarBadges() {
    if (!this.player || !this.player.supplies) return;
    for (const key of Object.keys(this.player.supplies)) {
      const item = this.player.supplies[key];
      const badge = document.querySelector(`.slot-badge[data-badge="${key}"]`);
      const slot = document.querySelector(`.hotbar-slot[data-tool="${key}"]`);
      if (badge) {
        badge.textContent = `${item.current}/${item.max}`;
        if (item.current === 0) {
          badge.classList.add('empty');
          if (slot) slot.classList.add('empty-supply');
        } else {
          badge.classList.remove('empty');
          if (slot) slot.classList.remove('empty-supply');
        }
      }
    }
  }

  showToast(msg) {
    this.interactPrompt.textContent = msg;
    this.interactPrompt.style.display = 'block';
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toastTimer = null;
      this.interactPrompt.style.display = 'none';
    }, 2800);
  }

  openStore() {
    this.renderStore();
    this.storeModal.style.display = 'flex';
  }

  renderStore() {
    if (!this.storeGrid) return;
    this.storeGrid.innerHTML = '';

    for (const item of this.store.upgrades) {
      const isOwned = this.store.hasUpgrade(item.id);
      const canAfford = this.store.coins >= item.cost;

      const card = document.createElement('div');
      card.className = 'store-item';
      card.innerHTML = `
        <div class="store-item-top">
          <div class="store-item-icon">${item.icon}</div>
          <div>
            <div class="store-item-name">${item.name}</div>
            <div class="store-item-desc">${item.desc}</div>
          </div>
        </div>
        <button class="store-buy-btn ${isOwned ? 'bought' : ''}" data-id="${item.id}">
          ${isOwned ? '✓ Owned' : `🪙 ${item.cost} Coins`}
        </button>
      `;

      const btn = card.querySelector('.store-buy-btn');
      if (!isOwned) {
        btn.addEventListener('click', () => {
          const res = this.store.buyUpgrade(item.id);
          this.showToast(res.message);
          this.renderStore();
        });
      }

      this.storeGrid.appendChild(card);
    }
  }

  update(gameTime) {
    // 1. Update Top Bar HUD
    if (this.hudCoinsVal) this.hudCoinsVal.textContent = `${this.store.coins} Coins`;
    if (this.hudRepVal) this.hudRepVal.textContent = `${this.store.reputation.toFixed(1)} (${this.store.ratingCount} reviews)`;
    if (this.hudPetCount) this.hudPetCount.textContent = `${this.petManager.pets.length} / ${this.store.maxCapacity} Pets`;

    // Clock display (9am to 6pm cycle)
    const hours = 9 + Math.floor((gameTime % 300) / 33);
    const mins = Math.floor(((gameTime % 300) % 33) * 1.8);
    const padMin = mins < 10 ? '0' + mins : mins;
    if (this.hudClock) this.hudClock.textContent = `Day 1 • ${hours}:${padMin} AM`;

    // 2. Reception Alert
    const customer = this.ownerManager.activeCustomer;
    if (customer && customer.state === 'waiting_at_desk') {
      this.receptionAlert.style.display = 'flex';
      this.receptionAlertMsg.textContent = customer.mode === 'dropoff'
        ? `🛎️ ${customer.data.ownerName} arrived to drop off a pet! Click to visit`
        : `🛎️ ${customer.data.ownerName} is here to pick up their pet! Click to visit`;
    } else {
      this.receptionAlert.style.display = 'none';
    }

    // 3. Active Pets Drawer
    this.updatePetsDrawer();

    // 4. Update Carrying UI State & Smart Prompts
    if (this.player.carriedPet) {
      const pet = this.player.carriedPet;
      if (this.slotHands) {
        const iconEl = this.slotHands.querySelector('.slot-icon');
        const labelEl = this.slotHands.querySelector('.slot-label');
        if (iconEl) iconEl.textContent = '🤲';
        if (labelEl) labelEl.textContent = 'Put Down';
      }
      if (this.touchActionBtn) {
        if (this.touchActionLabel) this.touchActionLabel.textContent = 'PUT DOWN';
        if (this.touchActionIcon) this.touchActionIcon.textContent = '🤲';
      }

      if (!this._toastTimer && this.interactPrompt) {
        const tubDist = this.player.pos.distanceTo(this.interactions.world.stations.bathTub.pos);
        if (tubDist < 2.8) {
          this.interactPrompt.textContent = `[E] / 🐾 Tap: Place ${pet.name} into Bubble Bath! 🧼`;
          this.interactPrompt.style.display = 'block';
        } else {
          const bed = this.interactions.world.petBeds.find(b => !b.isOccupied && this.player.pos.distanceTo(b.pos) < 2.5);
          if (bed) {
            this.interactPrompt.textContent = `[E] / 🐾 Tap: Place ${pet.name} into Bed for Nap! 💤`;
            this.interactPrompt.style.display = 'block';
          } else if (pet.species === 'cat' && this.player.pos.distanceTo(this.interactions.world.stations.catTree.pos) < 2.6) {
            this.interactPrompt.textContent = `[E] / 🐾 Tap: Place ${pet.name} on Cat Tree! 🌳`;
            this.interactPrompt.style.display = 'block';
          } else {
            this.interactPrompt.textContent = `[E] / 🐾 Tap: Put down ${pet.name} 🐾`;
            this.interactPrompt.style.display = 'block';
          }
        }
      }
    } else {
      if (this.slotHands) {
        const iconEl = this.slotHands.querySelector('.slot-icon');
        const labelEl = this.slotHands.querySelector('.slot-label');
        if (iconEl) iconEl.textContent = '✋';
        if (labelEl) labelEl.textContent = 'Hands';
      }
      if (this.touchActionBtn) {
        if (this.touchActionLabel) this.touchActionLabel.textContent = 'ACTION';
        if (this.touchActionIcon) this.touchActionIcon.textContent = '🐾';
      }

        if (!this._toastTimer && this.interactPrompt) {
        if (this.player.currentTool === 'HANDS') {
          const closePet = this.petManager.getClosestPet(this.player.pos, 3.2);
          if (closePet) {
            this.interactPrompt.textContent = `[E] / 🐾 Tap: Pick up ${closePet.name}! 🐾`;
            this.interactPrompt.style.display = 'block';
          } else {
            this.interactPrompt.style.display = 'none';
          }
        } else {
          this.interactPrompt.style.display = 'none';
        }
      }
    }

    // 5. Supply Cabin Proximity or Empty Supply Warning Override
    const cabinStation = this.interactions?.world?.stations?.supplyCabin;
    const isNearCabin = cabinStation && this.player.pos.distanceTo(cabinStation.pos) < cabinStation.radius;

    if (isNearCabin) {
      if (this.touchActionBtn) {
        if (this.touchActionLabel) this.touchActionLabel.textContent = 'RESTOCK';
        if (this.touchActionIcon) this.touchActionIcon.textContent = '🧺';
      }
      if (!this._toastTimer && this.interactPrompt) {
        this.interactPrompt.textContent = '🪵 Supply Cabin — Press [E] or Tap to Restock All Supplies! 🧺✨';
        this.interactPrompt.style.display = 'block';
      }
    } else if (this.player.currentTool !== 'HANDS' && this.player.getSupplyCount && this.player.getSupplyCount(this.player.currentTool) === 0) {
      const sup = this.player.supplies ? this.player.supplies[this.player.currentTool] : null;
      const supName = sup ? sup.name : 'supplies';
      if (!this._toastTimer && this.interactPrompt) {
        this.interactPrompt.textContent = `⚠️ Out of ${supName}! Visit the Supply Cabin in the backyard to restock 🪵🧺`;
        this.interactPrompt.style.display = 'block';
      }
    }

    // 6. Update Hotbar Badges
    this.updateHotbarBadges();
  }

  updatePetsDrawer() {
    if (!this.petsDrawer) return;

    // Check if drawer count matches
    const pets = this.petManager.pets;
    if (pets.length === 0) {
      this.petsDrawer.innerHTML = '';
      return;
    }

    // Rebuild or update cards
    this.petsDrawer.innerHTML = '';
    pets.forEach(pet => {
      const card = document.createElement('div');
      card.className = 'pet-card';
      const icon = pet.species === 'dog' ? '🐶' : (pet.species === 'cat' ? '🐱' : (pet.species === 'guinea_pig' ? '🐹' : (pet.species === 'capybara' ? '🍊' : '🐰')));

      card.innerHTML = `
        <div class="pet-card-header">
          <span class="pet-card-name">${icon} ${pet.name}</span>
          <span class="pet-card-species">${pet.breed}</span>
        </div>
        <div class="pet-meter-row">
          <span>🍖</span>
          <div class="pet-meter-bar">
            <div class="pet-meter-fill fill-hunger" style="width: ${pet.needs.hunger}%"></div>
          </div>
        </div>
        <div class="pet-meter-row">
          <span>🧼</span>
          <div class="pet-meter-bar">
            <div class="pet-meter-fill fill-clean" style="width: ${pet.needs.cleanliness}%"></div>
          </div>
        </div>
        <div class="pet-meter-row">
          <span>🎾</span>
          <div class="pet-meter-bar">
            <div class="pet-meter-fill fill-play" style="width: ${pet.needs.play}%"></div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        // Move caretaker to this pet
        this.player.pos.copy(pet.root.position).add(new THREE.Vector3(0, 0, 1.2));
        this.player.mesh.position.copy(this.player.pos);
        this.audio.playSnuggle();
      });

      this.petsDrawer.appendChild(card);
    });
  }
}
