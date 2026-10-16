import { MISSIONS } from './missions.js';

export const COURSE_PHASES = [
  { title: 'Le héros' }, { title: 'Les premiers pas' },
  { title: 'Les commandes' }, { title: 'Les sauts' },
  { title: 'Le score' }, { title: 'Le trophée' },
  { title: 'Le drapeau' }, { title: 'Ta version du jeu' }
];

const code = moduleIndex => ({ ...MISSIONS[moduleIndex], id: `code-${moduleIndex}`, kind: 'code', moduleIndex, final: moduleIndex === 19 });
const option = (text, feedback) => ({ text, feedback });
const question = (prompt, snippet, options, correct) => ({ prompt, snippet, options, correct });
const quiz = (id, title, moduleIndex, questions) => ({
  id, title, kind: 'quiz', moduleIndex, questions,
  exportName: MISSIONS[moduleIndex].exportName,
  outcome: 'Bilan validé : tu sais expliquer ce que fait ton code.'
});
const practice = (id, title, moduleIndex, concept, text, example, steps, rule, outcome, hint) => ({
  id, title, kind: 'practice', moduleIndex, concept, lesson: { text, example },
  exportName: rule.field || MISSIONS[moduleIndex].exportName,
  edit: true, steps, rule, outcome, hint,
  secondHint: rule.kind === 'compare' ? 'Garde la même ligne : change seulement sa valeur, vérifie, puis essaie ton jeu.' : hint,
  challenge: 'Explique à ton binôme quelle ligne rend ce résultat possible.'
});

const nameSwap = practice('name-swap', 'Deux noms, un seul héros', 0, 'Modifier une ligne existante',
  'Tu peux changer une information sans recréer sa ligne. Le jeu relit ton fichier quand tu vérifies.', 'const playerName = "Nova";',
  ['Choisis un nouveau nom et vérifie.', 'Change encore le nom sur la même ligne, puis vérifie.'],
  { kind: 'compare', field: 'playerName', observe: 'instant', minDifference: 1 },
  'Tu as changé deux fois l’identité du même héros.', 'Modifie le texte entre guillemets. Ne crée pas un deuxième playerName.');
const startCompare = practice('start-compare', 'Deux points de départ', 1, 'Observer l’effet de X',
  'Comparer deux essais aide à comprendre une ligne. Change seulement startX pour voir son effet.', 'const startX = 30;',
  ['Essaie un départ près de `30` et vérifie.', 'Sur la même ligne, essaie près de `60` et vérifie.'],
  { kind: 'compare', field: 'startX', observe: 'instant', minDifference: 15 },
  'Tu sais relier une valeur de X à un endroit du jeu.', 'Garde les autres lignes. Choisis deux départs bien éloignés, entre 24 et 70.');
const parking = practice('parking', 'Gare ton héros', 1, 'Atteindre une zone avec un nombre',
  'Un petit objectif permet de tester ton réglage. Cette fois, ton héros doit commencer dans une zone précise.', 'const startX = 40;',
  ['Modifie `startX` pour partir entre `50` et `60`.', 'Vérifie et regarde la position X sous le jeu.'],
  { kind: 'setting', field: 'startX', min: 50, max: 60 },
  'Ton héros démarre dans la zone demandée.', 'Choisis toi-même un nombre de 50 à 60, sans guillemets.');
const speedCompare = practice('speed-compare', 'Change son allure', 3, 'Un réglage, deux essais',
  'Ton calcul utilise speed à chaque pas. Tu peux donc changer l’allure sans réécrire la fonction.', 'const speed = 3;',
  ['Essaie `speed` à `3` et laisse le héros avancer.', 'Passe près de `5`, vérifie et compare son allure.'],
  { kind: 'compare', field: 'speed', observe: 'move', minDifference: 1 },
  'Tu as testé deux allures avec le même calcul.', 'Après chaque vérification, laisse le héros faire quelques pas.');
