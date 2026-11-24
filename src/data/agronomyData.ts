export interface CropDisease {
  name: string;
  symptom: string;
  prevention: string;
  diagramType: 'spots' | 'holes' | 'rot' | 'bugs' | 'wilt';
}

export interface CropGuide {
  id: string;
  name: string;
  scientific: string;
  family: string;
  harvestDays: [number, number];
  transplantDays?: [number, number];
  cycleEndDays: number;
  difficulty: 'Principiante' | 'Intermedio';
  tilaranWindow: string;
  windSensitivity: 'Baja' | 'Media' | 'Alta';
  rainManagement: string;
  spacing: string;
  depth: string;
  sun: string;
  soil: string;
  water: string;
  nutrition: string;
  harvestText: string;
  tips: string[];
  diseases: CropDisease[];
}

export interface LearningStep {
  step: number;
  title: string;
  summary: string;
  tilaranNote: string;
  actionChecklist: string[];
  mistakeToAvoid: string;
}

export interface CompostRecipe {
  id: string;
  name: string;
  duration: string;
  difficulty: 'Básico' | 'Intermedio';
  bestFor: string;
  ingredients: string[];
  steps: string[];
  readySign: string;
  caution: string;
}

export interface CompostSpecializationItem {
  id: 'compost-vegetal' | 'lombricompost' | 'boñiga-gallinaza' | 'bokashi';
  option: string;
  ecotronLine: string;
  howToUse: string;
  safeCropsNote: string;
  warningNote?: string;
  defaultDosePerSqm: number;
  sourceLabel: string;
  sourceUrl: string;
}

export interface AgroLibraryCard {
  id: string;
  category: 'Caldos minerales' | 'Bioinsumos y extractos' | 'Plagas y MIP' | 'Suelos y Tilarán' | 'Empaques seguros';
  title: string;
  riskLevel: 'Bajo riesgo' | 'Con supervisión docente' | 'Uso técnico / SFE';
  summary: string;
  ingredientsOrTools: string[];
  preparationOrMethod: string[];
  preventionRule: string;
}

export interface AnnualPlanMonth {
  month: string;
  climateTilaran: string;
  huertaFocus: string;
  ecotronFocus: string;
}

export const TILARAN_CLIMATE_PROFILE = {
  zone: 'Tilarán, Guanacaste, Costa Rica (~560–850 m.s.n.m.)',
  classification: 'Transición bosque húmedo premontano con marcada influencia del Lago Arenal',
  seasons: [
    {
      name: 'Época seca ventosa (Noviembre – Abril)',
      conditions: 'Vientos alisios muy fuertes, ráfagas frías por la tarde y alta evaporación superficial.',
      actions: [
        'Instalar barreras rompevientos (zacate limón, gandul, madero negro o malla sarán al 50 %) en el lado noreste/este.',
        'Colocar acolchado (mulch) de hojarasca o pasto seco sobre las eras para conservar humedad.',
        'Tutorear fuerte el tomate, el chile y el pepino desde etapa temprana para evitar quiebres de tallo.',
        'Regar al amanecer o al caer la tarde para evitar evaporación rápida por viento.',
      ],
    },
    {
      name: 'Época lluviosa intensa (Mayo – Octubre)',
      conditions: 'Aguaceros frecuentes, alta humedad relativa y riesgo de encharcamiento y hongos foliares.',
      actions: [
        'Construir eras altas (lomillos de 20 a 30 cm de altura) y zanjas de desagüe perimetrales.',
        'Usar microtúnel o techo plástico transparente en almácigos y tomate para evitar golpe directo de lluvia.',
        'Ampliar distancia entre plantas (25–35 cm en lechuga/chile) para mejorar ventilación.',
        'Aplicar prevención temprana (poda de hojas bajas, drenaje y caldos preventivos supervisados si hay brote).',
      ],
    },
  ],
};

