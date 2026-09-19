import * as THREE from 'three';

// Procedural Canvas Texture Generator for Paws & Play: 3D Pet Daycare
export class TextureGenerator {
  // 1. Warm Honey Oak Wood Planks with Grain and Nail Details
  static createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm oak color
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 0, 512, 512);

    const numPlanks = 8;
    const plankHeight = 512 / numPlanks;

    for (let i = 0; i < numPlanks; i++) {
      const y = i * plankHeight;
      // Slight shade variation per plank
      const hueShift = (Math.sin(i * 1.7) * 8);
      ctx.fillStyle = `rgb(${212 + hueShift}, ${163 + hueShift * 0.8}, ${115 + hueShift * 0.6})`;
      ctx.fillRect(0, y, 512, plankHeight);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(107, 78, 61, 0.12)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 12; g++) {
        ctx.beginPath();
        const gy = y + Math.random() * plankHeight;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + (Math.random() - 0.5) * 6, 350, gy + (Math.random() - 0.5) * 6, 512, gy);
        ctx.stroke();
      }

      // Plank horizontal groove/gap
      ctx.strokeStyle = 'rgba(74, 52, 40, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Plank vertical seams (staggered)
      const seamX1 = (i % 2 === 0 ? 170 : 340) + (Math.random() - 0.5) * 20;
      const seamX2 = seamX1 + 250 > 512 ? seamX1 - 250 : seamX1 + 250;
      [seamX1, seamX2].forEach(sx => {
        ctx.strokeStyle = 'rgba(74, 52, 40, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx, y + plankHeight);
        ctx.stroke();

        // Nails near seams
        ctx.fillStyle = 'rgba(60, 40, 30, 0.6)';
        ctx.beginPath();
        ctx.arc(sx - 8, y + 8, 2.5, 0, Math.PI * 2);
        ctx.arc(sx - 8, y + plankHeight - 8, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + 8, y + 8, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + 8, y + plankHeight - 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  // 2. Spa Checkered Ceramic Tiles with Bevel
  static createCheckeredTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#f4f9f9' : '#a8dadc';
        ctx.fillRect(x, y, tileSize, tileSize);

        // Soft highlight at top-left
        ctx.strokeStyle = isLight ? '#ffffff' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + tileSize - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + tileSize - 1, y + 1);
        ctx.stroke();

        // Soft shadow at bottom-right
        ctx.strokeStyle = 'rgba(69, 123, 157, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + tileSize - 1);
        ctx.lineTo(x + tileSize - 1, y + tileSize - 1);
        ctx.lineTo(x + tileSize - 1, y + 1);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // 3. Woven Rug with Braided Border & Paw Print Center
  static createPawRugTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Outer warm pastel circle
    ctx.fillStyle = '#bde0fe';
    ctx.beginPath();
    ctx.arc(256, 256, 248, 0, Math.PI * 2);
    ctx.fill();

    // Braided ring border
    ctx.strokeStyle = '#a2d2ff';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner cozy pattern
    ctx.fillStyle = '#e2efff';
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.fill();

    // Embossed Paw Print in center
    ctx.fillStyle = '#6495ed';
    // Main pad
    ctx.beginPath();
    ctx.ellipse(256, 290, 60, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Toes
    const toes = [
      { x: 195, y: 220, rx: 22, ry: 28, rot: -0.35 },
      { x: 236, y: 190, rx: 24, ry: 30, rot: -0.1 },
      { x: 276, y: 190, rx: 24, ry: 30, rot: 0.1 },
      { x: 317, y: 220, rx: 22, ry: 28, rot: 0.35 }
    ];
    toes.forEach(t => {
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, t.rx, t.ry, t.rot, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  // 4. Lush Grass Texture with Daisies and Blade Variations
  static createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base meadow green
    ctx.fillStyle = '#80b95b';
    ctx.fillRect(0, 0, 512, 512);

    // Stipple variations
    for (let i = 0; i < 1800; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      const c = Math.random() > 0.5 ? 'rgba(144, 210, 102, 0.45)' : 'rgba(92, 148, 62, 0.45)';
      ctx.fillStyle = c;
      ctx.fillRect(gx, gy, 3, 3);
    }

    // Small daisy flowers scattered
    for (let i = 0; i < 30; i++) {
      const fx = Math.random() * 500 + 6;
      const fy = Math.random() * 500 + 6;
      // White petals
      ctx.fillStyle = '#ffffff';
      for (let p = 0; p < 5; p++) {
        const angle = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(angle) * 4, fy + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Yellow center
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  // 5. Garden Cobblestone Pavers for Walkway
  static createCobblestoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b7b7a4'; // Mortar grey
    ctx.fillRect(0, 0, 512, 512);

    const stoneColors = ['#eddcd2', '#ddbea9', '#d6ccc2', '#f5ebe0', '#e3d5ca'];
    const rows = 12;
    const cols = 8;
    const rh = 512 / rows;
    const cw = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2 === 0 ? 0 : cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const sx = c * cw + offsetX + 3;
        const sy = r * rh + 3;
        const w = cw - 6;
        const h = rh - 6;

        ctx.fillStyle = stoneColors[(r * 3 + c * 5) % stoneColors.length];
        ctx.beginPath();
        ctx.roundRect(sx, sy, w, h, 8);
        ctx.fill();

        // Subtle inner shadow
        ctx.strokeStyle = 'rgba(100, 90, 80, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  }

  // 6. Cozy Wallpaper with Warm Wainscoting & Subtle Pinstripes
  static createWallpaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm cream background
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle warm vertical pinstripes
    ctx.strokeStyle = '#faedcd';
    ctx.lineWidth = 4;
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Lower wainscoting panel border (bottom 30%)
    ctx.fillStyle = '#faedcd';
    ctx.fillRect(0, 360, 512, 152);

    // Decorative chair rail molding
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 355, 512, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 357, 512, 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }

  // 7. Contact Shadow Decal Disc (Radial gradient for grounding characters & furniture)
  static createContactShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(40, 25, 15, 0.65)');
    grad.addColorStop(0.5, 'rgba(40, 25, 15, 0.35)');
    grad.addColorStop(1, 'rgba(40, 25, 15, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 8. Framed Art Painting Texture ("Bella - Daycare Mascot")
  static createArtPortraitTexture(name = 'Bella', emoji = '🐶') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Pastel background with soft gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#ffcad4');
    grad.addColorStop(1, '#b8c0ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Inner gold border
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 236, 236);

    // Big Emoji Mascot
    ctx.font = '96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 115);

    // Banner
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(24, 180, 208, 48, 12);
    ctx.fill();
    ctx.strokeStyle = '#f4a261';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#723c12';
    ctx.fillText(name, 128, 212);

    return new THREE.CanvasTexture(canvas);
  }

  // 9. Horizontal Log Cabin Wood Texture with Chink Mortar Grooves
  static createLogCabinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm cedar log tone
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 0, 512, 512);

    const logCount = 6;
    const logHeight = 512 / logCount;

    for (let i = 0; i < logCount; i++) {
      const y = i * logHeight;

      // Cylindrical round log 3D lighting gradient
      const grad = ctx.createLinearGradient(0, y, 0, y + logHeight);
      grad.addColorStop(0, '#5c3818');     // Shadowed top groove
      grad.addColorStop(0.18, '#a6723e');  // Top highlight
      grad.addColorStop(0.5, '#935f2f');   // Rich mid-timber
      grad.addColorStop(0.85, '#78481e');  // Lower curve shadow
      grad.addColorStop(1.0, '#3e240c');   // Bottom deep mortar groove

      ctx.fillStyle = grad;
      ctx.fillRect(0, y, 512, logHeight);

      // Bark grain & knot details
      ctx.strokeStyle = 'rgba(50, 30, 15, 0.18)';
      ctx.lineWidth = 1.6;
      for (let g = 0; g < 10; g++) {
        ctx.beginPath();
        const gy = y + 4 + Math.random() * (logHeight - 8);
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(160, gy + (Math.random() - 0.5) * 8, 360, gy + (Math.random() - 0.5) * 8, 512, gy);
        ctx.stroke();
      }

      // Occasional rustic tree ring knots
      if (i % 2 === 0) {
        const kx = 120 + ((i * 137) % 280);
        const ky = y + logHeight * 0.5;
        ctx.fillStyle = 'rgba(60, 32, 12, 0.4)';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(40, 20, 8, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Mortar chinking line (pale gray cream seal)
      ctx.fillStyle = '#dcd3b8';
      ctx.fillRect(0, y + logHeight - 3, 512, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // 10. Rustic Supply Cabin Hanging Wood Signboard
  static createSupplySignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Rich dark oak carved board
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 160);
    bgGrad.addColorStop(0, '#58311a');
    bgGrad.addColorStop(0.5, '#6a3b20');
    bgGrad.addColorStop(1, '#432310');
    ctx.fillStyle = bgGrad;
    ctx.roundRect(6, 6, 500, 148, 18);
    ctx.fill();

    // Carved bevel rim
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 6;
    ctx.roundRect(12, 12, 488, 136, 14);
    ctx.stroke();

    // Decorative corner bolts
    ctx.fillStyle = '#ffd166';
    [[24, 24], [488, 24], [24, 136], [488, 136]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sign Header: "PAWS & PANTRY"
    ctx.font = 'bold 36px "Fredoka", "Quicksand", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeedd';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillText('🐾 PAWS & PANTRY 🧺', 256, 65);

    // Sign Subtitle: "SUPPLY CABIN • RESTOCK"
    ctx.font = 'bold 22px "Fredoka", "Quicksand", sans-serif';
    ctx.fillStyle = '#f4a261';
    ctx.fillText('SUPPLY CABIN • FREE RESTOCK 🪵', 256, 114);

    return new THREE.CanvasTexture(canvas);
  }

  // 11. Burlap Kibble Sack Stencil
  static createKibbleSackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Burlap woven jute base
    ctx.fillStyle = '#d4b483';
    ctx.fillRect(0, 0, 256, 256);

    // Crossweave texture
    ctx.strokeStyle = 'rgba(140, 100, 60, 0.2)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 256; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Stenciled Paw & Text
    ctx.fillStyle = '#6b4e3d';
    ctx.font = '54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍖', 128, 90);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('CHOW', 128, 140);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('100% ORGANIC', 128, 172);

    return new THREE.CanvasTexture(canvas);
  }
}

