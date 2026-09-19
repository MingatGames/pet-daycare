export class StoreManager {
  constructor(audio) {
    this.audio = audio;
    this.coins = 120;
    this.reputation = 5.0;
    this.ratingCount = 1;
    this.maxCapacity = 6;
    this.purchasedUpgrades = new Set();

    this.upgrades = [
      {
        id: 'auto_feeder',
        name: 'Gourmet Feeder Station',
        icon: '🍖',
        cost: 80,
        desc: 'Elevated ceramic bowls that keep delicious crunchy kibble fresh all day!'
      },
      {
        id: 'hydro_spa',
        name: 'Hydro-Jet Bubble Tub',
        icon: '🧼',
        cost: 110,
        desc: 'Luxury bubble bath spa that makes pet coats sparkle instantly!'
      },
      {
        id: 'agility_pro',
        name: 'Agility Playground Pro',
        icon: '🎪',
        cost: 95,
        desc: 'Hurdles and A-frame ramps giving pets 2x Fun and Happiness!'
      },
      {
        id: 'cat_castle',
        name: 'Cat Scratching Castle',
        icon: '🏰',
        cost: 75,
        desc: 'Multi-tiered climbing tower with sisal scratching posts and soft perches.'
      },
      {
        id: 'capacity_1',
        name: 'Daycare Expansion I',
        icon: '🏡',
        cost: 130,
        desc: 'Expand daycare capacity to host up to 9 pets at the same time!'
      },
      {
        id: 'pet_party_hats',
        name: 'Cute Party Hats & Bows',
        icon: '🎀',
        cost: 60,
        desc: 'Adorable accessories for pets that boost owner tips by +20%!'
      }
    ];

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('paws_daycare_save_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.coins = data.coins ?? 120;
        this.reputation = data.reputation ?? 5.0;
        this.ratingCount = data.ratingCount ?? 1;
        this.maxCapacity = data.maxCapacity ?? 3;
        if (Array.isArray(data.purchased)) {
          this.purchasedUpgrades = new Set(data.purchased);
        }
      }
    } catch (e) {
      console.warn('LocalStorage not available, running in-memory:', e);
    }
  }

  saveState() {
    try {
      const data = {
        coins: this.coins,
        reputation: this.reputation,
        ratingCount: this.ratingCount,
        maxCapacity: this.maxCapacity,
        purchased: Array.from(this.purchasedUpgrades)
      };
      localStorage.setItem('paws_daycare_save_v1', JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to persist to LocalStorage:', e);
    }
  }

  addCoins(amount) {
    this.coins += amount;
    this.saveState();
  }

  recordReview(stars) {
    this.reputation = parseFloat(((this.reputation * this.ratingCount + stars) / (this.ratingCount + 1)).toFixed(1));
    this.ratingCount++;
    this.saveState();
  }

  buyUpgrade(id) {
    const upgrade = this.upgrades.find(u => u.id === id);
    if (!upgrade) return { success: false, message: 'Upgrade not found' };
    if (this.purchasedUpgrades.has(id)) return { success: false, message: 'Already unlocked!' };
    if (this.coins < upgrade.cost) return { success: false, message: `Need ${upgrade.cost} coins!` };

    this.coins -= upgrade.cost;
    this.purchasedUpgrades.add(id);

    if (id === 'capacity_1') {
      this.maxCapacity = 9;
    }

    if (this.audio) {
      this.audio.playCoin();
      this.audio.playFanfare();
    }

    this.saveState();
    return { success: true, message: `Unlocked ${upgrade.name}! 🎉` };
  }

  hasUpgrade(id) {
    return this.purchasedUpgrades.has(id);
  }
}