export const APRENDE_STEPS: LearningStep[] = [
  {
    step: 1,
    title: 'Elegir el lugar y frenar el viento de Tilarán',
    summary: 'Antes de mover tierra, observa por dónde entra el sol de la mañana y por dónde soplan las ráfagas del noreste.',
    tilaranNote: 'En Tilarán el viento alisio seca las plántulas y quiebra tallos tiernos. Una barrera viva o malla en el borde norte-este marca toda la diferencia.',
    actionChecklist: [
      'Asegurar al menos 5–6 horas de sol directo al día.',
      'Orientar las eras con pendiente suave para que corra el agua de lluvia sin lavar la tierra.',
      'Colocar barrera rompevientos (zacate limón, vetiver o malla sarán) sin tapar el sol.',
    ],
    mistakeToAvoid: 'Sembrar en un sitio donde se empoza el agua o expuesto de frente al viento sin cobertura.',
  },
  {
    step: 2,
    title: 'Construir eras altas (lomillos) con buen drenaje',
    summary: 'La raíz necesita aire tanto como agua. En zonas lluviosas las eras planas se encharcan y pudren la raíz.',
    tilaranNote: 'Levanta eras de 1 metro de ancho y 20–30 cm de alto con zanjas de 40 cm entre eras para evacuar aguaceros de mayo a noviembre.',
    actionChecklist: [
      'Descompactar los primeros 20–25 cm con pala o bieldo sin voltear capas estériles profundas.',
      'Dar forma abombada o elevada al lomillo para que el exceso de lluvia escurra hacia la zanja.',
      'Retirar piedras grandes y raíces de malezas invasoras (como pasto estrella).',
    ],
    mistakeToAvoid: 'Pisar sobre la era después de prepararla: el suelo compactado asfixia las raíces.',
  },
  {
    step: 3,
    title: 'Nutrir con compost maduro, lombricompost o bokashi',
    summary: 'El suelo vivo alimenta la planta gradualmente y retiene humedad en verano.',
    tilaranNote: 'Usa TierraViva (compost) o VermiVida (lombricompost) para mezcla base, y deja reposar BokaSuelo 7–15 días antes de sembrar.',
    actionChecklist: [
      'Incorporar 2–3 kg de compost maduro por metro cuadrado de era.',
      'Verificar que el abono huela a tierra de bosque y no esté caliente ni ácido.',
      'Guardar abonos restantes en sacos secos bajo techo.',
    ],
    mistakeToAvoid: 'Aplicar estiércol fresco o abono inmaduro en cultivos de consumo directo como lechuga o culantro.',
  },
  {
    step: 4,
    title: 'Elegir siembra directa o almácigo',
    summary: 'No todas las hortalizas nacen igual: unas odian el trasplante y otras lo agradecen.',
    tilaranNote: 'Rábano, vainica y culantro de Castilla se siembran directo; tomate, chile, lechuga y culantro coyote dan mejores resultados empezando en bandeja o vasito protegido.',
    actionChecklist: [
      'Usar regla de oro de profundidad: enterrar la semilla a 2 veces su propio tamaño.',
      'Proteger las bandejas de almácigo bajo malla o alero para evitar que la lluvia desentierre semillas.',
      'Trasplantar al final de la tarde cuando la plántula tenga 4 hojas verdaderas.',
    ],
    mistakeToAvoid: 'Enterrar demasiado profundo semillas diminutas como lechuga o culantro (no logran salir).',
  },
  {
    step: 5,
    title: 'Regar por observación (prueba del puño y dedo)',
    summary: 'El exceso de agua mata más plantas en la escuela que la falta de agua.',
    tilaranNote: 'En días nublados o lluviosos de Tilarán no se riega aunque toque turno; en verano ventoso se revisa a diario a 2–3 cm de profundidad.',
    actionChecklist: [
      'Meter el dedo 2–3 cm en el suelo: si sale húmedo y fresco, NO regar todavía.',
      'Regar siempre directo a la base del tallo, evitando mojar las hojas al anochecer.',
      'Preferir riego temprano en la mañana o al final de la tarde.',
    ],
    mistakeToAvoid: 'Regar por calendario fijo cuando ya llovió o cuando el suelo sigue saturado.',
  },
  {
    step: 6,
    title: 'Proteger el suelo con acolchado (mulch)',
    summary: 'El suelo desnudo se calienta, se agrieta en verano y salpica hongos en época lluviosa.',
    tilaranNote: 'Una capa de 3–5 cm de pasto seco sin semilla o hojarasca frena la erosión del agua y reduce el riego en enero–abril.',
    actionChecklist: [
      'Cubrir alrededor de la planta dejando 2 cm libres junto al tallo para evitar pudrición.',
      'Evitar pastos con espigas o semillas maduras para no llenar la era de maleza.',
      'Reponer la capa cuando se vaya descomponiendo e integrando al suelo.',
    ],
    mistakeToAvoid: 'Amontonar mulch húmedo pegado al cuello del tallo de chile o tomate.',
  },
  {
    step: 7,
    title: 'Prevenir plagas y enfermedades antes de curar',
    summary: 'El 80 % de los problemas se evita con buen espaciamiento, drenaje y revisión dos veces por semana.',
    tilaranNote: 'Revisar el envés de 5 hojas por era ayuda a detectar pulgón, mosca blanca o manchas de tizón a tiempo, antes de perder el cultivo.',
    actionChecklist: [
      'Instalar trampas amarillas/azules (EcoMonitor) y retirar hojas enfermas en bolsa aparte.',
      'Distinguir insectos benéficos (mariquitas, avispitas, arañas) antes de aplicar cualquier producto.',
      'Aplicar preparados preventivos solo bajo guía docente y en horario fresco.',
    ],
    mistakeToAvoid: 'Fumigar "por si acaso" sobre flores cuando hay abejas polinizando o aplicar aceite/caldo bajo el sol del mediodía.',
  },
  {
    step: 8,
    title: 'Tutoreo, podas sanitarias y cosecha limpia',
    summary: 'Levantar el tomate, chile y pepino del suelo mejora la aireación y evita pudriciones.',
    tilaranNote: 'En Tilarán la lluvia salpica esporas del suelo hacia las hojas bajas del tomate; podar las hojas inferiores hasta la primera floración previene hongos.',
    actionChecklist: [
      'Amarrar tallos sin estrangular (nudo en ocho) a estacas firmes antes de que doblen.',
      'Cosechar temprano en la mañana con tijera o cuchilla limpia.',
      'Lavar siempre hortalizas de consumo fresco con agua potable.',
    ],
    mistakeToAvoid: 'Dejar frutos podridos o enfermos en la era contaminando la siguiente cosecha.',
  },
  {
    step: 9,
    title: 'Registrar en bitácora y cerrar el ciclo con ECOTRON',
    summary: 'Lo que no se anota se olvida. Cada cultivo enseña qué funcionó mejor en nuestro clima.',
    tilaranNote: 'Los restos sanos de cosecha regresan a la compostera para producir TierraViva y los envases limpios se transforman en kits y botellas rotuladas.',
    actionChecklist: [
      'Anotar fecha de siembra, lluvias/viento fuertes, plagas observadas y peso cosechado.',
      'Separar rastrojos sanos para compost y retirar restos enfermos fuera de la compostera.',
      'Evaluar qué ajustes hacer en la próxima siembra escalonada.',
    ],
    mistakeToAvoid: 'Compostar plantas con marchitez bacteriana o virosis severa dentro de la compostera fría.',
  },
];

