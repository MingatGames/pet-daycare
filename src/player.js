import * as THREE from 'three';
import { TextureGenerator } from './textures.js';

export class PlayerController {
  constructor(scene, camera, domElement, world) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;

    // Movement state
    this.pos = new THREE.Vector3(0, 0, 3);
    this.velocity = new THREE.Vector3();
    this.facingAngle = 0;
    this.speed = 5.2;

    // Keys state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Touch joystick & mobile input state
    this.joystickVector = new THREE.Vector2(0, 0);
    this.lastTouchTime = 0;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Camera parameters
    this.cameraDist = 6.2;
    this.cameraHeight = 4.2;
    this.cameraPitch = 0.45;
    this.cameraYaw = 0;
    this.cameraMode = 'follow'; // 'follow' or 'free_orbit'
    this.cameraOverride = null;

    // Active held tool
    this.currentTool = 'HANDS';

    // Currently carried pet in arms
    this.carriedPet = null;

    // Item Supply Inventory Tracking (Restocked at the Supply Cabin)
    this.supplies = {
      FOOD: { current: 5, max: 5, name: 'Kibble', icon: '🍖' },
      WATER: { current: 5, max: 5, name: 'Fresh Water', icon: '💧' },
      GROOM: { current: 5, max: 5, name: 'Soap Sponge', icon: '🧼' },
      BALL: { current: 3, max: 3, name: 'Tennis Balls', icon: '🎾' },
      FEATHER: { current: 5, max: 5, name: 'Feather Wand', icon: '🪶' }
    };

    // Build Caretaker 3D Mesh
    this.mesh = this.buildPlayerMesh();
    this.scene.add(this.mesh);

    // Build Held Item Mesh Group
    this.heldGroup = new THREE.Group();
    this.mesh.add(this.heldGroup);
    this.updateHeldItemMesh();

