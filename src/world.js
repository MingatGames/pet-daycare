import * as THREE from 'three';
import { TextureGenerator } from './textures.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;

    // Interactive stations registry
    this.stations = {
      reception: { pos: new THREE.Vector3(0, 0, 7.5), name: 'Reception Desk', type: 'reception', radius: 2.5 },
      foodBowl: { pos: new THREE.Vector3(-6, 0, 1.5), name: 'Kibble Feeder', type: 'food', radius: 2.2, level: 1 },
      waterBowl: { pos: new THREE.Vector3(-6, 0, -1.5), name: 'Fresh Water Bowl', type: 'water', radius: 2.2, level: 1 },
      bathTub: { pos: new THREE.Vector3(6, 0, 0), name: 'Bubble Bath Spa', type: 'bath', radius: 2.4, level: 1 },
      catTree: { pos: new THREE.Vector3(-3.5, 0, -5.5), name: 'Cat Scratching Tree', type: 'cattree', radius: 2.0 },
      agilityRamp: { pos: new THREE.Vector3(4, 0, -12), name: 'Agility Ramp', type: 'agility', radius: 2.8 },
      agilityHurdle: { pos: new THREE.Vector3(-4, 0, -13), name: 'Agility Hurdle Jump', type: 'hurdle', radius: 2.5 },
      agilityTunnel: { pos: new THREE.Vector3(-7.5, 0, -11), name: 'Agility Play Tunnel', type: 'tunnel', radius: 2.5 },
      supplyCabin: { pos: new THREE.Vector3(8.5, 0, -8.4), name: 'Supply Cabin', type: 'cabin', radius: 3.2 }
    };

    this.petBeds = [];
    this.colliders = [];
    this.butterflies = [];
    this.cabinSmokePuffs = [];
    this.cabinLanternLight = null;
    this.clockSecondHand = null;
    this.fountainWater = null;

    this.buildLighting();
    this.buildGroundAndFloors();
    this.buildWallsAndFences();
    this.buildReception();
    this.buildFeedingStation();
    this.buildSpaGroomingStation();
    this.buildPetBedsAndLounge();
    this.buildDecorations();
    this.buildBackyardPlayground();
    this.buildSupplyCabin();
    this.buildDecorativeNature();
    this.buildRoof();
  }

  buildLighting() {
    // Soft Ambient Light for warm cozy illumination
    const ambient = new THREE.AmbientLight(0xfff3e6, 0.95);
    this.scene.add(ambient);

    // Warm Sun Directional Light
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.3);
    sun.position.set(18, 26, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -22;
    sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    this.scene.add(sun);

    // Warm Indoor Chandelier Light
    const roomLight = new THREE.PointLight(0xffd166, 0.8, 18);
    roomLight.position.set(0, 4.5, 1);
    this.scene.add(roomLight);

    // Reception Spot Glow
    const receptionLight = new THREE.PointLight(0xffe3a8, 0.7, 10);
    receptionLight.position.set(0, 3.2, 7);
    this.scene.add(receptionLight);
  }

  buildGroundAndFloors() {
    // 1. Overall Outdoor Grass Terrain with flowers & grass blade texture
    const grassGeo = new THREE.PlaneGeometry(60, 60);
    grassGeo.rotateX(-Math.PI / 2);
    const grassMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createGrassTexture(),
      roughness: 0.85,
      metalness: 0.02
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.receiveShadow = true;
    this.scene.add(grass);

    // 2. Indoor Daycare Room Floor (Honey Oak Wood Planks Texture)
    const indoorFloorGeo = new THREE.BoxGeometry(18, 0.12, 16);
    const indoorMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodFloorTexture(),
      roughness: 0.45,
      metalness: 0.05
    });
    const indoorFloor = new THREE.Mesh(indoorFloorGeo, indoorMat);
    indoorFloor.position.set(0, 0.06, 1);
    indoorFloor.receiveShadow = true;
    this.scene.add(indoorFloor);

    // 3. Reception Welcome Rug
    const rugGeo = new THREE.BoxGeometry(7, 0.04, 4);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0xf4a261,
      roughness: 0.8
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.13, 6);
    this.scene.add(rug);

    // 4. Playroom Soft Pastel Carpet with Embossed Paw Print Texture
    const playRugGeo = new THREE.CylinderGeometry(4.4, 4.4, 0.03, 32);
    const playRugMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createPawRugTexture(),
      roughness: 0.85
    });
    const playRug = new THREE.Mesh(playRugGeo, playRugMat);
    playRug.position.set(0, 0.13, -1.5);
    playRug.receiveShadow = true;
    this.scene.add(playRug);

    // 5. Spa Tile Floor Area with Checkered Ceramic Tiles
    const spaFloorGeo = new THREE.BoxGeometry(5.2, 0.03, 5.2);
    const spaFloorMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCheckeredTileTexture(),
      roughness: 0.25,
      metalness: 0.1
    });
    const spaFloor = new THREE.Mesh(spaFloorGeo, spaFloorMat);
    spaFloor.position.set(6, 0.13, 0);
    spaFloor.receiveShadow = true;
    this.scene.add(spaFloor);

    // 6. Front Sidewalk / Arrival Path (Cobblestone Pavers Texture)
    const pathGeo = new THREE.BoxGeometry(4.5, 0.05, 14);
    const pathMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCobblestoneTexture(),
      roughness: 0.8
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.position.set(0, 0.04, 16);
    path.receiveShadow = true;
    this.scene.add(path);
  }

  buildWallsAndFences() {
    const wallMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWallpaperTexture(),
      roughness: 0.75
    });
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0xa98467,
      roughness: 0.7
    });

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.8, 16), wallMat);
    leftWall.position.set(-9, 1.9, 1);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.colliders.push({ minX: -9.5, maxX: -8.5, minZ: -7, maxZ: 9 });

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.8, 16), wallMat);
    rightWall.position.set(9, 1.9, 1);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    this.colliders.push({ minX: 8.5, maxX: 9.5, minZ: -7, maxZ: 9 });

    // Front Wall (Left segment)
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 0.4), wallMat);
    frontWallL.position.set(-5.75, 1.9, 9);
    this.scene.add(frontWallL);
    this.colliders.push({ minX: -9, maxX: -2.5, minZ: 8.7, maxZ: 9.3 });

    // Front Wall (Right segment)
    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 0.4), wallMat);
    frontWallR.position.set(5.75, 1.9, 9);
    this.scene.add(frontWallR);
    this.colliders.push({ minX: 2.5, maxX: 9, minZ: 8.7, maxZ: 9.3 });

    // Archway header above front entrance door
    const frontArch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 0.4), wallMat);
    frontArch.position.set(0, 3.3, 9);
    this.scene.add(frontArch);

    // Back Wall with Double Doorway leading into Backyard
    const backWallL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 0.4), wallMat);
    backWallL.position.set(-5.75, 1.9, -7);
    this.scene.add(backWallL);
    this.colliders.push({ minX: -9, maxX: -2.5, minZ: -7.3, maxZ: -6.7 });

    const backWallR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 0.4), wallMat);
    backWallR.position.set(5.75, 1.9, -7);
    this.scene.add(backWallR);
    this.colliders.push({ minX: 2.5, maxX: 9, minZ: -7.3, maxZ: -6.7 });

    const backArch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 0.4), wallMat);
    backArch.position.set(0, 3.3, -7);
    this.scene.add(backArch);

    // Picket Fences around the Backyard
    this.buildPicketFence(new THREE.Vector3(-14, 0, -17), new THREE.Vector3(-14, 0, -7)); // West fence
    this.buildPicketFence(new THREE.Vector3(14, 0, -17), new THREE.Vector3(14, 0, -7));   // East fence
    this.buildPicketFence(new THREE.Vector3(-14, 0, -17), new THREE.Vector3(14, 0, -17)); // North back fence
  }

  buildPicketFence(start, end) {
    const dir = end.clone().sub(start);
    const dist = dir.length();
    const count = Math.floor(dist / 0.85);
    const step = dir.clone().divideScalar(count);

    const postGeo = new THREE.BoxGeometry(0.12, 1.2, 0.12);
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, dist);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

    for (let i = 0; i <= count; i++) {
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.copy(start).add(step.clone().multiplyScalar(i));
      post.position.y = 0.6;
      post.castShadow = true;
      this.scene.add(post);
    }

    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(dist, 0.08, 0.08), fenceMat);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    rail1.position.set(mid.x, 0.4, mid.z);
    if (Math.abs(dir.x) < 0.1) rail1.rotation.y = Math.PI / 2;
    this.scene.add(rail1);

    const rail2 = rail1.clone();
    rail2.position.y = 0.85;
    this.scene.add(rail2);
  }

  buildReception() {
    const counterGroup = new THREE.Group();
    counterGroup.position.set(0, 0, 7.5);

    // 1. Reception Counter Desk
    const deskGeo = new THREE.BoxGeometry(3.6, 1.1, 1.1);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.4 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.55;
    desk.castShadow = true;
    desk.receiveShadow = true;
    counterGroup.add(desk);

    // Marble counter top slab
    const topGeo = new THREE.BoxGeometry(3.8, 0.08, 1.3);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 1.14;
    counterGroup.add(top);

    // Brass Service Bell
    const bellBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.05, 12);
    const bellTopGeo = new THREE.SphereGeometry(0.12, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });
    const bellBase = new THREE.Mesh(bellBaseGeo, bellMat);
    bellBase.position.set(0.7, 1.2, 0);
    const bellTop = new THREE.Mesh(bellTopGeo, bellMat);
    bellTop.position.set(0.7, 1.24, 0);
    counterGroup.add(bellBase);
    counterGroup.add(bellTop);

    // Modern Touchscreen Register / POS Terminal
    const posStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 })
    );
    posStand.position.set(-0.6, 1.25, 0.1);
    counterGroup.add(posStand);

    const posScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 })
    );
    posScreen.position.set(-0.6, 1.42, 0.1);
    posScreen.rotation.x = -0.3;
    counterGroup.add(posScreen);

    // Glowing screen face
    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.24),
      new THREE.MeshBasicMaterial({ color: 0x48cae4 })
    );
    screenFace.position.set(-0.6, 1.42, 0.125);
    screenFace.rotation.x = -0.3;
    counterGroup.add(screenFace);

    // Wooden Clipboard with Pet Intake Log
    const clipBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.02, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xc89f68, roughness: 0.8 })
    );
    clipBoard.position.set(0.05, 1.19, 0.12);
    clipBoard.rotation.y = 0.15;
    counterGroup.add(clipBoard);

    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.022, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    paper.position.set(0.05, 1.2, 0.12);
    paper.rotation.y = 0.15;
    counterGroup.add(paper);

    // Daisy Flower Glass Vase
    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.06, 0.26, 12),
      new THREE.MeshStandardMaterial({ color: 0xe0fbfc, transparent: true, opacity: 0.7, roughness: 0.1 })
    );
    vase.position.set(-1.25, 1.28, 0);
    counterGroup.add(vase);

    // Daisy Blossoms
    for (let f = 0; f < 3; f++) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6),
        new THREE.MeshStandardMaterial({ color: 0x52b788 })
      );
      stem.position.set(-1.25 + (f - 1) * 0.04, 1.42, (f === 1 ? 0.04 : -0.02));
      stem.rotation.z = (f - 1) * 0.2;
      counterGroup.add(stem);

      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshStandardMaterial({ color: f === 1 ? 0xffea00 : 0xffffff })
      );
      blossom.position.set(-1.25 + (f - 1) * 0.07, 1.58, (f === 1 ? 0.05 : -0.03));
      counterGroup.add(blossom);
    }

    // Swinging Saloon Door Gate next to counter
    const gatePost = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.5 })
    );
    gatePost.position.set(2.8, 0.55, 0);
    counterGroup.add(gatePost);

    const gateDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    gateDoor.position.set(2.35, 0.65, 0);
    counterGroup.add(gateDoor);

    // Welcome Signboard above
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.9, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xdda15e, roughness: 0.5 })
    );
    signBoard.position.set(0, 3.2, 1.2);
    counterGroup.add(signBoard);

    // Cute Daycare Logo Emblems (paw prints on sign)
    const pawGeo = new THREE.SphereGeometry(0.16, 10, 10);
    const pawMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const paw = new THREE.Mesh(pawGeo, pawMat);
    paw.scale.set(1, 1, 0.3);
    paw.position.set(-1.2, 3.2, 1.3);
    counterGroup.add(paw);

    const pawR = paw.clone();
    pawR.position.x = 1.2;
    counterGroup.add(pawR);

    this.scene.add(counterGroup);
    this.colliders.push({ minX: -1.9, maxX: 1.9, minZ: 6.9, maxZ: 8.1 });
  }

  buildFeedingStation() {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(-6, 0, 0);

    // Wooden feeding platform
    const platformGeo = new THREE.BoxGeometry(1.8, 0.18, 3.6);
    const platMat = new THREE.MeshStandardMaterial({ color: 0xa98467, roughness: 0.5 });
    const platform = new THREE.Mesh(platformGeo, platMat);
    platform.position.y = 0.09;
    stationGroup.add(platform);

    // Food Bowl (Orange Ceramic)
    const bowlGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.22, 16);
    const foodBowlMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.3 });
    const foodBowl = new THREE.Mesh(bowlGeo, foodBowlMat);
    foodBowl.position.set(0, 0.26, 1.1);
    stationGroup.add(foodBowl);

    // Kibble Food Inside Bowl
    const kibbleGeo = new THREE.CylinderGeometry(0.34, 0.32, 0.14, 16);
    const kibbleMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.9 });
    this.kibbleMesh = new THREE.Mesh(kibbleGeo, kibbleMat);
    this.kibbleMesh.position.set(0, 0.3, 1.1);
    stationGroup.add(this.kibbleMesh);

    // Water Bowl (Blue Ceramic)
    const waterBowlMat = new THREE.MeshStandardMaterial({ color: 0x48cae4, roughness: 0.3 });
    const waterBowl = new THREE.Mesh(bowlGeo, waterBowlMat);
    waterBowl.position.set(0, 0.26, -1.1);
    stationGroup.add(waterBowl);

    // Fresh Water Surface Inside Bowl
    const waterGeo = new THREE.CylinderGeometry(0.34, 0.32, 0.14, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, 0.3, -1.1);
    stationGroup.add(this.waterMesh);

    // Treat / Kibble Sacks leaning on wall
    const sackGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.8, 12);
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xdda15e, roughness: 0.9 });
    const sack1 = new THREE.Mesh(sackGeo, sackMat);
    sack1.position.set(-1.8, 0.4, 0.5);
    sack1.rotation.z = 0.15;
    stationGroup.add(sack1);

    const sack2 = new THREE.Mesh(sackGeo, sackMat);
    sack2.position.set(-1.8, 0.4, -0.5);
    sack2.rotation.z = 0.12;
    stationGroup.add(sack2);

    this.scene.add(stationGroup);
    this.colliders.push({ minX: -7.5, maxX: -4.8, minZ: -2.2, maxZ: 2.2 });
  }

  buildSpaGroomingStation() {
    const spaGroup = new THREE.Group();
    spaGroup.position.set(6, 0, 0);

    // Porcelain Clawfoot Grooming Bathtub
    const tubBodyGeo = new THREE.BoxGeometry(2.4, 0.9, 1.4);
    const tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
    const tub = new THREE.Mesh(tubBodyGeo, tubMat);
    tub.position.y = 0.6;
    tub.castShadow = true;
    spaGroup.add(tub);

    // Gold Tub Feet
    const footGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.85, roughness: 0.2 });
    [[-1, -0.5], [-1, 0.5], [1, -0.5], [1, 0.5]].forEach(([x, z]) => {
      const foot = new THREE.Mesh(footGeo, goldMat);
      foot.position.set(x, 0.12, z);
      spaGroup.add(foot);
    });

    // Bubbly Water / Foaming Suds inside tub
    const foamGeo = new THREE.BoxGeometry(2.1, 0.15, 1.1);
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0xe0fbfc,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    this.tubWaterMesh = new THREE.Mesh(foamGeo, foamMat);
    this.tubWaterMesh.position.set(0, 0.92, 0);
    spaGroup.add(this.tubWaterMesh);

    // Decorative Rubber Ducky in tub
    const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffea00 }));
    duckBody.position.set(0.4, 1.05, 0.2);
    const duckBeak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0xff7b00 }));
    duckBeak.rotation.z = -Math.PI / 2;
    duckBeak.position.set(0.52, 1.05, 0.2);
    spaGroup.add(duckBody);
    spaGroup.add(duckBeak);

    // Shower Faucet & Nozzle
    const faucetPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), goldMat);
    faucetPipe.position.set(-1.1, 1.4, 0);
    const faucetHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.15, 12), goldMat);
    faucetHead.position.set(-0.95, 2.0, 0);
    faucetHead.rotation.z = -Math.PI / 4;
    spaGroup.add(faucetPipe);
    spaGroup.add(faucetHead);

    // Towel Bench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.55, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 })
    );
    bench.position.set(2.0, 0.28, 0);
    spaGroup.add(bench);

    // Stacked Fluffy Towels
    const towelColors = [0xf72585, 0x7209b7, 0x4cc9f0];
    towelColors.forEach((color, i) => {
      const towel = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.08, 0.9),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
      );
      towel.position.set(2.0, 0.58 + i * 0.09, 0);
      spaGroup.add(towel);
    });

    this.scene.add(spaGroup);
    this.colliders.push({ minX: 4.6, maxX: 7.8, minZ: -1.2, maxZ: 1.2 });
  }

  buildPetBedsAndLounge() {
    // 3 Cozy Plush Pet Cushions / Beds
    const bedConfigs = [
      { pos: new THREE.Vector3(-2.8, 0, -2.5), color: 0xffb703, name: 'Golden Sun Cushion' },
      { pos: new THREE.Vector3(2.5, 0, -3.0), color: 0xf72585, name: 'Berry Velvet Bed' },
      { pos: new THREE.Vector3(0, 0, -4.5), color: 0x48cae4, name: 'Cloud Blue Pillow' }
    ];

    bedConfigs.forEach((cfg) => {
      const bedGroup = new THREE.Group();
      bedGroup.position.copy(cfg.pos);

      // Bed Rim Ring
      const rimGeo = new THREE.TorusGeometry(0.65, 0.18, 12, 24);
      rimGeo.rotateX(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.y = 0.2;
      bedGroup.add(rim);

      // Bed Inner Cushion
      const cushionGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.18, 20);
      const cushionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const cushion = new THREE.Mesh(cushionGeo, cushionMat);
      cushion.position.y = 0.14;
      bedGroup.add(cushion);

      this.scene.add(bedGroup);
      this.petBeds.push({ pos: cfg.pos.clone(), isOccupied: false });
    });

    // Cat Scratching Tree & Climbing Tower
    const catTreeGroup = new THREE.Group();
    catTreeGroup.position.set(-3.5, 0, -5.5);

    // Base plate
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xfaedcd, roughness: 0.8 })
    );
    base.position.y = 0.06;
    catTreeGroup.add(base);

    // Sisal scratching post trunk
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.95 });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12), poleMat);
    pole1.position.set(-0.3, 0.95, -0.2);
    catTreeGroup.add(pole1);

    // Tier 1 Platform
    const plat1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.7 })
    );
    plat1.position.set(-0.3, 1.85, -0.2);
    catTreeGroup.add(plat1);

    // Pole 2 to top perch
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 12), poleMat);
    pole2.position.set(0.2, 2.45, 0.2);
    catTreeGroup.add(pole2);

    // Top Perch Bed
    const topPerch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0xffcbf2, roughness: 0.8 })
    );
    topPerch.position.set(0.2, 3.1, 0.2);
    catTreeGroup.add(topPerch);

    this.scene.add(catTreeGroup);
    this.colliders.push({ minX: -4.5, maxX: -2.5, minZ: -6.5, maxZ: -4.5 });
  }

  buildDecorations() {
    const shadowMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    // 1. Soft Contact Shadows under stations & pet furniture
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    shadowGeo.rotateX(-Math.PI / 2);

    const deskShadow = new THREE.Mesh(shadowGeo, shadowMat);
    deskShadow.scale.set(4.2, 1.8, 1);
    deskShadow.position.set(0, 0.08, 7.5);
    this.scene.add(deskShadow);

    const tubShadow = new THREE.Mesh(shadowGeo, shadowMat);
    tubShadow.scale.set(3.0, 2.0, 1);
    tubShadow.position.set(6, 0.08, 0);
    this.scene.add(tubShadow);

    const catTreeShadow = new THREE.Mesh(shadowGeo, shadowMat);
    catTreeShadow.scale.set(2.2, 2.2, 1);
    catTreeShadow.position.set(-3.5, 0.08, -5.5);
    this.scene.add(catTreeShadow);

    // Pet Bed Shadows
    this.petBeds.forEach(b => {
      const bShadow = new THREE.Mesh(shadowGeo, shadowMat);
      bShadow.scale.set(1.6, 1.6, 1);
      bShadow.position.set(b.pos.x, 0.08, b.pos.z);
      this.scene.add(bShadow);
    });

    // 2. Framed Art Portraits on Daycare Walls
    const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.85, roughness: 0.2 });
    const artConfigs = [
      { name: 'Bella', emoji: '🐶', pos: new THREE.Vector3(-8.78, 2.2, 2), rotY: Math.PI / 2 },
      { name: 'Luna', emoji: '🐱', pos: new THREE.Vector3(-8.78, 2.2, -3), rotY: Math.PI / 2 },
      { name: 'Barnaby', emoji: '🐰', pos: new THREE.Vector3(8.78, 2.2, 3), rotY: -Math.PI / 2 }
    ];

    artConfigs.forEach(cfg => {
      const artGroup = new THREE.Group();
      artGroup.position.copy(cfg.pos);
      artGroup.rotation.y = cfg.rotY;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.06), goldFrameMat);
      frame.castShadow = true;
      artGroup.add(frame);

      const canvasMat = new THREE.MeshStandardMaterial({
        map: TextureGenerator.createArtPortraitTexture(cfg.name, cfg.emoji),
        roughness: 0.4
      });
      const artCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), canvasMat);
      artCanvas.position.z = 0.035;
      artGroup.add(artCanvas);

      this.scene.add(artGroup);
    });

    // 3. Real Working Circular Wall Clock
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 3.25, -6.78);

    const clockFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24),
      goldFrameMat
    );
    clockFrame.rotation.x = Math.PI / 2;
    clockGroup.add(clockFrame);

    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    clockFace.position.z = 0.045;
    clockGroup.add(clockFace);

    // Hour markings
    for (let h = 0; h < 12; h++) {
      const angle = (h * Math.PI * 2) / 12;
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.08, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      mark.position.set(Math.sin(angle) * 0.38, Math.cos(angle) * 0.38, 0.05);
      mark.rotation.z = -angle;
      clockGroup.add(mark);
    }

    const handMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const secMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });

    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.01), handMat);
    hourHand.position.set(0, 0.08, 0.052);
    clockGroup.add(hourHand);

    const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.01), handMat);
    minHand.position.set(0, 0.13, 0.054);
    clockGroup.add(minHand);

    this.clockSecondHand = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.38, 0.01), secMat);
    this.clockSecondHand.position.set(0, 0.15, 0.056);
    clockGroup.add(this.clockSecondHand);

    this.scene.add(clockGroup);

    // 4. Large Sunny Picture Windows Looking into Backyard
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xdff9fb,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45
    });

    [-5.75, 5.75].forEach(wx => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, 2.0, -6.8);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.08), windowFrameMat);
      winGroup.add(frame);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.9), glassMat);
      glass.position.z = 0.01;
      winGroup.add(glass);

      const mullionH = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 0.06), windowFrameMat);
      mullionH.position.z = 0.02;
      winGroup.add(mullionH);

      const mullionV1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), windowFrameMat);
      mullionV1.position.set(-0.95, 0, 0.02);
      winGroup.add(mullionV1);

      const mullionV2 = mullionV1.clone();
      mullionV2.position.x = 0.95;
      winGroup.add(mullionV2);

      this.scene.add(winGroup);
    });

    // 5. Indoor Potted Fig Tree
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-8.0, 0, 6.2);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.28, 0.65, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    pot.position.y = 0.325;
    pot.castShadow = true;
    plantGroup.add(pot);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x6f4e37 })
    );
    stem.position.y = 1.45;
    plantGroup.add(stem);

    const leafGeo = new THREE.SphereGeometry(0.28, 8, 8);
    leafGeo.scale(1.4, 0.2, 1.0);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });

    for (let l = 0; l < 8; l++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const angle = (l * Math.PI * 2) / 8;
      leaf.position.set(Math.cos(angle) * 0.35, 1.2 + l * 0.14, Math.sin(angle) * 0.35);
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.3;
      plantGroup.add(leaf);
    }
    this.scene.add(plantGroup);

    // 6. Hanging Ivy Plant Baskets
    [-3.5, 3.5].forEach(px => {
      const ivyGroup = new THREE.Group();
      ivyGroup.position.set(px, 3.8, 1.0);

      const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), windowFrameMat);
      hanger.position.y = -0.4;
      ivyGroup.add(hanger);

      const basket = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 })
      );
      basket.position.y = -0.8;
      ivyGroup.add(basket);

      for (let v = 0; v < 6; v++) {
        const vine = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.5 + Math.random() * 0.3, 6),
          leafMat
        );
        vine.rotation.x = Math.PI;
        vine.position.set((Math.random() - 0.5) * 0.22, -0.9 - Math.random() * 0.2, (Math.random() - 0.5) * 0.22);
        ivyGroup.add(vine);
      }

      this.scene.add(ivyGroup);
    });
  }

  buildBackyardPlayground() {
    // 1. Agility A-Frame Ramp
    const rampGroup = new THREE.Group();
    rampGroup.position.set(4, 0, -12);

    const rampMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.6 });
    const rampHalf1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 2.5), rampMat);
    rampHalf1.position.set(0, 0.7, -0.9);
    rampHalf1.rotation.x = Math.PI / 6;
    rampGroup.add(rampHalf1);

    const rampHalf2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 2.5), rampMat);
    rampHalf2.position.set(0, 0.7, 0.9);
    rampHalf2.rotation.x = -Math.PI / 6;
    rampGroup.add(rampHalf2);

    this.scene.add(rampGroup);
    this.colliders.push({ minX: 3.0, maxX: 5.0, minZ: -13.5, maxZ: -10.5 });

    // 2. Agility Hurdle Jump
    const hurdleGroup = new THREE.Group();
    hurdleGroup.position.set(-4, 0, -13);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf28482, roughness: 0.5 });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), poleMat);
    postL.position.set(-1.0, 0.6, 0);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), poleMat);
    postR.position.set(1.0, 0.6, 0);
    hurdleGroup.add(postL);
    hurdleGroup.add(postR);

    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 0.5, 0);
    hurdleGroup.add(crossbar);

    this.scene.add(hurdleGroup);

    // 3. Agility Fabric Play Tunnel
    const tunnelGroup = new THREE.Group();
    tunnelGroup.position.set(-7.5, 0, -11);

    const tunnelGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.8, 16, 1, true);
    tunnelGeo.rotateX(Math.PI / 2);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x4cc9f0,
      side: THREE.DoubleSide,
      roughness: 0.6
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.y = 0.65;
    tunnelGroup.add(tunnel);

    // Striped Rings on Tunnel
    for (let tr = -1.2; tr <= 1.2; tr += 0.6) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.66, 0.04, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5 })
      );
      ring.position.set(0, 0.65, tr);
      tunnelGroup.add(ring);
    }
    this.scene.add(tunnelGroup);
    this.colliders.push({ minX: -8.5, maxX: -6.5, minZ: -12.5, maxZ: -9.5 });

    // 4. Stone Birdbath Fountain with Bubbling Water
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(0, 0, -13.5);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.8 });
    const fountainPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.8, 12), stoneMat);
    fountainPedestal.position.y = 0.4;
    fountainPedestal.castShadow = true;
    fountainGroup.add(fountainPedestal);

    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.55, 0.22, 16),
      stoneMat
    );
    basin.position.y = 0.9;
    fountainGroup.add(basin);

    const fWaterMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85
    });
    this.fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 16), fWaterMat);
    this.fountainWater.position.y = 0.98;
    fountainGroup.add(this.fountainWater);

    this.scene.add(fountainGroup);
    this.colliders.push({ minX: -0.8, maxX: 0.8, minZ: -14.3, maxZ: -12.7 });

    // 5. Scattered Chew Toys on Lawn
    // Red Rubber Bone Toy
    const boneGroup = new THREE.Group();
    boneGroup.position.set(-2.5, 0.08, -9.5);
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xef233c, roughness: 0.5 });
    const boneShaft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.35), boneMat);
    boneGroup.add(boneShaft);
    [[-0.08, -0.16], [0.08, -0.16], [-0.08, 0.16], [0.08, 0.16]].forEach(([bx, bz]) => {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), boneMat);
      ball.position.set(bx, 0, bz);
      boneGroup.add(ball);
    });
    this.scene.add(boneGroup);

    // Squeaky Rubber Dumbbell
    const dumbbell = new THREE.Group();
    dumbbell.position.set(2.0, 0.08, -9.0);
    const dumbMat = new THREE.MeshStandardMaterial({ color: 0x7209b7, roughness: 0.4 });
    const dShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8), dumbMat);
    dShaft.rotation.z = Math.PI / 2;
    dumbbell.add(dShaft);
    [-0.14, 0.14].forEach(dx => {
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), dumbMat);
      bell.position.x = dx;
      dumbbell.add(bell);
    });
    this.scene.add(dumbbell);

    // 6. Cute Red Doghouse in Far Yard Corner
    const doghouseGroup = new THREE.Group();
    doghouseGroup.position.set(12.0, 0, -14.5);

    const houseBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.6, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.7 })
    );
    houseBody.position.y = 0.8;
    doghouseGroup.add(houseBody);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 1.0, 4),
      new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.5 })
    );
    roof.position.y = 2.0;
    roof.rotation.y = Math.PI / 4;
    doghouseGroup.add(roof);

    const doorHole = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.0, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    doorHole.position.set(0, 0.5, 1.01);
    doghouseGroup.add(doorHole);

    this.scene.add(doghouseGroup);
    this.colliders.push({ minX: 10.8, maxX: 13.2, minZ: -15.7, maxZ: -13.3 });

    // 7. Fluttering Butterfly System
    this.spawnButterflies();
  }

  spawnButterflies() {
    const butterflyColors = [0xff70a6, 0xffd166, 0x48cae4, 0x9d4edd];
    const wingGeo = new THREE.PlaneGeometry(0.12, 0.12);

    for (let b = 0; b < 7; b++) {
      const root = new THREE.Group();
      const color = butterflyColors[b % butterflyColors.length];
      const wingMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });

      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.x = -0.06;
      root.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.x = 0.06;
      root.add(wingR);

      const origin = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        0.8 + Math.random() * 0.8,
        -9 - Math.random() * 6
      );
      root.position.copy(origin);
      this.scene.add(root);

      this.butterflies.push({
        root,
        wingL,
        wingR,
        origin,
        angle: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.6,
        radius: 1.2 + Math.random() * 1.5,
        flapSpeed: 16 + Math.random() * 8
      });
    }
  }

  update(dt) {
    const now = Date.now() * 0.001;

    // 1. Animate Wall Clock Second Hand
    if (this.clockSecondHand) {
      const secs = (Date.now() / 1000) % 60;
      this.clockSecondHand.rotation.z = - (secs / 60) * Math.PI * 2;
    }

    // 2. Animate Fluttering Butterflies
    for (const b of this.butterflies) {
      b.angle += b.speed * dt;
      b.root.position.x = b.origin.x + Math.sin(b.angle) * b.radius;
      b.root.position.z = b.origin.z + Math.cos(b.angle) * b.radius;
      b.root.position.y = b.origin.y + Math.sin(now * 3 + b.angle) * 0.25;

      const flap = Math.sin(now * b.flapSpeed) * 0.8;
      b.wingL.rotation.y = flap;
      b.wingR.rotation.y = -flap;
      b.root.rotation.y = b.angle + Math.PI / 2;
    }

    // 3. Animate Fountain Water Shimmer
    if (this.fountainWater) {
      this.fountainWater.position.y = 0.98 + Math.sin(now * 4) * 0.015;
    }

    // 4. Animate Supply Cabin Chimney Smoke Puffs & Lantern
    if (this.cabinSmokePuffs && this.cabinSmokePuffs.length > 0) {
      for (const p of this.cabinSmokePuffs) {
        p.offsetY += p.speed * dt;
        if (p.offsetY > 2.2) {
          p.offsetY = 0;
          p.mesh.scale.set(1, 1, 1);
        }
        p.mesh.position.y = p.baseY + p.offsetY;
        const progress = p.offsetY / 2.2;
        p.mesh.position.x = 1.85 + Math.sin(now * 1.5 + p.wobblePhase) * 0.18 + progress * 0.35;
        p.mesh.position.z = -0.8 + Math.cos(now * 1.2 + p.wobblePhase) * 0.12 - progress * 0.25;
        const s = 1.0 + progress * 1.8;
        p.mesh.scale.set(s, s, s);
        if (p.mesh.material) {
          p.mesh.material.opacity = Math.max(0, (1 - progress) * 0.45);
        }
      }
    }
    if (this.cabinLanternLight) {
      this.cabinLanternLight.intensity = 0.85 + Math.sin(now * 8) * 0.06;
    }
  }

  buildSupplyCabin() {
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(8.5, 0, -10.5);

    // Materials
    const logMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createLogCabinTexture(),
      roughness: 0.8
    });
    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x5c3818,
      roughness: 0.75
    });
    const deckMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodFloorTexture(),
      roughness: 0.7
    });
    const shingleMat = new THREE.MeshStandardMaterial({
      color: 0x6a3b20,
      roughness: 0.85
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x7f6a58,
      roughness: 0.9
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x2b2b2b,
      roughness: 0.4,
      metalness: 0.6
    });

    // 1. Foundation & Porch Deck Platform
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 4.4), deckMat);
    deck.position.set(0, 0.11, 0.4);
    deck.receiveShadow = true;
    cabinGroup.add(deck);

    // Stone foundation piers
    [[-2.1, -1.5], [2.1, -1.5], [-2.1, 2.3], [2.1, 2.3]].forEach(([px, pz]) => {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.3, 8), stoneMat);
      pier.position.set(px, 0.05, pz);
      pier.castShadow = true;
      cabinGroup.add(pier);
    });

    // 2. Main Log Cabin Enclosure
    const cabinBody = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.7, 2.8), logMat);
    cabinBody.position.set(0, 1.46, -0.4);
    cabinBody.castShadow = true;
    cabinBody.receiveShadow = true;
    cabinGroup.add(cabinBody);

    // Stacked interlocking corner notches (authentic log cabin dovetail overlap)
    [[-2.02, -1.82], [2.02, -1.82], [-2.02, 1.02], [2.02, 1.02]].forEach(([cx, cz]) => {
      for (let l = 0; l < 6; l++) {
        const logEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 8), timberMat);
        logEnd.rotation.x = Math.PI / 2;
        logEnd.position.set(cx, 0.35 + l * 0.44, cz);
        logEnd.castShadow = true;
        cabinGroup.add(logEnd);
      }
    });

    // 3. Vaulted Gabled Cedar Shingle Roof
    const roofPitch = 0.58; // ~33 degrees
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 3.4), shingleMat);
    roofL.position.set(-1.08, 3.45, -0.4);
    roofL.rotation.z = roofPitch;
    roofL.castShadow = true;
    cabinGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 3.4), shingleMat);
    roofR.position.set(1.08, 3.45, -0.4);
    roofR.rotation.z = -roofPitch;
    roofR.castShadow = true;
    cabinGroup.add(roofR);

    // Triangular Gable Walls (Front & Back)
    [1.01, -1.81].forEach(gz => {
      const gableGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -2.0, 0, 0,
         2.0, 0, 0,
         0, 1.3, 0,
        -2.0, 0, 0
      ]);
      gableGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      gableGeo.computeVertexNormals();
      const gableMesh = new THREE.Mesh(gableGeo, timberMat);
      gableMesh.position.set(0, 2.81, gz);
      if (gz > 0) gableMesh.rotation.y = Math.PI;
      cabinGroup.add(gableMesh);
    });

    // Ridge Beam Cap
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 3.5), timberMat);
    ridgeCap.position.set(0, 4.15, -0.4);
    cabinGroup.add(ridgeCap);

    // 4. Stone Chimney with Drifting Procedural Smoke Puffs
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.2, 0.7), stoneMat);
    chimney.position.set(1.85, 3.0, -0.8);
    chimney.castShadow = true;
    cabinGroup.add(chimney);

    const chimRim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.85), stoneMat);
    chimRim.position.set(1.85, 4.65, -0.8);
    cabinGroup.add(chimRim);

    // Smoke Emitter Puffs
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    for (let s = 0; s < 5; s++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), smokeMat);
      const startH = 4.8 + s * 0.45;
      puff.position.set(1.85 + (Math.random() - 0.5) * 0.15, startH, -0.8 + (Math.random() - 0.5) * 0.15);
      cabinGroup.add(puff);
      this.cabinSmokePuffs.push({
        mesh: puff,
        baseY: 4.8,
        offsetY: s * 0.45,
        speed: 0.65 + Math.random() * 0.35,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    // 5. Covered Front Service Porch Awning & Timber Columns
    const porchAwning = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 1.8), shingleMat);
    porchAwning.position.set(0, 2.65, 1.6);
    porchAwning.rotation.x = 0.18;
    porchAwning.castShadow = true;
    cabinGroup.add(porchAwning);

    // 2 Rustic Porch Posts
    [[-1.85, 2.3], [1.85, 2.3]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 2.4, 8), timberMat);
      post.position.set(px, 1.25, pz);
      post.castShadow = true;
      cabinGroup.add(post);

      const postCap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), timberMat);
      postCap.position.set(px, 2.45, pz);
      cabinGroup.add(postCap);
    });

    // 6. Hanging Black Iron Lantern with Warm Amber Light
    const lanternArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), ironMat);
    lanternArm.position.set(0, 2.35, 1.95);
    cabinGroup.add(lanternArm);

    const lanternCage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.11, 0.26, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffe8a1,
        emissive: 0xffaa00,
        emissiveIntensity: 0.85,
        roughness: 0.2
      })
    );
    lanternCage.position.set(0, 2.12, 1.95);
    cabinGroup.add(lanternCage);

    this.cabinLanternLight = new THREE.PointLight(0xffbe0b, 0.85, 9.0);
    this.cabinLanternLight.position.set(0, 2.05, 1.95);
    cabinGroup.add(this.cabinLanternLight);

    // 7. Hanging Carved Wooden Signboard ("PAWS & PANTRY")
    const signMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createSupplySignTexture(),
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.55), signMat);
    sign.position.set(0, 2.2, 1.2);
    sign.castShadow = true;
    cabinGroup.add(sign);

    // Iron hanging chains for signboard
    [-0.7, 0.7].forEach(cx => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 4), ironMat);
      chain.position.set(cx, 2.45, 1.2);
      cabinGroup.add(chain);
    });

    // 8. Service Counter Bar
    const counterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.88, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
    );
    counterDesk.position.set(0, 0.55, 1.2);
    counterDesk.castShadow = true;
    cabinGroup.add(counterDesk);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.08, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.3 })
    );
    counterTop.position.set(0, 1.02, 1.2);
    counterTop.castShadow = true;
    cabinGroup.add(counterTop);

    // 9. Stocked 3D Pet Supplies on Counter & Porch

    // A. Burlap Kibble Sacks (2 organic chow bags)
    const sackMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createKibbleSackTexture(),
      roughness: 0.95
    });
    const sack1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.32), sackMat);
    sack1.position.set(-1.15, 0.42, 1.85);
    sack1.rotation.y = 0.22;
    sack1.castShadow = true;
    cabinGroup.add(sack1);

    const sack2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.3), sackMat);
    sack2.position.set(-1.45, 0.4, 1.6);
    sack2.rotation.y = -0.35;
    sack2.castShadow = true;
    cabinGroup.add(sack2);

    // B. Glass Carboy Fresh Water Jugs with Corks
    const glassWaterMat = new THREE.MeshStandardMaterial({
      color: 0x48cae4,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const corkMat = new THREE.MeshStandardMaterial({ color: 0xbc6c25, roughness: 0.9 });
    [-0.75, -0.38].forEach(wx => {
      const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.36, 12), glassWaterMat);
      jug.position.set(wx, 1.24, 1.2);
      jug.castShadow = true;
      cabinGroup.add(jug);

      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.07, 8), corkMat);
      cork.position.set(wx, 1.45, 1.2);
      cabinGroup.add(cork);
    });

    // C. Yellow Grooming Sponge Wooden Crate
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xdda15e, roughness: 0.8 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.32), crateMat);
    crate.position.set(0.18, 1.14, 1.2);
    crate.castShadow = true;
    cabinGroup.add(crate);

    const spongeMat = new THREE.MeshStandardMaterial({ color: 0xffea00, roughness: 0.9 });
    [[-0.12, -0.06], [0.12, -0.06], [-0.12, 0.06], [0.12, 0.06]].forEach(([sx, sz]) => {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.11), spongeMat);
      sp.position.set(0.18 + sx, 1.25, 1.2 + sz);
      cabinGroup.add(sp);
    });

    // D. Wire Basket with Neon Tennis Balls
    const basketGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.22, 10, 1, true);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, side: THREE.DoubleSide });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.set(0.72, 1.17, 1.2);
    cabinGroup.add(basket);

    const ballMat = new THREE.MeshStandardMaterial({ color: 0xccff00, roughness: 0.4 });
    [[0, 0], [-0.06, 0.06], [0.06, 0.06], [0, 0.08]].forEach(([bx, by]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), ballMat);
      b.position.set(0.72 + bx, 1.18 + by, 1.2);
      cabinGroup.add(b);
    });

    // E. Fresh Carrots & Apples Wicker Basket (for bunnies & capybara)
    const wickerMat = new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.9 });
    const snackBasket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.22, 10), wickerMat);
    snackBasket.position.set(1.35, 0.32, 1.8);
    snackBasket.castShadow = true;
    cabinGroup.add(snackBasket);

    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf77f00, roughness: 0.6 });
    const carrotTopMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
    for (let c = 0; c < 3; c++) {
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 6), carrotMat);
      carrot.rotation.x = Math.PI * 0.6 + (c * 0.2);
      carrot.position.set(1.3 + c * 0.06, 0.45, 1.76 + c * 0.04);
      cabinGroup.add(carrot);

      const top = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), carrotTopMat);
      top.position.set(1.3 + c * 0.06, 0.54, 1.74 + c * 0.04);
      cabinGroup.add(top);
    }

    // 10. Stepping Stones from Cottage Back Door to Cabin Porch
    const stepStoneMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCobblestoneTexture(),
      roughness: 0.8
    });
    const stoneWaypoints = [
      [3.0, -7.4],
      [4.2, -7.8],
      [5.5, -8.3],
      [6.8, -8.7],
      [8.0, -9.0]
    ];
    stoneWaypoints.forEach(([sx, sz]) => {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.04, 10), stepStoneMat);
      stone.position.set(sx - 8.5, 0.03, sz + 10.5); // Local to cabin group
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      cabinGroup.add(stone);
    });

    this.scene.add(cabinGroup);

    // Register Colliders for the Supply Cabin
    // Cabin group origin is (8.5, 0, -10.5)
    // Cabin body: x in [6.3, 10.7], z in [-12.2, -8.8]
    this.colliders.push({ minX: 6.3, maxX: 10.7, minZ: -12.2, maxZ: -8.8 });
  }

  buildDecorativeNature() {
    // Stylized low-poly trees in the yard
    const treePositions = [
      new THREE.Vector3(-10, 0, -11),
      new THREE.Vector3(-11, 0, -15),
      new THREE.Vector3(11, 0, -15),
      new THREE.Vector3(7, 0, 15),
      new THREE.Vector3(-7, 0, 15)
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6c584c, roughness: 0.9 });
    const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.8 });
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x74c69d, roughness: 0.8 });

    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.copy(pos);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8), trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage puff spheres
      const puff1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), leavesMat1);
      puff1.position.set(0, 2.6, 0);
      puff1.castShadow = true;
      tree.add(puff1);

      const puff2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), leavesMat2);
      puff2.position.set(0.3, 3.4, 0.2);
      tree.add(puff2);

      this.scene.add(tree);
      this.colliders.push({ minX: pos.x - 0.5, maxX: pos.x + 0.5, minZ: pos.z - 0.5, maxZ: pos.z + 0.5 });
    });

    // Flower patches
    const flowerColors = [0xff70a6, 0xff9770, 0xffd670, 0xe9ff70];
    for (let i = 0; i < 18; i++) {
      const fx = (Math.random() - 0.5) * 20;
      const fz = -8 - Math.random() * 7;
      const fColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];

      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshStandardMaterial({ color: fColor })
      );
      flower.position.set(fx, 0.12, fz);
      this.scene.add(flower);
    }
  }

  buildRoof() {
    this.roofGroup = new THREE.Group();

    // 1. Vaulted Timber Trusses (Rafters, Tie Beams & King Posts inside ceiling)
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x7f5539, roughness: 0.8 });
    const trussZPositions = [-4.5, 0.5, 5.5];

    trussZPositions.forEach(z => {
      const truss = new THREE.Group();
      truss.position.set(0, 0, z);

      // High Collar Beam near peak at y = 5.6 (wide open sightline below)
      const collarBeam = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.18, 0.18), timberMat);
      collarBeam.position.set(0, 5.6, 0);
      collarBeam.castShadow = true;
      truss.add(collarBeam);

      // Left slanted rafter
      const rafterL = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 0.16), timberMat);
      rafterL.position.set(-4.6, 5.45, 0);
      rafterL.rotation.z = Math.atan2(3.2, 9.2);
      truss.add(rafterL);

      // Right slanted rafter
      const rafterR = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 0.16), timberMat);
      rafterR.position.set(4.6, 5.45, 0);
      rafterR.rotation.z = -Math.atan2(3.2, 9.2);
      truss.add(rafterR);

      // King Post at peak
      const kingPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), timberMat);
      kingPost.position.set(0, 6.3, 0);
      truss.add(kingPost);

      // Hanging Lantern suspended high above camera view
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), timberMat);
      chain.position.set(0, 5.35, 0);
      truss.add(chain);

      const lanternGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.28, 6);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xffaa00,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(0, 5.0, 0);
      truss.add(lantern);

      // Warm glow point light from lantern
      const lanternLight = new THREE.PointLight(0xffbe0b, 0.6, 12);
      lanternLight.position.set(0, 4.9, 0);
      truss.add(lanternLight);

      this.roofGroup.add(truss);
    });

    // 2. Central Ridge Beam running along the top peak
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 17.6), timberMat);
    ridgeBeam.position.set(0, 7.05, 1.0);
    this.roofGroup.add(ridgeBeam);

    // 3. Gable End Triangular Walls (Front at z = 9, Back at z = -7)
    const gableMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, roughness: 0.8 });
    const atticWindowMat = new THREE.MeshStandardMaterial({
      color: 0xffe8d6,
      emissive: 0xffd166,
      emissiveIntensity: 0.35,
      roughness: 0.2
    });

    [9.0, -7.0].forEach(zPos => {
      const gableGroup = new THREE.Group();
      gableGroup.position.set(0, 3.8, zPos);

      // Triangular shape geometry
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -9.0, 0, 0,
         9.0, 0, 0,
         0, 3.2, 0,
        -9.0, 0, 0,
         0, 3.2, 0,
         9.0, 0, 0
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const gableWall = new THREE.Mesh(geom, gableMat);
      gableGroup.add(gableWall);

      // Round Attic Window
      const windowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.08, 8, 20),
        timberMat
      );
      windowRing.position.set(0, 1.4, zPos > 0 ? 0.05 : -0.05);
      gableGroup.add(windowRing);

      const windowPane = new THREE.Mesh(
        new THREE.CircleGeometry(0.62, 20),
        atticWindowMat
      );
      windowPane.position.set(0, 1.4, zPos > 0 ? 0.06 : -0.06);
      if (zPos < 0) windowPane.rotation.y = Math.PI;
      gableGroup.add(windowPane);

      this.roofGroup.add(gableGroup);
    });

    // 4. Roof Slopes (Terracotta Cottage Shingles with Sun Skylights)
    const shingleColor = 0xc86432;
    const shingleMat = new THREE.MeshStandardMaterial({
      color: shingleColor,
      roughness: 0.85,
      side: THREE.DoubleSide
    });

    const skylightMat = new THREE.MeshStandardMaterial({
      color: 0xcaf0f8,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    const roofPitch = Math.atan2(3.2, 9.4);
    const slopeLen = Math.sqrt(9.4 * 9.4 + 3.2 * 3.2);

    // Left Roof Slope (West)
    const leftRoof = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.14, 17.6), shingleMat);
    leftRoof.position.set(-4.7, 5.4, 1.0);
    leftRoof.rotation.z = roofPitch;
    leftRoof.castShadow = true;
    this.roofGroup.add(leftRoof);

    // Right Roof Slope (East)
    const rightRoof = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.14, 17.6), shingleMat);
    rightRoof.position.set(4.7, 5.4, 1.0);
    rightRoof.rotation.z = -roofPitch;
    rightRoof.castShadow = true;
    this.roofGroup.add(rightRoof);

    // Sun Skylights along the ridge
    const skylightL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 9.0), skylightMat);
    skylightL.position.set(-2.0, 6.32, 1.0);
    skylightL.rotation.z = roofPitch;
    this.roofGroup.add(skylightL);

    const skylightR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 9.0), skylightMat);
    skylightR.position.set(2.0, 6.32, 1.0);
    skylightR.rotation.z = -roofPitch;
    this.roofGroup.add(skylightR);

    // 5. Red Brick Chimney with Terracotta Pot
    const chimneyGroup = new THREE.Group();
    chimneyGroup.position.set(5.5, 6.2, -2.0);

    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9d4b38, roughness: 0.9 });
    const chimneyStack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.9), brickMat);
    chimneyStack.castShadow = true;
    chimneyGroup.add(chimneyStack);

    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.15, 1.05), brickMat);
    rim.position.y = 1.15;
    chimneyGroup.add(rim);

    const potMat = new THREE.MeshStandardMaterial({ color: 0xe07a5f, roughness: 0.7 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.6, 12), potMat);
    pot.position.y = 1.5;
    chimneyGroup.add(pot);

    this.roofGroup.add(chimneyGroup);

    // 6. Welcoming Front Porch Canopy / Awning
    const porchGroup = new THREE.Group();
    porchGroup.position.set(0, 0, 9.0);

    // 2 Decorative Timber Porch Columns
    [[-2.6, 2.4], [2.6, 2.4]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.4, 0.25), timberMat);
      col.position.set(px, 1.7, pz);
      col.castShadow = true;
      porchGroup.add(col);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), timberMat);
      cap.position.set(px, 3.35, pz);
      porchGroup.add(cap);

      this.colliders.push({ minX: px - 0.25, maxX: px + 0.25, minZ: 9.0 + pz - 0.25, maxZ: 9.0 + pz + 0.25 });
    });

    // Slanted Porch Canopy Roof
    const canopyMat = new THREE.MeshStandardMaterial({ color: shingleColor, roughness: 0.8 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 2.8), canopyMat);
    canopy.position.set(0, 3.4, 1.25);
    canopy.rotation.x = 0.14;
    canopy.castShadow = true;
    porchGroup.add(canopy);

    this.roofGroup.add(porchGroup);

    this.scene.add(this.roofGroup);
  }

  // Helper to check if a position collides with building walls/furniture
  checkCollision(x, z, radius = 0.4) {
    for (const box of this.colliders) {
      if (x + radius > box.minX && x - radius < box.maxX &&
          z + radius > box.minZ && z - radius < box.maxZ) {
        return true;
      }
    }
    // Outer boundaries (-14 to 14 X, -17 to 18 Z)
    if (x < -14 || x > 14 || z < -17 || z > 18) {
      return true;
    }
    return false;
  }
}