export const TILARAN_CROPS: CropGuide[] = [
  {
    id: 'tomate',
    name: 'Tomate',
    scientific: 'Solanum lycopersicum',
    family: 'Solanáceas',
    harvestDays: [70, 90],
    transplantDays: [25, 32],
    cycleEndDays: 135,
    difficulty: 'Intermedio',
    tilaranWindow: 'Todo el año bajo techo plástico en lluvias; al aire libre rinde mejor de diciembre a abril con barrera rompeviento.',
    windSensitivity: 'Alta',
    rainManagement: 'Muy sensible al golpe directo de lluvia: usar techo plástico transparente en mayo–noviembre y eras altas de 25–30 cm.',
    spacing: '45–50 cm entre plantas · 90–100 cm entre hileras',
    depth: '0,5 cm en almácigo; trasplantar enterrando 2–3 cm extra de tallo para mayor raíz',
    sun: 'Pleno sol (6–8 horas diarias); agradece techo ventilado en temporada de lluvias',
    soil: 'Franco, bien drenado, pH 6,0–6,8, rico en compost maduro y calcio',
    water: 'Riego constante solo en la base (sin mojar hojas). Cambios bruscos seco-húmedo rajan el fruto y causan pudrición apical.',
    nutrition: 'Base con TierraViva + VermiVida. Refuerzo moderado de BokaSuelo o NutriVerde al pie al iniciar floración y cuaje de fruto.',
    harvestText: 'De 70 a 90 días después del trasplante; cosechar al iniciar cambio de color (pintón) para mayor firmeza.',
    tips: [
      'Tutorear desde los 25 cm de altura con estacas firmes o espaldera resistente al viento de Tilarán.',
      'Eliminar brotes axilares ("chupones") semanalmente en tomate indeterminado para mejorar aireación.',
      'Podar las hojas más bajas que tocan o quedan cerca del suelo para prevenir tizón temprano y tardío.',
    ],
    diseases: [
      {
        name: 'Tizón tardío y temprano (Phytophthora / Alternaria)',
        symptom: 'Manchas oscuras acuosas o con anillos concéntricos en hojas viejas y manchas negras en tallo y fruto durante lluvias.',
        prevention: 'Mantener hojas secas con techo ventilado, podar hojas bajas, usar eras altas y prevenir con Caldo Bordelés supervisado antes de brotes.',
        diagramType: 'spots',
      },
      {
        name: 'Mosca blanca y pulgón (vectores de virus)',
        symptom: 'Insectos blancos pequeños en el envés, hojas amarillentas encrespadas hacia arriba y melaza.',
        prevention: 'Proteger almácigo con malla antiáfidos, colgar trampas amarillas EcoMonitor y rotar bioinsecticidas autorizados.',
        diagramType: 'bugs',
      },
      {
        name: 'Pudrición apical ("culo negro" del tomate)',
        symptom: 'Mancha oscura hundida en la base inferior del fruto verde o maduro.',
        prevention: 'No es hongo: se previene manteniendo riego uniforme (sin estrés hídrico por viento) y aporte adecuado de calcio/compost.',
        diagramType: 'rot',
      },
    ],
  },
  {
    id: 'castilla',
    name: 'Culantro de Castilla',
    scientific: 'Coriandrum sativum',
    family: 'Apiáceas',
    harvestDays: [35, 55],
    cycleEndDays: 65,
    difficulty: 'Principiante',
    tilaranWindow: 'Todo el año con siembra escalonada cada 15–20 días; en meses secos requiere sombra ligera y protección del viento.',
    windSensitivity: 'Media',
    rainManagement: 'El exceso de agua en lluvia compacta la cama y favorece manchas bacterianas: usar cama elevada y arena/compost para drenar.',
    spacing: '10–15 cm entre surcos · raleo ligero a 5–8 cm entre matitas',
    depth: '1–1,5 cm (presionar suavemente la semilla partida antes de sembrar)',
    sun: 'Sol de mañana; sombra parcial (30 %) en días muy calurosos para retrasar floración',
    soil: 'Suelto, fértil y húmedo pero nunca encharcado',
    water: 'Humedad constante los primeros 12 días para germinar; luego regar al pie sin salpicar tierra sobre las hojas.',
    nutrition: 'Preparar cama mezclando compost vegetal maduro (TierraViva) en la capa superficial o lombricompost antes de sembrar. Evitar estiércol fresco por contacto de hojas con la tierra.',
    harvestText: 'Cortes de hojas frescas entre 35 y 55 días después de siembra directa.',
    tips: [
      'Partir suavemente las semillas redondas (fruto doble) con un rodillo ligero antes de sembrar para duplicar nacimientos.',
      'Sembrar cada 2 semanas una franja pequeña para tener cosecha continua en el comedor.',
      'Cosechar antes de que emita tallo floral alto.',
    ],
    diseases: [
      {
        name: 'Mancha foliar bacteriana',
        symptom: 'Puntos oscuros húmedos en las hojas que luego se secan.',
        prevention: 'Regar por la mañana en la base, no trabajar las eras cuando el follaje está mojado y evitar salpicaduras con mulch fino.',
        diagramType: 'spots',
      },
      {
        name: 'Mal de talluelo (Damping-off)',
        symptom: 'Plántulas recién nacidas se doblan y mueren a ras del suelo.',
        prevention: 'No sembrar demasiado denso, usar sustrato limpio y evitar riegos pesados de tarde.',
        diagramType: 'rot',
      },
      {
        name: 'Pulgones en brotes',
        symptom: 'Colonias verdes o negras en pecíolos y hojas jóvenes deformadas.',
        prevention: 'Favorecer mariquitas, retirar focos iniciales y aplicar solución jabonosa/RepelVerde con suficiente tiempo antes del corte.',
        diagramType: 'bugs',
      },
    ],
  },
  {
    id: 'coyote',
    name: 'Culantro coyote',
    scientific: 'Eryngium foetidum',
    family: 'Apiáceas',
    harvestDays: [90, 120],
    transplantDays: [35, 45],
    cycleEndDays: 320,
    difficulty: 'Principiante',
    tilaranWindow: 'Excelente adaptación todo el año en Tilarán bajo semisombra; aprovecha muy bien la humedad de la zona.',
    windSensitivity: 'Baja',
    rainManagement: 'Tolera bien la lluvia si está en lomillo drenado; en charcos prolongados se pudre el cuello.',
    spacing: '20–25 cm entre plantas (espacio para roseta ancha)',
    depth: 'Semilla muy pequeña: sembrar superficialmente en almácigo sin tapar grueso',
    sun: 'Sombra parcial (50–70 % bajo sarán o árboles claros); el sol directo endurece y amarillea las hojas',
    soil: 'Fértil, rico en materia orgánica y húmedo pero drenado',
    water: 'Mantener humedad pareja sin secar por completo.',
    nutrition: 'Compost vegetal maduro (TierraViva) o lombricompost en la siembra y refuerzo moderado en la base tras cada corte. Evitar estiércol fresco por seguridad alimentaria.',
    harvestText: 'Primera cosecha a los 3–4 meses; luego permite cortes sucesivos cada 45–60 días.',
    tips: [
      'Cortar las espigas florales apenas aparecen para que la planta siga produciendo hojas anchas y tiernas.',
      'Cosechar solo hojas externas dejando el cogollo central intacto para rebrote.',
      'Es más perenne que el culantro de Castilla: una buena era dura muchos meses.',
    ],
    diseases: [
      {
        name: 'Pudrición de cuello',
        symptom: 'Centro de la roseta blando, amarilleamiento rápido y olor desagradable.',
        prevention: 'Evitar sembrar profundo enterrando el cogollo y garantizar drenaje en invierno.',
        diagramType: 'rot',
      },
      {
        name: 'Babosas y caracoles',
        symptom: 'Mordeduras limpias en bordes de hojas, sobre todo en semisombra húmeda.',
        prevention: 'Limpiar refugios de madera/maleza alrededor, colocar barreras de ceniza seca o recolección manual al amanecer.',
        diagramType: 'holes',
      },
    ],
  },
  {
    id: 'rabano',
    name: 'Rábano',
    scientific: 'Raphanus sativus',
    family: 'Brassicáceas',
    harvestDays: [24, 35],
    cycleEndDays: 42,
    difficulty: 'Principiante',
    tilaranWindow: 'Todo el año; es el cultivo estrella para principiantes e inicio de trimestre escolar.',
    windSensitivity: 'Baja',
    rainManagement: 'Tolera bien lluvia en suelo suelto; si hay costra superficial del suelo las raíces se deforman.',
    spacing: '5–8 cm entre plantas · 15 cm entre surcos',
    depth: '1–1,5 cm en siembra directa en la cama definitiva',
    sun: 'Buena luz solar; en calor extremo agradecerá sombra ligera al mediodía',
    soil: 'Muy suelto, libre de piedras y terrones duros',
    water: 'Riego uniforme y ligero: si pasa sed en verano ventoso se vuelve leñoso, picante y agrietado.',
    nutrition: 'Mezclar compost vegetal maduro en la capa superficial o poco lombricompost. Evitar estiércol fresco en absoluto, porque el bulbo comestible crece directo en la tierra.',
    harvestText: 'De 24 a 35 días desde siembra. No dejar pasar mucho tiempo en suelo o se ahueca.',
    tips: [
      'Ideal para enseñar siembra directa, raleo y prueba de germinación de compost.',
      'Ralear dejando 6–8 cm entre plantitas a los 8 días de nacido para lograr bulbos redondos.',
      'Se puede asociar entre filas lentas de lechuga o repollo mientras estas crecen.',
    ],
    diseases: [
      {
        name: 'Gusanos cortadores y pulguillas',
        symptom: 'Pequeños agujeros redondos en hojas ("tiro de munición") o plántulas cortadas al ras.',
        prevention: 'Mantener cama libre de malezas hospederas, cubrir con malla fina los primeros días y usar ceniza o monitoreo.',
        diagramType: 'holes',
      },
      {
        name: 'Raíz rajada o hueca',
        symptom: 'Bulbo partido por la mitad o esponjoso por dentro.',
        prevention: 'Evitar ciclos de sequía seguidos de riego abundante y cosechar a tiempo (antes del día 35).',
        diagramType: 'rot',
      },
    ],
  },
  {
    id: 'chile',
    name: 'Chile (dulce y picante)',
    scientific: 'Capsicum annuum',
    family: 'Solanáceas',
    harvestDays: [75, 100],
    transplantDays: [35, 45],
    cycleEndDays: 180,
    difficulty: 'Intermedio',
    tilaranWindow: 'Excelente desarrollo; requiere almácigo protegido de lluvias fuertes y estacas contra los vientos alisios de Tilarán.',
    windSensitivity: 'Alta',
    rainManagement: 'Sensible a pudrición radicular (*Phytophthora capsici*) en terrenos planos con charcos: sembrar siempre en lomillo alto.',
    spacing: '40–50 cm entre plantas · 70–80 cm entre hileras',
    depth: '0,5 cm en almácigo; trasplantar al nivel del cuello (no enterrar el tallo demasiado)',
    sun: 'Sol pleno (mínimo 6 horas); tolera sombra muy ligera en floración intensa',
    soil: 'Muy bien drenado, suelto, pH 6,0–6,8',
    water: 'Revisar humedad a 4–5 cm de profundidad. El chile prefiere suelo húmedo sin excesos.',
    nutrition: 'Base de TierraViva o BokaSuelo reposado; apoyo de VermiVida y NutriVerde al inicio de floración y llenado de frutos.',
    harvestText: '75–100 días tras trasplante; cosechar con tijera para no desgajar ramas frágiles.',
    tips: [
      'Colocar tutor individual a cada mata de chile dulce porque el peso de frutos + viento de Tilarán quiebra el tallo.',
      'Vigilar el envés de las hojas tiernas: el ácaro blanco encrespa y vuelve coriáceos los brotes rápidamente.',
      'Cosechar el primer chile pequeño de la horqueta para estimular más ramificación y producción.',
    ],
    diseases: [
      {
        name: 'Ácaro blanco y trips',
        symptom: 'Hojas nuevas pequeñas, rizadas hacia abajo, aspecto bronceado y caída de flores.',
        prevention: 'Monitoreo semanal con lupa EcoMonitor, buena nutrición y control temprano con jabón potásico o caldo sulfocálcico muy diluido bajo guía docente.',
        diagramType: 'bugs',
      },
      {
        name: 'Marchitez por exceso de agua (Phytophthora)',
        symptom: 'Planta completa marchita de golpe aunque el suelo esté húmedo; cuello oscuro.',
        prevention: 'Lomillos altos, cero charcos, rotación de cultivos (no sembrar tras tomate o papa).',
        diagramType: 'wilt',
      },
      {
        name: 'Picudo del chile (Anthonomus eugenii)',
        symptom: 'Botones florales y chiles pequeños amarillos que caen al suelo con un punto de picadura.',
        prevention: 'Recoger y destruir inmediatamente los frutos caídos en bolsa cerrada para cortar el ciclo del insecto.',
        diagramType: 'holes',
      },
    ],
  },
  {
    id: 'lechuga',
    name: 'Lechuga',
    scientific: 'Lactuca sativa',
    family: 'Asteráceas',
    harvestDays: [45, 65],
    transplantDays: [20, 28],
    cycleEndDays: 70,
    difficulty: 'Principiante',
    tilaranWindow: 'Muy favorecida por las noches frescas de Tilarán; en verano ventoso usar acolchado y barrera.',
    windSensitivity: 'Media',
    rainManagement: 'Las lluvias fuertes rompen hojas tiernas y salpican barro; ideal bajo techo plástico alto o malla liviana.',
    spacing: '25–30 cm entre plantas',
    depth: '0,3 cm (casi superficial) en bandeja de almácigo',
    sun: 'Sol suave de mañana; sombra parcial si hay mediodía muy intenso',
    soil: 'Suelto, muy fértil y drenado',
    water: 'Humedad constante y ligera al pie, evitando mojar el corazón de la lechuga al caer la tarde.',
    nutrition: 'Compost vegetal maduro y lombricompost (VermiVida) al preparar la era o maceta. Evitar estiércol fresco y lixiviados sin estabilizar porque las hojas tocan el suelo y reciben salpicaduras.',
    harvestText: '45–65 días desde semilla; cosechar temprano en la mañana para mantener turgencia.',
    tips: [
      'No enterrar el cuello de la plántula al trasplantar para evitar pudrición basal.',
      'Dejar suficiente espacio (25–30 cm) para que circule aire y no aparezca mildiu.',
      'Preferir variedades de hoja suelta o romana resistentes al espigado.',
    ],
    diseases: [
      {
        name: 'Pudrición blanda de base (Sclerotinia / Erwinia)',
        symptom: 'Hojas inferiores pegadas al suelo se vuelven aguadas, cafés y con mal olor.',
        prevention: 'No enterrar demasiado al trasplantar, evitar riego nocturno y usar mulch seco limpio.',
        diagramType: 'rot',
      },
      {
        name: 'Babosas y orugas cortadoras',
        symptom: 'Hojas masticadas con rastros brillantes de baba.',
        prevention: 'Inspección matutina/nocturna manual y limpieza de bordes de la era.',
        diagramType: 'holes',
      },
    ],
  },
  {
    id: 'vainica',
    name: 'Vainica',
    scientific: 'Phaseolus vulgaris',
    family: 'Fabáceas',
    harvestDays: [50, 65],
    cycleEndDays: 80,
    difficulty: 'Principiante',
    tilaranWindow: 'Excelente en transición (abril-mayo y septiembre-noviembre); la vainica de mata resiste mejor el viento de Tilarán.',
    windSensitivity: 'Media',
    rainManagement: 'En lluvias intensas evitar siembra muy densa para reducir roya y antracnosis en vainas.',
    spacing: '15–20 cm entre golpes (2 semillas) · 45 cm entre surcos',
    depth: '2,5–3 cm en siembra directa',
    sun: 'Pleno sol (6 horas)',
    soil: 'Suelto, bien drenado, sin encharcamientos',
    water: 'Riego moderado; clave en floración y llenado de vainas para que no aborte flores.',
    nutrition: 'Fija su propio nitrógeno en simbiosis; basta compost maduro de base.',
    harvestText: 'Cosecha de vainas tiernas entre los 50 y 65 días, cada 3–4 días.',
    tips: [
      'Excelente cultivo para rotar después de tomate, chile o repollo porque descansa y enriquece el suelo.',
      'No trabajar entre las matas cuando están mojadas por lluvia o rocío para no dispersar hongos.',
      'Si se usa variedad de enrame, asegurar espaldera muy firme contra vientos alisios.',
    ],
    diseases: [
      {
        name: 'Roya y mancha angular',
        symptom: 'Pústulas color óxido o manchas angulares en hojas viejas.',
        prevention: 'Buena distancia entre surcos, no manipular follaje mojado y rotar con gramíneas o solanáceas.',
        diagramType: 'spots',
      },
      {
        name: 'Chicharrita y mosca blanca',
        symptom: 'Bordes de hojas encorvados y amarillentos; insectos pequeños que saltan al tocar la mata.',
        prevention: 'Monitoreo con trampas amarillas y conservación de depredadores naturales.',
        diagramType: 'bugs',
      },
    ],
  },
  {
    id: 'pepino',
    name: 'Pepino',
    scientific: 'Cucumis sativus',
    family: 'Cucurbitáceas',
    harvestDays: [50, 65],
    cycleEndDays: 90,
    difficulty: 'Intermedio',
    tilaranWindow: 'Rinde muy bien guiado en espaldera vertical protegida del viento directo.',
    windSensitivity: 'Alta',
    rainManagement: 'Guiarlo en malla vertical evita que los frutos toquen barro húmedo y reduce mildiu velloso.',
    spacing: '35–40 cm entre plantas en espaldera',
    depth: '2 cm directo o en bolsa de sustrato suave (no dañar raíces al pasar)',
    sun: 'Pleno sol; necesita abejas y polinizadores activos en la mañana',
    soil: 'Rico en materia orgánica y de drenaje rápido',
    water: 'Riego frecuente y parejo en la base; la falta de agua vuelve amargo el pepino.',
    nutrition: 'TierraViva + VermiVida en la base y refuerzo ligero al iniciar floración.',
    harvestText: '50–65 días; cosechar verde firme antes de que amarillee o endurezca semillas.',
    tips: [
      'Guiar zarcillos en malla desde el inicio libera espacio en la era y produce frutos rectos y limpios.',
      'Nunca aplicar insecticidas en la mañana cuando las flores amarillas están abiertas con abejas.',
      'Combinar con flores (tagetes/caléndula o albahaca) cerca para atraer polinizadores.',
    ],
    diseases: [
      {
        name: 'Mildiu velloso y oídio',
        symptom: 'Manchas amarillas angulares delimitadas por las venas o polvo blanco harinoso en hojas.',
        prevention: 'Tutorado vertical para ventilación máxima, riego al pie y eliminación temprana de hojas viejas afectadas.',
        diagramType: 'spots',
      },
      {
        name: 'Gusano perforador del fruto (Diaphania)',
        symptom: 'Orificios en frutos jóvenes y hojas pegadas con seda.',
        prevention: 'Revisión temprana del envés y flores, remoción manual y trampas de luz/monitoreo.',
        diagramType: 'holes',
      },
    ],
  },
];