const walkStop = practice('walk-stop', 'Avance, puis stop !', 4, 'Tester sa condition en jouant',
  'Une condition doit aussi fonctionner quand la touche est relâchée. Vérifie les deux situations.', 'if (keys.right) {\n  // action\n}',
  ['Vérifie, puis avance avec `→` d’au moins `50` pixels.', 'Relâche la touche pour montrer que le héros s’arrête.'],
  { kind: 'play', action: 'walk-stop', distance: 50 },
  'Ton if commande bien le départ et l’arrêt.', 'Regarde la position X. Relâche la flèche après quelques pas.');
const returnTrip = practice('return-trip', 'Aller… et retour !', 5, 'Additionner, puis soustraire',
  'Les deux directions utilisent la même position. Pour revenir, on fait le trajet dans l’autre sens.', 'player.x = player.x - speed;',
  ['Vérifie, puis dépasse la position `X = 120` avec `→`.', 'Reviens près de ton départ avec `←`.'],
  { kind: 'play', action: 'return-trip', turnX: 120 },
  'Tu as utilisé les deux calculs pour revenir au départ.', 'La position de départ est la valeur de startX. Une marge de quelques pixels suffit.');
const jumpCompare = practice('jump-compare', 'Trouve ton saut', 6, 'Comparer deux puissances',
  'Un réglage se teste dans le jeu. Une puissance plus grande donne une impulsion plus forte.', 'const jumpPower = 9;',
  ['Essaie une puissance près de `9`, vérifie et saute.', 'Essaie près de `11`, vérifie et saute à nouveau.'],
  { kind: 'compare', field: 'jumpPower', observe: 'jump', minDifference: 1 },
  'Tu as comparé deux sauts en changeant une seule valeur.', 'Chaque essai compte après un vrai saut avec Espace.');
const firstPlatform = practice('first-platform', 'Pose-toi sur la plateforme', 6, 'Mettre son réglage à l’épreuve',
  'Un saut utile permet d’atteindre un endroit. Combine la direction et Espace pour atterrir sur la première plateforme.', 'const jumpPower = 10;',
  ['Vérifie, puis avance vers la première plateforme.', 'Saute et pose-toi dessus.'],
  { kind: 'play', action: 'platform', target: 1 },
  'Premier atterrissage réussi avec ton réglage !', 'Saute avant le bord de la plateforme et avance pendant le saut.');
const gravityCompare = practice('gravity-compare', 'Un saut sur la Lune', 7, 'Changer une seule chose',
  'Garde la même puissance pour comparer les gravités. Sinon, tu ne saurais pas quel réglage a changé le saut.', 'const gravity = 0.35;',
  ['Essaie une gravité près de `0.35`, vérifie et saute.', 'Essaie près de `0.6`, vérifie et saute à nouveau.'],
  { kind: 'compare', field: 'gravity', observe: 'jump', minDifference: 0.1 },
  'Tu as observé deux chutes avec la même puissance.', 'Ne change pas jumpPower. Teste deux gravités assez différentes.');
const highPlatform = practice('high-platform', 'Atteins le sommet', 7, 'Régler pour réussir un trajet',
  'Tes réglages doivent permettre de jouer. Choisis une puissance et une gravité qui te plaisent, puis teste le trajet.', 'const jumpPower = 10;\nconst gravity = 0.45;',
  ['Vérifie tes réglages et rejoins la première plateforme.', 'Saute ensuite sur la plateforme la plus haute.'],
  { kind: 'play', action: 'platform', target: 2 },
  'Ton héros a atteint le sommet avec tes réglages.', 'Repars de la première plateforme. Avance pendant le deuxième saut.');
