// Compatibility metadata for backups from the earlier curriculum.
export const LEGACY_MISSIONS = [
  {
    "exportName": "playerName",
    "previousStarters": [
      "const playerName = \"Player\";"
    ]
  },
  {
    "exportName": "speed",
    "previousStarters": [
      "const speed = 2;"
    ]
  },
  {
    "exportName": "updateX",
    "previousStarters": [
      "function moveRight(speed) {\n  return 0;\n}"
    ]
  },
  {
    "exportName": "updateX",
    "previousStarters": [
      "function moveLeft(speed) {\n  return speed;\n}"
    ]
  },
  {
    "exportName": "chooseAnimation",
    "previousStarters": [
      "function chooseAnimation(player) {\n  if (player.vx !== 0) {\n    return \"Idle\";\n  }\n  return \"Idle\";\n}",
      "function chooseAnimation(player) {\n  return \"Idle\";\n}"
    ]
  },
  {
    "exportName": "jumpPower",
    "previousStarters": [
      "const jumpPower = 5;"
    ]
  },
  {
    "exportName": "gravity",
    "previousStarters": [
      "const gravity = 0.9;"
    ]
  },
  {
    "exportName": "jumpDirection",
    "previousStarters": [
      "function jumpDirection(jumpPower) {\n  return jumpPower;\n}"
    ]
  },
  {
    "exportName": "canJump",
    "previousStarters": [
      "function canJump(player) {\n  return true;\n}"
    ]
  },
  {
    "exportName": "limitFall",
    "previousStarters": [
      "function limitFall(velocity) {\n  if (velocity > 9) {\n    return velocity;\n  }\n  return velocity;\n}",
      "function limitFall(velocity) {\n  return velocity;\n}"
    ]
  },
  {
    "exportName": "fruitPoints",
    "previousStarters": [
      "const fruitPoints = 0;"
    ]
  },
  {
    "exportName": "collectFruit",
    "previousStarters": [
      "function collectFruit(score, points) {\n  return points;\n}"
    ]
  },
  {
    "exportName": "targetScore",
    "previousStarters": [
      "const targetScore = 99;"
    ]
  },
  {
    "exportName": "canFinish",
    "previousStarters": [
      "function canFinish(score, target) {\n  return true;\n}"
    ]
  },
  {
    "exportName": "isDangerous",
    "previousStarters": [
      "function isDangerous(trap) {\n  return false;\n}"
    ]
  },
  {
    "exportName": "shouldSaveCheckpoint",
    "previousStarters": [
      "function shouldSaveCheckpoint(playerX, checkpointX) {\n  return false;\n}"
    ]
  },
  {
    "exportName": "createFruitLine",
    "previousStarters": [
      "function createFruitLine(count) {\n  const positions = [];\n  for (let i = 0; i < 0; i++) {\n    positions.push(i * 24);\n  }\n  return positions;\n}"
    ]
  },
  {
    "exportName": "fruitBonus",
    "previousStarters": [
      "function fruitBonus(count) {\n  return 0;\n}"
    ]
  },
  {
    "exportName": "canOpenGate",
    "previousStarters": [
      "function canOpenGate(score, target, checkpointActive) {\n  return score >= target;\n}"
    ]
  },
  {
    "exportName": "describeVictory",
    "previousStarters": [
      "function describeVictory(playerName, score) {\n  return \"Bravo !\";\n}"
    ]
  }
];
export const LEGACY_PROGRESS = [0, 1, 3, 5, 6, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
