-- =============================================================================
-- EXERCISE SEED DATA — GYM-AI
-- =============================================================================
-- Covers all categories: gym machines, barbell, dumbbell, cable, kettlebell,
-- bodyweight, calisthenics, band, smith machine, EZ-bar.
-- All muscle groups are represented. Names are professional English.
-- Spanish translations provided for every exercise.
-- Embeddings are left NULL — run GET /api/setup-ai after inserting to generate them.
--
-- Equipment enum values:
--   bodyweight | dumbbell | barbell | kettlebell | cable |
--   machine    | band     | smith_machine | ez_bar
--
-- Muscle group enum values:
--   chest | lats | traps | shoulders | triceps | biceps | forearms |
--   obliques | abs | lower_back | glutes | quads | hamstrings | calves | cardio_system
--
-- Difficulty enum values : beginner | intermediate | advanced
-- Force enum values      : push | pull | static | hinge
-- Mechanic enum values   : compound | isolation
-- =============================================================================

-- Clear existing exercises to avoid duplicates on re-run
-- (comment this out if you want to keep existing data)
-- TRUNCATE TABLE exercises RESTART IDENTITY CASCADE;

INSERT INTO exercises
  (name, name_es, description, description_es, difficulty, equipment, force, mechanic, primary_muscle, secondary_muscles)
VALUES

-- =============================================================================
-- CHEST
-- =============================================================================

(
  'Barbell Bench Press',
  'Press de Banca con Barra',
  'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower it to the mid-chest, and press back up to full elbow extension.',
  'Recuéstate en un banco plano, agarra la barra un poco más ancha que los hombros, bájala al pecho medio y empuja de vuelta a extensión completa.',
  'intermediate', 'barbell', 'push', 'compound', 'chest',
  ARRAY['triceps','shoulders']::muscle_group[]
),
(
  'Incline Barbell Bench Press',
  'Press de Banca Inclinado con Barra',
  'Set the bench to 30-45 degrees, grip the bar shoulder-width apart, lower to the upper chest, and press upward.',
  'Ajusta el banco a 30-45 grados, agarra la barra al ancho de los hombros, baja al pecho superior y empuja hacia arriba.',
  'intermediate', 'barbell', 'push', 'compound', 'chest',
  ARRAY['shoulders','triceps']::muscle_group[]
),
(
  'Decline Barbell Bench Press',
  'Press de Banca Declinado con Barra',
  'Set the bench to a decline angle, lower the bar to the lower chest, and press explosively back to lockout.',
  'Ajusta el banco en declive, baja la barra al pecho inferior y empuja explosivamente hasta bloqueo.',
  'intermediate', 'barbell', 'push', 'compound', 'chest',
  ARRAY['triceps']::muscle_group[]
),
(
  'Dumbbell Bench Press',
  'Press de Banca con Mancuernas',
  'Hold a dumbbell in each hand at chest level, press both upward simultaneously until elbows are fully extended, then lower under control.',
  'Sostén una mancuerna en cada mano a nivel del pecho, empuja ambas simultáneamente hasta extensión completa, luego baja con control.',
  'beginner', 'dumbbell', 'push', 'compound', 'chest',
  ARRAY['triceps','shoulders']::muscle_group[]
),
(
  'Incline Dumbbell Press',
  'Press Inclinado con Mancuernas',
  'On a 30-45 degree incline bench, press the dumbbells from shoulder height to full lockout, targeting the upper chest.',
  'En un banco inclinado a 30-45 grados, empuja las mancuernas desde la altura de los hombros hasta bloqueo completo, enfocando el pecho superior.',
  'beginner', 'dumbbell', 'push', 'compound', 'chest',
  ARRAY['shoulders','triceps']::muscle_group[]
),
(
  'Dumbbell Flye',
  'Apertura con Mancuernas',
  'Lie on a flat bench, hold dumbbells above the chest with a slight elbow bend, open the arms wide in an arc, and squeeze back together.',
  'Recuéstate en un banco plano, sostén las mancuernas sobre el pecho con leve flexión de codo, abre los brazos en arco y cierra apretando.',
  'beginner', 'dumbbell', 'push', 'isolation', 'chest',
  ARRAY[]::muscle_group[]
),
(
  'Cable Crossover',
  'Cruce de Cables',
  'Stand between two cable stations, pull the handles from high or mid height in a crossing arc motion, squeezing the pecs at peak contraction.',
  'Párate entre dos estaciones de cable, jala los agarres desde altura alta o media en movimiento cruzado, apretando los pectorales en la contracción máxima.',
  'intermediate', 'cable', 'push', 'isolation', 'chest',
  ARRAY[]::muscle_group[]
),
(
  'Pec Deck',
  'Pec Deck',
  'Sit at the pec deck machine, place forearms on the pads, and bring them together in front of the chest in a squeezing arc motion.',
  'Siéntate en la máquina pec deck, coloca los antebrazos en las almohadillas y júntalos frente al pecho en movimiento de arco apretando.',
  'beginner', 'machine', 'push', 'isolation', 'chest',
  ARRAY[]::muscle_group[]
),
(
  'Push-Up',
  'Flexión de Brazos',
  'Start in a plank position with hands shoulder-width apart, lower your chest to the floor, then push back up maintaining a straight body line.',
  'Empieza en posición de plancha con manos al ancho de los hombros, baja el pecho al piso y empuja de vuelta manteniendo el cuerpo recto.',
  'beginner', 'bodyweight', 'push', 'compound', 'chest',
  ARRAY['triceps','shoulders']::muscle_group[]
),
(
  'Wide-Grip Push-Up',
  'Flexión con Agarre Ancho',
  'Perform a push-up with hands placed wider than shoulder-width to emphasize the outer chest fibers.',
  'Realiza una flexión con las manos más anchas que los hombros para enfatizar las fibras externas del pectoral.',
  'beginner', 'bodyweight', 'push', 'compound', 'chest',
  ARRAY['shoulders']::muscle_group[]
),
(
  'Diamond Push-Up',
  'Flexión en Diamante',
  'Place hands close together under the sternum forming a diamond shape, and perform a push-up to maximize tricep and inner-chest activation.',
  'Coloca las manos juntas bajo el esternón formando un diamante y realiza una flexión para maximizar la activación de tríceps y pecho interno.',
  'intermediate', 'bodyweight', 'push', 'compound', 'chest',
  ARRAY['triceps']::muscle_group[]
),
(
  'Chest Dip',
  'Fondos para Pecho',
  'Lean forward 30-45 degrees on the dip bars and lower until the elbows reach 90 degrees, emphasizing the lower chest.',
  'Inclínate hacia adelante 30-45 grados en las barras de fondos y baja hasta que los codos lleguen a 90 grados, enfatizando el pecho inferior.',
  'intermediate', 'bodyweight', 'push', 'compound', 'chest',
  ARRAY['triceps','shoulders']::muscle_group[]
),

