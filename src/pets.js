import * as THREE from 'three';
import { TextureGenerator } from './textures.js';

export class PetManager {
  constructor(scene, audio, world) {
    this.scene = scene;
    this.audio = audio;
    this.world = world;

    this.pets = [];
    this.heldPet = null;
    this.carriedBall = null;

    // Pre-allocated scratch objects for zero-allocation tick loop
    this._scratchVec = new THREE.Vector3();
    this._targetVec = new THREE.Vector3();

    // Canvas texture generator for floating pet speech bubbles
    this.bubbleTextures = this.generateBubbleTextures();
  }

  generateBubbleTextures() {
    const emojis = {
      hungry: '🍖',
      thirsty: '💧',
      dirty: '🧼',
      playful: '🎾',
      sleepy: '💤',
      love: '💖',
      happy: '✨'
    };

    const textures = {};
    for (const [key, emoji] of Object.entries(emojis)) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // Rounded speech bubble background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(64, 56, 44, 0, Math.PI * 2);
      ctx.fill();

      // Tail of bubble
      ctx.beginPath();
      ctx.moveTo(56, 96);
      ctx.lineTo(64, 118);
      ctx.lineTo(76, 94);
      ctx.fill();

      // Emoji
      ctx.font = '52px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 64, 56);

      const texture = new THREE.CanvasTexture(canvas);
      textures[key] = texture;
    }
    return textures;
  }

  // Spawn a new pet into the daycare
  spawnPet(spec) {
    let petObj;
    if (spec.species === 'dog') {
      petObj = this.buildDog(spec);
    } else if (spec.species === 'cat') {
      petObj = this.buildCat(spec);
    } else if (spec.species === 'guinea_pig') {
      petObj = this.buildGuineaPig(spec);
    } else if (spec.species === 'capybara') {
      petObj = this.buildCapybara(spec);
    } else {
      petObj = this.buildBunny(spec);
    }

    petObj.id = 'pet_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    petObj.name = spec.name;
    petObj.breed = spec.breed || spec.species;
    petObj.ownerName = spec.ownerName || 'Friendly Neighbor';
    petObj.personality = spec.personality || 'Playful and sweet';
    petObj.stayDuration = spec.stayDuration || 180; // in seconds
    petObj.timeInDaycare = 0;
    petObj.isReadyForPickup = false;

    // Needs (0 - 100)
    petObj.needs = {
      hunger: spec.hunger ?? 65,
      thirst: spec.thirst ?? 70,
      cleanliness: spec.cleanliness ?? 80,
      play: spec.play ?? 60,
      energy: spec.energy ?? 85,
      happiness: 85
    };

    // AI & Locomotion State
    petObj.state = 'idle'; // idle, wander, eating, drinking, bathing, playing_fetch, sleeping, following
    petObj.stateTimer = 2 + Math.random() * 3;
    petObj.targetPos = petObj.root.position.clone();
    petObj.speed = spec.species === 'dog' ? 2.4 : (spec.species === 'bunny' ? 2.8 : (spec.species === 'guinea_pig' ? 1.8 : (spec.species === 'capybara' ? 1.35 : 2.0)));
    petObj.animTime = Math.random() * 10;
    petObj.isHeld = false;
    petObj.currentBed = null;
    petObj.blinkTimer = 2.0 + Math.random() * 3.0;
    petObj.isBlinking = false;
    petObj.blinkDuration = 0;
    petObj.idleSitTimer = 0;
    petObj.isPopcorning = false;
    petObj.popcornTimer = 0;
    petObj.triggerPopcorn = function() {
      this.isPopcorning = true;
      this.popcornTimer = 0.45;
    };

    // Create 3D Status Bubble above pet
    const bubbleMat = new THREE.SpriteMaterial({
      map: this.bubbleTextures.happy,
      transparent: true,
      opacity: 0
    });
    const bubble = new THREE.Sprite(bubbleMat);
    bubble.scale.set(0.85, 0.85, 0.85);
    bubble.position.y = petObj.height + 0.55;
    petObj.root.add(bubble);
    petObj.bubble = bubble;
    petObj.currentBubbleType = 'happy';

    this.pets.push(petObj);
    return petObj;
  }

  // ====================================================
  // 3D PROCEDURAL PET BUILDERS
  // ====================================================

  buildDog(spec) {
    const root = new THREE.Group();
    root.position.copy(spec.startPos || new THREE.Vector3(0, 0, 4));

    const furColor = spec.color || 0xdda15e; // Golden / Corgi orange
    const secondaryColor = spec.secondaryColor || 0xffffff;
    const bodyMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.65 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });

    const isCorgi = spec.breed === 'Corgi';

    // 1. Ground Contact Shadow Decal Disc
    const shadowGeo = new THREE.PlaneGeometry(1.3, 1.3);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    // 2. Torso / Body
    const bodyGeo = new THREE.CapsuleGeometry(isCorgi ? 0.28 : 0.32, isCorgi ? 0.55 : 0.65, 8, 12);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = isCorgi ? 0.32 : 0.42;
    body.castShadow = true;
    root.add(body);

    // Cute White Chest Patch
    const chestGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const chest = new THREE.Mesh(chestGeo, whiteMat);
    chest.position.set(0, isCorgi ? 0.35 : 0.45, 0.26);
    root.add(chest);

    // 3. Head
    const headGeo = new THREE.SphereGeometry(0.3, 10, 10);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, isCorgi ? 0.62 : 0.75, 0.38);
    head.castShadow = true;
    root.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.2, 0.16, 0.24);
    const snout = new THREE.Mesh(snoutGeo, whiteMat);
    snout.position.set(0, isCorgi ? 0.56 : 0.68, 0.62);
    root.add(snout);

    // Black Shiny Nose
    const noseGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const nose = new THREE.Mesh(noseGeo, darkMat);
    nose.position.set(0, isCorgi ? 0.61 : 0.73, 0.75);
    root.add(nose);

    // Panting Pink Tongue
    const tongueGeo = new THREE.BoxGeometry(0.09, 0.025, 0.12);
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff758f, roughness: 0.5 });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0, isCorgi ? 0.50 : 0.62, 0.71);
    tongue.rotation.x = 0.25;
    root.add(tongue);

    // 4. Expressive Shiny Eyes with Glint Highlights
    const eyes = [];
    [-0.13, 0.13].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, isCorgi ? 0.68 : 0.81, 0.58);

      const eyeball = new THREE.Mesh(
        new THREE.SphereGeometry(0.046, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })
      );
      eyeGroup.add(eyeball);

      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(0.014, 0.016, 0.036);
      eyeGroup.add(glint);

      root.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // 5. Collar & Dangling Golden Bone Tag
    const collarGeo = new THREE.TorusGeometry(0.24, 0.038, 8, 20);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.5 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, isCorgi ? 0.48 : 0.58, 0.32);
    root.add(collar);

    const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.018, 8), goldMat);
    tag.position.set(0, isCorgi ? 0.44 : 0.54, 0.48);
    tag.rotation.x = Math.PI / 2;
    root.add(tag);

    // 6. Ears
    const ears = [];
    if (isCorgi) {
      const earGeo = new THREE.ConeGeometry(0.12, 0.32, 6);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.2, 0.92, 0.35);
      earL.rotation.z = 0.2;
      root.add(earL);
      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.2, 0.92, 0.35);
      earR.rotation.z = -0.2;
      root.add(earR);
      ears.push(earL, earR);
    } else {
      const earGeo = new THREE.BoxGeometry(0.1, 0.32, 0.14);
      const earL = new THREE.Mesh(earGeo, darkMat);
      earL.position.set(-0.28, 0.72, 0.35);
      earL.rotation.z = 0.15;
      root.add(earL);
      const earR = new THREE.Mesh(earGeo, darkMat);
      earR.position.set(0.28, 0.72, 0.35);
      earR.rotation.z = -0.15;
      root.add(earR);
      ears.push(earL, earR);
    }

    // 7. Legs with Paw Pads
    const legGeo = new THREE.CylinderGeometry(0.07, 0.08, isCorgi ? 0.25 : 0.38, 8);
    const legMat = isCorgi ? whiteMat : bodyMat;
    const padMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.8 });
    const legs = [];
    const legX = 0.18;
    const legZ = 0.25;
    const legY = isCorgi ? 0.14 : 0.2;

    [[-legX, legZ], [legX, legZ], [-legX, -legZ], [legX, -legZ]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, legY, z);
      leg.castShadow = true;

      // Paw Pad on bottom
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 8), padMat);
      pad.position.y = -(isCorgi ? 0.12 : 0.18);
      leg.add(pad);

      root.add(leg);
      legs.push(leg);
    });

    // 8. Wagging Tail
    const tailGeo = new THREE.CylinderGeometry(0.05, 0.07, isCorgi ? 0.16 : 0.4, 6);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, isCorgi ? 0.38 : 0.52, isCorgi ? -0.38 : -0.48);
    tail.rotation.x = -Math.PI / 4;
    root.add(tail);

    this.scene.add(root);

    return {
      species: 'dog',
      breed: spec.breed,
      isCorgi,
      root,
      head,
      ears,
      eyes,
      tongue,
      legs,
      tail,
      shadow,
      height: isCorgi ? 0.95 : 1.15
    };
  }

  buildCat(spec) {
    const root = new THREE.Group();
    root.position.copy(spec.startPos || new THREE.Vector3(0, 0, 4));

    const coatColor = spec.color || 0xf4a261; // Orange tabby
    const catMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.65 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffcad4, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });

    // 1. Ground Contact Shadow Decal Disc
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    // 2. Slender Body
    const bodyGeo = new THREE.CapsuleGeometry(0.24, 0.55, 8, 12);
    const body = new THREE.Mesh(bodyGeo, catMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.34;
    body.castShadow = true;
    root.add(body);

    // 3. Head
    const headGeo = new THREE.SphereGeometry(0.26, 10, 10);
    const head = new THREE.Mesh(headGeo, catMat);
    head.position.set(0, 0.62, 0.35);
    head.castShadow = true;
    root.add(head);

    // Pointed Triangular Ears with Pink Interior
    const earGeo = new THREE.ConeGeometry(0.09, 0.22, 5);
    const earL = new THREE.Mesh(earGeo, catMat);
    earL.position.set(-0.16, 0.86, 0.35);
    earL.rotation.z = 0.2;
    const innerEarL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), pinkMat);
    innerEarL.position.set(0, -0.02, 0.02);
    earL.add(innerEarL);
    root.add(earL);

    const earR = new THREE.Mesh(earGeo, catMat);
    earR.position.set(0.16, 0.86, 0.35);
    earR.rotation.z = -0.2;
    const innerEarR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), pinkMat);
    innerEarR.position.set(0, -0.02, 0.02);
    earR.add(innerEarR);
    root.add(earR);

    // Muzzle & Pink Heart Nose
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), whiteMat);
    muzzle.position.set(0, 0.56, 0.54);
    root.add(muzzle);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.04, 4), pinkMat);
    nose.position.set(0, 0.58, 0.62);
    nose.rotation.x = Math.PI / 2;
    root.add(nose);

    // 3D Fine Whiskers
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.12, 0.12].forEach(wx => {
      for (let w = -1; w <= 1; w++) {
        const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.008, 0.008), whiskerMat);
        whisker.position.set(wx + (wx > 0 ? 0.08 : -0.08), 0.56 + w * 0.02, 0.56);
        whisker.rotation.z = (wx > 0 ? -1 : 1) * w * 0.12;
        root.add(whisker);
      }
    });

    // 4. Bright Expressive Feline Eyes with Pupil Slit & Glint
    const eyeColor = spec.eyeColor || 0x2a9d8f; // Emerald
    const eyes = [];
    [-0.11, 0.11].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, 0.66, 0.52);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2 }));
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.032, 4, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      pupil.position.z = 0.026;
      eyeGroup.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.012, 0.016, 0.036);
      eyeGroup.add(glint);

      root.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // 5. Velvet Collar & Jingling Bell
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.032, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0x9d4edd, roughness: 0.4 })
    );
    collar.position.set(0, 0.48, 0.32);
    collar.rotation.x = Math.PI / 2;
    root.add(collar);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldMat);
    bell.position.set(0, 0.44, 0.46);
    root.add(bell);

    // 6. Legs with Pink Paw Pads
    const legGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.32, 8);
    const legs = [];
    [[-0.14, 0.22], [0.14, 0.22], [-0.14, -0.22], [0.14, -0.22]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, whiteMat);
      leg.position.set(x, 0.16, z);
      leg.castShadow = true;

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.018, 8), pinkMat);
      pad.position.y = -0.15;
      leg.add(pad);

      root.add(leg);
      legs.push(leg);
    });

    // 7. Swishing Curled Tail
    const tailGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.48, 6);
    const tail = new THREE.Mesh(tailGeo, catMat);
    tail.position.set(0, 0.44, -0.42);
    tail.rotation.x = -Math.PI / 3;
    root.add(tail);

    this.scene.add(root);

    return {
      species: 'cat',
      root,
      head,
      ears: [earL, earR],
      eyes,
      legs,
      tail,
      shadow,
      height: 1.05
    };
  }

  buildBunny(spec) {
    const root = new THREE.Group();
    root.position.copy(spec.startPos || new THREE.Vector3(0, 0, 4));

    const furColor = spec.color || 0xfff0f3; // Soft snow white / cream
    const furMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.8 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffb3c1, roughness: 0.6 });

    // 1. Ground Contact Shadow Decal Disc
    const shadowGeo = new THREE.PlaneGeometry(1.1, 1.1);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    // 2. Round Plump Body
    const bodyGeo = new THREE.SphereGeometry(0.3, 10, 10);
    bodyGeo.scale(1, 1.1, 1.25);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.position.y = 0.32;
    body.castShadow = true;
    root.add(body);

    // 3. Head
    const headGeo = new THREE.SphereGeometry(0.24, 10, 10);
    const head = new THREE.Mesh(headGeo, furMat);
    head.position.set(0, 0.58, 0.28);
    head.castShadow = true;
    root.add(head);

    // Tall Lop / Twitching Ears with Pink Interior
    const earGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.42, 6);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(-0.12, 0.88, 0.24);
    earL.rotation.z = -0.15;
    const innerEarL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.34, 6), pinkMat);
    innerEarL.position.set(0, 0, 0.02);
    earL.add(innerEarL);
    root.add(earL);

    const earR = new THREE.Mesh(earGeo, furMat);
    earR.position.set(0.12, 0.88, 0.24);
    earR.rotation.z = 0.15;
    const innerEarR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.34, 6), pinkMat);
    innerEarR.position.set(0, 0, 0.02);
    earR.add(innerEarR);
    root.add(earR);

    // 4. Cute Shiny Button Eyes with Glint
    const eyes = [];
    [-0.1, 0.1].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, 0.62, 0.44);

      const eyeball = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 })
      );
      eyeGroup.add(eyeball);

      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.013, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(0.012, 0.012, 0.028);
      eyeGroup.add(glint);

      root.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // 5. Pink Twitching Nose & Whiskers
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), pinkMat);
    nose.position.set(0, 0.56, 0.48);
    root.add(nose);

    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.08, 0.08].forEach(wx => {
      [-0.015, 0.015].forEach(wy => {
        const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.006), whiskerMat);
        whisker.position.set(wx + (wx > 0 ? 0.05 : -0.05), 0.56 + wy, 0.48);
        root.add(whisker);
      });
    });

    // 6. Cute Ribbon Bowtie on Neck
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.46, 0.42);
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pinkMat);
    bowGroup.add(bowKnot);
    const bowWingL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 5), pinkMat);
    bowWingL.rotation.z = Math.PI / 2;
    bowWingL.position.x = -0.04;
    bowGroup.add(bowWingL);
    const bowWingR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 5), pinkMat);
    bowWingR.rotation.z = -Math.PI / 2;
    bowWingR.position.x = 0.04;
    bowGroup.add(bowWingR);
    root.add(bowGroup);

    // 7. Fluffy Cotton Ball Tail
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), furMat);
    tail.position.set(0, 0.3, -0.36);
    root.add(tail);

    // 8. Soft Paws
    const pawGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const legs = [];
    [[-0.14, 0.16], [0.14, 0.16], [-0.15, -0.14], [0.15, -0.14]].forEach(([x, z]) => {
      const paw = new THREE.Mesh(pawGeo, furMat);
      paw.position.set(x, 0.08, z);
      root.add(paw);
      legs.push(paw);
    });

    this.scene.add(root);

    return {
      species: 'bunny',
      root,
      head,
      ears: [earL, earR],
      eyes,
      nose,
      legs,
      tail,
      shadow,
      height: 1.15
    };
  }

  buildGuineaPig(spec) {
    const root = new THREE.Group();
    root.position.copy(spec.startPos || new THREE.Vector3(0, 0, 4));

    const gingerColor = spec.color || 0xd4a373; // Warm ginger/cinnamon
    const gingerMat = new THREE.MeshStandardMaterial({ color: gingerColor, roughness: 0.75 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
    const darkPatchMat = new THREE.MeshStandardMaterial({ color: spec.secondaryColor || 0x4a3b32, roughness: 0.75 }); // Dark chocolate patch
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffcad4, roughness: 0.6 });

    // 1. Ground Contact Shadow Decal Disc
    const shadowGeo = new THREE.PlaneGeometry(0.9, 0.9);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    // 2. Compact Rounded "Potato" Body
    const bodyGeo = new THREE.SphereGeometry(0.24, 10, 10);
    bodyGeo.scale(1.0, 0.88, 1.35);
    const body = new THREE.Mesh(bodyGeo, gingerMat);
    body.position.y = 0.22;
    body.castShadow = true;
    root.add(body);

    // Calico / Tricolor Patches on Body
    const patchL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), darkPatchMat);
    patchL.position.set(-0.14, 0.23, -0.06);
    root.add(patchL);

    const patchR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), whiteMat);
    patchR.position.set(0.12, 0.2, 0.1);
    root.add(patchR);

    // 3. Head & Snout (Seamlessly nestled into body)
    const headGeo = new THREE.SphereGeometry(0.19, 10, 10);
    headGeo.scale(0.95, 0.9, 1.1);
    const head = new THREE.Mesh(headGeo, gingerMat);
    head.position.set(0, 0.24, 0.22);
    head.castShadow = true;
    root.add(head);

    // White Facial Blaze Stripe
    const blazeGeo = new THREE.BoxGeometry(0.06, 0.14, 0.16);
    const blaze = new THREE.Mesh(blazeGeo, whiteMat);
    blaze.position.set(0, 0.26, 0.3);
    blaze.rotation.x = -Math.PI / 6;
    root.add(blaze);

    // Tiny Pink Nose & Y-Shaped Mouth
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), pinkMat);
    nose.position.set(0, 0.22, 0.42);
    root.add(nose);

    // Fine 3D Whiskers
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.07, 0.07].forEach(wx => {
      [-0.012, 0.012].forEach(wy => {
        const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.005, 0.005), whiskerMat);
        whisker.position.set(wx + (wx > 0 ? 0.04 : -0.04), 0.22 + wy, 0.41);
        root.add(whisker);
      });
    });

    // 4. Rounded Petal Droop Ears with Pink Interior
    const ears = [];
    const earGeo = new THREE.SphereGeometry(0.046, 6, 6);
    earGeo.scale(1.1, 0.4, 1.0);
    [-0.17, 0.17].forEach(ex => {
      const ear = new THREE.Mesh(earGeo, pinkMat);
      ear.position.set(ex, 0.31, 0.18);
      ear.rotation.z = ex > 0 ? -0.35 : 0.35;
      root.add(ear);
      ears.push(ear);
    });

    // 5. Big Glossy Button Eyes with Glint
    const eyes = [];
    [-0.11, 0.11].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, 0.28, 0.32);

      const eyeball = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.15 })
      );
      eyeGroup.add(eyeball);

      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(0.01, 0.012, 0.025);
      eyeGroup.add(glint);

      root.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // 6. Tiny Little Paws with Pink Pads Underneath
    const pawGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const legs = [];
    [[-0.11, 0.18], [0.11, 0.18], [-0.11, -0.16], [0.11, -0.16]].forEach(([x, z]) => {
      const paw = new THREE.Mesh(pawGeo, whiteMat);
      paw.position.set(x, 0.05, z);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 6), pinkMat);
      pad.position.y = -0.04;
      paw.add(pad);

      root.add(paw);
      legs.push(paw);
    });

    this.scene.add(root);

    return {
      species: 'guinea_pig',
      breed: spec.breed || 'Abyssinian',
      root,
      head,
      ears,
      eyes,
      nose,
      legs,
      shadow,
      height: 0.65
    };
  }

  // ====================================================
  // PROCEDURAL CAPYBARA WITH ORANGE ON HEAD 🍊
  // ====================================================
  buildCapybara(spec) {
    const root = new THREE.Group();
    if (spec.startPos) root.position.copy(spec.startPos);

    // Warm, earthy capybara fur materials
    const capyMat = new THREE.MeshStandardMaterial({
      color: spec.color || 0x8a5a3c, // Rich toasted caramel brown
      roughness: 0.88,
      metalness: 0.05
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xa4714d, // Warmer light tan underbelly
      roughness: 0.88
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x3d261a, // Dark muzzle, feet, and nostril accents
      roughness: 0.9
    });

    // 1. Sturdy, Barrel-Shaped Rounded Body
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0.44, 0);

    // Main torso
    const bodyGeo = new THREE.SphereGeometry(0.46, 12, 10);
    bodyGeo.scale(1.05, 0.88, 1.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, capyMat);
    bodyMesh.castShadow = true;
    bodyGroup.add(bodyMesh);

    // Soft lighter underbelly
    const bellyGeo = new THREE.SphereGeometry(0.40, 10, 8);
    bellyGeo.scale(1.0, 0.72, 1.25);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, -0.08, 0);
    bodyGroup.add(bellyMesh);

    root.add(bodyGroup);

    // 2. Grounded Contact Shadow Decal
    const shadowGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.01, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow);

    // 3. Smoothly Rounded Capybara Head & Chubby Cheeks
    const head = new THREE.Group();
    head.position.set(0, 0.58, 0.52);

    // Rounded cranium / skull
    const skullGeo = new THREE.SphereGeometry(0.24, 16, 14);
    skullGeo.scale(0.98, 0.92, 1.12);
    const skull = new THREE.Mesh(skullGeo, capyMat);
    skull.position.set(0, 0, 0);
    skull.castShadow = true;
    head.add(skull);

    // Cute rounded chubby cheeks
    [-0.14, 0.14].forEach(cx => {
      const cheekGeo = new THREE.SphereGeometry(0.14, 12, 10);
      cheekGeo.scale(0.88, 0.85, 1.05);
      const cheek = new THREE.Mesh(cheekGeo, capyMat);
      cheek.position.set(cx, -0.05, 0.06);
      cheek.castShadow = true;
      head.add(cheek);
    });

    // Smoothly rounded snout extending gently forward
    const snoutGeo = new THREE.SphereGeometry(0.18, 16, 12);
    snoutGeo.scale(0.95, 0.86, 1.15);
    const snout = new THREE.Mesh(snoutGeo, capyMat);
    snout.position.set(0, -0.04, 0.20);
    snout.castShadow = true;
    head.add(snout);

    // Softly rounded dark muzzle / nose plate
    const muzzleGeo = new THREE.SphereGeometry(0.13, 14, 10);
    muzzleGeo.scale(1.12, 0.82, 0.65);
    const muzzle = new THREE.Mesh(muzzleGeo, darkMat);
    muzzle.position.set(0, -0.06, 0.35);
    muzzle.castShadow = true;
    head.add(muzzle);

    // Wide nostrils on rounded muzzle
    [-0.055, 0.055].forEach(nx => {
      const nostril = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x1a0f0a })
      );
      nostril.position.set(nx, -0.04, 0.40);
      head.add(nostril);
    });

    // 4. Peaceful, Zen Eyelids & Half-Closed Button Eyes
    const eyes = [];
    [-0.19, 0.19].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, 0.06, 0.12);
      eyeGroup.rotation.y = ex > 0 ? 0.22 : -0.22;

      // Dark serene almond/oval eye
      const eyeball = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x16120e, roughness: 0.15 })
      );
      eyeball.scale.set(0.6, 0.9, 1.1);
      eyeGroup.add(eyeball);

      // Zen sleepy eyelid giving signature chill expression
      const lidGeo = new THREE.SphereGeometry(0.037, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const eyelid = new THREE.Mesh(lidGeo, capyMat);
      eyelid.rotation.x = Math.PI / 2;
      eyelid.position.set(0, 0.012, 0);
      eyeGroup.add(eyelid);

      // Specular glint
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(ex > 0 ? 0.014 : -0.014, 0.012, 0.026);
      eyeGroup.add(glint);

      head.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // 5. Small, Rounded Zen Ears
    const ears = [];
    const earGeo = new THREE.SphereGeometry(0.052, 8, 8);
    earGeo.scale(0.8, 1.1, 0.45);
    [-0.19, 0.19].forEach(ex => {
      const ear = new THREE.Mesh(earGeo, darkMat);
      ear.position.set(ex, 0.19, -0.08);
      ear.rotation.z = ex > 0 ? -0.28 : 0.28;
      ear.rotation.y = ex > 0 ? 0.25 : -0.25;
      head.add(ear);
      ears.push(ear);
    });

    // 6. THE ICONIC ORANGE (YUZU) ON ITS HEAD! 🍊
    const orangeGroup = new THREE.Group();
    // Position directly on the rounded crown of head between ears
    orangeGroup.position.set(0, 0.22, 0.02);

    // Vibrant citrus orange fruit with slight natural dimpled squish
    const orangeGeo = new THREE.SphereGeometry(0.105, 14, 12);
    orangeGeo.scale(1.08, 0.94, 1.08);
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xff7b00, // Vibrant ripe citrus orange
      roughness: 0.35,
      metalness: 0.05
    });
    const orangeFruit = new THREE.Mesh(orangeGeo, orangeMat);
    orangeFruit.castShadow = true;
    orangeFruit.position.y = 0.09;
    orangeGroup.add(orangeFruit);

    // Little navel/indentation and tiny stem
    const stemGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.042, 6);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a40, // Woody leafy green stem
      roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.195, 0);
    orangeGroup.add(stem);

    // Fresh emerald citrus leaf angled outward
    const leafGeo = new THREE.ConeGeometry(0.034, 0.075, 4);
    leafGeo.scale(1.4, 0.3, 1.0);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f, // Deep fresh citrus leaf
      roughness: 0.45
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0.030, 0.20, 0.02);
    leaf.rotation.set(-0.3, 0.4, -0.7);
    orangeGroup.add(leaf);

    head.add(orangeGroup);
    root.add(head);

    // 7. Sturdy, Solid Legs with Darker Paws
    const legs = [];
    const legGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.34, 8);
    const footGeo = new THREE.SphereGeometry(0.085, 8, 6);
    footGeo.scale(1.0, 0.45, 1.3);

    const legPositions = [
      [-0.20, 0.17, 0.34],  // Front Left
      [0.20, 0.17, 0.34],   // Front Right
      [-0.21, 0.17, -0.34], // Back Left
      [0.21, 0.17, -0.34]   // Back Right
    ];

    legPositions.forEach(([x, y, z]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, y, z);

      const legMesh = new THREE.Mesh(legGeo, capyMat);
      legMesh.castShadow = true;
      legGroup.add(legMesh);

      // Darker foot/paw with subtle webbing
      const foot = new THREE.Mesh(footGeo, darkMat);
      foot.position.set(0, -0.15, 0.04);
      legGroup.add(foot);

      root.add(legGroup);
      legs.push(legGroup);
    });

    this.scene.add(root);

    return {
      species: 'capybara',
      breed: spec.breed || 'Giant Capybara',
      root,
      head,
      ears,
      eyes,
      legs,
      orange: orangeGroup,
      shadow,
      height: 0.92
    };
  }

  // ====================================================
  // TICK UPDATE LOOP & AI BEHAVIORS
  // ====================================================
  update(dt, playerPos) {
    for (const pet of this.pets) {
      pet.animTime += dt * 3;
      pet.timeInDaycare += dt;

      // Needs decay over time
      pet.needs.hunger = Math.max(0, pet.needs.hunger - dt * 0.4);
      pet.needs.thirst = Math.max(0, pet.needs.thirst - dt * 0.45);
      pet.needs.cleanliness = Math.max(0, pet.needs.cleanliness - dt * 0.2);
      pet.needs.play = Math.max(0, pet.needs.play - dt * 0.35);

      if (pet.state === 'sleeping') {
        pet.needs.energy = Math.min(100, pet.needs.energy + dt * 4.0);
        if (pet.needs.energy >= 98) {
          pet.state = 'idle';
          if (pet.currentBed) pet.currentBed.isOccupied = false;
          pet.currentBed = null;
        }
      } else {
        pet.needs.energy = Math.max(0, pet.needs.energy - dt * 0.3);
      }

      // Compute Happiness score
      const avgNeeds = (pet.needs.hunger + pet.needs.thirst + pet.needs.cleanliness + pet.needs.play + pet.needs.energy) / 5;
      pet.needs.happiness = Math.round(avgNeeds);

      // Check if pet is ready for owner pickup
      if (pet.timeInDaycare >= pet.stayDuration) {
        pet.isReadyForPickup = true;
      }

      // Update Floating Thought Bubble
      this.updatePetBubble(pet);

      // If pet is held by player, animate in arms and gently boost happiness
      if (pet.isHeld) {
        pet.needs.happiness = Math.min(100, pet.needs.happiness + dt * 1.5);
        this.animatePetMesh(pet, dt);
        continue;
      }

      // State machine logic
      this.updatePetAI(pet, dt);
      this.animatePetMesh(pet, dt);
    }
  }

  updatePetBubble(pet) {
    let desiredBubble = null;
    if (pet.needs.hunger < 35) desiredBubble = 'hungry';
    else if (pet.needs.thirst < 35) desiredBubble = 'thirsty';
    else if (pet.needs.cleanliness < 35) desiredBubble = 'dirty';
    else if (pet.needs.play < 35) desiredBubble = 'playful';
    else if (pet.needs.energy < 30) desiredBubble = 'sleepy';
    else if (pet.needs.happiness >= 85) desiredBubble = 'love';

    if (desiredBubble) {
      if (pet.currentBubbleType !== desiredBubble) {
        pet.bubble.material.map = this.bubbleTextures[desiredBubble];
        pet.bubble.material.needsUpdate = true;
        pet.currentBubbleType = desiredBubble;
      }
      pet.bubble.material.opacity = 0.95;
      // Gentle floating bob
      pet.bubble.position.y = pet.height + 0.55 + Math.sin(pet.animTime * 2) * 0.08;
    } else {
      pet.bubble.material.opacity = 0;
    }
  }

  updatePetAI(pet, dt) {
    pet.stateTimer -= dt;

    // Autonomous choice when state timer expires
    if (pet.stateTimer <= 0) {
      pet.stateTimer = 3 + Math.random() * 4;

      // If very tired, seek an empty bed
      if (pet.needs.energy < 35 && pet.state !== 'sleeping') {
        const availableBed = this.world.petBeds.find(b => !b.isOccupied);
        if (availableBed) {
          availableBed.isOccupied = true;
          pet.currentBed = availableBed;
          pet.targetPos.copy(availableBed.pos);
          pet.state = 'wander';
          return;
        }
      }

      // If very hungry and food bowl is near, wander to bowl
      if (pet.needs.hunger < 40 && Math.random() < 0.6) {
        pet.targetPos.copy(this.world.stations.foodBowl.pos).add(new THREE.Vector3(0.8, 0, 0));
        pet.state = 'wander';
        return;
      }

      // Normal wander inside playroom or backyard
      const inYard = Math.random() < 0.45;
      let randX, randZ;
      if (inYard) {
        randX = (Math.random() - 0.5) * 16;
        randZ = -9 - Math.random() * 6; // Backyard area
      } else {
        randX = (Math.random() - 0.5) * 10;
        randZ = (Math.random() - 0.5) * 8; // Indoor playroom
      }

      if (!this.world.checkCollision(randX, randZ, 0.4)) {
        pet.targetPos.set(randX, 0, randZ);
        pet.state = Math.random() < 0.25 ? 'idle' : 'wander';
      }

      // Happy Guinea Pigs occasionally popcorn when exploring
      if (pet.species === 'guinea_pig' && pet.needs.happiness > 65 && Math.random() < 0.3) {
        pet.triggerPopcorn();
        if (this.audio.playWheek) this.audio.playWheek();
      }

      // Peaceful Capybara occasionally chirps when zen and content
      if (pet.species === 'capybara' && pet.needs.happiness > 60 && Math.random() < 0.25) {
        if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
      }
    }

    // Movement toward target position
    if (pet.state === 'wander' || pet.state === 'playing_fetch') {
      const dist = pet.root.position.distanceTo(pet.targetPos);
      if (dist > 0.3) {
        const moveDir = this._scratchVec.copy(pet.targetPos).sub(pet.root.position).normalize();
        pet.root.position.addScaledVector(moveDir, pet.speed * dt);
        pet.root.rotation.y = Math.atan2(moveDir.x, moveDir.z);

        // If carrying ball in mouth during fetch
        if (pet.state === 'playing_fetch' && this.carriedBall) {
          this.carriedBall.position.copy(pet.root.position).add(new THREE.Vector3(0, 0.4, 0.3));
        }
      } else {
        // Arrived at target!
        if (pet.currentBed && pet.root.position.distanceTo(pet.currentBed.pos) < 0.8) {
          pet.state = 'sleeping';
          this.audio.playPurr();
        } else if (pet.state === 'playing_fetch') {
          pet.state = 'idle';
          this.audio.playBark();
        } else {
          pet.state = 'idle';
        }
      }
    }
  }

  animatePetMesh(pet, dt) {
    const isMoving = pet.state === 'wander' || pet.state === 'playing_fetch';

    // 1. Natural Blinking Animation
    pet.blinkTimer -= dt;
    if (pet.blinkTimer <= 0) {
      pet.isBlinking = true;
      pet.blinkDuration = 0.12;
      pet.blinkTimer = 2.4 + Math.random() * 3.6;
    }
    if (pet.isBlinking) {
      pet.blinkDuration -= dt;
      if (pet.eyes) {
        pet.eyes.forEach(e => { e.scale.y = 0.08; });
      }
      if (pet.blinkDuration <= 0) {
        pet.isBlinking = false;
        if (pet.eyes) {
          pet.eyes.forEach(e => { e.scale.y = 1.0; });
        }
      }
    }

    // 2. Head Tilt During Idle
    if (!isMoving && pet.head && pet.state !== 'sleeping') {
      pet.head.rotation.z = Math.sin(pet.animTime * 1.2) * 0.14;
    } else if (pet.head) {
      pet.head.rotation.z = 0;
    }

    // 3. Species-Specific Animations
    if (pet.species === 'dog') {
      // Wagging Tail (excited when happy)
      if (pet.tail) {
        const wagSpeed = pet.needs.happiness > 70 ? 12 : 7;
        const wagAmp = pet.needs.happiness > 70 ? 0.75 : 0.35;
        pet.tail.rotation.z = Math.sin(pet.animTime * wagSpeed) * wagAmp;
      }
      // Panting Tongue
      if (pet.tongue) {
        if (pet.needs.happiness > 50 || pet.state === 'playing_fetch') {
          pet.tongue.visible = true;
          pet.tongue.scale.z = 1.0 + Math.sin(pet.animTime * 10) * 0.25;
        } else {
          pet.tongue.visible = false;
        }
      }
    } else if (pet.species === 'cat') {
      // Swishing Tail
      if (pet.tail) {
        pet.tail.rotation.z = Math.sin(pet.animTime * 2.6) * 0.4;
        pet.tail.rotation.x = -Math.PI / 3 + Math.sin(pet.animTime * 1.5) * 0.12;
      }
      // Occasional Ear Twitch
      if (pet.ears && !isMoving && Math.sin(pet.animTime * 0.7) > 0.85) {
        pet.ears[0].rotation.z = 0.2 + Math.sin(pet.animTime * 16) * 0.16;
      }
    } else if (pet.species === 'bunny') {
      // Twitching Nose
      if (pet.nose) {
        const twitch = 1.0 + Math.sin(pet.animTime * 14) * 0.18;
        pet.nose.scale.set(twitch, twitch, 1.0);
      }
      // Independent Ear Wiggle
      if (pet.ears) {
        pet.ears[0].rotation.x = Math.sin(pet.animTime * 4) * 0.1;
        pet.ears[1].rotation.x = Math.cos(pet.animTime * 4) * 0.1;
      }
    } else if (pet.species === 'guinea_pig') {
      // Constant cute nose twitch
      if (pet.nose) {
        const twitch = 1.0 + Math.sin(pet.animTime * 18) * 0.18;
        pet.nose.scale.set(twitch, twitch, 1.0);
      }
      // Gentle ear wiggles
      if (pet.ears) {
        pet.ears[0].rotation.z = -0.35 + Math.sin(pet.animTime * 3) * 0.08;
        pet.ears[1].rotation.z = 0.35 - Math.sin(pet.animTime * 3) * 0.08;
      }
      // Joyful Popcorning Hop & Twist
      if (pet.isPopcorning) {
        pet.popcornTimer -= dt;
        const progress = Math.max(0, pet.popcornTimer / 0.45);
        const hopY = Math.sin((1 - progress) * Math.PI) * 0.32;
        pet.root.position.y = hopY;
        pet.root.rotation.y += Math.sin((1 - progress) * Math.PI * 4) * 0.15;

        if (pet.shadow) {
          pet.shadow.position.y = 0.02 - hopY;
          const s = Math.max(0.6, 1.0 - hopY * 0.8);
          pet.shadow.scale.set(s, s, s);
        }

        if (pet.popcornTimer <= 0) {
          pet.isPopcorning = false;
          pet.root.position.y = 0;
          if (pet.shadow) {
            pet.shadow.position.y = 0.02;
            pet.shadow.scale.set(1, 1, 1);
          }
        }
      } else if (!isMoving) {
        pet.root.position.y = 0;
        if (pet.shadow) {
          pet.shadow.position.y = 0.02;
          pet.shadow.scale.set(1, 1, 1);
        }
      }
    } else if (pet.species === 'capybara') {
      // 1. The Iconic Balanced Orange Micro-Wobble on its head 🍊
      if (pet.orange) {
        const wobbleZ = Math.sin(pet.animTime * 2.2) * 0.05 + (isMoving ? Math.sin(pet.animTime * 4.5) * 0.06 : 0);
        const wobbleX = Math.cos(pet.animTime * 1.8) * 0.04;
        pet.orange.rotation.z = wobbleZ;
        pet.orange.rotation.x = wobbleX;
      }
      // 2. Peaceful, Zen Ear Wiggles
      if (pet.ears) {
        pet.ears[0].rotation.z = -0.25 + Math.sin(pet.animTime * 2.0) * 0.05;
        pet.ears[1].rotation.z = 0.25 - Math.sin(pet.animTime * 2.0) * 0.05;
      }
      // 3. Calm Snout / Head Breathing Bob
      if (pet.head && !isMoving && pet.state !== 'sleeping') {
        pet.head.position.y = 0.58 + Math.sin(pet.animTime * 1.4) * 0.012;
      }
    }

    // 4. Legs Locomotion Swing, Guinea Pig Scurry, or Bunny Hopping
    if (pet.species === 'bunny') {
      if (isMoving) {
        const hopCycle = (pet.animTime * 5.5) % Math.PI;
        const hopY = Math.sin(hopCycle) * 0.32;
        pet.root.position.y = hopY;

        // Shadow stays pinned to floor and shrinks slightly in mid-air
        if (pet.shadow) {
          pet.shadow.position.y = 0.02 - hopY;
          const s = Math.max(0.65, 1.0 - hopY * 0.7);
          pet.shadow.scale.set(s, s, s);
        }
      } else {
        pet.root.position.y = 0;
        if (pet.shadow) {
          pet.shadow.position.y = 0.02;
          pet.shadow.scale.set(1, 1, 1);
        }
      }
    } else if (pet.species === 'guinea_pig') {
      if (isMoving && pet.legs) {
        pet.legs.forEach((leg, idx) => {
          const phase = (idx % 2 === 0 ? 1 : -1) * (idx < 2 ? 1 : -1);
          leg.rotation.x = Math.sin(pet.animTime * 12 + phase) * 0.45; // Fast cute scurry!
        });
      } else if (pet.legs) {
        pet.legs.forEach(leg => { leg.rotation.x = 0; });
      }
    } else if (pet.species === 'capybara') {
      if (isMoving && pet.legs) {
        pet.legs.forEach((leg, idx) => {
          const phase = (idx % 2 === 0 ? 1 : -1) * (idx < 2 ? 1 : -1);
          leg.rotation.x = Math.sin(pet.animTime * 4.6 + phase) * 0.38; // Stately, calm capybara stroll
        });
      } else if (pet.legs) {
        pet.legs.forEach(leg => { leg.rotation.x = 0; });
      }
    } else {
      if (isMoving && pet.legs) {
        pet.legs.forEach((leg, idx) => {
          const phase = (idx % 2 === 0 ? 1 : -1) * (idx < 2 ? 1 : -1);
          leg.rotation.x = Math.sin(pet.animTime * 6.5 + phase) * 0.55;
        });
      } else if (pet.legs) {
        pet.legs.forEach(leg => { leg.rotation.x = 0; });
      }
    }

    // 5. Sleeping Breathing Pulsation & Closed Eyes
    if (pet.state === 'sleeping') {
      if (pet.eyes) {
        pet.eyes.forEach(e => { e.scale.y = 0.05; });
      }
      if (pet.tongue) pet.tongue.visible = false;
      const breath = 1.0 + Math.sin(pet.animTime * 1.5) * 0.05;
      pet.root.scale.set(1, breath, 1);
    } else {
      pet.root.scale.set(1, 1, 1);
    }
  }

  // Find the closest pet to a given position within maxDistance
  getClosestPet(pos, maxDistance = 2.8) {
    let closest = null;
    let minDst = maxDistance;
    for (const pet of this.pets) {
      const dst = pet.root.position.distanceTo(pos);
      if (dst < minDst) {
        minDst = dst;
        closest = pet;
      }
    }
    return closest;
  }
}