const airGuard = practice('air-guard', 'Essaie de tricher avec le saut', 9, 'Tester le cas interdit',
  'Pour tester une règle, essaie aussi ce qu’elle doit empêcher. Ton héros ne doit pas repartir vers le haut en plein saut.', 'return player.onGround;',
  ['Vérifie et fais un saut avec `Espace`.', 'Pendant le saut, appuie encore sur `Espace`.'],
  { kind: 'play', action: 'air-guard' },
  'Tu as testé que le saut en l’air est bien refusé.', 'Appuie une première fois, relâche, puis appuie une deuxième fois avant de retoucher le sol.');
const fruitCompare = practice('fruit-compare', 'Rends les fruits précieux', 11, 'Le score dépend d’un réglage',
  'Ton addition utilise fruitPoints. Changer cette donnée doit changer le gain sans perdre les anciens points.', 'const fruitPoints = 2;',
  ['Choisis une valeur de `fruitPoints`, vérifie et ramasse un fruit.', 'Change la valeur, vérifie et ramasse encore un fruit.'],
  { kind: 'compare', field: 'fruitPoints', observe: 'collect', minDifference: 1 },
  'Tu as testé deux valeurs de fruit dans le vrai compteur.', 'Le fruit au sol, près du départ, est facile à ramasser à chaque essai.');
const fruitDuo = practice('fruit-duo', 'Ramasse un duo', 11, 'Vérifier que le score s’additionne',
  'Deux fruits doivent rapporter deux fois leur valeur. Observe le compteur pendant ta récolte.', 'return score + points;',
  ['Vérifie, puis ramasse le fruit près du départ.', 'Ramasse un deuxième fruit et observe le nouveau score.'],
  { kind: 'play', action: 'collect', count: 2 },
  'Ton compteur a gardé les points des deux fruits.', 'Les fruits suivants sont sur les plateformes. Utilise les flèches et Espace.');
const fruitTrio = practice('fruit-trio', 'Trois fruits, six points', 11, 'Prévoir, puis vérifier un calcul',
  'Avec deux points par fruit, trois fruits doivent donner six points. Fais correspondre ton réglage à cette règle.', 'const fruitPoints = 1;',
  ['Passe `fruitPoints` à `2` et vérifie.', 'Ramasse au moins trois fruits pour atteindre `6` points.'],
  { kind: 'play', action: 'collect', count: 3, field: 'fruitPoints', value: 2 },
  'Ta prévision et le compteur donnent bien six points pour trois fruits.', 'Modifie la ligne fruitPoints existante. Le calcul addPoints reste le même.');
const firstVictory = practice('first-victory', 'Teste ton trophée', 13, 'Jouer jusqu’au résultat attendu',
  'Une règle de victoire se teste jusqu’au bout. Ramasse assez de points, puis rejoins le trophée.', 'return score >= target;',
  ['Vérifie ton code et atteins ton objectif de points.', 'Rejoins le trophée à droite du niveau.'],
  { kind: 'play', action: 'win' },
  'Ton objectif et ta comparaison permettent de finir le niveau.', 'Le compteur et l’objectif sont affichés dans le jeu.');
const fireTiming = practice('fire-timing', 'Traverse au bon moment', 14, 'Observer vrai et faux dans le jeu',
  'Le feu alterne entre allumé et éteint. Ta règle suit son état : attends le moment où le passage est sûr.', 'return trap.active;',
  ['Vérifie et rejoins le passage avec le feu.', 'Traverse au sol quand le feu est éteint, sans te brûler.'],
  { kind: 'play', action: 'fire-crossing' },
  'Tu as traversé quand la règle indiquait « sans danger ».', 'Attends à gauche du feu. S’il te touche, utilise Rejouer pour refaire cet essai.');
const checkpointTest = practice('checkpoint-test', 'Éprouve ton drapeau', 15, 'Vérifier un nouveau point de départ',
  'Le drapeau sert quand tu rencontres un danger. Pour tester sa règle, il faut l’activer puis revenir après une brûlure.', 'return playerX >= flagX;',
  ['Vérifie et dépasse le drapeau pour l’activer.', 'Laisse le feu te toucher : observe où le héros revient.'],
  { kind: 'play', action: 'checkpoint' },
  'Le héros est bien revenu au drapeau après la brûlure.', 'Le drapeau est après la première plateforme. Le feu est plus à droite.');
