import type { Concept, Position, Transition } from './types';

/**
 * Starter content: a small, beginner-level set of ideas. Kept deliberately short —
 * the goal is to give a new student a map, not an encyclopedia.
 */

type Stamped<T> = Omit<T, 'createdAt' | 'updatedAt' | 'notes'>;

const concepts: Stamped<Concept>[] = [
  {
    id: 'safety',
    name: 'Tap early, tap often',
    summary: 'Tapping is how you stay healthy enough to keep training. It is part of learning, not losing.',
    keyPoints: [
      'Tap with your hand on your partner or the mat, or say "tap" out loud.',
      'Tap as soon as a choke or joint lock is on — do not wait for pain.',
      'When your partner taps, let go right away.',
      'Go slowly with new techniques, especially joint locks.',
    ],
    drill: 'With a partner, practise applying a slow armbar and letting go the moment they tap. Then swap.',
    order: 1,
  },
  {
    id: 'posture',
    name: 'Posture',
    summary: 'Keep your spine straight and your head up so you are hard to pull down and attack.',
    keyPoints: [
      'Head up, back straight, hips under your shoulders.',
      'When someone pulls your head down, they control you.',
      "In someone's guard, sit back on your heels and hold their hips or belt.",
    ],
    drill: "Kneel in your partner's closed guard. They pull your head and collar; you keep recovering upright posture.",
    order: 2,
  },
  {
    id: 'base',
    name: 'Base',
    summary: 'Being hard to knock over: a wide, low, balanced stance with your weight spread out.',
    keyPoints: [
      'Widen your knees or feet when you feel yourself being tipped.',
      'Keep your hips low and your weight centred over your support.',
      'Post a hand or foot on the side you are being pushed toward.',
    ],
    drill: 'On your knees, have a partner push and pull you in different directions. Stay up by widening and posting.',
    order: 3,
  },
  {
    id: 'frames',
    name: 'Frames',
    summary: 'Using your bones — forearms, shins, straight arms — to hold space instead of pushing with muscle.',
    keyPoints: [
      'A frame blocks; it does not push. Pushing straightens your arm and gets it attacked.',
      'Forearm across the neck or collarbone, other hand on the hip or bicep.',
      'Frames hold distance while your hips move to make real space.',
    ],
    drill:
      "From bottom side control, build a forearm frame on your partner's neck and a hand on their hip, then hold it while they apply light pressure.",
    order: 4,
  },
  {
    id: 'hip-escape',
    name: 'Hip escape (shrimp)',
    summary: 'Moving your hips away from your opponent while lying on your side. The core movement of escapes.',
    keyPoints: [
      'Turn onto your side and push off one foot.',
      'Drive your hips back, away from your partner, not your shoulders.',
      'Combine it with frames: frames hold the space, the shrimp makes it bigger.',
    ],
    drill: 'Shrimp up and down the mat, alternating sides, keeping your elbows tight.',
    order: 5,
  },
  {
    id: 'bridge',
    name: 'Bridge (upa)',
    summary:
      'Lifting your hips explosively off the mat, driving up and over a shoulder, to off-balance someone on top.',
    keyPoints: [
      'Feet flat on the mat, close to your butt.',
      'Drive your hips up and over one shoulder, not straight up.',
      'A bridge creates the moment of space; shrimp or roll to use it.',
    ],
    drill: 'Solo: lie on your back and bridge over each shoulder 10 times, looking toward the mat.',
    order: 6,
  },
  {
    id: 'elbows-in',
    name: 'Elbows in, knees in',
    summary: 'Keep your elbows close to your ribs and your knees close to your elbows when you are on the bottom.',
    keyPoints: [
      'Arms extended away from your body are easy to attack (armbars, americanas).',
      'Gaps between elbow and knee let your opponent pass or mount.',
      'Tight elbows also protect against underhooks and back takes.',
    ],
    drill:
      'From your back, have a partner try to walk around your legs. Keep turning to face them with elbows and knees connected.',
    order: 7,
  },
  {
    id: 'underhooks',
    name: 'Underhooks',
    summary: "Getting your arm under your opponent's armpit. The underhook side usually wins the scramble.",
    keyPoints: [
      'Arm under their armpit, hand on their back or shoulder blade.',
      'An underhook lets you lift, turn, and come up on top.',
      'Deny their underhook by keeping your elbow tight to your side.',
    ],
    drill: 'Standing chest to chest, both partners fight for double underhooks at light pace (pummeling).',
    order: 8,
  },
  {
    id: 'grips',
    name: 'Grips',
    summary: 'Where you hold controls what your opponent can do. Good grips first, then technique.',
    keyPoints: [
      'Control the sleeve to control the arm; control the collar to control the head.',
      'Break bad grips before you try to attack or pass.',
      'Grip with intention, then let go of grips you no longer need to save your hands.',
    ],
    drill:
      'Standing grip fighting: try to get a collar and sleeve grip while your partner breaks them, for one-minute rounds.',
    order: 9,
  },
  {
    id: 'pressure',
    name: 'Pressure',
    summary: 'Making your bodyweight heavy on your opponent by connecting chest to chest and keeping your hips low.',
    keyPoints: [
      'Put weight through your chest or shoulder, not your hands.',
      'Keep your hips low and your toes on the mat to drive forward.',
      'Pressure makes them carry you, which tires them and limits escapes.',
    ],
    drill:
      'Hold side control for 30 seconds while your partner tries to make space. Focus on staying heavy rather than squeezing.',
    order: 10,
  },
];