export const COMPOST_SPECIALIZATION: CompostSpecializationItem[] = [
  {
    id: 'compost-vegetal',
    option: 'Compost vegetal maduro',
    ecotronLine: 'ECOTRON TierraViva (10, 25 y 45 kg)',
    howToUse:
      'Mézclalo con la capa superficial de la tierra antes de sembrar. Se puede hacer con hojas secas, restos vegetales de cocina y podas picadas. Es una buena opción para los cinco cultivos (culantro, rábano, chile, tomate y lechuga).',
    safeCropsNote: 'Apto para los cinco cultivos principales de la huerta escolar.',
    defaultDosePerSqm: 3,
    sourceLabel: 'Guía de compostaje de la UNED',
    sourceUrl: 'https://revistas.uned.ac.cr/index.php/biocenosis/es/article/download/5082/7222/24523?inline=1',
  },
  {
    id: 'lombricompost',
    option: 'Lombricompost o humus de lombriz',
    ecotronLine: 'ECOTRON VermiVida (Bolsas y sacos)',
    howToUse:
      'Úsalo como complemento, mezclado con la tierra. Es práctico cuando tienes poco espacio, en almácigos o cuando vas a sembrar en macetas y botellas reutilizadas.',
    safeCropsNote: 'Ideal en macetas, espacios reducidos, almácigos y los cinco cultivos.',
    defaultDosePerSqm: 2,
    sourceLabel: 'Nota técnica de la UCR',
    sourceUrl:
      'https://www.cia.ucr.ac.cr/sites/default/files/2021-09/Nota%20tecnica%202_2014%20Elaboracion%20de%20abonos%20organicos%20en%20Costa%20Rica.pdf',
  },
  {
    id: 'boñiga-gallinaza',
    option: 'Compost de boñiga o gallinaza bien compostada',
    ecotronLine: 'Lotes con tratamiento térmico verificado',
    howToUse:
      'Si consigues un producto cuyo tratamiento puedas verificar, puedes incorporarlo antes de plantar (preferiblemente en tomate o chile con antelación previa).',
    safeCropsNote: 'Uso previo controlado en tomate y chile únicamente tras compostaje verificado.',
    warningNote:
      'Para el rábano, la lechuga y el culantro, evitar el estiércol fresco, porque la parte comestible puede tocar la tierra o recibir salpicaduras.',
    defaultDosePerSqm: 2,
    sourceLabel: 'Guía de manejo seguro de abonos de origen animal',
    sourceUrl: 'https://www.pubs.ext.vt.edu/content/pubs_ext_vt_edu/en/FST/FST-39/FST-39NP.html',
  },
  {
    id: 'bokashi',
    option: 'Bokashi',
    ecotronLine: 'ECOTRON BokaSuelo (10, 25 y 45 kg)',
    howToUse:
      'Abono orgánico fermentado de liberación rápida y alta actividad microbiana. Mézclalo con la tierra de 7 a 15 días antes de sembrar o trasplantar para nutrir tomate, chile y preparación de eras sin quemar raíces.',
    safeCropsNote: 'Excelente en preparación previa de eras, tomate, chile y reposición de suelo.',
    warningNote:
      'Debe estar frío, seco y reposado en el suelo 7–15 días antes de colocar plántulas o semillas tiernas.',
    defaultDosePerSqm: 2.5,
    sourceLabel: 'Nota técnica de abonos orgánicos UCR',
    sourceUrl:
      'https://www.cia.ucr.ac.cr/sites/default/files/2021-09/Nota%20tecnica%202_2014%20Elaboracion%20de%20abonos%20organicos%20en%20Costa%20Rica.pdf',
  },
];