-- =============================================================================
-- BACK — LATS
-- =============================================================================

(
  'Pull-Up',
  'Dominada',
  'Hang from a bar with an overhand grip wider than shoulders, pull your chin over the bar by driving the elbows down, then lower under control.',
  'Cuélgate de una barra con agarre prono más ancho que los hombros, sube el mentón sobre la barra llevando los codos hacia abajo, luego baja con control.',
  'intermediate', 'bodyweight', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'Chin-Up',
  'Jalón con Agarre Supino',
  'Hang from a bar with an underhand shoulder-width grip and pull until the chin clears the bar, maximizing bicep and lat recruitment.',
  'Cuélgate de una barra con agarre supino al ancho de hombros y sube hasta que el mentón supere la barra, maximizando el reclutamiento de bíceps y dorsal.',
  'intermediate', 'bodyweight', 'pull', 'compound', 'lats',
  ARRAY['biceps']::muscle_group[]
),
(
  'Lat Pulldown',
  'Jalón al Pecho',
  'Sit at the cable pulldown station, grip the bar wide, and pull it down to the upper chest by retracting the shoulder blades.',
  'Siéntate en la estación de jalón, agarra la barra ancha y jálala hasta el pecho superior retrayendo los omóplatos.',
  'beginner', 'cable', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'Seated Cable Row',
  'Remo en Cable Sentado',
  'Sit at the cable row machine with feet on the platform, grip the handle, and row it to the lower abdomen while keeping the torso upright.',
  'Siéntate en la máquina de remo con los pies en la plataforma, agarra el manubrio y hálalo hacia el abdomen inferior manteniendo el torso erguido.',
  'beginner', 'cable', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps','lower_back']::muscle_group[]
),
(
  'Barbell Row',
  'Remo con Barra',
  'Hinge at the hips until the torso is roughly parallel to the floor, grip the bar overhand, and row it into the lower abdomen.',
  'Bisagra las caderas hasta que el torso quede paralelo al piso, agarra la barra en prono y llévala hacia el abdomen inferior.',
  'intermediate', 'barbell', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps','lower_back']::muscle_group[]
),
(
  'Dumbbell Row',
  'Remo con Mancuerna',
  'Place one knee and hand on a bench for support, hold a dumbbell in the other hand, and row it to hip height in a single-arm motion.',
  'Coloca una rodilla y mano en un banco para apoyo, sostén una mancuerna en la otra mano y llévala a la altura de la cadera en movimiento unilateral.',
  'beginner', 'dumbbell', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'T-Bar Row',
  'Remo en T',
  'Straddle the T-bar, grip the handle, and row the bar into the lower chest while keeping the back straight and hips hinged.',
  'Monta el T-bar, agarra el manubrio y lleva la barra al pecho inferior manteniendo la espalda recta y las caderas en bisagra.',
  'intermediate', 'barbell', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps','lower_back']::muscle_group[]
),
(
  'Inverted Row',
  'Remo Invertido',
  'Hang below a bar at chest height with straight legs, and row the body up until the chest touches the bar.',
  'Cuélgate debajo de una barra a la altura del pecho con piernas rectas y sube el cuerpo hasta que el pecho toque la barra.',
  'beginner', 'bodyweight', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'Face Pull',
  'Jalón Facial',
  'Attach a rope to a high cable, pull the rope to the face while externally rotating the shoulders and squeezing the rear delts at the finish.',
  'Acopla una cuerda a un cable alto, jala hacia la cara mientras rotas externamente los hombros y aprietas los deltoides posteriores al final.',
  'beginner', 'cable', 'pull', 'isolation', 'traps',
  ARRAY['shoulders']::muscle_group[]
),

-- =============================================================================
-- BACK — TRAPS
-- =============================================================================

(
  'Barbell Shrug',
  'Encogimiento con Barra',
  'Stand holding the bar at arm length, elevate the shoulders straight up toward the ears as high as possible, then lower under control.',
  'Párate sosteniendo la barra con brazos extendidos, eleva los hombros directamente hacia las orejas lo más alto posible, luego baja con control.',
  'beginner', 'barbell', 'pull', 'isolation', 'traps',
  ARRAY['forearms']::muscle_group[]
),
(
  'Dumbbell Shrug',
  'Encogimiento con Mancuernas',
  'Hold dumbbells at your sides and shrug the shoulders up and slightly back, focusing on peak contraction of the upper trapezius.',
  'Sostén mancuernas a los costados y encoge los hombros hacia arriba y ligeramente atrás, enfocando la contracción máxima del trapecio superior.',
  'beginner', 'dumbbell', 'pull', 'isolation', 'traps',
  ARRAY[]::muscle_group[]
),
(
  'Cable Upright Row',
  'Remo al Mentón en Cable',
  'Stand facing a low cable, grip the bar shoulder-width, and pull it straight up to chin level while flaring the elbows outward.',
  'Párate frente a un cable bajo, agarra la barra al ancho de los hombros y jálala hacia el mentón abriendo los codos hacia afuera.',
  'beginner', 'cable', 'pull', 'compound', 'traps',
  ARRAY['shoulders']::muscle_group[]
),

-- =============================================================================
-- BACK — LOWER BACK
-- =============================================================================

(
  'Barbell Deadlift',
  'Peso Muerto con Barra',
  'Stand over a barbell with mid-foot under the bar, hinge to grip it, brace the core, and drive through the floor until standing fully upright.',
  'Párate sobre la barra con el pie a la mitad por debajo, bisagra para agarrarla, tensa el core y empuja a través del piso hasta estar completamente erguido.',
  'advanced', 'barbell', 'hinge', 'compound', 'lower_back',
  ARRAY['glutes','hamstrings','traps','quads']::muscle_group[]
),
(
  'Romanian Deadlift',
  'Peso Muerto Rumano',
  'Start standing with the bar at hip height, hinge at the hips while keeping a neutral spine, lower the bar along the legs, then return to full hip extension.',
  'Empieza de pie con la barra a la altura de la cadera, bisagra las caderas manteniendo la columna neutra, baja la barra por las piernas y regresa a extensión completa.',
  'intermediate', 'barbell', 'hinge', 'compound', 'lower_back',
  ARRAY['hamstrings','glutes']::muscle_group[]
),
(
  'Sumo Deadlift',
  'Peso Muerto Sumo',
  'Take a wide stance with toes flared, grip the bar inside the knees, and drive the hips forward to stand upright, emphasizing the inner thighs and glutes.',
  'Adopta una postura amplia con los pies girados hacia afuera, agarra la barra dentro de las rodillas y lleva las caderas hacia adelante para erguirte, enfatizando aductores y glúteos.',
  'advanced', 'barbell', 'hinge', 'compound', 'lower_back',
  ARRAY['glutes','quads','hamstrings']::muscle_group[]
),
(
  'Back Extension',
  'Extensión de Espalda',
  'Lock the thighs against the hyperextension bench, lower the torso toward the floor, then raise back up to parallel by contracting the lower back.',
  'Fija los muslos contra el banco de hiperextensión, baja el torso hacia el piso y sube de regreso a paralelo contrayendo la zona lumbar.',
  'beginner', 'bodyweight', 'hinge', 'isolation', 'lower_back',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Good Morning',
  'Buenos Días',
  'Place a barbell across the upper back, hinge at the hips with a slight knee bend until the torso is parallel, then return to upright.',
  'Coloca la barra en la parte superior de la espalda, bisagra las caderas con leve flexión de rodilla hasta que el torso quede paralelo, luego regresa a posición erguida.',
  'intermediate', 'barbell', 'hinge', 'isolation', 'lower_back',
  ARRAY['hamstrings','glutes']::muscle_group[]
),

