export const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function integratePlayer(player, vx, vy, solids) {
  const next = { ...player, vx, vy, onGround: false };
  next.x += vx;
  for (const solid of solids) {
    if (intersects(next, solid)) {
      if (vx > 0) next.x = solid.x - next.w;
      else if (vx < 0) next.x = solid.x + solid.w;
      next.vx = 0;
    }
  }
  next.x = Math.max(16, Math.min(464 - next.w, next.x));
  next.y += vy;
  for (const solid of solids) {
    if (!intersects(next, solid)) continue;
    if (vy >= 0) { next.y = solid.y - next.h; next.onGround = true; }
    else next.y = solid.y + solid.h;
    next.vy = 0;
  }
  if (next.y < 16) { next.y = 16; next.vy = 0; }
  return next;
}
