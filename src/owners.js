import * as THREE from 'three';

export class OwnerManager {
  constructor(scene, audio, petManager, onCustomerArrival, onPickupReady) {
    this.scene = scene;
    this.audio = audio;
    this.petManager = petManager;
    this.onCustomerArrival = onCustomerArrival;
    this.onPickupReady = onPickupReady;

    this.activeCustomer = null;
    this.arrivalTimer = 2.0; // First customer arrives quickly!
    this.customerCatalog = this.getCatalog();
    this.catalogIndex = 0;

    // Visual model for active human customer
    this.customerMesh = this.buildHumanModel();
    this.customerMesh.visible = false;
    this.scene.add(this.customerMesh);
  }

  getCatalog() {
    return [
      {
        ownerName: 'Sarah Jenkins',
        avatar: '👩‍🦰',
        petSpec: {
          species: 'dog',
          breed: 'Golden Retriever',
          name: 'Bella',
          color: 0xe0a96d,
          hunger: 40,
          thirst: 50,
          cleanliness: 60,
          play: 35,
          energy: 85,
          stayDuration: 75
        },
        dropoffGreeting: "Hi there! This is my sweetheart Bella. She's been super playful all morning and needs a good meal and playtime in the backyard!",
        pickupHappy: "Oh wow, look at Bella! She's glowing, well-fed, and wagging her tail so happily! Thank you so much! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Thanks for watching Bella today! She looks like she had fun."
      },
      {
        ownerName: 'Oliver Chen',
        avatar: '👨‍💼',
        petSpec: {
          species: 'dog',
          breed: 'Corgi',
          name: 'Mochi',
          color: 0xddb892,
          hunger: 30,
          thirst: 45,
          cleanliness: 50,
          play: 40,
          energy: 70,
          stayDuration: 85
        },
        dropoffGreeting: "Hello! Meet Mochi the Corgi. He gets hungry very quickly and would love a warm bubble bath and a cozy nap on the cushion!",
        pickupHappy: "Mochi smells like flowers and looks so relaxed! You run a five-star daycare! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Mochi had a good time. Here is your payment!"
      },
      {
        ownerName: 'Emily Watson',
        avatar: '👩‍🎨',
        petSpec: {
          species: 'cat',
          breed: 'Tuxedo Cat',
          name: 'Luna',
          color: 0x222222,
          hunger: 55,
          thirst: 60,
          cleanliness: 45,
          play: 25,
          energy: 90,
          stayDuration: 80
        },
        dropoffGreeting: "Good day! This is Luna. She's curious and loves pouncing on feather toys. Please give her plenty of love and attention!",
        pickupHappy: "Luna is purring up a storm! She clearly adored her stay with you! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Luna is calm and happy. Thanks for taking care of her!"
      },
      {
        ownerName: 'Marcus Diaz',
        avatar: '👨‍🦱',
        petSpec: {
          species: 'bunny',
          breed: 'Lop Bunny',
          name: 'Barnaby',
          color: 0xfff0f3,
          hunger: 45,
          thirst: 50,
          cleanliness: 55,
          play: 40,
          energy: 80,
          stayDuration: 90
        },
        dropoffGreeting: "Hey! Barnaby is my gentle little bunny. He loves quiet cuddles, crunchy treats, and soft bedding to nap on!",
        pickupHappy: "Barnaby's nose is twitching with pure joy! Best daycare ever! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Barnaby looks well rested. Appreciate the care!"
      },
      {
        ownerName: 'Grandma Rose',
        avatar: '👵',
        petSpec: {
          species: 'cat',
          breed: 'Orange Tabby',
          name: 'Cleo',
          color: 0xf4a261,
          hunger: 35,
          thirst: 40,
          cleanliness: 70,
          play: 30,
          energy: 65,
          stayDuration: 70
        },
        dropoffGreeting: "Dear, could you watch my darling Cleo? She loves grooming brushes and sunny naps by the window!",
        pickupHappy: "My sweet Cleo looks so pampered and contented! Bless your kind heart! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Thank you dear for watching over Cleo."
      },
      {
        ownerName: 'Maya Patel',
        avatar: '👧',
        petSpec: {
          species: 'guinea_pig',
          breed: 'Calico Guinea Pig',
          name: 'Pip',
          color: 0xd4a373,
          secondaryColor: 0x4a3b32,
          hunger: 40,
          thirst: 50,
          cleanliness: 75,
          play: 45,
          energy: 85,
          stayDuration: 70
        },
        dropoffGreeting: "Hi! This is Pip, my calico guinea pig! He makes the happiest wheeking sounds when he sees crunchy treats and loves soft cuddles!",
        pickupHappy: "Pip is popcorning and wheeking with excitement! He had the best day ever! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Pip seems very peaceful and happy. Thank you!"
      },
      {
        ownerName: 'Chloe Bennett',
        avatar: '👩‍🦱',
        petSpec: {
          species: 'cat',
          breed: 'Siamese Cat',
          name: 'Mochi',
          color: 0xf5ebe0,
          secondaryColor: 0x3d312a,
          eyeColor: 0x3a86ff,
          hunger: 45,
          thirst: 55,
          cleanliness: 80,
          play: 35,
          energy: 75,
          stayDuration: 75
        },
        dropoffGreeting: "Hello! Meet Mochi the Siamese cat. She loves climbing tall perches and chasing the feather wand!",
        pickupHappy: "Mochi is purring like a little motor! You really understand cats! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Mochi looks sleek and well cared for. Thanks!"
      },
      {
        ownerName: 'Lucas Wright',
        avatar: '👦',
        petSpec: {
          species: 'guinea_pig',
          breed: 'Abyssinian Guinea Pig',
          name: 'Peanut',
          color: 0xdda15e,
          secondaryColor: 0x281912,
          hunger: 35,
          thirst: 45,
          cleanliness: 65,
          play: 50,
          energy: 90,
          stayDuration: 80
        },
        dropoffGreeting: "Hey! Peanut is my little potato buddy. When he's happy, he does joyful popcorn jumps in the air! Please give him fresh veggies!",
        pickupHappy: "Peanut is doing popcorn hops all over the place! You are an amazing daycare caretaker! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Peanut is in a great mood. Thanks a lot!"
      },
      {
        ownerName: 'Kenji Tanaka',
        avatar: '🧘‍♂️',
        petSpec: {
          species: 'capybara',
          breed: 'Giant Capybara',
          name: 'Yuzu',
          color: 0x8a5a3c,
          hunger: 40,
          thirst: 45,
          cleanliness: 60,
          play: 40,
          energy: 95,
          stayDuration: 85
        },
        dropoffGreeting: "Konnichiwa! Meet Yuzu, the world's most relaxed capybara. He refuses to take off his favorite orange and loves warm bubble baths. Please take good care of him!",
        pickupHappy: "Look at Yuzu! His orange is still perfectly balanced and he is radiating pure tranquility! 5 stars! ⭐⭐⭐⭐⭐",
        pickupNeutral: "Yuzu had a lovely, quiet day. Arigato gozaimasu!"
      }
    ];
  }