-- =============================================================================
-- SHOULDERS
-- =============================================================================

(
  'Barbell Overhead Press',
  'Press Militar con Barra',
  'Stand or sit with a barbell at collarbone height, press it straight overhead to full lockout, then lower under control.',
  'Párate o siéntate con la barra a la altura de la clavícula, empuja verticalmente hasta bloqueo completo, luego baja con control.',
  'intermediate', 'barbell', 'push', 'compound', 'shoulders',
  ARRAY['triceps','traps']::muscle_group[]
),
(
  'Dumbbell Shoulder Press',
  'Press de Hombros con Mancuernas',
  'Sit with dumbbells at shoulder height, press both overhead simultaneously until the elbows are fully extended.',
  'Siéntate con mancuernas a la altura de los hombros, empuja ambas sobre la cabeza simultáneamente hasta extensión completa de codos.',
  'beginner', 'dumbbell', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'Arnold Press',
  'Press Arnold',
  'Start with dumbbells in front of the face with palms facing in, rotate and press overhead ending with palms facing out at lockout.',
  'Empieza con mancuernas frente al rostro con palmas hacia adentro, rota y empuja sobre la cabeza terminando con palmas hacia afuera al final.',
  'intermediate', 'dumbbell', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'Lateral Raise',
  'Elevación Lateral',
  'Hold dumbbells at your sides, raise both arms laterally to shoulder height with a slight bend in the elbows, then lower under control.',
  'Sostén mancuernas a los costados, eleva ambos brazos lateralmente hasta la altura de los hombros con leve flexión de codo, luego baja con control.',
  'beginner', 'dumbbell', 'push', 'isolation', 'shoulders',
  ARRAY[]::muscle_group[]
),
(
  'Front Raise',
  'Elevación Frontal',
  'Hold a dumbbell in each hand and raise them to shoulder height in front of the body with straight arms, then lower slowly.',
  'Sostén una mancuerna en cada mano y eleva a la altura de los hombros al frente del cuerpo con brazos rectos, luego baja lentamente.',
  'beginner', 'dumbbell', 'push', 'isolation', 'shoulders',
  ARRAY[]::muscle_group[]
),
(
  'Rear Delt Fly',
  'Apertura de Deltoides Posterior',
  'Hinge forward with the torso, hold dumbbells below the chest, and raise both arms out to the sides squeezing the rear deltoids at the top.',
  'Inclínate hacia adelante con el torso, sostén mancuernas bajo el pecho y eleva ambos brazos a los lados apretando los deltoides posteriores arriba.',
  'beginner', 'dumbbell', 'pull', 'isolation', 'shoulders',
  ARRAY['traps']::muscle_group[]
),
(
  'Cable Lateral Raise',
  'Elevación Lateral en Cable',
  'Stand beside a low cable pulley, grip the handle across the body, and raise the arm to shoulder height in a lateral arc.',
  'Párate junto a una polea baja, agarra el manubrio cruzando el cuerpo y eleva el brazo a la altura del hombro en arco lateral.',
  'beginner', 'cable', 'push', 'isolation', 'shoulders',
  ARRAY[]::muscle_group[]
),

-- =============================================================================
-- TRICEPS
-- =============================================================================

(
  'Tricep Pushdown',
  'Extensión de Tríceps en Polea',
  'Stand at a high cable with a bar or rope attachment, keep the elbows pinned to the sides, and extend the forearms down to full lockout.',
  'Párate en una polea alta con barra o cuerda, mantén los codos fijos a los lados y extiende los antebrazos hacia abajo hasta bloqueo completo.',
  'beginner', 'cable', 'push', 'isolation', 'triceps',
  ARRAY[]::muscle_group[]
),
(
  'Skull Crusher',
  'Rompe Cráneos',
  'Lie on a bench, hold an EZ-bar above the chest, lower it toward the forehead by bending only the elbows, then extend back to lockout.',
  'Recuéstate en un banco, sostén la barra EZ sobre el pecho, bájala hacia la frente flexionando solo los codos, luego extiende de regreso a bloqueo.',
  'intermediate', 'ez_bar', 'push', 'isolation', 'triceps',
  ARRAY[]::muscle_group[]
),
(
  'Overhead Tricep Extension',
  'Extensión de Tríceps sobre la Cabeza',
  'Hold a dumbbell or cable overhead with both hands, bend the elbows behind the head, then press up to full extension.',
  'Sostén una mancuerna o cable sobre la cabeza con ambas manos, flexiona los codos detrás de la cabeza y empuja hasta extensión completa.',
  'beginner', 'dumbbell', 'push', 'isolation', 'triceps',
  ARRAY[]::muscle_group[]
),
(
  'Tricep Kickback',
  'Patada de Tríceps',
  'Hinge forward with a dumbbell in one hand, upper arm parallel to the floor, and extend the forearm back until the elbow is fully straight.',
  'Inclínate hacia adelante con una mancuerna en una mano, brazo paralelo al piso, y extiende el antebrazo hacia atrás hasta que el codo esté completamente recto.',
  'beginner', 'dumbbell', 'push', 'isolation', 'triceps',
  ARRAY[]::muscle_group[]
),
(
  'Close-Grip Bench Press',
  'Press de Banca con Agarre Cerrado',
  'Perform a bench press with hands roughly shoulder-width or closer, emphasizing the triceps over the chest.',
  'Realiza un press de banca con las manos al ancho de los hombros o más cerradas, enfatizando los tríceps sobre el pecho.',
  'intermediate', 'barbell', 'push', 'compound', 'triceps',
  ARRAY['chest','shoulders']::muscle_group[]
),
(
  'Tricep Dip',
  'Fondos de Tríceps',
  'Place hands on parallel bars with the torso upright, lower the body by bending the elbows, then press back up to full extension.',
  'Coloca las manos en barras paralelas con el torso erguido, baja el cuerpo flexionando los codos y empuja de regreso a extensión completa.',
  'intermediate', 'bodyweight', 'push', 'compound', 'triceps',
  ARRAY['chest','shoulders']::muscle_group[]
),