    this.setupInputs();
    this.setupTouchControls();
  }

  buildPlayerMesh() {
    const root = new THREE.Group();
    root.position.copy(this.pos);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.6 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xf28482, roughness: 0.5 }); // Coral daycare apron
    const apronStrapMat = new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x457b9d, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.6 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x6c584c, roughness: 0.9 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf28482, roughness: 0.5 });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xffa69e, transparent: true, opacity: 0.6 });

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

    // 2. Torso with Coral Apron
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    const torso = new THREE.Mesh(torsoGeo, apronMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    root.add(torso);

    // Apron Neck Halter Strap
    const strapGeo = new THREE.TorusGeometry(0.18, 0.02, 6, 16, Math.PI);
    const strap = new THREE.Mesh(strapGeo, apronStrapMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, 1.52, 0.06);
    root.add(strap);

    // Apron Kangaroo Front Pouch Pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.22, 0.04),
      apronStrapMat
    );
    pocket.position.set(0, 1.0, 0.17);
    root.add(pocket);

    // Cute Grooming Comb peeking from pocket
    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.16, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.4 })
    );
    comb.rotation.z = 0.2;
    comb.position.set(-0.08, 1.14, 0.175);
    root.add(comb);

    // Dog Treat Bone peeking from pocket
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.5 });
    const boneShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 6), boneMat);
    boneShaft.rotation.z = -0.3;
    boneShaft.position.set(0.08, 1.14, 0.175);
    root.add(boneShaft);

    // Cute Paw Print Badge on Apron
    const badgeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.14, 1.35, 0.17);
    badge.rotation.x = Math.PI / 2;
    root.add(badge);

    // 3. Head & Expressive Facial Features
    const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.72, 0);
    head.castShadow = true;
    root.add(head);

    // Shiny Eyes with Glints
    [-0.08, 0.08].forEach(ex => {
      const eyeball = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.2 })
      );
      eyeball.position.set(ex, 1.74, 0.19);
      root.add(eyeball);

      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      glint.position.set(ex + 0.01, 1.752, 0.218);
      root.add(glint);
    });

    // Rosy Cheeks Blush Discs
    [-0.12, 0.12].forEach(bx => {
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.036, 12), blushMat);
      blush.position.set(bx, 1.68, 0.198);
      root.add(blush);
    });

    // Friendly Smile Line
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x8d0801 })
    );
    smile.rotation.x = Math.PI;
    smile.position.set(0, 1.66, 0.21);
    root.add(smile);

    // Hair & Caretaker Cap with Visor Brim
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      capMat
    );
    cap.position.set(0, 1.74, 0);
    root.add(cap);

    // Visor Bill
    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.03, 12, 1, false, -Math.PI / 3, Math.PI * 2 / 3),
      capMat
    );
    visor.position.set(0, 1.78, 0.12);
    visor.rotation.x = 0.18;
    root.add(visor);

    // 4. Legs with Two-Tone Sneakers
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8);
    const legL = new THREE.Mesh(legGeo, jeansMat);
    legL.position.set(-0.15, 0.45, 0);
    legL.castShadow = true;
    root.add(legL);
    this.legL = legL;

    const legR = new THREE.Mesh(legGeo, jeansMat);
    legR.position.set(0.15, 0.45, 0);
    legR.castShadow = true;
    root.add(legR);
    this.legR = legR;

    // Sneakers (Left & Right)
    [[-0.15, legL], [0.15, legR]].forEach(([sx, leg]) => {
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.32, 0.04);

      // Shoe body
      const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.24), shoeMat);
      shoeUpper.position.y = 0.06;
      shoeGroup.add(shoeUpper);

      // White rubber sole
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.26), soleMat);
      sole.position.y = 0.02;
      shoeGroup.add(sole);

      leg.add(shoeGroup);
    });

    // 5. Arms with Shirt & Rolled Cuffs
    const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 8);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.35, 1.14, 0.06);
    armL.rotation.x = Math.PI / 6;
    armL.castShadow = true;
    root.add(armL);
    this.armL = armL;

    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.35, 1.14, 0.06);
    armR.rotation.x = Math.PI / 6;
    armR.castShadow = true;
    root.add(armR);
    this.armR = armR;

    // Hands
    [armL, armR].forEach(arm => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), skinMat);
      hand.position.y = -0.28;
      arm.add(hand);
    });

    return root;
  }

  updateHeldItemMesh() {
    // Clear existing held tool mesh
    while (this.heldGroup.children.length > 0) {
      this.heldGroup.remove(this.heldGroup.children[0]);
    }

    if (this.currentTool === 'FOOD') {
      // Kibble Bowl
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.16, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf4a261 })
      );
      bowl.position.set(0, 1.1, 0.45);
      this.heldGroup.add(bowl);
    } else if (this.currentTool === 'WATER') {
      // Water Pitcher
      const jug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0x48cae4, roughness: 0.2 })
      );
      jug.position.set(0, 1.15, 0.45);
      this.heldGroup.add(jug);
    } else if (this.currentTool === 'GROOM') {
      // Soap Sponge
      const sponge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12, 0.26),
        new THREE.MeshStandardMaterial({ color: 0xffea00, roughness: 0.9 })
      );
      sponge.position.set(0, 1.1, 0.45);
      this.heldGroup.add(sponge);
    } else if (this.currentTool === 'BALL') {
      // Neon Tennis Ball
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xccff00 })
      );
      ball.position.set(0, 1.1, 0.45);
      this.heldGroup.add(ball);
    } else if (this.currentTool === 'FEATHER') {
      // Feather Wand
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0xeddcd2 })
      );
      stick.rotation.x = Math.PI / 4;
      stick.position.set(0.2, 1.2, 0.45);
      const feather = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.24, 6),
        new THREE.MeshStandardMaterial({ color: 0xf72585 })
      );
      feather.position.set(0.2, 1.45, 0.65);
      this.heldGroup.add(stick);
      this.heldGroup.add(feather);
    }
  }

  setTool(toolName) {
    this.currentTool = toolName;
    this.updateHeldItemMesh();
  }

  pickUpPet(pet) {
    if (!pet) return false;
    this.carriedPet = pet;
    pet.isHeld = true;
    pet.state = 'held';
    this.setTool('HANDS');
    return true;
  }

  dropPet(targetPos = null) {
    if (!this.carriedPet) return null;
    const pet = this.carriedPet;
    pet.isHeld = false;
    pet.state = 'idle';
    if (targetPos) {
      pet.root.position.copy(targetPos);
    } else {
      const forward = this.getForwardDirection();
      pet.root.position.copy(this.pos).add(forward.multiplyScalar(0.75));
      pet.root.position.y = 0;
    }
    if (pet.shadow) {
      pet.shadow.position.y = 0.02;
      pet.shadow.scale.set(1, 1, 1);
    }
    this.carriedPet = null;
    return pet;
  }

  hasSupply(tool) {
    if (!tool || tool === 'HANDS') return true;
    const sup = this.supplies[tool];
    if (!sup) return true;
    return sup.current > 0;
  }

  getSupplyCount(tool) {
    if (!tool || tool === 'HANDS') return Infinity;
    return this.supplies[tool] ? this.supplies[tool].current : Infinity;
  }

  consumeSupply(tool) {
    if (!tool || tool === 'HANDS') return true;
    const sup = this.supplies[tool];
    if (!sup) return true;
    if (sup.current > 0) {
      sup.current -= 1;
      return true;
    }
    return false;
  }

  restockAllSupplies() {
    let replenished = false;
    for (const key of Object.keys(this.supplies)) {
      const item = this.supplies[key];
      if (item.current < item.max) {
        item.current = item.max;
        replenished = true;
      }
    }
    return {
      success: true,
      replenished
    };
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Digit1':
          this.setTool('HANDS');
          break;
        case 'Digit2':
          this.setTool('FOOD');
          break;
        case 'Digit3':
          this.setTool('WATER');
          break;
        case 'Digit4':
          this.setTool('GROOM');
          break;
        case 'Digit5':
          this.setTool('BALL');
          break;
        case 'Digit6':
          this.setTool('FEATHER');
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
      }
    });

    // Direct Mouse Movement Perspective (No dragging needed!)
    let prevMouseX = null;
    let prevMouseY = null;

    // Optional pointer lock on canvas click
    this.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== this.domElement && this.domElement.requestPointerLock) {
        this.domElement.requestPointerLock();
      }
    });

    window.addEventListener('mousemove', (e) => {
      // Guard against touch-emulated mousemove events on iPad/mobile
      if (Date.now() - this.lastTouchTime < 600) return;

      let deltaX = 0;
      let deltaY = 0;

      if (document.pointerLockElement === this.domElement) {
        deltaX = e.movementX || 0;
        deltaY = e.movementY || 0;
      } else {
        if (prevMouseX !== null && prevMouseY !== null) {
          deltaX = e.movementX !== undefined && Math.abs(e.movementX) > 0 ? e.movementX : e.clientX - prevMouseX;
          deltaY = e.movementY !== undefined && Math.abs(e.movementY) > 0 ? e.movementY : e.clientY - prevMouseY;
        }
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Rotate camera yaw horizontally
      const sensitivity = 0.0035;
      this.cameraYaw -= deltaX * sensitivity;

      // Adjust camera pitch vertically (look up at roof or down at pets)
      this.cameraPitch = Math.max(0.12, Math.min(1.05, this.cameraPitch + deltaY * sensitivity * 0.7));
    });

    // Smooth Mouse Wheel Camera Zoom In / Out
    window.addEventListener('wheel', (e) => {
      this.cameraDist = Math.max(3.2, Math.min(11.0, this.cameraDist + e.deltaY * 0.005));
    }, { passive: true });
  }

  setupTouchControls() {
    const joystickEl = document.getElementById('touch-joystick');
    const knobEl = document.getElementById('touch-stick-knob');
    const touchActionBtn = document.getElementById('touch-action-btn');

    // Force show controls on iPad or touch devices
    if (this.isTouchDevice) {
      if (joystickEl) joystickEl.style.display = 'block';
      if (touchActionBtn) touchActionBtn.style.display = 'flex';
    }

    let joyTouchId = null;
    let joyCenter = { x: 0, y: 0 };
    const maxRadius = 45;

    // Pointer Events on Virtual Joystick for robust iPad, stylus & touch interaction
    if (joystickEl) {
      let isPointerDown = false;
      const updateJoyFromCoords = (clientX, clientY) => {
        const rect = joystickEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        if (knobEl) {
          knobEl.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        }

        this.joystickVector.x = (knobX / maxRadius);
        this.joystickVector.y = -(knobY / maxRadius);
      };

      joystickEl.addEventListener('pointerdown', (e) => {
        isPointerDown = true;
        this.lastTouchTime = Date.now();
        if (joystickEl.setPointerCapture) {
          try { joystickEl.setPointerCapture(e.pointerId); } catch (_) {}
        }
        updateJoyFromCoords(e.clientX, e.clientY);
      });

      const onPointerMove = (e) => {
        if (!isPointerDown) return;
        this.lastTouchTime = Date.now();
        updateJoyFromCoords(e.clientX, e.clientY);
      };
      joystickEl.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointermove', onPointerMove);

      const onPointerUp = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        this.joystickVector.set(0, 0);
        if (knobEl) {
          knobEl.style.transform = 'translate(-50%, -50%)';
        }
        if (joystickEl.releasePointerCapture) {
          try { joystickEl.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };

      joystickEl.addEventListener('pointerup', onPointerUp);
      joystickEl.addEventListener('pointercancel', onPointerUp);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    let camTouchId = null;
    let lastCamX = 0;
    let lastCamY = 0;
    let initialPinchDist = 0;
    let initialCameraDist = this.cameraDist;

    const onTouchStart = (e) => {
      this.lastTouchTime = Date.now();
      if (joystickEl && joystickEl.style.display === 'none') joystickEl.style.display = 'block';
      if (touchActionBtn && touchActionBtn.style.display === 'none') touchActionBtn.style.display = 'flex';

      // Pinch zoom handling for 2 fingers
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialCameraDist = this.cameraDist;
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const target = document.elementFromPoint(t.clientX, t.clientY);
        if (target && target.closest('#hud-top, #pets-drawer, #hotbar, #quick-actions, .modal-backdrop, #welcome-screen, #loading-screen, #touch-action-btn, #dialogue-modal, #store-modal, #help-modal')) {
          continue;
        }

        // Left 48% of screen: Virtual Joystick
        if (t.clientX < window.innerWidth * 0.48 && joyTouchId === null) {
          joyTouchId = t.identifier;
          if (joystickEl) {
            const rect = joystickEl.getBoundingClientRect();
            joyCenter = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
        }
        // Right 52% of screen: Camera Rotation
        else if (t.clientX >= window.innerWidth * 0.48 && camTouchId === null) {
          camTouchId = t.identifier;
          lastCamX = t.clientX;
          lastCamY = t.clientY;
        }
      }
    };

    const onTouchMove = (e) => {
      this.lastTouchTime = Date.now();

      // Two-finger pinch zoom
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentPinch = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const pinchDelta = currentPinch - initialPinchDist;
        this.cameraDist = Math.max(3.2, Math.min(11.0, initialCameraDist - pinchDelta * 0.025));
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];

        // Process joystick movement
        if (t.identifier === joyTouchId) {
          const dx = t.clientX - joyCenter.x;
          const dy = t.clientY - joyCenter.y;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;

          if (knobEl) {
            knobEl.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
          }

          this.joystickVector.x = (knobX / maxRadius);
          this.joystickVector.y = -(knobY / maxRadius);
        }

        // Process camera look swipe
        if (t.identifier === camTouchId) {
          const dx = t.clientX - lastCamX;
          const dy = t.clientY - lastCamY;
          lastCamX = t.clientX;
          lastCamY = t.clientY;

          const touchSensitivity = 0.005;
          this.cameraYaw -= dx * touchSensitivity;
          this.cameraPitch = Math.max(0.12, Math.min(1.05, this.cameraPitch + dy * touchSensitivity * 0.7));
        }
      }
    };

    const onTouchEnd = (e) => {
      this.lastTouchTime = Date.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === joyTouchId) {
          joyTouchId = null;
          this.joystickVector.set(0, 0);
          if (knobEl) {
            knobEl.style.transform = 'translate(-50%, -50%)';
          }
        }
        if (t.identifier === camTouchId) {
          camTouchId = null;
        }
      }
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  getForwardDirection() {
    return new THREE.Vector3(Math.sin(this.facingAngle), 0, Math.cos(this.facingAngle)).normalize();
  }

  update(dt) {
    // Calculate camera forward & right unit vectors along ground plane
    const forwardX = Math.sin(this.cameraYaw);
    const forwardZ = Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw);
    const rightZ = -Math.sin(this.cameraYaw);

    let moveX = 0;
    let moveZ = 0;

    // W = Move forward away from camera (in view direction)
    if (this.keys.forward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    // S = Move backward toward camera
    if (this.keys.backward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    // D = Strafe right
    if (this.keys.right) {
      moveX += rightX;
      moveZ += rightZ;
    }
    // A = Strafe left
    if (this.keys.left) {
      moveX -= rightX;
      moveZ -= rightZ;
    }

    // Touch Virtual Joystick input (iPad / Mobile)
    if (this.joystickVector && (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05)) {
      moveX += forwardX * this.joystickVector.y + rightX * this.joystickVector.x;
      moveZ += forwardZ * this.joystickVector.y + rightZ * this.joystickVector.x;
    }

    const moveDist = Math.hypot(moveX, moveZ);
    const isMoving = moveDist > 0.001;

    if (isMoving) {
      // Normalize movement direction
      const normX = moveX / moveDist;
      const normZ = moveZ / moveDist;

      const nextX = this.pos.x + normX * this.speed * dt;
      const nextZ = this.pos.z + normZ * this.speed * dt;

      // Collision detection with sliding
      if (!this.world.checkCollision(nextX, this.pos.z, 0.45)) {
        this.pos.x = nextX;
      }
      if (!this.world.checkCollision(this.pos.x, nextZ, 0.45)) {
        this.pos.z = nextZ;
      }

      // Face direction of movement smoothly
      this.facingAngle = Math.atan2(normX, normZ);
      this.mesh.rotation.y = this.facingAngle;

      // Natural leg and arm swing walk animation
      const walkTime = Date.now() * 0.008;
      this.legL.rotation.x = Math.sin(walkTime) * 0.5;
      this.legR.rotation.x = -Math.sin(walkTime) * 0.5;
      if (this.carriedPet) {
        // Cradling arm pose holding pet securely with gentle walking bob
        const carryBob = Math.sin(walkTime * 0.5) * 0.05;
        this.armL.rotation.set(Math.PI / 3 + carryBob, 0.38, 0.42);
        this.armR.rotation.set(Math.PI / 3 + carryBob, -0.38, -0.42);
      } else if (this.armL && this.armR) {
        this.armL.rotation.set(Math.PI / 6 - Math.sin(walkTime) * 0.45, 0, 0);
        this.armR.rotation.set(Math.PI / 6 + Math.sin(walkTime) * 0.45, 0, 0);
      }
    } else {
      this.legL.rotation.x = 0;
      this.legR.rotation.x = 0;
      if (this.carriedPet) {
        // Idle gentle breathing cradling pose
        const breathe = Math.sin(Date.now() * 0.003) * 0.03;
        this.armL.rotation.set(Math.PI / 3 + breathe, 0.38, 0.42);
        this.armR.rotation.set(Math.PI / 3 + breathe, -0.38, -0.42);
      } else if (this.armL && this.armR) {
        this.armL.rotation.set(Math.PI / 6, 0, 0);
        this.armR.rotation.set(Math.PI / 6, 0, 0);
      }
    }

    this.mesh.position.copy(this.pos);

    // Synchronize carried pet in front of caretaker's chest
    if (this.carriedPet) {
      const forward = this.getForwardDirection();
      const carryHeight = 0.70 + (this.carriedPet.species === 'capybara' ? -0.05 : (this.carriedPet.species === 'guinea_pig' ? -0.15 : 0));
      const carryDist = this.carriedPet.species === 'capybara' ? 0.62 : 0.52;
      const walkBob = isMoving ? Math.sin(Date.now() * 0.008 * 2) * 0.04 : Math.sin(Date.now() * 0.003) * 0.02;

      this.carriedPet.root.position.copy(this.pos)
        .add(forward.clone().multiplyScalar(carryDist))
        .add(new THREE.Vector3(0, carryHeight + walkBob, 0));
      this.carriedPet.root.rotation.y = this.facingAngle;

      // Keep shadow on the floor directly beneath the pet
      if (this.carriedPet.shadow) {
        this.carriedPet.shadow.position.y = 0.02 - (carryHeight + walkBob);
        this.carriedPet.shadow.scale.set(0.85, 0.85, 0.85);
      }
    }

    // Camera follow or cinematic override
    if (this.cameraOverride) {
      this.camera.position.copy(this.cameraOverride.position);
      this.camera.lookAt(this.cameraOverride.lookAt);
    } else {
      // Smooth Camera Follow with pitch & yaw
      const horizontalDist = Math.cos(this.cameraPitch) * this.cameraDist;
      const verticalDist = Math.sin(this.cameraPitch) * this.cameraDist;

      const targetCamX = this.pos.x - Math.sin(this.cameraYaw) * horizontalDist;
      const targetCamZ = this.pos.z - Math.cos(this.cameraYaw) * horizontalDist;
      const targetCamY = this.pos.y + verticalDist + 1.2;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.14;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.14;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.14;

      const lookTarget = new THREE.Vector3(this.pos.x, this.pos.y + 1.3, this.pos.z);
      this.camera.lookAt(lookTarget);
    }
  }
}