const positions: Stamped<Position>[] = [
  {
    id: 'standing',
    name: 'Standing',
    category: 'standing',
    summary: 'Every match starts here. Both people are on their feet trying to take the other down or pull guard.',
    topGoals: ['Get grips first', 'Take them down and land on top', 'Keep a strong stance and base'],
    bottomGoals: ['Break their grips', 'Keep your hips back to defend takedowns', 'Pull guard on your terms'],
    conceptIds: ['base', 'grips', 'posture'],
    order: 1,
  },
  {
    id: 'closed-guard',
    name: 'Closed Guard',
    category: 'guard',
    summary: "The bottom person has their legs wrapped around the top person's waist with ankles crossed.",
    topGoals: ['Keep good posture', 'Control their hips', 'Open the guard and pass'],
    bottomGoals: ['Break their posture by pulling them down', 'Sweep them', 'Attack with submissions'],
    conceptIds: ['posture', 'grips', 'elbows-in'],
    order: 2,
  },
  {
    id: 'open-guard',
    name: 'Open Guard',
    category: 'guard',
    summary: 'The bottom person uses feet, shins, and grips to keep the top person away without locking their legs.',
    topGoals: ['Control or move their legs', 'Get past their feet and knees', 'Settle into side control'],
    bottomGoals: [
      'Keep feet and knees between you and them',
      'Hold grips to control distance',
      'Re-guard when they get close',
    ],
    conceptIds: ['frames', 'hip-escape', 'grips'],
    order: 3,
  },
  {
    id: 'half-guard',
    name: 'Half Guard',
    category: 'guard',
    summary: "The bottom person traps one of the top person's legs between their own legs.",
    topGoals: ['Flatten them and stop the underhook', 'Free your trapped leg', 'Pass to side control or mount'],
    bottomGoals: ['Stay on your side, not flat on your back', 'Get the underhook', 'Sweep or recover full guard'],
    conceptIds: ['underhooks', 'frames', 'pressure'],
    order: 4,
  },
  {
    id: 'side-control',
    name: 'Side Control',
    category: 'top',
    summary: 'The top person has passed the legs and is lying chest to chest across the bottom person.',
    topGoals: ['Stay heavy and chest to chest', 'Block their hips from turning in', 'Move to mount or attack'],
    bottomGoals: ['Build frames before they settle', 'Shrimp to make space', 'Recover guard'],
    conceptIds: ['pressure', 'frames', 'hip-escape'],
    order: 5,
  },
  {
    id: 'mount',
    name: 'Mount',
    category: 'top',
    summary: "The top person sits on the bottom person's torso with a knee on each side.",
    topGoals: ['Stay balanced with a wide base', 'Keep your knees tight to their hips', 'Attack the arms and neck'],
    bottomGoals: ['Protect your neck and keep elbows in', 'Bridge to off-balance them', 'Escape to guard'],
    conceptIds: ['base', 'bridge', 'elbows-in'],
    order: 6,
  },
  {
    id: 'back-control',
    name: 'Back Control',
    category: 'back',
    summary:
      'The attacker is behind the defender, usually with a seatbelt grip and both feet hooked inside the thighs.',
    topGoals: ['Keep the seatbelt grip', 'Keep your hooks in', 'Finish with a choke'],
    bottomGoals: ['Protect your neck with both hands', 'Get your back to the mat', 'Turn to face them'],
    conceptIds: ['grips', 'elbows-in'],
    order: 7,
  },
  {
    id: 'turtle',
    name: 'Turtle',
    category: 'scramble',
    summary: 'The defender is on knees and elbows, curled up, often after avoiding a guard pass.',
    topGoals: ['Stay on top and heavy', 'Get a seatbelt grip', 'Insert hooks to take the back'],
    bottomGoals: ['Keep elbows tight to knees', 'Do not let them get hooks in', 'Recover guard or come up to stand'],
    conceptIds: ['elbows-in', 'base'],
    order: 8,
  },
];