-- =============================================================================
-- BICEPS
-- =============================================================================

(
  'Barbell Curl',
  'Curl con Barra',
  'Stand with the bar at hip level using an underhand grip, curl the bar to shoulder height by flexing the elbows, keeping the upper arms still.',
  'Párate con la barra a la altura de las caderas con agarre supino, lleva la barra a la altura de los hombros flexionando los codos, manteniendo los brazos quietos.',
  'beginner', 'barbell', 'pull', 'isolation', 'biceps',
  ARRAY['forearms']::muscle_group[]
),
(
  'Dumbbell Curl',
  'Curl con Mancuerna',
  'Hold a dumbbell in each hand at your sides and curl them alternately or simultaneously to shoulder height with a supinated grip.',
  'Sostén una mancuerna en cada mano a los costados y llévalas alternada o simultáneamente a la altura de los hombros con agarre supino.',
  'beginner', 'dumbbell', 'pull', 'isolation', 'biceps',
  ARRAY['forearms']::muscle_group[]
),
(
  'Hammer Curl',
  'Curl Martillo',
  'Hold dumbbells with a neutral grip and curl them to shoulder height, keeping the wrists neutral throughout the movement.',
  'Sostén mancuernas con agarre neutro y llévalas a la altura de los hombros, manteniendo las muñecas neutras durante todo el movimiento.',
  'beginner', 'dumbbell', 'pull', 'isolation', 'biceps',
  ARRAY['forearms']::muscle_group[]
),
(
  'Cable Curl',
  'Curl en Cable',
  'Stand at a low cable pulley, grip the bar with an underhand hold, and curl to shoulder height with continuous tension.',
  'Párate en una polea baja, agarra la barra en supino y lleva a la altura de los hombros manteniendo tensión continua.',
  'beginner', 'cable', 'pull', 'isolation', 'biceps',
  ARRAY[]::muscle_group[]
),
(
  'Preacher Curl',
  'Curl en Predicador',
  'Rest the upper arms on the preacher bench pad, grip an EZ-bar, and curl from full extension to peak contraction.',
  'Apoya los brazos sobre el atril predicador, agarra la barra EZ y lleva desde extensión completa hasta contracción máxima.',
  'intermediate', 'ez_bar', 'pull', 'isolation', 'biceps',
  ARRAY[]::muscle_group[]
),
(
  'Concentration Curl',
  'Curl de Concentración',
  'Sit on a bench, brace the upper arm against the inner thigh, and curl a dumbbell in a slow controlled arc.',
  'Siéntate en un banco, apoya el brazo contra la cara interna del muslo y lleva la mancuerna en arco lento y controlado.',
  'beginner', 'dumbbell', 'pull', 'isolation', 'biceps',
  ARRAY[]::muscle_group[]
),
(
  'Incline Dumbbell Curl',
  'Curl Inclinado con Mancuerna',
  'Lie back on a 45-degree incline bench, let the arms hang freely, and curl the dumbbells with a full range of motion to maximize the stretch.',
  'Recuéstate en un banco inclinado a 45 grados, deja los brazos colgando libremente y lleva las mancuernas con rango completo para maximizar el estiramiento.',
  'intermediate', 'dumbbell', 'pull', 'isolation', 'biceps',
  ARRAY[]::muscle_group[]
),

-- =============================================================================
-- LEGS — QUADS
-- =============================================================================

(
  'Barbell Back Squat',
  'Sentadilla con Barra',
  'Position the bar on the upper back, stand shoulder-width apart, squat until the hips are below parallel, then drive upward to full extension.',
  'Posiciona la barra en la parte superior de la espalda, párate al ancho de los hombros, baja hasta que las caderas queden por debajo de paralelo y luego empuja hacia arriba.',
  'intermediate', 'barbell', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings','lower_back']::muscle_group[]
),
(
  'Front Squat',
  'Sentadilla Frontal',
  'Hold the bar in a front-rack position at shoulder height, squat deep while keeping the torso as upright as possible.',
  'Sostén la barra en posición de rack frontal a la altura de los hombros, baja en sentadilla manteniendo el torso lo más vertical posible.',
  'advanced', 'barbell', 'push', 'compound', 'quads',
  ARRAY['glutes','abs']::muscle_group[]
),
(
  'Leg Press',
  'Prensa de Piernas',
  'Sit in the leg press machine, place feet shoulder-width on the platform, lower the sled until the knees form 90 degrees, then press back out.',
  'Siéntate en la máquina de prensa, coloca los pies al ancho de los hombros en la plataforma, baja el carro hasta 90 grados de rodilla y empuja de regreso.',
  'beginner', 'machine', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Hack Squat',
  'Sentadilla Hack',
  'Stand in the hack squat machine with feet on the platform, lower until the thighs are parallel to the platform, then drive back up.',
  'Párate en la máquina hack squat con los pies en la plataforma, baja hasta que los muslos queden paralelos a la plataforma y luego empuja hacia arriba.',
  'intermediate', 'machine', 'push', 'compound', 'quads',
  ARRAY['glutes']::muscle_group[]
),
(
  'Leg Extension',
  'Extensión de Cuádriceps',
  'Sit in the leg extension machine, place feet behind the roller pad, and extend both legs to full lockout, contracting the quads at the top.',
  'Siéntate en la máquina de extensión, coloca los pies detrás del rodillo y extiende ambas piernas hasta bloqueo completo, contrayendo los cuádriceps arriba.',
  'beginner', 'machine', 'push', 'isolation', 'quads',
  ARRAY[]::muscle_group[]
),
(
  'Bulgarian Split Squat',
  'Sentadilla Búlgara',
  'Place one foot behind you on a bench, lower the front knee until the rear knee nearly touches the floor, then drive back up through the front heel.',
  'Coloca un pie detrás en un banco, baja la rodilla delantera hasta casi tocar el piso con la trasera, luego empuja hacia arriba a través del talón delantero.',
  'intermediate', 'dumbbell', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Walking Lunge',
  'Zancada Caminando',
  'Step forward into a lunge, lower the rear knee toward the floor, then step the back leg forward and repeat on the opposite side.',
  'Da un paso al frente en zancada, baja la rodilla trasera hacia el piso, luego adelanta la pierna trasera y repite al otro lado.',
  'beginner', 'dumbbell', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Goblet Squat',
  'Sentadilla Goblet',
  'Hold a kettlebell or dumbbell against the chest, squat deep with an upright torso, and drive up through the heels.',
  'Sostén una pesa rusa o mancuerna contra el pecho, baja en sentadilla profunda con torso erguido y empuja hacia arriba a través de los talones.',
  'beginner', 'kettlebell', 'push', 'compound', 'quads',
  ARRAY['glutes']::muscle_group[]
),
(
  'Step-Up',
  'Subida a Cajón',
  'Hold dumbbells at your sides, step one foot onto a sturdy box or bench, drive through the heel to bring both feet up, then step back down.',
  'Sostén mancuernas a los costados, coloca un pie sobre un cajón o banco firme, empuja a través del talón para subir ambos pies y luego baja.',
  'beginner', 'dumbbell', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Pistol Squat',
  'Sentadilla Pistola',
  'Stand on one leg, extend the other forward, and squat on the single leg until the glute touches the heel, then rise back to standing.',
  'Párate en una pierna, extiende la otra al frente y baja en sentadilla sobre una sola pierna hasta que el glúteo toque el talón, luego sube.',
  'advanced', 'bodyweight', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),

