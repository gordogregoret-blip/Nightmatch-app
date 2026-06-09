const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background negro
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // Círculo rosa neón
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, '#e91e8c');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.42, 0, Math.PI*2);
  ctx.fill();
  
  // Letra N
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size*0.48}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', size/2, size/2 + size*0.03);
  
  fs.writeFileSync(`icon-${size}.png`, canvas.toBuffer('image/png'));
  console.log(`icon-${size}.png created`);
}

makeIcon(192);
makeIcon(512);