const gapCompare = practice('gap-compare', 'Dessine deux chemins', 16, 'Comparer deux dispositions',
  'Une seule donnée peut changer plusieurs objets. Observe la rangée, puis change seulement son écart.', 'const fruitGap = 16;',
  ['Vérifie avec un écart près de `16`.', 'Change la même ligne vers `24` et compare la rangée.'],
  { kind: 'compare', field: 'fruitGap', observe: 'instant', minDifference: 4 },
  'Tu as créé deux chemins avec un seul réglage.', 'Regarde la rangée de fruits sur la première plateforme.');
const bonusTest = practice('bonus-test', 'Encaisse ta prime', 17, 'Retrouver un calcul à l’arrivée',
  'Ton bonus donne deux points par fruit. Termine une partie pour retrouver ce calcul dans ta récompense.', 'return count * 2;',
  ['Vérifie et ramasse au moins trois fruits.', 'Gagne une partie et retrouve la prime à l’arrivée.'],
  { kind: 'play', action: 'bonus-win', count: 3 },
  'Ta prime correspond bien au double des fruits ramassés.', 'Les points des fruits et la prime sont présentés à l’arrivée.');
const finalTuning = practice('final-tuning', 'Crée ta version du jeu', 18, 'Choisir ses réglages et les tester',
  'Tu connais maintenant les réglages. Fais une première partie d’essai, puis change deux réglages pour créer ta propre sensation de jeu.', 'const speed = 4;\nconst jumpPower = 10;\nconst gravity = 0.45;',
  ['Vérifie et fais un saut pour garder un premier essai.', 'Change deux réglages parmi `speed`, `jumpPower`, `gravity`, puis vérifie et saute.'],
  { kind: 'compare-settings', fields: ['speed', 'jumpPower', 'gravity'], observe: 'jump', changes: 2, field: 'speed' },
  'Tu as créé et testé ta propre version des déplacements.', 'Modifie deux lignes existantes. Reste dans les valeurs apprises pendant les missions.');