-- =============================================================================
-- LEGS — HAMSTRINGS
-- =============================================================================

(
  'Leg Curl',
  'Curl de Isquiotibiales',
  'Lie face down on the leg curl machine, hook the ankles under the pad, and curl the heels toward the glutes to full contraction.',
  'Recuéstate boca abajo en la máquina de curl, engancha los tobillos bajo el rodillo y lleva los talones hacia los glúteos hasta contracción completa.',
  'beginner', 'machine', 'hinge', 'isolation', 'hamstrings',
  ARRAY[]::muscle_group[]
),
(
  'Seated Leg Curl',
  'Curl de Isquiotibiales Sentado',
  'Sit in the seated leg curl machine, secure the upper-leg pad, and flex the knees to full contraction.',
  'Siéntate en la máquina de curl sentado, asegura la almohadilla superior y flexiona las rodillas hasta contracción completa.',
  'beginner', 'machine', 'hinge', 'isolation', 'hamstrings',
  ARRAY[]::muscle_group[]
),
(
  'Nordic Hamstring Curl',
  'Curl Nórdico de Isquiotibiales',
  'Kneel on a mat with ankles secured, lower the body forward in a slow eccentric until unable to control, then use the hands to push back up.',
  'Arrodíllate en una colchoneta con los tobillos sujetos, baja el cuerpo hacia adelante de forma excéntrica lenta hasta no poder controlar, luego usa las manos para subir.',
  'advanced', 'bodyweight', 'hinge', 'isolation', 'hamstrings',
  ARRAY[]::muscle_group[]
),

-- =============================================================================
-- LEGS — GLUTES
-- =============================================================================

(
  'Hip Thrust',
  'Empuje de Cadera',
  'Rest the upper back against a bench, place a barbell across the hips, drive the hips upward to full extension, and squeeze the glutes at the top.',
  'Apoya la parte superior de la espalda en un banco, coloca la barra en las caderas, lleva las caderas hacia arriba hasta extensión completa y aprieta los glúteos.',
  'intermediate', 'barbell', 'hinge', 'isolation', 'glutes',
  ARRAY['hamstrings']::muscle_group[]
),
(
  'Glute Bridge',
  'Puente de Glúteos',
  'Lie on your back with knees bent, drive the hips upward by squeezing the glutes, hold for one second at the top, then lower.',
  'Recuéstate boca arriba con rodillas flexionadas, lleva las caderas hacia arriba apretando los glúteos, mantén un segundo arriba y baja.',
  'beginner', 'bodyweight', 'hinge', 'isolation', 'glutes',
  ARRAY['hamstrings']::muscle_group[]
),
(
  'Cable Pull-Through',
  'Jalón a través en Cable',
  'Stand facing away from a low cable with the rope between the legs, hinge at the hips and drive them forward to full extension.',
  'Párate de espaldas a una polea baja con la cuerda entre las piernas, bisagra las caderas y llévalas hacia adelante hasta extensión completa.',
  'beginner', 'cable', 'hinge', 'isolation', 'glutes',
  ARRAY['hamstrings']::muscle_group[]
),
(
  'Side-Lying Clam',
  'Almeja de Lado',
  'Lie on your side with hips stacked and knees bent at 45 degrees, rotate the top knee upward like a clamshell without moving the pelvis.',
  'Recuéstate de lado con caderas apiladas y rodillas a 45 grados, rota la rodilla superior hacia arriba como almeja sin mover la pelvis.',
  'beginner', 'bodyweight', 'push', 'isolation', 'glutes',
  ARRAY[]::muscle_group[]
),

-- =============================================================================
-- LEGS — CALVES
-- =============================================================================

(
  'Standing Calf Raise',
  'Elevación de Talones de Pie',
  'Stand on the edge of a step or calf-raise machine platform, lower the heels to full stretch, then rise on the toes to full contraction.',
  'Párate en el borde de un escalón o máquina, baja los talones hasta estiramiento total, luego sube en puntas hasta contracción completa.',
  'beginner', 'machine', 'push', 'isolation', 'calves',
  ARRAY[]::muscle_group[]
),
(
  'Seated Calf Raise',
  'Elevación de Talones Sentado',
  'Sit at the seated calf-raise machine with pads on the thighs, perform full range-of-motion heel raises targeting the soleus.',
  'Siéntate en la máquina de talones con las almohadillas en los muslos, realiza elevaciones con rango completo enfocando el sóleo.',
  'beginner', 'machine', 'push', 'isolation', 'calves',
  ARRAY[]::muscle_group[]
),
(
  'Single-Leg Calf Raise',
  'Elevación de Talón en Una Pierna',
  'Balance on one foot on a raised surface and perform slow, full range-of-motion calf raises to develop unilateral stability and strength.',
  'Equilibra en un pie sobre una superficie elevada y realiza elevaciones de talón lentas y con rango completo para desarrollar estabilidad y fuerza unilateral.',
  'intermediate', 'bodyweight', 'push', 'isolation', 'calves',
  ARRAY[]::muscle_group[]
),

-- =============================================================================
-- ABS AND CORE
-- =============================================================================

