# Code Quest

A beginner coding workshop with 40 missions and 12 intermediate quizzes across eight chapters: 52 steps in total. Twenty missions build the code; twenty apply it through experiments, settings challenges, and real gameplay checks. Student instructions are in French; code identifiers are in English.

Run `npm start` in this folder, then open <http://127.0.0.1:4173>. On Windows, `start-workshop.cmd` starts the same local server. Node.js is required. No package installation or internet connection is needed.

Edit a mission and select **Vérifier** below the editor, or press Ctrl+Enter, to check the code. Passing the behavior tests starts the game immediately with keyboard focus; failed checks keep it locked. Editing code or changing missions locks it again. The final mission is completed by winning a game after successful verification. The game only captures keys when its canvas has focus.

Practice missions require observable results. Comparisons record two different verified settings after the corresponding action, such as moving, jumping, or collecting fruit. Gameplay challenges check actual landings, stopping, the return trip, refused air jumps, the score, crossing the fire, and returning to a checkpoint. Replaying a pending challenge starts a fresh attempt. Just clicking **Vérifier** does not complete these missions.

Quizzes appear between the missions and show one question at a time beside the student's visible, read-only code. Students choose an answer and use **Vérifier** to see an explanation. Incorrect answers can be retried. All questions must be understood before the step completes; the game resumes only after the answers and code are validated. Answers, attempts, and completed experiments are included in the local backup. The final screen reports the completed assessments.

Drag the divider between the editor and the game to adjust their widths. The divider also supports the arrow keys and remembers the preferred layout.

A new workshop first shows the finished game for students to explore. **Commencer mon jeu** then opens an empty `game.js`. Students keep their previous lines and add each new rule to this same file. Lines added or changed during the current mission are marked in green; the previous code stays visible and editable. Important names, values, and operators are also highlighted in the instructions.

Each mission has two short views: **1. Comprendre** introduces one idea with an example; **2. À toi** gives two concrete steps and a link to the line to edit. Students first name and place a hero, set the step size, calculate movement, and then add keyboard conditions. The same `updateX` function grows in place. A live X position and an early X ruler connect the calculation to the movement.

The core course covers values, simple functions, arithmetic, conditions, and yes/no information. Functions that need a frame are provided with one small part to complete or repair. Students choose names and settings, compare outcomes, fix a counter, and try short game challenges after verification. Arrays and loops are kept out of this beginner course. Optional hints provide more help in stages; behavioral checks accept different working expressions. Feedback shows the first adjustment to make, with detailed checks available on demand.

Verification evaluates the entire file together and checks earlier rules as well as the current mission. Navigating between missions keeps the code in place. The editor's restart icon restores the last successfully verified version after confirmation, and exporting JavaScript downloads the exact `game.js` shown in the editor. Older workshop backups preserve their source and map their progress to the new sequence.

The game grows with the student's verified code: the character, movement, jumping and platforms, fruit and scoring, the goal, fire, a checkpoint, a fruit line, and a bonus appear progressively. The initial finished-game preview is separate from the student's project and does not fill in any code or complete missions. Returning students resume their saved project directly.

Progress is saved in this browser on this computer. **Exporter** downloads a backup; **Importer** restores one. The restart icon resets the workshop after confirmation.

The original image folders are used directly. Pixel Adventure graphics are by Pixel Frog, released under CC0: <https://pixelfrog-assets.itch.io/pixel-adventure-1>.