  buildHumanModel() {
    const root = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3a86ff, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.9 });

    // Torso / Jacket
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.35), shirtMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), skinMat);
    head.position.set(0, 2.05, 0);
    head.castShadow = true;
    root.add(head);

    // Hair / Cap
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), hairMat);
    hair.position.set(0, 2.12, -0.04);
    root.add(hair);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.18, 0.45, 0);
    root.add(legL);
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.18, 0.45, 0);
    root.add(legR);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 8);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.42, 1.3, 0);
    root.add(armL);
    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.42, 1.3, 0);
    root.add(armR);

    return root;
  }

  update(dt, maxDaycareCapacity = 3) {
    // Check if any pet in daycare is ready for owner pickup
    for (const pet of this.petManager.pets) {
      if (pet.isReadyForPickup && !pet.pickupNotified && (!this.activeCustomer || this.activeCustomer.mode !== 'pickup')) {
        pet.pickupNotified = true;
        this.triggerPickupCustomer(pet);
        return;
      }
    }

    // Customer spawn timer if no active customer at desk
    if (!this.activeCustomer && this.petManager.pets.length < maxDaycareCapacity) {
      this.arrivalTimer -= dt;
      if (this.arrivalTimer <= 0) {
        this.spawnArrivalCustomer();
      }
    }

    // Active customer locomotion / behavior
    if (this.activeCustomer) {
      this.updateCustomerLocomotion(dt);
    }
  }

  spawnArrivalCustomer() {
    const data = this.customerCatalog[this.catalogIndex % this.customerCatalog.length];
    this.catalogIndex++;

    this.activeCustomer = {
      data,
      mode: 'dropoff', // 'dropoff' or 'pickup'
      state: 'walking_in',
      pos: new THREE.Vector3(0, 0, 17),
      targetPos: new THREE.Vector3(0, 0, 8.8), // Right in front of reception desk
      speed: 2.8,
      petRef: null
    };

    this.customerMesh.position.copy(this.activeCustomer.pos);
    this.customerMesh.rotation.y = Math.PI; // Facing toward desk
    this.customerMesh.visible = true;
  }

  triggerPickupCustomer(pet) {
    const customerData = this.customerCatalog.find(c => c.petSpec.name === pet.name) || {
      ownerName: pet.ownerName,
      avatar: '🧑',
      pickupHappy: `Thank you so much for taking such great care of ${pet.name}! ⭐⭐⭐⭐⭐`,
      pickupNeutral: `Thanks for looking after ${pet.name} today!`
    };

    this.activeCustomer = {
      data: customerData,
      mode: 'pickup',
      state: 'walking_in',
      pos: new THREE.Vector3(0, 0, 17),
      targetPos: new THREE.Vector3(0, 0, 8.8),
      speed: 3.0,
      petRef: pet
    };

    this.customerMesh.position.copy(this.activeCustomer.pos);
    this.customerMesh.rotation.y = Math.PI;
    this.customerMesh.visible = true;
  }

  updateCustomerLocomotion(dt) {
    const c = this.activeCustomer;
    if (c.state === 'walking_in') {
      if (c.pos.z > c.targetPos.z) {
        c.pos.z = Math.max(c.targetPos.z, c.pos.z - c.speed * dt);
        this.customerMesh.position.copy(c.pos);
      }
      if (c.pos.z <= c.targetPos.z + 0.05) {
        c.pos.copy(c.targetPos);
        this.customerMesh.position.copy(c.pos);
        c.state = 'waiting_at_desk';
        this.audio.playBell();
        if (this.onCustomerArrival) {
          this.onCustomerArrival(c);
        }
      }
    } else if (c.state === 'walking_out') {
      c.pos.z += c.speed * dt;
      this.customerMesh.position.copy(c.pos);
      if (c.pos.z >= 17) {
        // Departed
        this.customerMesh.visible = false;
        this.activeCustomer = null;
        this.arrivalTimer = 6 + Math.random() * 6; // Next customer arrives in 6-12s
      }
    }
  }

  // Accept pet into daycare
  acceptActiveCustomerPet() {
    if (!this.activeCustomer || this.activeCustomer.mode !== 'dropoff') return null;

    const petSpec = {
      ...this.activeCustomer.data.petSpec,
      ownerName: this.activeCustomer.data.ownerName,
      startPos: new THREE.Vector3(0, 0, 6) // Just inside counter
    };

    const newPet = this.petManager.spawnPet(petSpec);

    // Owner waves and walks out
    this.activeCustomer.state = 'walking_out';
    this.audio.playCoin();

    return newPet;
  }

  // Complete pick up of pet
  completePickup(pet) {
    if (!this.activeCustomer || this.activeCustomer.mode !== 'pickup') return { coins: 30, stars: 4 };

    // Calculate rating and coins based on pet needs
    const happiness = pet.needs.happiness;
    let stars = 5;
    let coins = 50;
    let message = this.activeCustomer.data.pickupHappy;

    if (happiness >= 80) {
      stars = 5;
      coins = 65; // Base 50 + 15 bonus tip
      this.audio.playFanfare();
    } else if (happiness >= 55) {
      stars = 4;
      coins = 45;
      message = this.activeCustomer.data.pickupNeutral || "Good job! Here is your payment.";
      this.audio.playCoin();
    } else {
      stars = 3;
      coins = 30;
      message = "My pet was a little neglected, but thanks for keeping them safe.";
      this.audio.playCoin();
    }

    // Remove pet from active daycare
    const idx = this.petManager.pets.indexOf(pet);
    if (idx !== -1) {
      this.scene.remove(pet.root);
      this.petManager.pets.splice(idx, 1);
    }

    this.activeCustomer.state = 'walking_out';

    return {
      stars,
      coins,
      message,
      ownerName: this.activeCustomer.data.ownerName
    };
  }
}
