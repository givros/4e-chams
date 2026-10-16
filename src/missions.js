export const PHASES = [
  { title: 'Donne-lui vie', color: 'mint' },
  { title: 'Prends les commandes', color: 'blue' },
  { title: 'La chasse aux fruits', color: 'amber' },
  { title: 'À toi la victoire', color: 'pink' }
];

const mission = (id, title, exportName, type, content) => ({
  id, phase: Math.floor((id - 1) / 5), title, exportName, type,
  file: 'game.js', starter: '', ...content
});

export const MISSIONS = [
  mission(1, 'Nomme ton héros', 'playerName', 'string', {
    concept: 'Donner une information au jeu',
    lesson: { text: '`const` donne un nom à une information. Ici, `playerName` contient le nom du héros. Le texte s’écrit entre guillemets.', example: 'const playerName = "Pixel";' },
    steps: ['Choisis un nom court pour ton héros.', 'Écris ta ligne avec `playerName` dans le fichier vide.'],
    outcome: 'Ton héros apparaît avec le nom que tu as choisi.',
    challenge: 'Change son nom, vérifie et retrouve-le au-dessus du jeu.',
    hint: 'Garde playerName : c’est le nom que le jeu lit. Choisis toi-même le texte entre guillemets.',
    secondHint: 'Commence par const playerName = puis écris ton nom entre deux guillemets. Termine par ;',
    solution: 'const playerName = "Ninja";'
  }),
  mission(2, 'Choisis son départ', 'startX', 'number', {
    concept: 'Un nombre place le héros',
    lesson: { text: '`startX` fixe la position de départ. Sur l’axe `X`, un nombre plus grand place le héros plus à droite. Un nombre s’écrit sans guillemets.', example: 'const startX = 40;' },
    steps: ['Ajoute une ligne avec `startX`.', 'Choisis un départ entre `24` et `70`.'],
    outcome: 'Ton héros se place à l’endroit que tu as choisi.',
    challenge: 'Essaie 30, puis 60. De quel côté se déplace le départ ?',
    hint: 'Réutilise const comme pour le nom. Cette fois, sa valeur est un nombre.',
    secondHint: 'Écris const startX = suivi du nombre choisi, puis ;. Garde la ligne playerName au-dessus.',
    solution: 'const startX = 43;'
  }),
  mission(3, 'Règle son moteur', 'speed', 'number', {
    concept: 'Un réglage du jeu',
    lesson: { text: '`speed` indique la taille d’un pas, en pixels. Un pas de `5` sera plus grand qu’un pas de `3`. Tu connais déjà l’écriture avec `const`.', example: 'const speed = 3;' },
    steps: ['Ajoute le réglage `speed`.', 'Choisis une vitesse de `3` à `5`.'],
    outcome: 'Le moteur est réglé. La prochaine mission va le mettre en marche.',
    challenge: 'Prédis : avec un pas de 5, le héros sera-t-il plus lent ou plus rapide ?',
    hint: 'Une seule nouvelle ligne suffit. Ne change pas le départ du héros.',
    secondHint: 'Utilise const speed = puis ton nombre entre 3 et 5, et termine par ;',
    solution: 'const speed = 4;'
  }),
  mission(4, 'Fais son premier pas', 'updateX', 'function', {
    concept: 'Une petite règle répétée',
    lesson: { text: 'Une `function` regroupe des instructions. Le cadre est prêt : le jeu le répète. `player.x` est la position actuelle ; `=` lui donne une nouvelle valeur.', example: 'player.x = player.x + 3;' },
    steps: ['Dans le bloc vert, complète le calcul de `player.x`.', 'Garde sa position actuelle et ajoute un pas de `speed`.'],
    outcome: 'Ton héros avance tout seul : ta règle est répétée !',
    challenge: 'Change speed, vérifie et compare l’allure de ton héros.',
    hint: 'Avec x = x + 3, on lit d’abord x + 3, puis on range le résultat dans x.',
    secondHint: 'À droite du signe =, il faut la position actuelle player.x, puis + et la taille du pas speed.',
    scaffold: 'function updateX(player, keys, speed) {\n  player.x = player.x;\n}', focus: 'player.x =',
    solution: 'function updateX(player, keys, speed) {\n  player.x = player.x + speed;\n}'
  }),
  mission(5, 'Donne-lui une commande', 'updateX', 'function', {
    concept: 'Si la touche est pressée…',
    lesson: { text: '`if` veut dire « si ». `keys.right` indique la flèche droite. Entre les accolades, on place ce qui doit arriver quand cette touche est pressée.', example: 'if (keys.right) {\n  // action\n}' },
    steps: ['Dans `updateX`, entoure ton calcul avec `if (keys.right) {` et `}`.', 'Garde aussi les accolades de la fonction.'],
    outcome: 'Le héros avance avec → et s’arrête quand tu relâches.',
    challenge: 'Appuie, relâche, recommence : c’est ta condition qui décide.',
    hint: 'Le calcul reste le même. Tu ajoutes seulement une condition autour de cette ligne.',
    secondHint: 'Ouvre if (keys.right) { avant le calcul. Ferme ce if avec } juste après. La dernière } ferme toujours updateX.',
    edit: true, extension: true, focus: 'player.x',
    solution: 'function updateX(player, keys, speed) {\n  if (keys.right) {\n    player.x = player.x + speed;\n  }\n}'
  }),
  mission(6, 'Fais demi-tour', 'updateX', 'function', {
    concept: 'À gauche, on enlève',
    lesson: { text: 'Tu sais déjà écrire un `if`. Pour la gauche, la touche s’appelle `keys.left`. Enlever un pas à `player.x` déplace le héros vers la gauche.', example: 'player.x = player.x - 3;' },
    steps: ['Dans la même fonction, ajoute un deuxième `if` pour `keys.left`.', 'Cette fois, enlève `speed` à `player.x`.'],
    outcome: 'Tu diriges maintenant ton héros avec ← et →.',
    challenge: 'Reviens exactement à ton point de départ avec les deux flèches.',
    hint: 'Réutilise le if de la flèche droite : change le nom de la touche et le sens du calcul.',
    secondHint: 'Ajoute if (keys.left) { … } avant la dernière accolade de updateX. Le calcul utilise player.x - speed.',
    edit: true, extension: true, focus: 'if (keys.right)',
    solution: 'function updateX(player, keys, speed) {\n  if (keys.right) {\n    player.x = player.x + speed;\n  }\n  if (keys.left) {\n    player.x = player.x - speed;\n  }\n}'
  }),
  mission(7, 'Vise la plateforme', 'jumpPower', 'number', {
    concept: 'Choisir la force du saut',
    lesson: { text: '`jumpPower` règle la force du saut. Plus ce nombre est grand, plus le héros monte haut. Tu peux régler ton jeu avec une seule ligne.', example: 'const jumpPower = 9;' },
    steps: ['Ajoute `jumpPower`, avec un nombre de `9` à `11`.', 'Vérifie, puis essaie un saut avec `Espace`.'],
    outcome: 'Les plateformes apparaissent. À toi de sauter dessus !',
    challenge: 'Atteins la première plateforme. Préfères-tu un saut à 9 ou à 11 ?',
    hint: 'Utilise la même écriture que speed. Seul le nom et le nombre changent.',
    secondHint: 'Ajoute const jumpPower = puis 9, 10 ou 11, et termine par ;',
    solution: 'const jumpPower = 10;'
  }),
  mission(8, 'Teste la gravité', 'gravity', 'number', {
    concept: 'Un nombre à virgule… avec un point',
    lesson: { text: '`gravity` fait retomber le héros. Un petit nombre ralentit sa chute. En JavaScript, un nombre décimal utilise un point : `0.5`.', example: 'const gravity = 0.5;' },
    steps: ['Ajoute `gravity`, entre `0.35` et `0.6`.', 'Teste deux valeurs et garde ton réglage préféré.'],
    outcome: 'Ton saut devient plus léger ou plus rapide.',
    challenge: 'Compare 0.35 et 0.6 sans changer jumpPower. Quel saut dure le plus longtemps ?',
    hint: 'Écris 0.45 avec un point. Une virgule séparerait deux choses au lieu d’écrire un nombre.',
    secondHint: 'Ajoute const gravity = 0.45; puis change seulement le nombre pour comparer.',
    solution: 'const gravity = 0.45;'
  }),
  mission(9, 'Envoie-le vers le haut', 'jumpSpeed', 'function', {
    concept: 'La réponse d’une fonction',
    lesson: { text: '`return` donne la réponse d’une fonction. Sur l’écran, une vitesse négative va vers le haut. Le signe `-` change le sens du saut.', example: 'function opposite(number) {\n  return -number;\n}' },
    steps: ['Dans le nouveau bloc vert, change la réponse après `return`.', 'Renvoie la valeur opposée de `jumpPower`.'],
    outcome: 'Le saut commence bien vers le haut.',
    challenge: 'Explique à ton binôme pourquoi un signe moins fait monter le héros.',
    hint: 'Le cadre de la fonction est déjà écrit. Tu n’as besoin de changer qu’une ligne.',
    secondHint: 'Garde return et jumpPower. Place le signe moins juste devant jumpPower.',
    scaffold: 'function jumpSpeed(jumpPower) {\n  return jumpPower;\n}', focus: 'return',
    solution: 'function jumpSpeed(jumpPower) {\n  return -jumpPower;\n}'
  }),
  mission(10, 'Empêche le double saut', 'canJump', 'function', {
    concept: 'Une réponse oui ou non',
    lesson: { text: '`true` veut dire oui, `false` veut dire non. `player.onGround` vaut déjà oui au sol, non dans les airs. La fonction peut renvoyer cette information.', example: 'function answer() {\n  return true;\n}' },
    steps: ['Dans `canJump`, remplace `true` par l’information `player.onGround`.', 'Teste `Espace` au sol, puis en plein saut.'],
    outcome: 'Le héros peut sauter seulement quand il touche le sol.',
    challenge: 'Appuie plusieurs fois sur Espace en l’air : ta règle empêche de voler.',
    hint: 'La réponse doit dépendre du héros. true tout le temps autoriserait le saut partout.',
    secondHint: 'Dans canJump, garde return et renvoie directement player.onGround, sans guillemets.',
    scaffold: 'function canJump(player) {\n  return true;\n}', focus: 'return',
    solution: 'function canJump(player) {\n  return player.onGround;\n}'
  }),
  mission(11, 'Fais apparaître les fruits', 'fruitPoints', 'number', {
    concept: 'Combien vaut un fruit ?',
    lesson: { text: '`fruitPoints` est le nombre de points gagné pour un fruit. Réutilise `const` pour choisir cette règle de ton jeu.', example: 'const fruitPoints = 1;' },
    steps: ['Ajoute `fruitPoints` avec `1`, `2` ou `3`.', 'Vérifie, puis ramasse un fruit.'],
    outcome: 'Les fruits apparaissent et tu peux gagner des points.',
    challenge: 'Si un fruit vaut 2 points, prédis le score de trois fruits avant de jouer.',
    hint: 'Choisis un nombre entier : 1, 2 ou 3. Pas besoin de créer une fonction.',
    secondHint: 'Ajoute par exemple const fruitPoints = 2; à la suite de ton fichier.',
    solution: 'const fruitPoints = 1;'
  }),
  mission(12, 'Répare le compteur', 'addPoints', 'function', {
    concept: 'Garder les points déjà gagnés',
    lesson: { text: '`score` contient les points déjà gagnés. `points` contient ceux du nouveau fruit. Pour garder les deux, il faut les additionner.', example: 'const total = 4 + 2;' },
    steps: ['Le nouveau bloc oublie les anciens points : répare son `return`.', 'Fais un calcul avec `score` et `points`.'],
    outcome: 'Le compteur augmente à chaque fruit ramassé.',
    challenge: 'Ramasse deux fruits : le deuxième doit ajouter des points, pas remplacer le score.',
    hint: 'Renvoyer seulement points oublie ce que tu avais gagné. Quel signe permet de tout additionner ?',
    secondHint: 'Après return, additionne les deux informations reçues : score et points.',
    scaffold: 'function addPoints(score, points) {\n  return points;\n}', focus: 'return',
    solution: 'function addPoints(score, points) {\n  return score + points;\n}'
  }),
  mission(13, 'Place le trophée', 'targetScore', 'number', {
    concept: 'Fixer le score à atteindre',
    lesson: { text: '`targetScore` est le nombre de points nécessaire pour gagner. Choisis un objectif atteignable avec les fruits du niveau.', example: 'const targetScore = 3;' },
    steps: ['Ajoute `targetScore`, entre `3` et `5`.', 'Ramasse assez de fruits et rejoins le trophée.'],
    outcome: 'Ton niveau a maintenant une arrivée.',
    challenge: 'Choisis un objectif que ton binôme peut réussir, puis laisse-le essayer.',
    hint: 'Utilise const et un nombre entier, comme pour la valeur des fruits.',
    secondHint: 'Ajoute const targetScore = suivi de 3, 4 ou 5, puis ;',
    solution: 'const targetScore = 3;'
  }),
  mission(14, 'Gagne au bon moment', 'canWin', 'function', {
    concept: 'Assez de points, ça veut dire quoi ?',
    lesson: { text: '`>` veut dire « plus grand que ». `>=` veut dire « plus grand ou égal ». Le score exact doit aussi permettre de gagner.', example: 'const enough = 3 >= 3;' },
    steps: ['Dans le nouveau bloc, corrige le signe de comparaison.', 'Accepte un `score` égal ou supérieur à `target`.'],
    outcome: 'Le trophée accepte le score exact, et aussi un score plus grand.',
    challenge: 'Avec un objectif de 3, dis ce qui arrive pour les scores 2, 3 et 4.',
    hint: 'Le code fourni utilise >. Il lui manque le cas où les deux nombres sont égaux.',
    secondHint: 'Utilise le signe >= entre score et target. Garde le return.',
    scaffold: 'function canWin(score, target) {\n  return score > target;\n}', focus: 'return',
    solution: 'function canWin(score, target) {\n  return score >= target;\n}'
  }),
  mission(15, 'Attention au feu !', 'isDangerous', 'function', {
    concept: 'Une règle qui suit le piège',
    lesson: { text: '`trap.active` dit si le feu est allumé. Comme `player.onGround`, cette information vaut `true` ou `false`. Réutilise cette idée pour le danger.', example: 'function answer() {\n  return false;\n}' },
    steps: ['Dans `isDangerous`, renvoie l’information `trap.active`.', 'Observe le feu avant de traverser.'],
    outcome: 'Le feu est dangereux seulement quand il est allumé.',
    challenge: 'Traverse sans te brûler. Ta règle suit l’état du piège.',
    hint: 'Tu as déjà renvoyé une information du héros avec un point. Fais pareil pour le piège.',
    secondHint: 'Remplace false par trap.active après return, sans guillemets.',
    scaffold: 'function isDangerous(trap) {\n  return false;\n}', focus: 'return',
    solution: 'function isDangerous(trap) {\n  return trap.active;\n}'
  }),
  mission(16, 'Active le drapeau', 'canSave', 'function', {
    concept: 'Comparer deux endroits',
    lesson: { text: '`playerX` est la position du héros. `flagX` est celle du drapeau. Tu connais déjà le signe qui veut dire « atteint ou dépasse ».', example: 'const reached = 60 >= 40;' },
    steps: ['Dans le bloc vert, compare `playerX` à `flagX`.', 'Le drapeau doit s’activer quand le héros l’atteint ou le dépasse.'],
    outcome: 'Après le drapeau, une brûlure ne te renvoie plus au début.',
    challenge: 'Active le drapeau, puis teste le feu pour voir ton nouveau départ.',
    hint: 'Réutilise la comparaison du score. Cette fois, tu compares deux positions.',
    secondHint: 'Après return, compare playerX et flagX avec >=.',
    scaffold: 'function canSave(playerX, flagX) {\n  return false;\n}', focus: 'return',
    solution: 'function canSave(playerX, flagX) {\n  return playerX >= flagX;\n}'
  }),
  mission(17, 'Dessine un chemin de fruits', 'fruitGap', 'number', {
    concept: 'Un réglage change plusieurs objets',
    lesson: { text: '`fruitGap` règle l’écart entre les fruits d’une rangée. Le jeu réutilise ce même nombre pour les espacer. Choisis la disposition de ton niveau.', example: 'const fruitGap = 16;' },
    steps: ['Ajoute `fruitGap`, entre `16` et `24`.', 'Compare deux écarts sur la première plateforme.'],
    outcome: 'Une rangée de fruits suit ton réglage.',
    challenge: 'Crée une rangée facile à ramasser d’un seul saut.',
    hint: 'Un petit écart rapproche les fruits. Un grand écart les éloigne.',
    secondHint: 'Ajoute const fruitGap = puis un nombre de 16 à 24, et termine par ;',
    solution: 'const fruitGap = 24;'
  }),
  mission(18, 'Double la récompense', 'fruitBonus', 'function', {
    concept: 'Multiplier une quantité',
    lesson: { text: 'En code, `*` veut dire multiplier. Le bonus doit donner deux points par fruit. `count` contient le nombre de fruits ramassés.', example: 'const double = 3 * 2;' },
    steps: ['Dans `fruitBonus`, calcule le double de `count`.', 'Change la réponse après `return`.'],
    outcome: 'Une prime de deux points par fruit t’attend à l’arrivée.',
    challenge: 'Prédis ta prime pour 3 fruits, puis pour 5 fruits.',
    hint: 'Le résultat doit dépendre de count : évite d’écrire seulement le résultat d’un exemple.',
    secondHint: 'Multiplie count par 2 après return.',
    scaffold: 'function fruitBonus(count) {\n  return count;\n}', focus: 'return',
    solution: 'function fruitBonus(count) {\n  return count * 2;\n}'
  }),
  mission(19, 'Déverrouille l’arrivée', 'canOpen', 'function', {
    concept: 'Deux conditions en même temps',
    lesson: { text: '`&&` veut dire « et ». Pour ouvrir l’arrivée, il faut assez de points ET le drapeau activé. Si l’un manque, l’arrivée reste fermée.', example: 'const open = true && false;' },
    steps: ['Le bloc vérifie déjà le score.', 'Ajoute `&& flag` pour exiger aussi le drapeau.'],
    outcome: 'L’arrivée attend tes points et ton passage au drapeau.',
    challenge: 'Assez de points sans le drapeau : l’arrivée doit-elle s’ouvrir ?',
    hint: 'Garde la comparaison du score. Ajoute la deuxième information avant le point-virgule.',
    secondHint: 'La réponse combine score >= target et flag avec &&.',
    scaffold: 'function canOpen(score, target, flag) {\n  return score >= target;\n}', focus: 'return',
    solution: 'function canOpen(score, target, flag) {\n  return score >= target && flag;\n}'
  }),
  mission(20, 'Signe ta victoire', 'victoryMessage', 'function', {
    concept: 'Assembler du texte',
    lesson: { text: 'Avec du texte, `+` assemble les morceaux. Les mots sont entre guillemets ; `playerName` et `score` apportent les informations de la partie.', example: 'function greet(name) {\n  return "Bravo " + name;\n}' },
    steps: ['Invente ton message après `return`.', 'Assemble ton texte, `playerName` et `score`, puis termine une partie.'],
    outcome: 'Ta propre phrase célèbre la victoire. Ce jeu porte ta signature !',
    challenge: 'Fais jouer ton binôme, puis montre-lui une ligne dont tu peux expliquer l’effet.',
    hint: 'Choisis les mots de ton message et ajoute les deux informations avec +.',
    secondHint: 'Tu peux écrire return playerName + " gagne " + score + " points !"; ou inventer une autre phrase.',
    scaffold: 'function victoryMessage(playerName, score) {\n  return "Bravo !";\n}', focus: 'return',
    solution: 'function victoryMessage(playerName, score) {\n  return "Bravo " + playerName + " ! Score : " + score;\n}'
  })
];

for (const item of MISSIONS) item.task = item.steps.join(' ');

export function solutionSource(lastIndex = MISSIONS.length - 1) {
  const parts = new Map();
  for (let index = 0; index <= lastIndex; index++) parts.set(MISSIONS[index].exportName, MISSIONS[index].solution);
  return [...parts.values()].join('\n\n');
}

export const STORAGE_KEY = 'code-quest-workshop-v1';
const FEATURE_MISSIONS = { player: 0, position: 1, speed: 2, right: 3, controls: 4, left: 5, animation: 3, jump: 6, fruits: 10, goal: 12, danger: 14, checkpoint: 15, fruitLine: 16, bonus: 17, gate: 18, victory: 19 };
export function getGameFeatures(sources) {
  return Object.fromEntries(Object.entries(FEATURE_MISSIONS).map(([feature, index]) => [feature, typeof sources[index] === 'string']));
}
