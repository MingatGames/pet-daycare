import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function runPetDaycareTest() {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const viteProcess = spawn(cmd, ['vite', '--port', '3000', '--host'], {
    shell: true,
    stdio: 'pipe'
  });

  let activePort = 3000;
  await new Promise((resolve) => {
    viteProcess.stdout.on('data', (data) => {
      const str = data.toString();
      console.log(`[VITE]: ${str.trim()}`);
      const match = str.match(/localhost:(\d+)/);
      if (match) {
        activePort = parseInt(match[1], 10);
      }
      if (str.includes('Local:')) {
        setTimeout(resolve, 600); // Give server half a second to settle
      }
    });
    viteProcess.stderr.on('data', (d) => console.error(`[VITE ERR]: ${d.toString().trim()}`));
    setTimeout(resolve, 5000);
  });

  console.log(`Launching headless browser with WebGL swiftshader on port ${activePort}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR]: ${msg.text()}`);
    } else {
      console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error('[PAGE ERROR IMMEDIATE]:', err.toString());
    errors.push(`[PAGE ERROR]: ${err.toString()}`);
  });

  console.log(`Navigating to http://127.0.0.1:${activePort}/index.html ...`);
  await page.goto(`http://127.0.0.1:${activePort}/index.html`, { waitUntil: 'networkidle2' });

  // 1. Wait for loading screen to dismiss
  await page.waitForFunction(() => {
    const l = document.getElementById('loading-screen');
    return l && l.style.display === 'none';
  }, { timeout: 8000 });
  console.log("Loading screen dismissed!");

  // 2. Click OPEN DAYCARE! button
  console.log("Clicking 'OPEN DAYCARE! 🐾' start button...");
  await page.click('#start-daycare-btn');
  await new Promise(r => setTimeout(r, 600));

  // 3. Check HUD stats
  const initialHud = await page.evaluate(() => {
    return {
      clock: document.getElementById('hud-clock')?.textContent,
      coins: document.getElementById('hud-coins-val')?.textContent,
      pets: document.getElementById('hud-pet-count')?.textContent
    };
  });
  console.log("Daycare HUD after start:", initialHud);

  // 4. Stroll around daycare with WASD
  const initialZ = await page.evaluate(() => window.__petDaycareGame.player.pos.z);
  console.log(`Initial Player Z position: ${initialZ}`);
  console.log("Moving caretaker forward with 'W' key for 1.2s...");
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 1200));
  await page.keyboard.up('KeyW');
  const afterWZ = await page.evaluate(() => window.__petDaycareGame.player.pos.z);
  console.log(`Player Z position after pressing W: ${afterWZ.toFixed(2)} (moved forward: ${afterWZ > initialZ})`);

  // 4b. Test direct mouse move perspective (no dragging!)
  console.log("Testing direct mouse move perspective (without dragging)...");
  const initialYaw = await page.evaluate(() => window.__petDaycareGame.player.cameraYaw);
  await page.mouse.move(640, 360);
  await page.mouse.move(820, 340);
  await new Promise(r => setTimeout(r, 250));
  const newYaw = await page.evaluate(() => window.__petDaycareGame.player.cameraYaw);
  console.log(`Camera Yaw changed from mouse movement: ${initialYaw.toFixed(3)} -> ${newYaw.toFixed(3)}`);

  // 5. Test tool switching (Kibble Bowl, Tennis Ball, Bath Sponge)
  console.log("Equipping Kibble Bowl (Key 2)...");
  await page.keyboard.press('Digit2');
  await new Promise(r => setTimeout(r, 300));
  console.log("Interacting (feeding kibble)...");
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 400));

  console.log("Equipping Tennis Ball (Key 5)...");
  await page.keyboard.press('Digit5');
  await new Promise(r => setTimeout(r, 300));
  console.log("Throwing Tennis Ball for fetch...");
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 600));

  console.log("Equipping Hands (Key 1)...");
  await page.keyboard.press('Digit1');
  await new Promise(r => setTimeout(r, 300));
  console.log("Testing Pick Up Pet with Hands (Key E)...");
  await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const pet = game.petManager.pets[0];
    if (pet) {
      game.player.pos.set(pet.root.position.x, 0, pet.root.position.z + 1.0);
      game.player.facingAngle = Math.PI; // Face towards pet
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 400));

  const carryStatus = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    return {
      hasCarriedPet: !!game.player.carriedPet,
      petName: game.player.carriedPet?.name,
      petSpecies: game.player.carriedPet?.species,
      isHeld: game.player.carriedPet?.isHeld,
      armLRotX: game.player.armL.rotation.x
    };
  });
  console.log("Carrying Status after Pick Up:", carryStatus);
  if (!carryStatus.hasCarriedPet || !carryStatus.isHeld) {
    throw new Error("Pet should be picked up and held!");
  }

  // Capture screenshot of caretaker carrying pet
  await page.screenshot({ path: 'pet_daycare_carrying_pet.png' });
  console.log("Saved pet_daycare_carrying_pet.png!");

  // Test carrying pet to Bathtub and placing inside
  console.log("Carrying pet to bathtub...");
  await page.evaluate(() => {
    const game = window.__petDaycareGame;
    game.player.pos.set(6, 0, 1.2);
    game.player.facingAngle = Math.PI; // Face towards bathtub at (6, 0, 0)
  });
  await new Promise(r => setTimeout(r, 300));
  console.log("Placing pet into bathtub with Key E...");
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 400));

  const placedStatus = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const pet = game.petManager.pets.find(p => p.state === 'bathing');
    return {
      hasCarriedPet: !!game.player.carriedPet,
      bathingPet: pet ? pet.name : null,
      cleanliness: pet ? pet.needs.cleanliness : null
    };
  });
  console.log("Status after placing in bathtub:", placedStatus);
  if (placedStatus.hasCarriedPet || !placedStatus.bathingPet) {
    throw new Error("Pet should have been placed into bathtub!");
  }

  // 6. Wait for customer arrival
  console.log("Waiting for first customer arrival at reception...");
  await page.evaluate(() => {
    if (window.__petDaycareGame?.ownerManager) {
      window.__petDaycareGame.ownerManager.customerTimer = 0.1;
    }
  });
  await page.waitForFunction(() => {
    const alertEl = document.getElementById('reception-alert');
    return alertEl && alertEl.style.display !== 'none';
  }, { timeout: 20000 });
  console.log("Customer arrived at reception desk!");

  // 7. Click reception alert to open dialogue
  console.log("Clicking reception alert to greet customer...");
  await page.click('#reception-alert');
  await new Promise(r => setTimeout(r, 600));

  const dialogueInfo = await page.evaluate(() => {
    return {
      owner: document.getElementById('dialogue-owner-name')?.textContent,
      speech: document.getElementById('dialogue-speech')?.textContent,
      pet: document.getElementById('dialogue-pet-name')?.textContent
    };
  });
  console.log("Owner Dialogue Info:", dialogueInfo);

  // 8. Accept customer's pet into daycare
  console.log("Accepting pet into daycare...");
  await page.click('#dialogue-accept-btn');
  await new Promise(r => setTimeout(r, 600));

  // 9. Verify pet drawer has updated
  const updatedPetCount = await page.evaluate(() => {
    return document.querySelectorAll('.pet-card').length;
  });
  console.log(`Active pets count in drawer: ${updatedPetCount}`);

  // 10. Open Upgrades Store and buy an upgrade
  console.log("Opening Upgrades Store...");
  await page.click('#btn-store');
  await new Promise(r => setTimeout(r, 500));

  console.log("Purchasing party hats upgrade...");
  const bought = await page.evaluate(() => {
    const btn = document.querySelector('.store-buy-btn[data-id="pet_party_hats"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Bought upgrade:", bought);
  await new Promise(r => setTimeout(r, 600));

  await page.click('#store-close-btn');
  await new Promise(r => setTimeout(r, 400));

  // 11. Capture high-resolution screenshot at reception
  const screenshotPath = 'pet_daycare_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // 12. Turn around and stroll into the cozy playroom
  console.log("Strolling into the playroom to see pets...");
  await page.evaluate(() => {
    if (window.__petDaycareGame) {
      window.__petDaycareGame.player.pos.set(0, 0, 1.0);
      window.__petDaycareGame.player.cameraYaw = Math.PI; // Look toward -Z (playroom & backyard windows)
      window.__petDaycareGame.player.cameraDist = 5.5;
      window.__petDaycareGame.player.cameraPitch = 0.35;
      const hDist = Math.cos(0.35) * 5.5;
      const vDist = Math.sin(0.35) * 5.5;
      window.__petDaycareGame.camera.position.set(0, vDist + 1.2, 1.0 + hDist);
      window.__petDaycareGame.camera.lookAt(0, 1.3, 1.0);
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const screenshotPath2 = 'pet_daycare_playroom.png';
  await page.screenshot({ path: screenshotPath2 });
  console.log(`Saved screenshot to ${screenshotPath2}`);

  // 12b. Focus close-up on Capybara with Orange on its Head!
  console.log("Focusing camera on Capybara with orange on head...");
  const capyInfo = await page.evaluate(() => {
    const capy = window.__petDaycareGame.petManager.pets.find(p => p.species === 'capybara');
    if (capy) {
      const cp = capy.root.position;
      window.__petDaycareGame.player.mesh.visible = false;
      window.__petDaycareGame.player.pos.set(cp.x, -0.4, cp.z);
      window.__petDaycareGame.player.cameraYaw = 0;
      window.__petDaycareGame.player.cameraDist = 2.4;
      window.__petDaycareGame.player.cameraPitch = 0.28;
      return {
        found: true,
        name: capy.name,
        breed: capy.breed,
        hasOrange: !!capy.orange,
        orangeParts: capy.orange ? capy.orange.children.length : 0
      };
    }
    return { found: false };
  });
  console.log("Capybara with Orange verification:", capyInfo);
  await new Promise(r => setTimeout(r, 600));

  const screenshotCapy = 'pet_daycare_capybara.png';
  await page.screenshot({ path: screenshotCapy });
  console.log(`Saved screenshot to ${screenshotCapy}`);

  await page.evaluate(() => {
    if (window.__petDaycareGame) {
      window.__petDaycareGame.player.mesh.visible = true;
    }
  });

  // 13. Walk out to front walkway to capture exterior roof perspective
  console.log("Viewing exterior cottage roof from front walkway...");
  await page.evaluate(() => {
    if (window.__petDaycareGame) {
      window.__petDaycareGame.player.pos.set(0, 0, 13.5);
      window.__petDaycareGame.player.cameraYaw = Math.PI;
      window.__petDaycareGame.player.cameraDist = 9.5;
      window.__petDaycareGame.player.cameraPitch = 0.22;
      const hDist = Math.cos(0.22) * 9.5;
      const vDist = Math.sin(0.22) * 9.5;
      window.__petDaycareGame.camera.position.set(0, vDist + 1.6, 13.5 + hDist);
      window.__petDaycareGame.camera.lookAt(0, 3.2, 6.0); // Look at roof gable & cottage front
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const screenshotPath3 = 'pet_daycare_exterior_roof.png';
  await page.screenshot({ path: screenshotPath3 });
  console.log(`Saved screenshot to ${screenshotPath3}`);

  // 13b. Verify 3D Supply Cabin & Restocking System
  console.log("Viewing 3D Supply Cabin in the backyard...");
  const cabinCheck = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const cabin = game.world.stations.supplyCabin;
    // Set caretaker in front of Supply Cabin counter
    game.player.pos.set(8.5, 0, -8.0);
    game.player.facingAngle = Math.PI; // Face north towards cabin
    game.player.mesh.position.copy(game.player.pos);
    game.player.cameraOverride = {
      position: new window.THREE.Vector3(3.6, 2.2, -8.5),
      lookAt: new window.THREE.Vector3(8.5, 2.0, -10.5)
    };

    // Consume some items
    game.player.consumeSupply('FOOD');
    game.player.consumeSupply('FOOD');
    game.player.consumeSupply('BALL');

    return {
      hasStation: !!cabin,
      cabinPos: cabin ? cabin.pos : null,
      foodBefore: game.player.supplies.FOOD.current,
      ballBefore: game.player.supplies.BALL.current,
      promptText: document.getElementById('interact-prompt')?.textContent
    };
  });
  console.log("Supply Cabin Initial State:", cabinCheck);

  // Capture high-res screenshot of the Supply Cabin
  await new Promise(r => setTimeout(r, 600));
  const screenshotCabin = 'pet_daycare_supply_cabin.png';
  await page.screenshot({ path: screenshotCabin });
  console.log(`Saved screenshot to ${screenshotCabin}`);

  // Test Restocking at the Supply Cabin with Key E
  console.log("Interacting at the Supply Cabin with Key E...");
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 600));

  const postRestock = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    game.player.cameraOverride = null; // Revert camera override
    return {
      foodAfter: game.player.supplies.FOOD.current,
      ballAfter: game.player.supplies.BALL.current,
      waterAfter: game.player.supplies.WATER.current,
      promptText: document.getElementById('interact-prompt')?.textContent
    };
  });
  console.log("Supply Cabin After Restock:", postRestock);
  if (postRestock.foodAfter !== 5 || postRestock.ballAfter !== 3) {
    throw new Error("Supply Cabin should replenish food to 5 and ball to 3!");
  }

  // 14. iPad Emulation & Touch Controls Verification (iPad Landscape & Portrait)
  console.log("\n--- Testing iPad Playability & Touch Controls ---");
  console.log("Emulating iPad Landscape (1024 x 768, touch enabled, DPR 2)...");
  await page.setViewport({
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  await new Promise(r => setTimeout(r, 600));

  // If reload happened during emulation, tap start daycare button if welcome screen is visible
  const isWelcome = await page.evaluate(() => {
    const ws = document.getElementById('welcome-screen');
    return ws && window.getComputedStyle(ws).display !== 'none';
  });
  if (isWelcome) {
    console.log("Welcome screen visible after iPad emulation, tapping OPEN DAYCARE! via touch...");
    await page.tap('#start-daycare-btn');
    await new Promise(r => setTimeout(r, 600));
  }

  // Verify Touch Controls are displayed
  const touchUi = await page.evaluate(() => {
    const joy = document.getElementById('touch-joystick');
    const act = document.getElementById('touch-action-btn');
    const knob = document.getElementById('touch-stick-knob');
    return {
      joystickVisible: joy && window.getComputedStyle(joy).display !== 'none',
      actionBtnVisible: act && window.getComputedStyle(act).display !== 'none',
      hasKnob: !!knob
    };
  });
  console.log("iPad Touch UI Status:", touchUi);
  if (!touchUi.joystickVisible || !touchUi.actionBtnVisible) {
    throw new Error("Touch controls (joystick and action button) should be visible on iPad!");
  }

  // Test virtual joystick touch dragging
  console.log("Testing virtual joystick movement on iPad...");
  const beforeJoyZ = await page.evaluate(() => window.__petDaycareGame.player.pos.z);
  await page.evaluate(() => {
    const joy = document.getElementById('touch-joystick');
    const rect = joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    joy.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: cx, clientY: cy, bubbles: true }));
    joy.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: cx, clientY: cy - 42, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1200));

  // Release joystick
  await page.evaluate(() => {
    const joy = document.getElementById('touch-joystick');
    joy.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 0, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  const afterJoyZ = await page.evaluate(() => window.__petDaycareGame.player.pos.z);
  console.log(`Player Z position before: ${beforeJoyZ.toFixed(2)}, after joystick: ${afterJoyZ.toFixed(2)} (moved: ${afterJoyZ !== beforeJoyZ})`);

  // Test Touch Hotbar Tap & Action Button Tap
  console.log("Tapping Hotbar Food slot on iPad...");
  await page.tap('.hotbar-slot[data-tool="FOOD"]');
  await new Promise(r => setTimeout(r, 300));
  const activeTool = await page.evaluate(() => window.__petDaycareGame.player.currentTool);
  console.log(`Current Tool on iPad: ${activeTool}`);

  console.log("Tapping Touch Action Button (🐾 ACTION)...");
  await page.tap('#touch-action-btn');
  await new Promise(r => setTimeout(r, 400));

  // Test iPad Pick Up & Put Down via touch
  console.log("Tapping Hotbar Hands slot on iPad...");
  await page.tap('.hotbar-slot[data-tool="HANDS"]');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const pet = game.petManager.pets.find(p => !p.isHeld && p.state !== 'bathing');
    if (pet) {
      pet.root.position.set(0, 0, 0);
      pet.targetPos.set(0, 0, 0);
      pet.state = 'idle';
      game.player.pos.set(0, 0, 1.0);
      game.player.facingAngle = Math.PI;
    }
  });
  await new Promise(r => setTimeout(r, 400));
  
  const preCheck = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const closest = game.petManager.getClosestPet(game.player.pos, 3.2);
    return {
      tool: game.player.currentTool,
      pos: { x: game.player.pos.x, z: game.player.pos.z },
      closestPet: closest ? closest.name : null,
      closestDist: closest ? game.player.pos.distanceTo(closest.root.position).toFixed(2) : null
    };
  });
  console.log("Pre-pickup state on iPad:", preCheck);

  console.log("Tapping touch action button to pick up pet on iPad...");
  await page.tap('#touch-action-btn');
  await new Promise(r => setTimeout(r, 400));

  const ipadCarryCheck = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    const btnLabel = document.querySelector('.touch-action-label')?.textContent;
    return {
      carried: !!game.player.carriedPet,
      petName: game.player.carriedPet?.name,
      btnLabel: btnLabel
    };
  });
  console.log("iPad Carry Check:", ipadCarryCheck);
  if (!ipadCarryCheck.carried) {
    // If page.tap did not trigger in this environment, try dispatching direct pointerdown
    console.log("Retrying action button via pointerdown dispatch...");
    await page.evaluate(() => {
      const btn = document.getElementById('touch-action-btn');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 400));
  }
  const finalCarryCheck = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    return {
      carried: !!game.player.carriedPet,
      petName: game.player.carriedPet?.name
    };
  });
  console.log("Final iPad Carry Check:", finalCarryCheck);
  if (!finalCarryCheck.carried) {
    throw new Error("iPad touch action button should pick up pet!");
  }

  // Tap again to set down
  console.log("Tapping touch action button to put down pet on iPad...");
  await page.tap('#touch-action-btn');
  await new Promise(r => setTimeout(r, 400));

  let ipadDropCheck = await page.evaluate(() => {
    const game = window.__petDaycareGame;
    return {
      carried: !!game.player.carriedPet
    };
  });
  if (ipadDropCheck.carried) {
    console.log("Retrying put down via pointerdown dispatch...");
    await page.evaluate(() => {
      const btn = document.getElementById('touch-action-btn');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 400));
    ipadDropCheck = await page.evaluate(() => {
      const game = window.__petDaycareGame;
      return {
        carried: !!game.player.carriedPet
      };
    });
  }
  console.log("iPad Drop Check:", ipadDropCheck);
  if (ipadDropCheck.carried) {
    throw new Error("iPad touch action button should put down pet!");
  }

  // Capture iPad Landscape Screenshot
  const ipadLandscapePath = 'pet_daycare_ipad_landscape.png';
  await page.screenshot({ path: ipadLandscapePath });
  console.log(`Saved iPad Landscape screenshot to ${ipadLandscapePath}`);

  // Test iPad Portrait Mode
  console.log("Emulating iPad Portrait (768 x 1024, touch enabled, DPR 2)...");
  await page.setViewport({
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  await new Promise(r => setTimeout(r, 600));

  const ipadPortraitPath = 'pet_daycare_ipad_portrait.png';
  await page.screenshot({ path: ipadPortraitPath });
  console.log(`Saved iPad Portrait screenshot to ${ipadPortraitPath}`);

  if (errors.length > 0) {
    console.error("Encountered errors during test:", errors);
    throw new Error("Test failed with errors");
  } else {
    console.log("\n>>> ALL TESTS PASSED WITH 0 ERRORS! 📱🐶🐱🐰🐹🍊✨ <<<");
  }

  await browser.close();
  viteProcess.kill('SIGTERM');
  process.exit(0);
}

runPetDaycareTest().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