const readQuiz = quiz('quiz-read', 'Lire une ligne', 0, [
  question('Que contient playerName ?', 'const playerName = "Nova";', [
    option('Le texte Nova', 'Les guillemets entourent le texte choisi pour le héros.'),
    option('Le nombre de vies', 'Cette ligne contient un nom entre guillemets, pas un nombre de vies.'),
    option('Une touche du clavier', 'Aucune touche n’est testée ici : on donne un nom au héros.')
  ], 0),
  question('Pour changer le nom du héros, quelle partie modifies-tu ?', 'const playerName = "Nova";', [
    option('Le mot const', 'const sert à créer la donnée. Le nom affiché est le texte entre guillemets.'),
    option('Le texte entre guillemets', 'Le jeu continue de lire playerName, avec le nouveau texte.'),
    option('Le point-virgule', 'Le point-virgule termine la ligne ; il ne choisit pas le nom.')
  ], 1)
]);
const xQuiz = quiz('quiz-x', 'Comprendre la position', 1, [
  question('On passe startX de 30 à 60. Où commence le héros ?', 'const startX = 60;', [
    option('Plus à gauche', 'Sur l’axe X, un nombre plus grand place le héros plus à droite.'),
    option('Plus à droite', '60 est plus grand que 30 : le départ se décale vers la droite.'),
    option('Plus haut', 'startX règle l’horizontale. La hauteur correspond à l’axe Y.')
  ], 1),
  question('Quelle valeur est bien un nombre ?', '', [
    option('"50"', 'Avec les guillemets, "50" est du texte.'),
    option('"cinquante"', 'Un mot entre guillemets est du texte.'),
    option('50', 'Sans guillemets, 50 est un nombre utilisable pour une position.')
  ], 2)
]);
const settingsQuiz = quiz('quiz-settings', 'Un départ ou un pas ?', 2, [
  question('Quelle donnée change la taille d’un pas ?', 'const startX = 40;\nconst speed = 5;', [
    option('speed', 'speed règle le nombre de pixels parcourus à chaque pas.'),
    option('startX', 'startX place le départ ; speed règle le pas.'),
    option('playerName', 'playerName contient le nom du héros, pas sa vitesse.')
  ], 0),
  question('Quelle modification ne change que le départ ?', '', [
    option('Changer speed', 'Changer speed change la taille des pas, pas le départ.'),
    option('Changer startX', 'Le départ suit startX ; la taille des pas peut rester la même.'),
    option('Changer toutes les lignes', 'Changer une seule donnée suffit et permet de comprendre son effet.')
  ], 1)
]);
const moveQuiz = quiz('quiz-move', 'Prévoir le prochain pas', 3, [
  question('Le héros est à X = 50 et speed vaut 4. Quelle est sa prochaine position ?', 'player.x = player.x + speed;', [
    option('4', 'On ajoute le pas à la position actuelle : on ne remplace pas la position par le pas.'),
    option('54', '50 + 4 donne 54. L’ancienne position est conservée dans le calcul.'),
    option('46', '46 correspondrait à enlever 4. Ici, on additionne.')
  ], 1),
  question('Le jeu répète ce calcul deux fois depuis X = 50. Où arrive-t-on ?', 'player.x = player.x + 4;', [
    option('54', '54 est le résultat d’un seul pas. Le deuxième repart de 54.'),
    option('8', 'Deux pas ajoutent 8, mais il faut aussi garder la position initiale de 50.'),
    option('58', 'Premier pas : 54. Deuxième pas : 58.')
  ], 2)
]);
const ifQuiz = quiz('quiz-if', 'Qui donne la commande ?', 4, [
  question('La flèche droite est relâchée. Le calcul dans ce if se fait-il ?', 'if (keys.right) {\n  player.x = player.x + speed;\n}', [
    option('Oui, à chaque image', 'Le if n’exécute son bloc que si keys.right est vrai.'),
    option('Non', 'Sans la flèche droite, la condition est fausse et ce bloc est ignoré.'),
    option('Seulement au début', 'Le if teste la touche à chaque passage ; ce n’est pas une règle réservée au début.')
  ], 1),
  question('Que placent les accolades du if ?', '', [
    option('Le nom du héros', 'Le nom du héros se place dans la donnée playerName.'),
    option('La valeur de speed', 'speed est un réglage. Les accolades délimitent les actions de la condition.'),
    option('Les actions à faire si la condition est vraie', 'Les instructions entre { et } appartiennent à ce if.')
  ], 2)
]);
const leftQuiz = quiz('quiz-left', 'Trouver le bon sens', 5, [
  question('X vaut 80 et speed vaut 4. Où mène ce calcul ?', 'player.x = player.x - speed;', [
    option('76, vers la gauche', '80 - 4 donne 76 : X diminue, le héros va à gauche.'),
    option('84, vers la droite', '84 viendrait d’une addition. Ici, on soustrait.'),
    option('4, au début du niveau', 'Le pas est retiré à la position actuelle ; la position ne devient pas 4.')
  ], 0),
  question('Le héros va à droite, puis à gauche avec le même pas. Quel est le résultat ?', '', [
    option('Il avance deux fois à droite', 'Le deuxième calcul enlève le pas au lieu de l’ajouter.'),
    option('Il revient à sa position précédente', 'Ajouter un pas puis retirer le même pas annule le déplacement.'),
    option('Il monte', 'Ces deux calculs modifient X : ils changent l’horizontale, pas la hauteur.')
  ], 1)
]);
const jumpQuiz = quiz('quiz-jump', 'Prévoir un saut', 7, [
  question('On garde la même gravité. Quel réglage fait monter plus haut ?', '', [
    option('jumpPower = 11 plutôt que 9', 'Une puissance plus grande donne une impulsion plus forte.'),
    option('jumpPower = 9 plutôt que 11', 'Une puissance plus petite donne une impulsion moins forte.'),
    option('Changer playerName', 'Le nom ne change pas la force du saut.')
  ], 0),
  question('On garde la même puissance. Avec quelle gravité retombe-t-on moins vite ?', '', [
    option('0.6', 'Une gravité plus grande attire plus vite vers le sol.'),
    option('0.35', 'Une gravité plus petite ralentit la chute.'),
    option('Les deux donnent toujours le même saut', 'Changer gravity change le saut même quand jumpPower reste identique.')
  ], 1)
]);
const booleanQuiz = quiz('quiz-ground', 'Au sol ou dans les airs ?', 9, [
  question('En plein saut, que vaut player.onGround ?', '', [
    option('true', 'true signifie que le héros touche le sol. En l’air, cette information est fausse.'),
    option('false', 'false indique que le héros ne touche pas le sol.'),
    option('"false"', 'Avec les guillemets, ce serait du texte. L’information attendue est le booléen false.')
  ], 1),
  question('Quelle réponse doit donner canJump quand le héros est en l’air ?', 'return player.onGround;', [
    option('true, pour voler', 'La règle demandée autorise un saut seulement au sol.'),
    option('Le nom du héros', 'La fonction doit donner une réponse oui/non, pas un nom.'),
    option('false, pour refuser le nouveau saut', 'La fonction renvoie l’information du sol : false pendant le saut.')
  ], 2),
  question('Avec jumpPower = 10, que renvoie ce calcul ?', 'return -jumpPower;', [
    option('-10', 'Le signe moins donne la valeur opposée. Une vitesse négative fait monter sur l’écran.'),
    option('10', 'Le signe moins change le signe de la valeur reçue.'),
    option('0', 'Le calcul ne soustrait pas deux valeurs identiques : il donne l’opposé de jumpPower.')
  ], 0)
]);
const scoreQuiz = quiz('quiz-score', 'Garder les points gagnés', 11, [
  question('Tu as 7 points et le fruit en ajoute 2. Quelle réponse faut-il garder ?', 'return score + points;', [
    option('2', '2 oublie les 7 points déjà gagnés.'),
    option('7', '7 oublie le nouveau fruit.'),
    option('9', '7 + 2 donne 9 : on garde les anciens points et les nouveaux.')
  ], 2),
  question('Pourquoi return points est-il un bug pour le compteur ?', '', [
    option('Il remplace le score par la valeur du dernier fruit', 'Les points déjà gagnés disparaissent au lieu d’être additionnés.'),
    option('Il ajoute trop de points', 'Il n’additionne rien : il renvoie seulement les points du fruit.'),
    option('Il change la position du héros', 'La position X n’intervient pas dans cette réponse du compteur.')
  ], 0)
]);
const goalQuiz = quiz('quiz-goal', 'Le score exact compte', 13, [
  question('L’objectif vaut 3. Quel score cette règle accepte-t-elle ?', 'return score >= target;', [
    option('Seulement 3', '>= accepte aussi un score supérieur à l’objectif.'),
    option('3 et tous les scores plus grands', 'Le signe >= accepte l’égalité et les valeurs supérieures.'),
    option('2, 3 et 4', '2 est inférieur à l’objectif de 3 : il doit être refusé.')
  ], 1),
  question('Quelle erreur ferait le signe > à la place de >= ?', '', [
    option('Il refuserait le score exact', '> exige un score strictement plus grand. Le score égal serait oublié.'),
    option('Il accepterait tous les scores', 'Un score plus petit resterait refusé. C’est le cas égal qui change.'),
    option('Il doublerait le score', 'Une comparaison donne vrai ou faux ; elle n’additionne pas les points.')
  ], 0)
]);
const checkpointQuiz = quiz('quiz-checkpoint', 'Le rôle du drapeau', 15, [
  question('Le héros est exactement à la position du drapeau. Cette règle l’active-t-elle ?', 'return playerX >= flagX;', [
    option('Oui', '>= inclut l’égalité : atteindre exactement le drapeau suffit.'),
    option('Non', 'Le signe >= compte aussi le cas où les deux positions sont égales.'),
    option('Seulement si le héros saute', 'Cette règle compare deux positions X ; elle ne teste pas le saut.')
  ], 0),
  question('Après activation, à quoi sert le drapeau quand le feu te touche ?', '', [
    option('Il enlève tous les fruits', 'Le drapeau ne modifie pas la rangée de fruits.'),
    option('Il augmente speed', 'La vitesse reste le réglage speed écrit dans le fichier.'),
    option('Il donne un nouveau point de départ', 'Le héros revient au drapeau au lieu de recommencer tout à gauche.')
  ], 2)
]);
const finalQuiz = quiz('quiz-final', 'Prêt à signer ton jeu ?', 18, [
  question('Tu as assez de points, mais le drapeau est inactif. L’arrivée s’ouvre-t-elle ?', 'return score >= target && flag;', [
    option('Oui, le score suffit', '&& demande que les deux conditions soient vraies.'),
    option('Non, il manque le drapeau', 'Le score et le drapeau sont nécessaires ensemble.'),
    option('Oui, si le nom est assez long', 'Le nom ne fait pas partie de cette condition.')
  ], 1),
  question('Tu as ramassé 5 fruits. Quelle prime renvoie ta fonction ?', 'return count * 2;', [
    option('7', '7 serait le résultat de 5 + 2. Ici, le signe * multiplie.'),
    option('5', 'La réponse doit donner deux points pour chacun des cinq fruits.'),
    option('10', '5 multiplié par 2 donne une prime de 10 points.')
  ], 2),
  question('Pour savoir quel réglage change le saut, quelle méthode utilises-tu ?', '', [
    option('Je change tout le fichier en une fois', 'Avec plusieurs changements, on ne sait plus lequel a produit l’effet.'),
    option('Je change un réglage, puis je vérifie et je joue', 'Un changement à la fois permet de relier une ligne à ce que l’on observe.'),
    option('Je recopie sans regarder le jeu', 'Le résultat dans le jeu sert à comprendre et tester les instructions.')
  ], 1)
]);