export const COMPOST_RECIPES: CompostRecipe[] = [
  {
    id: 'compost',
    name: 'Compost vegetal maduro (TierraViva)',
    duration: '8 a 12 semanas',
    difficulty: 'Básico',
    bestFor: 'Mezclar con la capa superficial antes de sembrar; buena opción para los cinco cultivos principales.',
    ingredients: [
      '2 partes de material seco (hojas secas, pasto seco, aserrín sin tratar, cartón picado)',
      '1 parte de material fresco verde (restos vegetales de cocina del comedor y podas picadas sin semillas)',
      '10 % tierra fértil o compost maduro como inóculo microbiano',
      'Agua limpia hasta lograr humedad de esponja exprimida',
    ],
    steps: [
      'Colocar una base de ramas delgadas (10 cm) para permitir entrada de aire desde abajo.',
      'Alternar capas de 15 cm de material seco y 8 cm de restos vegetales picados.',
      'Humedecer cada capa sin encharcar (al apretar un puño debe sentirse húmedo sin escurrir gotas).',
      'Monitorear temperatura y voltear la pila cada 7–10 días para oxigenar el centro.',
      'Cuando ya no caliente tras el volteo y huela a tierra de bosque, tamizar y empacar en sacos.',
    ],
    readySign: 'Color café oscuro uniforme, textura suelta, temperatura ambiente y olor agradable a bosque húmedo.',
    caution: 'No agregar carnes, lácteos, aceites de cocina, heces de mascotas ni plantas con enfermedades severas.',
  },
  {
    id: 'lombricompost',
    name: 'Lombricompost o humus de lombriz (VermiVida)',
    duration: '6 a 10 semanas tras precompostado',
    difficulty: 'Básico',
    bestFor: 'Complemento mezclado con la tierra; muy práctico en espacios pequeños, macetas y almácigos.',
    ingredients: [
      'Pie de cría de lombriz roja californiana (Eisenia fetida)',
      'Restos vegetales precompostados 15–20 días (fríos y sin fermentación ácida)',
      'Cama de fibra/hojarasca húmeda bajo sombra',
    ],
    steps: [
      'Asegurar techo de sombra y buen drenaje en el módulo para que no se inunde con lluvias de Tilarán.',
      'Colocar capas delgadas (5–8 cm) de alimento precompostado en un extremo o franja.',
      'Mantener humedad constante (70–75 %) y revisar que no lleguen hormigas o calor.',
      'Cosechar por migración colocando alimento fresco en un lado durante 1 semana antes de retirar el humus.',
      'Tamizar suavemente y empacar en bolsas o sacos ventilados.',
    ],
    readySign: 'Gránulos negros finos tipo borra de café, sin restos reconocibles ni olores ácidos.',
    caution: 'Evitar exceso de cítricos, cebolla o material caliente fresco que queme o ahuyente a las lombrices.',
  },
  {
    id: 'boniga-gallinaza',
    name: 'Compost de boñiga o gallinaza bien compostada',
    duration: '10 a 14 semanas (tratamiento verificado)',
    difficulty: 'Intermedio',
    bestFor: 'Incorporar antes de plantar tomate o chile únicamente cuando el compostaje térmico está verificado.',
    ingredients: [
      'Boñiga o gallinaza seca de origen conocido (sin residuos veterinarios recientes)',
      '2 a 3 partes de material rico en carbono (cascarilla de arroz, hojarasca o pasto seco picado)',
      'Agua limpia y termómetro o varilla metálica para verificar calentamiento de la pila',
    ],
    steps: [
      'Mezclar el estiércol con abundante material seco para evitar malos olores y exceso de amoníaco.',
      'Mantener fase termofílica controlada (55–65 °C por varios días con volteos) para reducir patógenos y semillas de malezas.',
      'Completar la fase de maduración hasta que vuelva a temperatura ambiente y pierda olor fuerte.',
      'Verificar trazabilidad y madurez antes de incorporar al suelo previo a la plantación.',
    ],
    readySign: 'Sin olor amoniacal ni a estiércol fresco, frío al tacto, textura terrosa y color marrón oscuro.',
    caution: 'Para rábano, lechuga y culantro EVITAR estiércol fresco, porque la parte comestible toca la tierra o recibe salpicaduras.',
  },
  {
    id: 'bokashi',
    name: 'Bokashi (BokaSuelo fermentado)',
    duration: '15 a 21 días',
    difficulty: 'Intermedio',
    bestFor: 'Abono rápido de alta fertilidad incorporado 7–15 días antes de trasplantar en eras o sacos productivos.',
    ingredients: [
      '3 sacos de tierra negra cernida o mantillo de bosque',
      '3 sacos de cascarilla/granza de arroz o paja picada fina',
      '2 sacos de gallinaza seca madura o compost vegetal fino',
      '1 saco de carbón vegetal molido fino + 1 saco de semolina/salvado de arroz',
      '1–2 litros de melaza disuelta en agua tibia + levadura o microorganismos de montaña',
    ],
    steps: [
      'Mezclar primero los ingredientes secos en piso techado formando una pila homogénea.',
      'Disolver la melaza y levadura en agua limpia y humedecer gradualmente hasta prueba del puño firme.',
      'Tapar con lona o sacos el primer día; revisar temperatura dos veces al día.',
      'Voltear cuando la pila se acerque a 48–50 °C y extender gradualmente para bajar temperatura.',
      'Dejar secar a la sombra hasta alcanzar temperatura ambiente antes de ensacar.',
    ],
    readySign: 'Color grisáceo/café uniforme, seco al tacto, frío y olor suave a pan o fermento dulce.',
    caution: 'Nunca dejar que supere 55 °C ni aplicar caliente directo sobre raíces recién sembradas.',
  },
];