(
  'Plank',
  'Plancha',
  'Hold a push-up position on the forearms with the body in a straight line from head to heel, bracing the core against gravity.',
  'Mantén posición de flexión sobre los antebrazos con el cuerpo en línea recta de cabeza a talones, tensando el core contra la gravedad.',
  'beginner', 'bodyweight', 'static', 'isolation', 'abs',
  ARRAY['lower_back','shoulders']::muscle_group[]
),
(
  'Crunch',
  'Abdominal',
  'Lie on your back with knees bent, place hands behind the head, and flex the spine to bring the shoulder blades off the floor, squeezing the abs.',
  'Recuéstate con rodillas flexionadas, coloca las manos detrás de la cabeza y flexiona la columna para despegar los omóplatos del piso apretando los abdominales.',
  'beginner', 'bodyweight', 'push', 'isolation', 'abs',
  ARRAY[]::muscle_group[]
),
(
  'Bicycle Crunch',
  'Abdominal en Bicicleta',
  'Lie on your back, bring one knee in as you rotate the opposite elbow toward it, alternating sides in a cycling motion.',
  'Recuéstate boca arriba, acerca una rodilla mientras giras el codo opuesto hacia ella, alternando lados en movimiento de pedaleo.',
  'beginner', 'bodyweight', 'push', 'isolation', 'abs',
  ARRAY['obliques']::muscle_group[]
),
(
  'Hanging Knee Raise',
  'Elevación de Rodillas Colgado',
  'Hang from a pull-up bar, brace the core, and raise both knees toward the chest, then lower under control.',
  'Cuélgate de una barra, tensa el core y eleva ambas rodillas hacia el pecho, luego baja con control.',
  'intermediate', 'bodyweight', 'pull', 'compound', 'abs',
  ARRAY['obliques']::muscle_group[]
),
(
  'Hanging Leg Raise',
  'Elevación de Piernas Colgado',
  'Hang from a bar with straight legs and raise them parallel to the floor or higher, keeping the pelvis in posterior tilt throughout.',
  'Cuélgate de una barra con piernas rectas y éleva hasta paralelo al piso o más alto, manteniendo la pelvis en retroversión durante todo el movimiento.',
  'advanced', 'bodyweight', 'pull', 'compound', 'abs',
  ARRAY['obliques','lower_back']::muscle_group[]
),
(
  'Russian Twist',
  'Giro Ruso',
  'Sit with the torso at 45 degrees, feet lifted or on the floor, and rotate side to side while holding a weight or pressing hands together.',
  'Siéntate con el torso a 45 grados, pies elevados o en el piso, y gira de lado a lado sosteniendo un peso o con las manos juntas.',
  'beginner', 'bodyweight', 'static', 'isolation', 'obliques',
  ARRAY['abs']::muscle_group[]
),
(
  'Side Plank',
  'Plancha Lateral',
  'Rest on one forearm with the body in a straight lateral line, stacking the feet, and hold the position while bracing the obliques.',
  'Apoya en un antebrazo con el cuerpo en línea lateral recta, pies apilados, y mantén la posición tensando los oblicuos.',
  'beginner', 'bodyweight', 'static', 'isolation', 'obliques',
  ARRAY['abs']::muscle_group[]
),
(
  'Cable Crunch',
  'Abdominal en Cable',
  'Kneel at a high cable with a rope attachment, pull the rope to the sides of the head, and crunch the elbows toward the knees.',
  'Arrodíllate en un cable alto con cuerda, jala la cuerda a los lados de la cabeza y lleva los codos hacia las rodillas.',
  'beginner', 'cable', 'push', 'isolation', 'abs',
  ARRAY[]::muscle_group[]
),
(
  'Ab Wheel Rollout',
  'Rueda Abdominal',
  'Kneel and hold the ab wheel in front, roll forward extending the body to a straight line, then contract the core to roll back.',
  'Arrodíllate sosteniendo la rueda al frente, rueda hacia adelante extendiendo el cuerpo en línea recta, luego contrae el core para regresar.',
  'intermediate', 'bodyweight', 'pull', 'compound', 'abs',
  ARRAY['lower_back','shoulders']::muscle_group[]
),
(
  'Dead Bug',
  'Bicho Muerto',
  'Lie on your back with arms extended toward the ceiling and knees at 90 degrees, lower opposite arm and leg simultaneously while keeping the lower back pressed to the floor.',
  'Recuéstate con brazos extendidos al techo y rodillas a 90 grados, baja el brazo y la pierna opuestos simultáneamente manteniendo la zona lumbar pegada al piso.',
  'beginner', 'bodyweight', 'static', 'isolation', 'abs',
  ARRAY['lower_back']::muscle_group[]
),

-- =============================================================================
-- CALISTHENICS ADVANCED
-- =============================================================================

(
  'Muscle-Up',
  'Muscle-Up',
  'Hang from rings or a bar, perform an explosive pull-up and transition the wrists above the bar to press out to a straight-arm support.',
  'Cuélgate de argollas o barra, realiza un jalón explosivo y transiciona las muñecas sobre la barra para empujar hasta soporte con brazos extendidos.',
  'advanced', 'bodyweight', 'pull', 'compound', 'lats',
  ARRAY['chest','triceps','biceps']::muscle_group[]
),
(
  'Pike Push-Up',
  'Flexión en Pica',
  'Form an inverted V with the hips raised high, place hands shoulder-width, and lower the head toward the floor by bending the elbows.',
  'Forma una V invertida con las caderas muy elevadas, coloca las manos al ancho de los hombros y baja la cabeza hacia el piso flexionando los codos.',
  'intermediate', 'bodyweight', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'Handstand Push-Up',
  'Flexión en Pino',
  'Kick into a handstand against a wall, lower the head to the floor by bending the elbows, then press back to full arm extension.',
  'Sube a posición de pino contra la pared, baja la cabeza al piso flexionando los codos y empuja de regreso a extensión completa.',
  'advanced', 'bodyweight', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'L-Sit',
  'L-Sit',
  'Support the body on parallel bars or the floor with straight arms, and hold the legs straight out in front parallel to the ground.',
  'Apoya el cuerpo en barras paralelas o el piso con brazos rectos y sostén las piernas extendidas al frente paralelas al suelo.',
  'advanced', 'bodyweight', 'static', 'isolation', 'abs',
  ARRAY['quads','triceps']::muscle_group[]
),
(
  'Dragon Flag',
  'Bandera del Dragón',
  'Grip a pole or bench behind the head while lying down, lift the entire body from the floor in a straight line supported only by the upper back.',
  'Agarra un soporte detrás de la cabeza acostado, levanta el cuerpo completo del piso en línea recta apoyado solo en la parte superior de la espalda.',
  'advanced', 'bodyweight', 'static', 'compound', 'abs',
  ARRAY['lower_back','glutes']::muscle_group[]
),
(
  'Dip Bar Leg Raise',
  'Elevación de Piernas en Paralelas',
  'Support on dip bars, keep arms extended, and raise straight legs to hip height or higher while controlling the pelvis.',
  'Apóyate en barras de fondos, mantén los brazos extendidos y eleva las piernas rectas a la altura de las caderas o más arriba controlando la pelvis.',
  'intermediate', 'bodyweight', 'pull', 'isolation', 'abs',
  ARRAY['quads']::muscle_group[]
),

-- =============================================================================
-- KETTLEBELL
-- =============================================================================