const chapters = [
  [code(0), nameSwap, readQuiz, code(1), startCompare, parking, xQuiz],
  [code(2), settingsQuiz, code(3), speedCompare, moveQuiz, code(4), walkStop],
  [ifQuiz, code(5), returnTrip, leftQuiz, code(6), jumpCompare, firstPlatform],
  [code(7), gravityCompare, highPlatform, jumpQuiz, code(8), code(9)],
  [airGuard, booleanQuiz, code(10), code(11), fruitDuo, fruitCompare, scoreQuiz],
  [fruitTrio, code(12), code(13), goalQuiz, firstVictory, code(14)],
  [fireTiming, code(15), checkpointTest, checkpointQuiz, code(16), gapCompare],
  [code(17), bonusTest, code(18), finalTuning, finalQuiz, code(19)]
];
let missionNumber = 0, quizNumber = 0;
export const COURSE = chapters.flatMap((steps, phase) => steps.map(step => ({ ...step, phase })))
  .map((step, index) => ({ ...step, index, number: step.kind === 'quiz' ? ++quizNumber : ++missionNumber }));
export const MISSION_COUNT = missionNumber;
export const QUIZ_COUNT = quizNumber;
export const CODE_STEP_INDEX = MISSIONS.map((_, moduleIndex) => COURSE.findIndex(step => step.kind === 'code' && step.moduleIndex === moduleIndex));
export const codeModulesThrough = completed => COURSE.flatMap(step => step.kind === 'code' && completed.includes(step.index) ? [step.moduleIndex] : []);