export const AGRO_LIBRARY: AgroLibraryCard[] = [
  {
    id: 'lib-bordeles',
    category: 'Caldos minerales',
    title: 'Caldo Bordelés al 1 % (Preventivo fúngico)',
    riskLevel: 'Con supervisión docente',
    summary: 'Clásico fungicida mineral preventivo contra tizón y mildiu en épocas lluviosas de Tilarán.',
    ingredientsOrTools: [
      '100 g de sulfato de cobre + 100 g de cal hidratada agrícola para 10 litros de agua',
      '2 baldes plásticos limpios (NUNCA metálicos) y palo de madera',
      'Guantes, gafas, mascarilla y hoja metálica limpia (machete) o tira pH',
    ],
    preparationOrMethod: [
      'Disolver el sulfato de cobre en 5 litros de agua en el balde A.',
      'Disolver la cal hidratada en 5 litros de agua en el balde B.',
      'Verter lentamente la mezcla azul (cobre) sobre la lechada blanca (cal) agitando siempre.',
      'Comprobar pH neutro (7,0) sumergiendo un machete limpio 1 minuto: si no se oxida/mancha de cobre, está neutro; si mancha, agregar un poco más de cal.',
    ],
    preventionRule: 'Usar de forma preventiva antes de lluvia fuerte, no aplicar en flor abierta y respetar días de espera antes de cosechar.',
  },
  {
    id: 'lib-sulfocalcico',
    category: 'Caldos minerales',
    title: 'Caldo Sulfocálcico (Ácaros, oídio y podas)',
    riskLevel: 'Uso técnico / SFE',
    summary: 'Caldo mineral concentrado obtenido por cocción de azufre y cal bajo protocolo estricto docente.',
    ingredientsOrTools: [
      'Proporción clásica 2 partes azufre : 1 parte cal viva/hidratada : 10 partes agua',
      'Olla exclusiva al aire libre, paleta de madera y EPP completo',
      'Botellas plásticas gruesas limpias, sin etiquetas de bebida y selladas',
    ],
    preparationOrMethod: [
      'Hervir el agua, agregar el azufre formando pasta sin grumos y luego incorporar la cal gradualmente.',
      'Cocinar a fuego constante 45–60 min removiendo hasta lograr color rojo vino ladrillo.',
      'Dejar enfriar totalmente, decantar el líquido y envasar con sello de seguridad.',
      'Para uso en huerta diluir estrictamente (15–25 ml/L) en horario fresco.',
    ],
    preventionRule: 'No usar en cucurbitáceas sensibles con sol fuerte, no mezclar con aceites ni almacenar al alcance de estudiantes sin supervisión.',
  },
  {
    id: 'lib-botellas',
    category: 'Empaques seguros',
    title: 'Protocolo de triple lavado y rotulado para botellas plásticas',
    riskLevel: 'Bajo riesgo',
    summary: 'Norma obligatoria de seguridad escolar para reutilizar botellas plásticas en ECOTRON.',
    ingredientsOrTools: [
      'Botellas PET limpias (400 ml, 800 ml, 1 L, 3 L) nunca usadas con químicos tóxicos previos',
      'Agua limpia, detergente biodegradable y cloro muy diluido o vinagre desinfectante',
      'Etiqueta ECOTRON resistente con nombre del producto, lote y advertencia "NO INGERIR"',
    ],
    preparationOrMethod: [
      'Retirar el 100 % de la etiqueta comercial de refresco o agua y limpiar restos de goma.',
      'Realizar 3 enjuagues completos agitando con tapa, luego desinfectar y dejar escurrir boca abajo hasta secar.',
      'Para biofermentos activos, verificar que haya terminado el burbujeo antes de sellar la tapa.',
      'Colocar la nueva etiqueta agrícola ECOTRON claramente visible en el frente.',
    ],
    preventionRule: 'JAMAÍS entregar un bioinsumo o caldo en una botella que conserve etiqueta de refresco, jugo o agua.',
  },
  {
    id: 'lib-sacos',
    category: 'Empaques seguros',
    title: 'Estándar de empaque en sacos (10 kg, 25 kg y 45 kg)',
    riskLevel: 'Bajo riesgo',
    summary: 'Aprovechamiento de sacos de polipropileno recuperados para vender TierraViva, VermiVida y BokaSuelo.',
    ingredientsOrTools: [
      'Sacos limpios sin huecos ni restos de agroquímicos previos',
      'Báscula o romana verificada, aguja sacadora e hilo resistente',
      'Etiqueta cosida o tarjeta adherida con lote, peso neto y cultivo recomendado',
    ],
    preparationOrMethod: [
      'Sacudir, lavar y secar completamente al sol los sacos recuperados.',
      'Pesar el abono tamizado y frío descontando la tara del saco (10, 25 o 45 kg netos).',
      'Coser firme el cierre superior e incluir tarjeta de lote y código QR del catálogo.',
      'Estibar sobre tarima de madera despegados del piso y lejos de humedad.',
    ],
    preventionRule: 'Nunca utilizar sacos que hayan contenido herbicidas, venenos o cemento sin limpiar.',
  },
  {
    id: 'lib-ajo-chile',
    category: 'Bioinsumos y extractos',
    title: 'Repelente botánico de ajo, chile y aromáticas (RepelVerde)',
    riskLevel: 'Bajo riesgo',
    summary: 'Disuasor aromático rápido para reducir presencia de pulgones y chupadores en bordes de huerta.',
    ingredientsOrTools: [
      '100 g de ajo + 50 g de chile picante o hojas aromáticas (albahaca/zacate limón)',
      '1 litro de agua limpia, colador de tela fina y guantes',
    ],
    preparationOrMethod: [
      'Machacar o licuar con parte del agua y dejar macerar 24 horas en envase tapado a la sombra.',
      'Colar doblemente por tela para evitar obstruir atomizadores.',
      'Diluir 1 parte de concentrado en 9–10 partes de agua limpia antes de aplicar al atardecer.',
    ],
    preventionRule: 'Probar en 2 hojas testigo 24 h antes y evitar aplicar con sol fuerte o sin lavado previo al consumo.',
  },
  {
    id: 'lib-drenaje-tilaran',
    category: 'Suelos y Tilarán',
    title: 'Manejo de lomillos, drenajes y barreras contra el viento en Tilarán',
    riskLevel: 'Bajo riesgo',
    summary: 'Diseño físico de huerta adaptado al viento alisio (nov–abr) y lluvias fuertes (may–nov) de Guanacaste altura.',
    ingredientsOrTools: [
      'Pala, azada, estacas de bambú/caña y nivel o cuerda',
      'Plantas barrera (zacate limón, gandul, madero negro) o malla sarán',
    ],
    preparationOrMethod: [
      'Trazar camas de máximo 1,10 m de ancho para trabajar desde los pasillos sin pisar adentro.',
      'Elevar el perfil 20–30 cm excavando los pasillos como zanjas suaves hacia un desagüe seguro.',
      'Sembrar barrera viva en el borde de entrada del viento predominante sin proyectar sombra excesiva.',
    ],
    preventionRule: 'Una hora invertida en drenaje y rompevientos ahorra semanas de enfermedades en tomate y chile.',
  },
  {
    id: 'lib-mip',
    category: 'Plagas y MIP',
    title: 'Identificación de benéficos vs plagas y trampas cromáticas',
    riskLevel: 'Bajo riesgo',
    summary: 'Regla básica antes de aplicar cualquier insumo: contar, identificar y proteger aliados.',
    ingredientsOrTools: [
      'Lupa de bolsillo y tarjetas plásticas amarillas/azules con aceite vegetal',
      'Guía de insectos benéficos (mariquitas, crisopas, sírfidos, avispas parasitoides)',
    ],
    preparationOrMethod: [
      'Colocar trampas a 15–20 cm sobre el dosel del cultivo para monitorear mosca blanca y trips.',
      'Revisar 2 veces por semana el envés de hojas viejas y tiernas.',
      'Actuar solo cuando la plaga supera umbral de daño y respetar enemigos naturales.',
    ],
    preventionRule: 'Si hay abundantes mariquitas o pupas parasitadas, evitar cualquier aplicación generalizada.',
  },
  {
    id: 'lib-seguridad-alimentaria',
    category: 'Suelos y Tilarán',
    title: 'Manejo seguro de abonos de origen animal en hortalizas frescas',
    riskLevel: 'Bajo riesgo',
    summary: 'Normas sanitarias clave para rábano, lechuga y culantro frente a compost de boñiga o gallinaza.',
    ingredientsOrTools: [
      'Compost vegetal maduro (TierraViva), lombricompost (VermiVida), o compost de boñiga/gallinaza con tratamiento térmico verificado',
    ],
    preparationOrMethod: [
      'En rábano, lechuga y culantro evitar siempre el estiércol fresco, ya que la parte comestible toca la tierra o recibe salpicaduras.',
      'Si se usa compost de boñiga o gallinaza bien compostada, verificar que completó fase caliente (55–65 °C) e incorporarlo antes de plantar en cultivos altos como tomate o chile.',
      'Preferir compost vegetal maduro de hojas secas, restos vegetales de cocina y podas picadas para siembras directas de consumo crudo.',
      'Lavar siempre todas las hortalizas cosechadas con agua potable antes de servir en el comedor o vender.',
    ],
    preventionRule: 'Ante la menor duda sobre la madurez de una boñiga o gallinaza, no usarla en hortalizas de hoja o raíz comestible.',
  },
];

