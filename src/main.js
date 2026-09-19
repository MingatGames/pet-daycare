import * as THREE from 'three';
window.THREE = THREE;
import { AudioManager } from './audio.js';
import { WorldManager } from './world.js';
import { StoreManager } from './store.js';
import { PetManager } from './pets.js';
import { PlayerController } from './player.js';
import { InteractionManager } from './interactions.js';
import { OwnerManager } from './owners.js';
import { UIManager } from './ui.js';

class DaycareGame {
  constructor() {
    this.container = document.getElementById('app');
    this.gameTime = 0;
    this.lastFrameTime = performance.now();
    this.isPlaying = false;

    this.initEngine();
    this.initSystems();
    this.setupStartButton();

    // Auto-dismiss loading screen once Three.js scene compiles
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    }, 400);
  }

  initEngine() {
    // Scene with soft cozy atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbde0fe);
    this.scene.fog = new THREE.FogExp2(0xbde0fe, 0.014);

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 5, 10);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.container.appendChild(this.renderer.domElement);

    // Resize & Orientation Change Handlers (iPad Landscape & Portrait)
    const handleResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 120);
    });

    // Visibility / Blur listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.audio) {
        this.audio.stopBgm();
      } else if (this.isPlaying && this.audio) {
        this.audio.resume();
        this.audio.startBgmLoop();
      }
    });

    // AudioContext gesture unlock on first touch for iPadOS
    const unlockAudioOnTouch = () => {
      if (this.audio && this.audio.ctx && this.audio.ctx.state === 'suspended') {
        this.audio.ctx.resume();
      }
      window.removeEventListener('touchstart', unlockAudioOnTouch);
      window.removeEventListener('touchend', unlockAudioOnTouch);
    };
    window.addEventListener('touchstart', unlockAudioOnTouch, { passive: true });
    window.addEventListener('touchend', unlockAudioOnTouch, { passive: true });
  }

  initSystems() {
    this.audio = new AudioManager();
    this.world = new WorldManager(this.scene);
    this.store = new StoreManager(this.audio);
    this.petManager = new PetManager(this.scene, this.audio, this.world);
    this.player = new PlayerController(this.scene, this.camera, this.renderer.domElement, this.world);
    this.interactions = new InteractionManager(this.scene, this.audio, this.world, this.petManager, this.player);

    this.ownerManager = new OwnerManager(
      this.scene,
      this.audio,
      this.petManager,
      (customer) => {
        // Customer arrived
        if (this.ui) this.ui.update(this.gameTime);
      },
      (pickup) => {
        // Pickup ready
        if (this.ui) this.ui.update(this.gameTime);
      }
    );

    this.ui = new UIManager(
      this.store,
      this.player,
      this.petManager,
      this.ownerManager,
      this.interactions,
      this.audio
    );
  }

  setupStartButton() {
    const startBtn = document.getElementById('start-daycare-btn');
    const welcomeScreen = document.getElementById('welcome-screen');

    let started = false;
    const onStart = () => {
      if (started) return;
      started = true;

      // Unlock Web Audio API
      this.audio.init();
      welcomeScreen.style.display = 'none';
      this.isPlaying = true;

      // Spawn starter companion pets so all animal types are immediately active!
      // 1. Dog (Corgi)
      this.petManager.spawnPet({
        species: 'dog',
        breed: 'Corgi',
        name: 'Waffles',
        color: 0xe09f3e,
        startPos: new THREE.Vector3(0, 0, 1.5),
        hunger: 55,
        thirst: 60,
        cleanliness: 70,
        play: 45,
        energy: 80,
        stayDuration: 240
      });

      // 2. Cat (Calico / Tabby)
      this.petManager.spawnPet({
        species: 'cat',
        breed: 'Calico Cat',
        name: 'Miso',
        color: 0xf4a261,
        eyeColor: 0x2a9d8f,
        startPos: new THREE.Vector3(-2.8, 0, -2.5),
        hunger: 50,
        thirst: 55,
        cleanliness: 85,
        play: 40,
        energy: 75,
        stayDuration: 240
      });

      // 3. Guinea Pig (Tricolor)
      this.petManager.spawnPet({
        species: 'guinea_pig',
        breed: 'Abyssinian',
        name: 'Pip',
        color: 0xd4a373,
        secondaryColor: 0x4a3b32,
        startPos: new THREE.Vector3(1.2, 0, 0.4),
        hunger: 45,
        thirst: 50,
        cleanliness: 80,
        play: 50,
        energy: 85,
        stayDuration: 240
      });

      // 4. Capybara with Orange on its Head 🍊
      this.petManager.spawnPet({
        species: 'capybara',
        breed: 'Giant Capybara',
        name: 'Yuzu',
        color: 0x8a5a3c,
        startPos: new THREE.Vector3(-1.0, 0, 0.6),
        hunger: 50,
        thirst: 55,
        cleanliness: 75,
        play: 45,
        energy: 95,
        stayDuration: 240
      });

      this.audio.playBark();
      this.audio.playPurr();
      if (this.audio.playWheek) this.audio.playWheek();
      if (this.audio.playCapybaraChirp) this.audio.playCapybaraChirp();
      this.audio.playSnuggle();

      this.lastFrameTime = performance.now();
      this.animate();
    };

    startBtn?.addEventListener('click', onStart);
    startBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      onStart();
    }, { passive: false });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const rawDelta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Time Clamping
    const dt = Math.min(rawDelta, 0.1);
    this.gameTime += dt;

    // Always animate ambient world decor (clock, butterflies, fountain)
    if (this.world && this.world.update) {
      this.world.update(dt);
    }

    if (this.isPlaying) {
      this.player.update(dt);
      this.petManager.update(dt, this.player.pos);
      this.ownerManager.update(dt, this.store.maxCapacity);
      this.interactions.update(dt);
      this.ui.update(this.gameTime);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.__petDaycareGame = new DaycareGame();
});