(
  'Kettlebell Swing',
  'Swing con Pesa Rusa',
  'Hinge at the hips with the kettlebell between the legs, hike it back and then drive the hips forward explosively to swing it to chest height.',
  'Bisagra las caderas con la pesa rusa entre las piernas, lánzala hacia atrás y luego impulsa las caderas hacia adelante explosivamente para elevarla a la altura del pecho.',
  'intermediate', 'kettlebell', 'hinge', 'compound', 'glutes',
  ARRAY['hamstrings','lower_back','abs']::muscle_group[]
),
(
  'Kettlebell Clean',
  'Clean con Pesa Rusa',
  'Start in a hip hinge, swing the kettlebell and redirect it into a rack position at shoulder height in one fluid movement.',
  'Empieza en bisagra de cadera, balancea la pesa rusa y redirígela a posición de rack a la altura del hombro en un movimiento fluido.',
  'intermediate', 'kettlebell', 'pull', 'compound', 'glutes',
  ARRAY['hamstrings','shoulders','biceps']::muscle_group[]
),
(
  'Kettlebell Snatch',
  'Snatch con Pesa Rusa',
  'Swing the kettlebell and in one continuous movement punch it overhead to a locked-out position without touching the forearm.',
  'Balancea la pesa rusa y en un movimiento continuo empúnjala sobre la cabeza hasta posición bloqueada sin tocar el antebrazo.',
  'advanced', 'kettlebell', 'pull', 'compound', 'shoulders',
  ARRAY['glutes','hamstrings','triceps']::muscle_group[]
),
(
  'Kettlebell Turkish Get-Up',
  'Levantada Turca con Pesa Rusa',
  'Starting lying down with the kettlebell pressed overhead, transition through a series of positions to standing while keeping the arm locked out.',
  'Empezando acostado con la pesa rusa en press sobre la cabeza, transiciona por una serie de posiciones hasta estar de pie manteniendo el brazo bloqueado.',
  'intermediate', 'kettlebell', 'push', 'compound', 'shoulders',
  ARRAY['abs','glutes','lower_back']::muscle_group[]
),
(
  'Kettlebell Press',
  'Press con Pesa Rusa',
  'Hold the kettlebell in a rack position at shoulder height and press it straight overhead to full elbow extension.',
  'Sostén la pesa rusa en posición de rack a la altura del hombro y empújala sobre la cabeza hasta extensión completa del codo.',
  'intermediate', 'kettlebell', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'Kettlebell Row',
  'Remo con Pesa Rusa',
  'Hinge at the hips, row the kettlebell to hip height in a single-arm motion keeping the elbow close to the body.',
  'Bisagra las caderas y lleva la pesa rusa a la altura de la cadera en movimiento unilateral manteniendo el codo cerca del cuerpo.',
  'beginner', 'kettlebell', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'Kettlebell Goblet Squat',
  'Sentadilla Goblet con Pesa Rusa',
  'Cup the kettlebell at chest height, feet shoulder-width, and squat deep while keeping the chest tall and elbows inside the knees at the bottom.',
  'Sujeta la pesa rusa a la altura del pecho, pies al ancho de los hombros, y baja en sentadilla profunda manteniendo el pecho erguido y los codos dentro de las rodillas.',
  'beginner', 'kettlebell', 'push', 'compound', 'quads',
  ARRAY['glutes']::muscle_group[]
),

-- =============================================================================
-- CARDIO / METABOLIC
-- =============================================================================

(
  'Burpee',
  'Burpee',
  'From standing, squat down, kick the feet back into a push-up position, lower to the floor, push up, jump the feet back to hands, and leap upward.',
  'Desde de pie, baja en sentadilla, lanza los pies hacia atrás a posición de flexión, baja al piso, empuja, regresa los pies a las manos y salta hacia arriba.',
  'intermediate', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['chest','quads','abs']::muscle_group[]
),
(
  'Mountain Climber',
  'Escalador de Montaña',
  'Start in a plank, and rapidly alternate driving the knees toward the chest while maintaining a stable hip position.',
  'Empieza en plancha y alterna rápidamente llevando las rodillas hacia el pecho manteniendo la posición de cadera estable.',
  'beginner', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['abs','quads']::muscle_group[]
),
(
  'Box Jump',
  'Salto al Cajón',
  'Stand in front of a sturdy box, perform a small counter-movement and explosively jump onto the top, landing softly with bent knees.',
  'Párate frente a un cajón firme, realiza un pequeño contramovimiento y salta explosivamente a la parte superior, aterrizando suavemente con rodillas flexionadas.',
  'intermediate', 'bodyweight', 'push', 'compound', 'quads',
  ARRAY['glutes','calves','cardio_system']::muscle_group[]
),
(
  'Jumping Jack',
  'Salto de Tijera',
  'Stand with feet together and arms at sides, jump while spreading the legs and raising the arms above the head, then return to start.',
  'Párate con pies juntos y brazos a los lados, salta separando las piernas y elevando los brazos sobre la cabeza, luego regresa al inicio.',
  'beginner', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['shoulders','calves']::muscle_group[]
),
(
  'Jump Rope',
  'Saltar la Cuerda',
  'Hold a jump rope handle in each hand, swing it overhead, and jump over it continuously, keeping a light bounce on the balls of the feet.',
  'Sostén un mango de la cuerda en cada mano, gírala sobre la cabeza y salta sobre ella continuamente, manteniendo un ligero rebote en la punta de los pies.',
  'beginner', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['calves','shoulders']::muscle_group[]
),
(
  'High Knees',
  'Rodillas Altas',
  'Run in place while driving the knees up to hip height on each stride, pumping the arms in rhythm.',
  'Corre en el lugar llevando las rodillas a la altura de las caderas en cada zancada, bombeando los brazos al ritmo.',
  'beginner', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['quads','calves']::muscle_group[]
),
(
  'Tuck Jump',
  'Salto con Rodillas al Pecho',
  'Jump and pull both knees toward the chest at the peak of the jump, then land softly and immediately repeat.',
  'Salta y jala ambas rodillas hacia el pecho en el punto más alto del salto, luego aterriza suavemente y repite de inmediato.',
  'intermediate', 'bodyweight', 'push', 'compound', 'cardio_system',
  ARRAY['quads','glutes']::muscle_group[]
),

-- =============================================================================
-- BAND EXERCISES
-- =============================================================================