export const ANNUAL_PLAN_2027: AnnualPlanMonth[] = [
  {
    month: 'Febrero',
    climateTilaran: 'Verano con vientos alisios fuertes',
    huertaFocus: 'Mantenimiento de barreras rompevientos, colchón de mulch, siembras de rábano y culantro de Castilla.',
    ecotronFocus: 'Inventario de sacos y botellas PET recuperadas; lanzamiento de venta de TierraViva y Semilla Circular.',
  },
  {
    month: 'Marzo',
    climateTilaran: 'Seco ventoso y soleado',
    huertaFocus: 'Almácigos de tomate y chile bajo sarán; riego eficiente al pie con prueba del dedo.',
    ecotronFocus: 'Ensacado de lote 2 de TierraViva (10/25/45 kg) y jornada Bandera Azul de triple lavado de botellas.',
  },
  {
    month: 'Abril',
    climateTilaran: 'Transición cálida con primeras lluvias aisladas',
    huertaFocus: 'Levantamiento y refuerzo de lomillos altos (25–30 cm) y zanjas de drenaje antes del invierno.',
    ecotronFocus: 'Preparación de pila de Bokashi y calibración de costos de sacos y etiquetas.',
  },
  {
    month: 'Mayo',
    climateTilaran: 'Inicio firme de época lluviosa',
    huertaFocus: 'Trasplante de chile, culantro coyote y tomate bajo protección de techo plástico; revisión de drenajes.',
    ecotronFocus: 'Producción supervisada de bioinsumos preventivos (RepelVerde, Caldo Bordelés de ensayo) en botellas rotuladas.',
  },
  {
    month: 'Junio',
    climateTilaran: 'Lluvias frecuentes y alta humedad',
    huertaFocus: 'Poda sanitaria de hojas bajas en tomate, tutoreo firme y monitoreo MIP semanal con EcoMonitor.',
    ecotronFocus: 'Cosecha de humus VermiVida y evaluación de ventas escolares y comunitarias de medio año.',
  },
  {
    month: 'Julio',
    climateTilaran: 'Veranillo o lluvias moderadas (receso medio año)',
    huertaFocus: 'Guardias de mantenimiento, rotación con vainica y limpieza de zanjas de desagüe.',
    ecotronFocus: 'Auditoría de inventario, respaldo JSON del sistema y mantenimiento de infraestructura.',
  },
  {
    month: 'Agosto',
    climateTilaran: 'Lluvias de segunda mitad del año',
    huertaFocus: 'Renovación de almácigos de lechuga, culantro y chile; control de babosas en semisombra.',
    ecotronFocus: 'Campaña de catálogo con código QR para familias y productores locales de Tilarán.',
  },
  {
    month: 'Septiembre',
    climateTilaran: 'Pico lluvioso (máxima prevención de hongos)',
    huertaFocus: 'Vigilancia estricta de tizón en tomate y chile; aireación y retiro de tejido afectado.',
    ecotronFocus: 'Producción de kits circulares en botellas PET de 800 ml y 3 L para feria institucional.',
  },
  {
    month: 'Octubre',
    climateTilaran: 'Lluvias intensas de cierre',
    huertaFocus: 'Cosecha escalonada y aprovechamiento total de rastrojos sanos hacia composteras.',
    ecotronFocus: 'Cierre de lotes de Bokashi y VermiVida en sacos de 25 kg para época de siembra de verano.',
  },
  {
    month: 'Noviembre',
    climateTilaran: 'Retorno de vientos alisios y fin de lluvias',
    huertaFocus: 'Refuerzo de tutores y barreras contra ráfagas; cierre del ciclo anual con bitácoras estudiantiles.',
    ecotronFocus: 'Informe anual financiero, fondo de reinversión 30 %, memoria Bandera Azul y respaldo total.',
  },
];
