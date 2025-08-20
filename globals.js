// --- DADOS DOS PATROCINADORES ---
const sponsorsData = [
    // Tier 1: Série A
    { name: "PetroNacional", logo: "logo_petronacional.png", monthlyIncome: 1500000, minDivision: 1, description: "Gigante nacional do setor de energia, investindo pesado no futebol de elite." },
    { name: "Banco Imperial", logo: "logo_bancoimperial.png", monthlyIncome: 1350000, minDivision: 1, description: "Uma das maiores instituições financeiras do país, associando sua marca a campeões." },
    { name: "Quantum Telecom", logo: "logo_quantum.png", monthlyIncome: 1200000, minDivision: 1, description: "Empresa líder em tecnologia e comunicação, conectando torcedores e clubes." },
    // Tier 2: Série A & B
    { name: "AeroBrasil", logo: "logo_aerobrasil.png", monthlyIncome: 700000, minDivision: 2, description: "A principal companhia aérea do Brasil, levando os times para todas as partes do país." },
    { name: "Varejão do Povo", logo: "logo_varejao.png", monthlyIncome: 650000, minDivision: 2, description: "Rede de lojas de departamento com presença nacional e forte apelo popular." },
    { name: "Vitalis Seguros", logo: "logo_vitalis.png", monthlyIncome: 500000, minDivision: 2, description: "Seguradora que oferece proteção e tranquilidade para clubes em ascensão." },
    // Tier 3: Todas as Divisões
    { name: "Guaraná Tupi", logo: "logo_guaranatupi.png", monthlyIncome: 250000, minDivision: 3, description: "A marca de refrigerante com o sabor autêntico do Brasil, apoiando o futebol de base." },
    { name: "Supermercados Preço Bom", logo: "logo_precobom.png", monthlyIncome: 200000, minDivision: 3, description: "Rede de supermercados regional que acredita no esporte como ferramenta de união." },
    { name: "Construtora Rocha Forte", logo: "logo_rochaforte.png", monthlyIncome: 180000, minDivision: 3, description: "Empresa de construção civil que ajuda a construir os sonhos de clubes por todo o país." },
    { name: "Rede de Postos Veloz", logo: "logo_veloz.png", monthlyIncome: 150000, minDivision: 3, description: "Combustível para os times que buscam acelerar rumo à vitória." }
];

// --- Estado do Jogo (Variável Global Única) ---
const gameState = {
    managerName: null,
    userClub: null,
    currentLeagueId: null,
    currentDate: null,
    nextUserMatch: null,
    currentScreen: 'manager-creation-screen',
    currentMainContent: 'home-content',
    calendarDisplayDate: null,
    clubSponsor: null,
    tactics: {
        formation: '4-2-3-1',
        mentality: 'balanced',
        attackingWidth: 'normal',
        buildUp: 'play_out_defence',
        chanceCreation: 'mixed',
        tempo: 'normal',
        onPossessionLoss: 'counter_press',
        onPossessionGain: 'counter',
        lineOfEngagement: 'mid_block',
        defensiveLine: 'standard',
        tackling: 'stay_on_feet',
        offsideTrap: false
    },
    squadManagement: {
        startingXI: {},
        substitutes: [],
        reserves: []
    },
    isMatchLive: false,
    isPaused: false,
    matchState: null,
    isOnHoliday: false,
    holidayEndDate: null,
    newsFeed: [],
    season: 1,
    leagueStates: {},
    matchesView: { leagueId: null, round: 1 },
    tableView: { leagueId: null },
    isOffSeason: false,
    currency: 'BRL',
    clubFinances: {
        balance: 0,
        history: [],
        fixedMonthlyExpenses: 0 // NOVO: Despesas fixas mensais
    },
    allMatches: [],
    lastMatchDateOfYear: null,
    freeAgents: [],
    // Estas variáveis eram globais soltas em outros arquivos, agora centralizadas aqui
    negotiationState: {}, // Estado para negociações de contrato
    selectedPlayerInfo: null, // Jogador selecionado para táticas
    userTicketPrice: null // Preço do ingresso definido pelo usuário
};