const transitions: Stamped<Transition>[] = [
  // Standing
  {
    id: 'pull-guard',
    name: 'Pull closed guard',
    type: 'transition',
    fromId: 'standing',
    toId: 'closed-guard',
    steps: [
      'Get a collar and sleeve grip',
      'Step in close',
      'Sit down near your own heel',
      'Wrap your legs around their waist and cross your ankles',
    ],
    commonMistakes: ['Jumping or falling without grips', 'Sitting down too far away to close your legs'],
  },
  {
    id: 'double-leg',
    name: 'Double-leg takedown',
    type: 'takedown',
    fromId: 'standing',
    toId: 'side-control',
    steps: [
      'Lower your level by bending your knees',
      'Step deep between their feet',
      'Put your head on the side of their body and hug behind both knees',
      'Drive forward and turn the corner to land on top',
    ],
    commonMistakes: [
      'Bending at the waist instead of the knees',
      'Shooting from too far away',
      'Head in front of their chest',
    ],
  },
  // Closed guard
  {
    id: 'break-closed-guard',
    name: 'Open the closed guard',
    type: 'transition',
    fromId: 'closed-guard',
    toId: 'open-guard',
    steps: [
      'Build posture: sit back, head up',
      'Pin their hips with both hands',
      'Bring one knee to the middle under their tailbone',
      'Step the other leg back to stretch their legs until the ankles open',
    ],
    commonMistakes: ['Leaning forward so they break your posture', 'Leaving an arm on the mat between their legs'],
  },
  {
    id: 'scissor-sweep',
    name: 'Scissor sweep',
    type: 'sweep',
    fromId: 'closed-guard',
    toId: 'mount',
    steps: [
      'Grip their collar and same-side sleeve',
      'Open your guard and shrimp to one side',
      'Put your top shin across their belly, bottom leg on the mat behind their knee',
      'Pull them forward onto your shin',
      'Scissor: kick the bottom leg and sweep with the top leg',
      'Follow them over into mount',
    ],
    commonMistakes: ['Staying flat instead of getting on your side', 'Not pulling them forward first'],
  },
  {
    id: 'hip-bump-sweep',
    name: 'Hip bump sweep',
    type: 'sweep',
    fromId: 'closed-guard',
    toId: 'mount',
    steps: [
      'When they posture up, sit up onto one hand',
      'Reach over their shoulder and trap their arm on that side',
      'Open your legs and drive your hips up into them',
      'Roll them over the trapped arm side and come up in mount',
    ],
    commonMistakes: ['Not trapping the arm, so they post and stop the sweep', 'Sitting up without lifting the hips'],
  },
  {
    id: 'armbar-guard',
    name: 'Armbar from closed guard',
    type: 'submission',
    fromId: 'closed-guard',
    toId: '',
    steps: [
      'Control one of their arms at the wrist and elbow',
      'Put your foot on their hip on the same side and turn your body to an angle',
      'Swing your other leg over their head',
      'Squeeze your knees, keep their thumb pointing up, and lift your hips slowly',
    ],
    commonMistakes: [
      'Not turning to an angle',
      'Letting your knees open so they pull the arm out',
      'Applying it fast — go slowly in training',
    ],
  },
  // Open guard
  {
    id: 'toreando-pass',
    name: 'Toreando (bullfighter) pass',
    type: 'pass',
    fromId: 'open-guard',
    toId: 'side-control',
    steps: [
      'Stand up and grip their pants at both knees',
      'Push their legs to one side and pin them to the mat',
      'Step around the opposite way, staying low',
      'Drop your chest onto theirs in side control',
    ],
    commonMistakes: ['Staying too upright after the pass', 'Letting go of the legs before you are chest to chest'],
  },
  // Half guard
  {
    id: 'knee-slice',
    name: 'Knee slice pass',
    type: 'pass',
    fromId: 'half-guard',
    toId: 'side-control',
    steps: [
      'Get a crossface or underhook so they are flat',
      'Slide your trapped knee across their thigh toward the mat',
      'Keep your weight on them while you slice through',
      'Free your foot and settle in side control',
    ],
    commonMistakes: ['Letting them get the underhook', 'Sitting back so your weight comes off them'],
  },
  {
    id: 'half-to-full-guard',
    name: 'Recover full guard from half guard',
    type: 'transition',
    fromId: 'half-guard',
    toId: 'closed-guard',
    steps: [
      'Frame against their hip or shoulder',
      'Shrimp your hips away',
      'Bring your free knee inside, between you and them',
      'Free your trapped leg and lock your ankles around their waist',
    ],
    commonMistakes: ['Staying flat, which lets them crossface you'],
  },
  // Side control
  {
    id: 'side-control-escape',
    name: 'Side control escape to guard',
    type: 'escape',
    fromId: 'side-control',
    toId: 'open-guard',
    steps: [
      'Frame: forearm on their neck, other hand on their hip',
      'Bridge slightly to make them react',
      'Shrimp your hips away',
      'Slide your bottom knee into the gap and recover guard',
    ],
    commonMistakes: ['Pushing with straight arms', 'Turning away from them, giving your back'],
  },
  {
    id: 'side-to-mount',
    name: 'Side control to mount',
    type: 'transition',
    fromId: 'side-control',
    toId: 'mount',
    steps: [
      'Keep chest pressure and control their far side',
      'Block their near hip with your hand',
      'Slide your knee across their belly',
      'Put your foot on the far side and settle into mount',
    ],
    commonMistakes: ['Lifting your chest off them while switching', 'Getting your leg caught in half guard'],
  },
  {
    id: 'americana',
    name: 'Americana from side control',
    type: 'submission',
    fromId: 'side-control',
    toId: '',
    steps: [
      'Pin their far wrist to the mat, elbow bent at 90°',
      'Thread your other arm under their arm and grab your own wrist',
      'Keep their wrist on the mat',
      'Slowly slide their wrist toward their hip and lift the elbow',
    ],
    commonMistakes: ['Letting the wrist come off the mat', 'Cranking quickly — apply slowly'],
  },
  // Mount
  {
    id: 'upa-escape',
    name: 'Bridge and roll (upa) escape',
    type: 'escape',
    fromId: 'mount',
    toId: 'closed-guard',
    steps: [
      'Trap one of their arms against your chest',
      'Trap the foot on the same side with your foot',
      'Bridge high over the trapped side shoulder',
      'Roll them over and land in their guard',
    ],
    commonMistakes: ['Bridging straight up instead of over the shoulder', 'Not trapping both the arm and the foot'],
  },
  {
    id: 'elbow-knee-escape',
    name: 'Elbow-knee (shrimp) escape',
    type: 'escape',
    fromId: 'mount',
    toId: 'half-guard',
    steps: [
      'Frame with your elbows on their hips',
      'Turn on your side and shrimp away',
      'Slide your knee and elbow together to make a gap',
      'Pull your leg out to half guard, then shrimp the other way for full guard',
    ],
    commonMistakes: [
      'Pushing on their chest with straight arms',
      'Doing it while they are still heavy and balanced — bridge first',
    ],
  },
  {
    id: 'cross-collar-choke',
    name: 'Cross collar choke from mount',
    type: 'submission',
    fromId: 'mount',
    toId: '',
    steps: [
      'Feed one hand deep into their collar, fingers inside',
      'Put your second hand in the other side of the collar, palm up or palm down',
      'Bring your chest down toward theirs',
      'Pull your elbows out to the sides to close the choke',
    ],
    commonMistakes: ['First grip too shallow', 'Staying upright so the choke has no tension'],
  },
  {
    id: 'mount-to-back',
    name: 'Take the back from mount',
    type: 'transition',
    fromId: 'mount',
    toId: 'back-control',
    steps: [
      'When they turn to their side to escape, follow them',
      'Get a seatbelt grip: one arm over the shoulder, one under the arm',
      'Slide your hooks in front of their hips',
      'Fall to your side and keep the seatbelt',
    ],
    commonMistakes: ['Crossing your feet when putting hooks in (ankle lock risk)', 'Letting go of the upper body'],
  },
  // Back
  {
    id: 'rear-naked-choke',
    name: 'Rear naked choke',
    type: 'submission',
    fromId: 'back-control',
    toId: '',
    steps: [
      'From the seatbelt, slide your choking arm under their chin',
      'Put that hand on your other bicep',
      'Put your other hand behind their head',
      'Squeeze your elbows together and expand your chest',
    ],
    commonMistakes: ['Squeezing the jaw instead of getting under the chin', 'Losing hooks while focusing on the choke'],
  },
  {
    id: 'back-escape',
    name: 'Back escape',
    type: 'escape',
    fromId: 'back-control',
    toId: 'closed-guard',
    steps: [
      'Protect your neck with both hands',
      'Slide down so your back is on the mat, on the side of their bottom arm',
      'Clear the hook on that side with your hand or foot',
      'Turn into them and come up on top in their guard',
    ],
    commonMistakes: ['Turning toward the wrong side', 'Dropping your hands from your neck too early'],
  },
  // Turtle
  {
    id: 'turtle-to-back',
    name: 'Take the back from turtle',
    type: 'transition',
    fromId: 'turtle',
    toId: 'back-control',
    steps: [
      'Stay chest-on-back with weight on them',
      'Get a seatbelt grip',
      'Put the first hook in on the side your top arm crosses',
      'Roll or pull them back and insert the second hook',
    ],
    commonMistakes: ['Putting hooks in before you have upper body control', 'Sitting too far back so they roll out'],
  },
  {
    id: 'turtle-recover-guard',
    name: 'Recover guard from turtle',
    type: 'escape',
    fromId: 'turtle',
    toId: 'open-guard',
    steps: [
      'Keep elbows tight to knees',
      'Post on one hand and sit through, or roll to your shoulder',
      'Face your opponent',
      'Bring your feet and knees back between you and them',
    ],
    commonMistakes: ['Reaching out with an arm, which gets it trapped'],
  },
];

export function seedConcepts(now: number): Concept[] {
  return concepts.map((c) => ({ ...c, notes: '', createdAt: now, updatedAt: now }));
}

export function seedPositions(now: number): Position[] {
  return positions.map((p) => ({ ...p, notes: '', createdAt: now, updatedAt: now }));
}

export function seedTransitions(now: number): Transition[] {
  return transitions.map((t) => ({ ...t, notes: '', createdAt: now, updatedAt: now }));
}
