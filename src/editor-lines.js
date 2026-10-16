import { MISSIONS } from './missions.js';
import { CODE_STEP_INDEX } from './course.js';

export function inferLineOwners(source) {
  const names = new Map(MISSIONS.map((item, index) => [item.exportName, CODE_STEP_INDEX[index]]));
  names.set('updateX', CODE_STEP_INDEX[3]);
  names.set('moveRight', CODE_STEP_INDEX[3]);
  names.set('moveLeft', CODE_STEP_INDEX[5]);
  names.set('startX', CODE_STEP_INDEX[1]);
  let owner = -1;
  return source.split('\n').map(line => {
    const name = /^\s*(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line)?.[1];
    if (names.has(name)) owner = names.get(name);
    return owner;
  });
}

export function updateLineOwners(before, after, owners, missionIndex) {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  const previous = owners?.length === oldLines.length ? owners : inferLineOwners(before);
  if (before === after) return [...previous];
  const result = new Array(newLines.length).fill(missionIndex);
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    result[start] = previous[start];
    start++;
  }
  let oldEnd = oldLines.length;
  let newEnd = newLines.length;
  while (oldEnd > start && newEnd > start && oldLines[oldEnd - 1] === newLines[newEnd - 1]) {
    result[--newEnd] = previous[--oldEnd];
  }
  const rows = oldEnd - start;
  const columns = newEnd - start;
  // Preserve unchanged lines inside pasted edits without allocating an unbounded diff table.
  if (rows && columns && rows * columns <= 200000) {
    const stride = columns + 1;
    const matches = new Uint32Array((rows + 1) * stride);
    for (let row = rows - 1; row >= 0; row--) for (let column = columns - 1; column >= 0; column--) {
      matches[row * stride + column] = oldLines[start + row] === newLines[start + column]
        ? 1 + matches[(row + 1) * stride + column + 1]
        : Math.max(matches[(row + 1) * stride + column], matches[row * stride + column + 1]);
    }
    let row = 0, column = 0;
    while (row < rows && column < columns) {
      if (oldLines[start + row] === newLines[start + column]) {
        result[start + column] = previous[start + row]; row++; column++;
      } else if (matches[(row + 1) * stride + column] >= matches[row * stride + column + 1]) row++;
      else column++;
    }
  }
  return result;
}