// Variável que precisa ser global para setInterval/clearInterval
let holidayInterval = null;

// --- Constantes do Jogo ---
const MAX_SUBSTITUTES = 7;
const currencyRates = { BRL: 1, USD: 5.55, EUR: 6.42 };
const prizeMoney = {
    brasileirao_a: { 1: 48.1, 2: 45.7, 3: 43.3, 4: 40.9, 5: 38.5, 6: 36.1, 7: 33.7, 8: 31.3, 9: 28.8, 10: 26.4, 11: 20.7, 12: 19.2, 13: 17.8, 14: 17.3, 15: 16.8, 16: 16.3, },
    brasileirao_b: { 1: 3.5, 2: 1.35, 3: 1.35, 4: 1.35 },
    brasileirao_c: { advancement_bonus: 0.344, participation_fee: 1.4 }
};
const positionMatrix = {
    'GK':  { 'GK': 0, 'CB': 4, 'LB': 4, 'RB': 4, 'CDM': 4, 'CM': 4, 'CAM': 4, 'LW': 4, 'RW': 4, 'ST': 4 },
    'CB':  { 'GK': 4, 'CB': 0, 'LB': 1, 'RB': 1, 'CDM': 1, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 3, 'ST': 3 },
    'LB':  { 'GK': 4, 'CB': 1, 'LB': 0, 'RB': 2, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 1, 'RW': 3, 'ST': 3 },
    'RB':  { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 0, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 1, 'ST': 3 },
    'CDM': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 2, 'CDM': 0, 'CM': 1, 'CAM': 2, 'LW': 3, 'RW': 3, 'ST': 3 },
    'CM':  { 'GK': 4, 'CB': 2, 'LB': 2, 'RB': 2, 'CDM': 1, 'CM': 0, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 2 },
    'CAM': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 2, 'CM': 1, 'CAM': 0, 'LW': 1, 'RW': 1, 'ST': 1 },
    'LW':  { 'GK': 4, 'CB': 3, 'LB': 1, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 0, 'RW': 2, 'ST': 2 },
    'RW':  { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 1, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 0, 'ST': 2 },
    'ST':  { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 0 },
};
const formationLayouts = {
    '4-4-2': { 'GK': [7, 50], 'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'RM': [60, 85], 'CM1': [55, 60], 'CM2': [55, 40], 'LM': [60, 15], 'ST1': [85, 60], 'ST2': [85, 40] },
    '4-3-3': { 'GK': [7, 50], 'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'CM1': [55, 70], 'CM2': [50, 50], 'CM3': [55, 30], 'RW': [80, 80], 'ST': [88, 50], 'LW': [80, 20] },
    '3-5-2': { 'GK': [7, 50], 'CB1': [25, 70], 'CB2': [22, 50], 'CB3': [25, 30], 'RWB': [55, 88], 'CM1': [58, 65], 'CDM': [40, 50], 'CM2': [58, 35], 'LWB': [55, 12], 'ST1': [85, 65], 'ST2': [85, 35] },
    '4-2-3-1': { 'GK': [7, 50], 'RB': [35, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [35, 15], 'CDM1': [45, 65], 'CDM2': [45, 35], 'RW': [70, 85], 'CAM': [65, 50], 'LW': [70, 15], 'ST': [88, 50] }
};
const PITCH_DIMS = { top: 0, bottom: 100, left: 0, right: 100, goalHeight: 30 };
const overallWeights = { pace: 0.15, shooting: 0.15, passing: 0.2, dribbling: 0.15, defending: 0.2, physical: 0.15 };

const SIMULATION_DURATION_MS = 4 * 60 * 1000; // Duração da simulação de partida

// NOVAS CONSTANTES PARA INGRESSOS E ESTÁDIO (baseados na liga)
// Estes são valores base, o cálculo final considera o time, liga, etc.
const STADIUM_BASE_CAPACITY = {
    'brasileirao_a': 50000,
    'brasileirao_b': 30000,
    'brasileirao_c': 15000
};
const BASE_TICKET_PRICE = {
    'brasileirao_a': 120, // Preço base em BRL
    'brasileirao_b': 80,
    'brasileirao_c': 50
};