(
  'Resistance Band Pull-Apart',
  'Separación con Banda de Resistencia',
  'Hold a resistance band in front of the chest with arms straight, and pull it apart until the band touches the chest, squeezing the rear delts.',
  'Sostén una banda de resistencia frente al pecho con brazos rectos y sepárala hasta que toque el pecho, apretando los deltoides posteriores.',
  'beginner', 'band', 'pull', 'isolation', 'shoulders',
  ARRAY['traps']::muscle_group[]
),
(
  'Resistance Band Row',
  'Remo con Banda de Resistencia',
  'Anchor the band at chest height, grip the ends with both hands, and row toward the lower abdomen while retracting the shoulder blades.',
  'Ancla la banda a la altura del pecho, agarra los extremos con ambas manos y lleva hacia el abdomen inferior retrayendo los omóplatos.',
  'beginner', 'band', 'pull', 'compound', 'lats',
  ARRAY['biceps','traps']::muscle_group[]
),
(
  'Resistance Band Lateral Walk',
  'Caminata Lateral con Banda',
  'Place a resistance band above the knees, get into a partial squat, and take steps laterally while maintaining tension on the band.',
  'Coloca una banda de resistencia sobre las rodillas, adopta posición de sentadilla parcial y da pasos laterales manteniendo tensión en la banda.',
  'beginner', 'band', 'push', 'isolation', 'glutes',
  ARRAY['quads']::muscle_group[]
),
(
  'Resistance Band Bicep Curl',
  'Curl de Bíceps con Banda',
  'Stand on the middle of the band, grip the ends with an underhand hold, and curl to shoulder height against the resistance.',
  'Párate sobre el centro de la banda, agarra los extremos en supino y lleva a la altura de los hombros contra la resistencia.',
  'beginner', 'band', 'pull', 'isolation', 'biceps',
  ARRAY[]::muscle_group[]
),
(
  'Resistance Band Squat',
  'Sentadilla con Banda de Resistencia',
  'Stand on the band with feet shoulder-width apart and loop the ends over the shoulders, perform a squat against the band resistance.',
  'Párate sobre la banda con pies al ancho de los hombros y pasa los extremos sobre los hombros, realiza sentadilla contra la resistencia de la banda.',
  'beginner', 'band', 'push', 'compound', 'quads',
  ARRAY['glutes']::muscle_group[]
),

-- =============================================================================
-- SMITH MACHINE
-- =============================================================================

(
  'Smith Machine Squat',
  'Sentadilla en Máquina Smith',
  'Position the bar on the upper back inside a Smith machine, place feet slightly forward, and squat to parallel or below.',
  'Posiciona la barra en la parte superior de la espalda dentro de la máquina Smith, coloca los pies ligeramente adelantados y baja en sentadilla a paralelo o más abajo.',
  'beginner', 'smith_machine', 'push', 'compound', 'quads',
  ARRAY['glutes','hamstrings']::muscle_group[]
),
(
  'Smith Machine Bench Press',
  'Press de Banca en Máquina Smith',
  'Lie under the Smith machine bar, set up as for a regular bench press, and press the bar up along its fixed vertical path.',
  'Recuéstate bajo la barra de la máquina Smith, configúrate como para un press de banca regular y empuja la barra a lo largo de su trayectoria vertical fija.',
  'beginner', 'smith_machine', 'push', 'compound', 'chest',
  ARRAY['triceps','shoulders']::muscle_group[]
),
(
  'Smith Machine Shoulder Press',
  'Press de Hombros en Máquina Smith',
  'Sit under the Smith machine bar at shoulder height and press it overhead along the fixed path.',
  'Siéntate bajo la barra de la máquina Smith a la altura de los hombros y empuja sobre la cabeza a lo largo del camino fijo.',
  'beginner', 'smith_machine', 'push', 'compound', 'shoulders',
  ARRAY['triceps']::muscle_group[]
),
(
  'Smith Machine Romanian Deadlift',
  'Peso Muerto Rumano en Máquina Smith',
  'Set the Smith machine bar at hip height, grip it and hinge the hips to lower the bar along the thighs in a strict hip-hinge pattern.',
  'Ajusta la barra de la máquina Smith a la altura de las caderas, agárrala y bisagra las caderas para bajar la barra por los muslos en patrón estricto.',
  'beginner', 'smith_machine', 'hinge', 'compound', 'lower_back',
  ARRAY['hamstrings','glutes']::muscle_group[]
),

-- =============================================================================
-- FOREARMS / GRIP
-- =============================================================================

(
  'Barbell Wrist Curl',
  'Curl de Muñeca con Barra',
  'Sit with forearms on the thighs, hold the bar with an underhand grip, and curl the wrists upward against resistance.',
  'Siéntate con los antebrazos sobre los muslos, sostén la barra con agarre supino y dobla las muñecas hacia arriba contra la resistencia.',
  'beginner', 'barbell', 'pull', 'isolation', 'forearms',
  ARRAY[]::muscle_group[]
),
(
  'Barbell Reverse Wrist Curl',
  'Curl de Muñeca Invertido con Barra',
  'Hold the bar with an overhand grip, forearms on the thighs, and extend the wrists upward against resistance to target the extensors.',
  'Sostén la barra con agarre prono, antebrazos sobre los muslos, y extiende las muñecas hacia arriba contra la resistencia para trabajar los extensores.',
  'beginner', 'barbell', 'push', 'isolation', 'forearms',
  ARRAY[]::muscle_group[]
),
(
  'Farmer Walk',
  'Caminata del Granjero',
  'Hold heavy dumbbells or kettlebells at your sides and walk for a set distance or time, maintaining an upright posture.',
  'Sostén mancuernas o pesas rusas pesadas a los costados y camina durante una distancia o tiempo determinado, manteniendo postura erguida.',
  'intermediate', 'dumbbell', 'static', 'compound', 'forearms',
  ARRAY['traps','quads','calves']::muscle_group[]
),

-- =============================================================================
-- ADDITIONAL COMPOUND MOVEMENTS
-- =============================================================================

(
  'Power Clean',
  'Cargada de Potencia',
  'Start with a barbell on the floor, explosively extend the hips and knees, shrug and pull the bar high, then drop into a partial squat to catch it in a front rack.',
  'Empieza con la barra en el piso, extiende explosivamente caderas y rodillas, encoge y jala la barra alto, luego baja a sentadilla parcial para recibirla en rack frontal.',
  'advanced', 'barbell', 'pull', 'compound', 'quads',
  ARRAY['glutes','hamstrings','shoulders','traps','biceps']::muscle_group[]
),
(
  'Dumbbell Thruster',
  'Thruster con Mancuernas',
  'Start with dumbbells at shoulder height, squat to parallel, and as you rise use the momentum to press both dumbbells overhead in one fluid motion.',
  'Empieza con mancuernas a la altura de los hombros, baja en sentadilla a paralelo y al subir usa el impulso para empujar ambas mancuernas sobre la cabeza en un movimiento fluido.',
  'intermediate', 'dumbbell', 'push', 'compound', 'quads',
  ARRAY['glutes','shoulders','triceps']::muscle_group[]
)

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERY — run after insert to confirm row count
-- =============================================================================
-- SELECT COUNT(*) AS total_exercises FROM exercises;
-- SELECT equipment, COUNT(*) FROM exercises GROUP BY equipment ORDER BY equipment;
-- SELECT primary_muscle, COUNT(*) FROM exercises GROUP BY primary_muscle ORDER BY primary_muscle;
