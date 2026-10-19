import type { WishColor, WishIcon } from './wishes';

export const COLOR_HEX: Record<WishColor, string> = {
  pink: '#ffb3c9',
  aqua: '#a8ecf0',
  periwinkle: '#b3bfff',
  yellow: '#ffe58a',
  orange: '#ffc28a',
};

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: WishIcon, x: number, y: number, r: number) {
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#0d0b1a';
  ctx.lineJoin = 'round';
  switch (icon) {
    case 'heart': {
      ctx.fillStyle = '#ff6f91';
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.bezierCurveTo(x - r * 1.8, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.4);
      ctx.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.8, y - r * 0.2, x, y + r);
      break;
    }
    case 'moon': {
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.arc(x, y, r, 0.6, Math.PI * 2 - 0.6);
      ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.78, Math.PI * 2 - 1.0, 1.0, true);
      break;
    }
    case 'cloud': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - r * 0.5, y + r * 0.1, r * 0.55, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x, y - r * 0.35, r * 0.6, Math.PI, 0);
      ctx.arc(x + r * 0.55, y + r * 0.1, r * 0.5, Math.PI * 1.5, Math.PI * 0.5);
      break;
    }
    case 'sparkle': {
      ctx.fillStyle = '#b8f23a';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      break;
    }
    default: {
      ctx.fillStyle = '#ffe27a';
      star(ctx, x, y, r);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Draws the wish onto a 560x560 paper note PNG, handed to React Bits Paper Crumple as its `src`. */
export async function noteDataUrl(text: string, color: WishColor, icon: WishIcon): Promise<string> {
  const W = 560;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  try {
    await document.fonts.load('72px "Nanum Pen Script"');
  } catch {}
  ctx.fillStyle = COLOR_HEX[color];
  ctx.fillRect(0, 0, W, W);
  ctx.strokeStyle = '#0d0b1a';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, W - 14, W - 14);
  // ruled lines
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(13,11,26,0.14)';
  for (let y = 190; y < W - 60; y += 66) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
  }
  // tape
  ctx.save();
  ctx.translate(W / 2, 26);
  ctx.rotate(-0.05);
  ctx.fillStyle = 'rgba(255,226,122,0.9)';
  ctx.fillRect(-70, -18, 140, 40);
  ctx.restore();
  // text
  ctx.fillStyle = '#0d0b1a';
  ctx.font = '72px "Nanum Pen Script", "Gochi Hand", cursive';
  ctx.textBaseline = 'alphabetic';
  const words = (text || ' ').split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > W - 100 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  lines.push(cur);
  lines.slice(0, 6).forEach((l, i) => ctx.fillText(l, 50, 160 + i * 66));
  drawIcon(ctx, icon, W - 90, W - 90, 40);
  return c.toDataURL('image/png');
}
