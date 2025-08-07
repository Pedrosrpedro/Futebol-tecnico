// --- Estado do Jogo ---
const gameState = {
    managerName: null,
    userClub: null,
    currentLeagueId: null,
    currentDate: null,
    nextUserMatch: null,
    currentScreen: 'manager-creation-screen',
    currentMainContent: 'home-content',
    calendarDisplayDate: null,
    tactics: {
        formation: '4-2-3-1', mentality: 'balanced', attackingWidth: 'normal',
        buildUp: 'play_out_defence', chanceCreation: 'mixed', tempo: 'normal',
        onPossessionLoss: 'counter_press', onPossessionGain: 'counter', lineOfEngagement: 'mid_block',
        defensiveLine: 'standard', tackling: 'stay_on_feet', offsideTrap: false
    },
    squadManagement: { startingXI: {}, substitutes: [], reserves: [] },
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
    clubFinances: { balance: 0, history: [] },
    allMatches: [],
    lastMatchDateOfYear: null,
    freeAgents: [] 
};
let holidayInterval = null;
let selectedPlayerInfo = null;
let negotiationState = {};
const MAX_SUBSTITUTES = 7;

const currencyRates = { BRL: 1, USD: 5.55, EUR: 6.42 };

const prizeMoney = {
    brasileirao_a: { 1: 48.1, 2: 45.7, 3: 43.3, 4: 40.9, 5: 38.5, 6: 36.1, 7: 33.7, 8: 31.3, 9: 28.8, 10: 26.4, 11: 20.7, 12: 19.2, 13: 17.8, 14: 17.3, 15: 16.8, 16: 16.3, },
    brasileirao_b: { 1: 3.5, 2: 1.35, 3: 1.35, 4: 1.35 },
    brasileirao_c: { advancement_bonus: 0.344, participation_fee: 1.4 }
};

const positionMatrix = { 'GK': { 'GK': 0, 'CB': 4, 'LB': 4, 'RB': 4, 'CDM': 4, 'CM': 4, 'CAM': 4, 'LW': 4, 'RW': 4, 'ST': 4 }, 'CB': { 'GK': 4, 'CB': 0, 'LB': 1, 'RB': 1, 'CDM': 1, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 3, 'ST': 3 }, 'LB': { 'GK': 4, 'CB': 1, 'LB': 0, 'RB': 2, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 1, 'RW': 3, 'ST': 3 }, 'RB': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 0, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 1, 'ST': 3 }, 'CDM': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 2, 'CDM': 0, 'CM': 1, 'CAM': 2, 'LW': 3, 'RW': 3, 'ST': 3 }, 'CM': { 'GK': 4, 'CB': 2, 'LB': 2, 'RB': 2, 'CDM': 1, 'CM': 0, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 2 }, 'CAM': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 2, 'CM': 1, 'CAM': 0, 'LW': 1, 'RW': 1, 'ST': 1 }, 'LW': { 'GK': 4, 'CB': 3, 'LB': 1, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 0, 'RW': 2, 'ST': 2 }, 'RW': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 1, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 0, 'ST': 2 }, 'ST': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 0 }, };
const formationLayouts = {
    '4-4-2':    { 'GK': [7, 50],  'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'RM': [60, 85], 'CM1': [55, 60], 'CM2': [55, 40], 'LM': [60, 15], 'ST1': [85, 60], 'ST2': [85, 40] },
    '4-3-3':    { 'GK': [7, 50],  'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'CM1': [55, 70], 'CM2': [50, 50], 'CM3': [55, 30], 'RW': [80, 80], 'ST': [88, 50], 'LW': [80, 20] },
    '3-5-2':    { 'GK': [7, 50],  'CB1': [25, 70], 'CB2': [22, 50], 'CB3': [25, 30], 'RWB': [55, 88], 'CM1': [58, 65], 'CDM': [40, 50], 'CM2': [58, 35], 'LWB': [55, 12], 'ST1': [85, 65], 'ST2': [85, 35] },
    '4-2-3-1':  { 'GK': [7, 50],  'RB': [35, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [35, 15], 'CDM1': [45, 65], 'CDM2': [45, 35], 'RW': [70, 85], 'CAM': [65, 50], 'LW': [70, 15], 'ST': [88, 50] }
};
const PITCH_DIMS = { top: 0, bottom: 100, left: 0, right: 100, goalHeight: 30 };
const overallWeights = { pace: 0.15, shooting: 0.15, passing: 0.2, dribbling: 0.15, defending: 0.2, physical: 0.15 };

// --- Funções de Inicialização e Setup do Jogo ---
function startGame(team) {
    gameState.userClub = team;
    mergeAllData();

    if (typeof freeAgents !== 'undefined' && freeAgents.players) {
        gameState.freeAgents = freeAgents.players.map(p => {
            p.overall = p.overall || calculatePlayerOverall(p);
            updateMarketValue(p); // Atualiza o valor de todos para garantir consistência
            p.contractUntil = 0; 
            return p;
        });
    }

    initializeAllPlayerData();
    initializeClubFinances();
    initializeSeason();

    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;

    populateLeagueSelectors();
    showScreen('main-game-screen');
    showMainContent('home-content');
}

function initializeSeason() {
    const year = 2025 + gameState.season - 1;
    gameState.isOffSeason = false;
    gameState.newsFeed = [];

    for (const leagueId in leaguesData) {
        const leagueInfo = leaguesData[leagueId];
        const seasonStartDate = leagueInfo.leagueInfo.startDate ? `${year}-${leagueInfo.leagueInfo.startDate.substring(5)}` : `${year}-04-15`;
        const leagueStartDate = new Date(`${seasonStartDate}T12:00:00Z`);
        const isSerieC = leagueId === 'brasileirao_c';
        const schedule = generateSchedule(leagueInfo.teams, leagueInfo.leagueInfo, leagueStartDate, 0, isSerieC ? 1 : undefined);
        gameState.leagueStates[leagueId] = {
            table: initializeLeagueTable(leagueInfo.teams),
            schedule: schedule,
            serieCState: { phase: 1, groups: { A: [], B: [] }, finalists: [] }
        };
    }

    gameState.allMatches = [];
    for (const leagueId in gameState.leagueStates) {
        gameState.allMatches.push(...gameState.leagueStates[leagueId].schedule);
    }
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (gameState.allMatches.length > 0) {
        const lastMatch = gameState.allMatches[gameState.allMatches.length - 1];
        gameState.lastMatchDateOfYear = new Date(lastMatch.date);
    } else {
        gameState.lastMatchDateOfYear = new Date(`${year}-12-15T12:00:00Z`);
    }

    gameState.currentDate = new Date(`${year}-01-01T12:00:00Z`);

    gameState.matchesView.leagueId = gameState.currentLeagueId;
    gameState.tableView.leagueId = gameState.currentLeagueId;

    setupInitialSquad();
    findNextUserMatch();
    updateLeagueTable(gameState.currentLeagueId);
    updateContinueButton();
    addNews(`Começa a Temporada ${year}!`, `A bola vai rolar para a ${leaguesData[gameState.currentLeagueId].name}. Boa sorte, ${gameState.managerName}!`, true, gameState.userClub.name);
}

function mergeAllData() {
    for (const leagueId in leaguesData) {
        if (!playerBioData[leagueId] || !playerBioData[leagueId].teams) continue;

        for (const team of leaguesData[leagueId].teams) {
            const bioTeam = playerBioData[leagueId].teams.find(t => t.name === team.name);
            if (bioTeam && bioTeam.players) {
                for (const player of team.players) {
                    const bioPlayer = bioTeam.players.find(p => p.name === player.name);
                    if (bioPlayer) {
                        Object.assign(player, bioPlayer);
                    }
                }
            }
        }
    }
}

function initializeAllPlayerData() {
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            initializeAllPlayerDataForTeam(team);
        }
    }
}

function initializeAllPlayerDataForTeam(team) {
    for (const player of team.players) {
        if (!player.overall && player.attributes) {
            player.overall = calculatePlayerOverall(player);
        }
        if (typeof player.marketValue === 'string' || !player.marketValue) {
            updateMarketValue(player);
        }
    }
}

// --- Funções de Progressão, Aposentadoria e Valor ---
function calculatePlayerOverall(player) {
    // CORREÇÃO: Verifica se os atributos existem E se não estão vazios.
    if (!player.attributes || Object.keys(player.attributes).length === 0) {
        // Se não houver atributos, retorna o overall que o jogador já tinha ou um valor padrão de 50.
        return player.overall || 50;
    }
    
    let weightedSum = 0;
    for (const attr in player.attributes) {
        weightedSum += player.attributes[attr] * (overallWeights[attr] || 0);
    }
    const primaryAttrBonus = { 'ST': 'shooting', 'CAM': 'passing', 'LW': 'dribbling', 'RW': 'dribbling', 'CB': 'defending', 'GK': 'defending' };
    const primaryAttr = primaryAttrBonus[player.position];
    if (primaryAttr && player.attributes[primaryAttr]) {
        weightedSum += player.attributes[primaryAttr] * 0.05;
    }
    return Math.min(99, Math.round(weightedSum));
}

function updateMarketValue(player) {
    if (typeof player.marketValue === 'string') {
        player.marketValue = parseMarketValue(player.marketValue) * currencyRates.EUR;
    }
    
    const baseValueEUR = (player.overall / 100) ** 4 * 30000000;
    let ageMultiplier = 1.0;
    if (player.age < 21) ageMultiplier = 1.2;
    else if (player.age >= 21 && player.age <= 28) ageMultiplier = 1.5 - ((player.age - 21) * 0.05);
    else if (player.age > 28 && player.age < 33) ageMultiplier = 1.1 - ((player.age - 28) * 0.1);
    else ageMultiplier = Math.max(0.1, 0.5 - ((player.age - 33) * 0.03));
    const positionMultiplier = (['ST', 'LW', 'RW', 'CAM'].includes(player.position)) ? 1.2 : 1.0;
    let finalValueEUR = baseValueEUR * ageMultiplier * positionMultiplier;
    finalValueEUR = Math.max(10000, Math.round(finalValueEUR / 10000) * 10000);
    player.marketValue = finalValueEUR * currencyRates.EUR;
}

function generateNewPlayer(team) {
    const positions = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
    const newPlayer = {
        name: `*Novo Talento ${Math.floor(Math.random() * 1000)}`,
        position: positions[Math.floor(Math.random() * positions.length)],
        age: 17 + Math.floor(Math.random() * 4),
        attributes: {
            pace: 40 + Math.floor(Math.random() * 25),
            shooting: 40 + Math.floor(Math.random() * 25),
            passing: 40 + Math.floor(Math.random() * 25),
            dribbling: 40 + Math.floor(Math.random() * 25),
            defending: 40 + Math.floor(Math.random() * 25),
            physical: 40 + Math.floor(Math.random() * 25),
        },
        contractUntil: 36 + Math.floor(Math.random() * 25),
    };
    newPlayer.overall = calculatePlayerOverall(newPlayer);
    updateMarketValue(newPlayer);
    return newPlayer;
}

function getDevelopmentLogic(age) {
    if (age < 24) return () => (1 + Math.floor(Math.random() * 3));
    if (age < 30) return () => Math.floor(Math.random() * 2);
    if (age < 33) return () => (Math.random() < 0.2) ? (Math.random() < 0.5 ? 1 : -1) : 0;
    return (attr) => {
        let loss = Math.floor(Math.random() * 2);
        if ((attr === 'pace' || attr === 'physical') && age >= 35) {
            loss += Math.floor(Math.random() * 2);
        }
        return -loss;
    };
}

function updatePlayerDevelopment() {
    console.log("Processando desenvolvimento de jogadores para a nova temporada...");
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            const playersToRemove = [];
            const playersToAdd = [];
            for (const player of team.players) {
                player.age++;

                if (player.age >= 35 && Math.random() < (player.age - 34) / 10) {
                    playersToRemove.push(player.name);
                    playersToAdd.push(generateNewPlayer(team));
                    addNews("Fim de uma Era", `${player.name} (${player.age} anos) do ${team.name} anunciou sua aposentadoria.`, team.name === gameState.userClub.name, team.name);
                    continue;
                }
                
                const devLogic = getDevelopmentLogic(player.age);
                if (player.attributes) {
                    Object.keys(player.attributes).forEach(attr => {
                        const change = devLogic(attr);
                        player.attributes[attr] = Math.min(99, Math.max(20, player.attributes[attr] + change));
                    });
                    player.overall = calculatePlayerOverall(player);
                }
                updateMarketValue(player);
            }
            team.players = team.players.filter(p => !playersToRemove.includes(p.name));
            team.players.push(...playersToAdd);
        }
    }
}

// --- Funções de Finanças ---
function initializeClubFinances() {
    const clubFinancialData = typeof estimativaVerbaMedia2025 !== 'undefined' ? estimativaVerbaMedia2025.find(c => c.time === gameState.userClub.name) : null;
    let initialBudget = 5 * 1000000;
    if (clubFinancialData) {
        initialBudget = clubFinancialData.verba_media_estimada_milhoes_reais * 1000000;
    }
    gameState.clubFinances.balance = 0;
    gameState.clubFinances.history = [];
    addTransaction(initialBudget, "Verba inicial da temporada");
}

function addTransaction(amount, description) {
    gameState.clubFinances.history.unshift({ date: new Date(gameState.currentDate), description, amount });
    gameState.clubFinances.balance += amount;
}

// --- Funções de Progressão de Jogo (Dia, Mês, Temporada) ---
function advanceDay() {
    const today = new Date(gameState.currentDate);
    
    if (today.getMonth() === 11 && today.getDate() === 31) {
        handleEndOfSeason();
        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 1);
        gameState.currentDate = nextDay;
        triggerNewSeason();
        return;
    }

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    gameState.currentDate = nextDay;

    if (today.getDate() === 1) { 
        updateMonthlyContracts();
        handleExpiredContracts();
        aiContractManagement();
        aiTransferLogic();
        checkExpiringContracts();
    }
    
    simulateDayMatches();
    checkSeasonEvents();
    findNextUserMatch();
    Object.keys(gameState.leagueStates).forEach(id => updateLeagueTable(id));
    updateContinueButton();
    if (gameState.currentMainContent === 'calendar-content') updateCalendar();
}

function updateMonthlyContracts() {
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            for (const player of team.players) {
                if (player.contractUntil && player.contractUntil > 0) {
                    player.contractUntil--;
                }
            }
        }
    }
}

function simulateDayMatches() {
    const todayMatches = gameState.allMatches.filter(match => isSameDay(new Date(match.date), gameState.currentDate));
    for (const match of todayMatches) {
        if (match.status === 'scheduled') {
            const isUserMatch = match.home.name === gameState.userClub.name || match.away.name === gameState.userClub.name;
            if (isUserMatch && !gameState.isOnHoliday) {
                continue;
            }
            simulateSingleMatch(match, isUserMatch);
            if (match.round !== 'Amistoso') {
                const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name));
                updateTableWithResult(leagueId, match);
            }
        }
    }
}

function simulateSingleMatch(match, isUserMatch) {
    const homeTeamData = findTeamInLeagues(match.home.name);
    const awayTeamData = findTeamInLeagues(match.away.name);
    let homeStrength, awayStrength;
    if (isUserMatch && match.home.name === gameState.userClub.name) {
        homeStrength = getTeamStrength(homeTeamData, true);
        awayStrength = getTeamStrength(awayTeamData, false);
    } else if (isUserMatch && match.away.name === gameState.userClub.name) {
        homeStrength = getTeamStrength(homeTeamData, false);
        awayStrength = getTeamStrength(awayTeamData, true);
    } else {
        homeStrength = getTeamStrength(homeTeamData, false);
        awayStrength = getTeamStrength(awayTeamData, false);
    }

    // --- LÓGICA DE SIMULAÇÃO APRIMORADA ---
    homeStrength *= 1.1; // Mantém o fator casa

    // Evita divisão por zero se ambas as forças forem 0
    if (homeStrength <= 0 && awayStrength <= 0) {
        match.homeScore = 0;
        match.awayScore = 0;
        match.status = 'played';
        if (isUserMatch && match.round === 'Amistoso') showFriendlyResultModal(match);
        return;
    }

    const averageGoalsPerMatch = 2.7; // Média de gols mais realista
    const totalStrength = homeStrength + awayStrength;

    // Calcula o número esperado de gols para cada time
    let homeExpectedGoals = (homeStrength / totalStrength) * averageGoalsPerMatch;
    let awayExpectedGoals = (awayStrength / totalStrength) * averageGoalsPerMatch;

    // Adiciona um fator de aleatoriedade para mais surpresas
    homeExpectedGoals *= (0.7 + Math.random() * 0.7); // Varia entre 70% e 140%
    awayExpectedGoals *= (0.7 + Math.random() * 0.7);

    // Simula os gols minuto a minuto (uma aproximação da Distribuição de Poisson)
    let homeScore = 0;
    let awayScore = 0;
    for (let minute = 0; minute < 90; minute++) {
        if (Math.random() < homeExpectedGoals / 90) {
            homeScore++;
        }
        if (Math.random() < awayExpectedGoals / 90) {
            awayScore++;
        }
    }
    
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'played';
    if (isUserMatch && match.round === 'Amistoso') {
        showFriendlyResultModal(match);
    }
}

function getTeamStrength(teamData, isUser) {
    let strength = 0;
    if (isUser) {
        const startingXI = Object.values(gameState.squadManagement.startingXI);
        if (startingXI.length === 11 && startingXI.every(p => p)) {
            strength = startingXI.reduce((acc, player) => acc + calculateModifiedOverall(player, Object.keys(gameState.squadManagement.startingXI).find(pos => gameState.squadManagement.startingXI[pos].name === player.name)), 0) / 11;
            switch (gameState.tactics.mentality) {
                case 'very_attacking': strength *= 1.05; break;
                case 'attacking': strength *= 1.02; break;
                case 'defensive': strength *= 0.98; break;
                case 'very_defensive': strength *= 0.95; break;
            }
        } else {
            strength = teamData.players.slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11;
        }
    } else {
        strength = teamData.players.sort((a,b)=>b.overall-a.overall).slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11;
    }
    return strength;
}

function findNextUserMatch() {
    gameState.nextUserMatch = gameState.allMatches
        .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name) && new Date(m.date) >= gameState.currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

// --- Funções de Tabelas e Ligas ---
function initializeLeagueTable(teams) {
    return teams.map(team => ({
        name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    }));
}

function updateTableWithResult(leagueId, match) {
    if (!leagueId || !gameState.leagueStates[leagueId] || match.round === 'Amistoso') return;
    const leagueState = gameState.leagueStates[leagueId];
    let tableToUpdate;
    if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase > 1) {
        tableToUpdate = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name) || leagueState.serieCState.groups.B.includes(t.name));
    } else {
        tableToUpdate = leagueState.table;
    }

    const homeTeam = tableToUpdate.find(t => t.name === match.home.name);
    const awayTeam = tableToUpdate.find(t => t.name === match.away.name);
    if (!homeTeam || !awayTeam) return;

    homeTeam.played++; awayTeam.played++;
    homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; } 
    else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; } 
    else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; }
}

// --- Funções de Calendário, Jogo e Agendamento ---
function generateSchedule(teams, leagueInfo, startDate, roundOffset = 0, phase = undefined) {
    let currentMatchDate = new Date(startDate);
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) {
        clubes.push({ name: "BYE", logo: "logo_default.png" });
    }
    const numTeams = clubes.length;
    const isSerieCPhase1 = phase === 1;
    const matchesPerRound = numTeams / 2;
    let allMatches = [];
    for (let turn = 0; turn < (isSerieCPhase1 ? 1 : 2); turn++) {
        let tempClubes = [...clubes];
        for (let r = 0; r < numTeams - 1; r++) {
            for (let i = 0; i < matchesPerRound; i++) {
                const home = turn === 0 ? tempClubes[i] : tempClubes[numTeams - 1 - i];
                const away = turn === 0 ? tempClubes[numTeams - 1 - i] : tempClubes[i];
                if(home.name !== "BYE" && away.name !== "BYE") allMatches.push({home, away});
            }
            tempClubes.splice(1, 0, tempClubes.pop());
        }
    }
    const schedule = [];
    for (let i = 0; i < allMatches.length; i++) {
        if (i > 0 && i % matchesPerRound === 0) {
            const gamesPerWeek = leagueInfo.gamesPerWeek || 1;
            const daysToAdd = gamesPerWeek === 2 ? (currentMatchDate.getDay() < 4 ? 3 : 4) : 7;
            currentMatchDate.setDate(currentMatchDate.getDate() + daysToAdd);
        }
        schedule.push({ ...allMatches[i], date: new Date(currentMatchDate).toISOString(), status: 'scheduled', round: Math.floor(i / matchesPerRound) + 1 + roundOffset });
    }
    return schedule;
}

function isDateAvailableForTeam(date, teamName) {
    return !gameState.allMatches.some(match => (match.home.name === teamName || match.away.name === teamName) && isSameDay(new Date(match.date), date));
}

// --- Lógica de Fim de Temporada, Promoção e Rebaixamento ---
function triggerNewSeason() {
    gameState.season++;
    processPromotionRelegation();
    initializeSeason();
}

function checkSeasonEvents() {
    if (gameState.isOffSeason) return;

    if (leaguesData.brasileirao_c.teams.some(t => t.name === gameState.userClub.name) || gameState.currentLeagueId === 'brasileirao_c') {
        const leagueState = gameState.leagueStates['brasileirao_c'];
        const phase1Matches = leagueState.schedule.filter(m => m.round <= 19);
        if (phase1Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 1) {
            handleEndOfSerieCFirstPhase();
            return;
        }
        const phase2Matches = leagueState.schedule.filter(m => m.round > 19 && m.round <= 25);
        if (phase2Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 2) {
            handleEndOfSerieCSecondPhase();
            return;
        }
    }
}

function handleEndOfSerieCFirstPhase() {
    const leagueState = gameState.leagueStates['brasileirao_c'];
    if (leagueState.serieCState.phase !== 1) return;
    leagueState.serieCState.phase = 2;
    const fullTable = getFullFirstPhaseTableC();
    const qualified = fullTable.slice(0, 8);
    const groupA_teams = [qualified[0], qualified[3], qualified[4], qualified[7]];
    const groupB_teams = [qualified[1], qualified[2], qualified[5], qualified[6]];
    leagueState.serieCState.groups.A = groupA_teams.map(t => t.name);
    leagueState.serieCState.groups.B = groupB_teams.map(t => t.name);
    const groupA_data = groupA_teams.map(t => findTeamInLeagues(t.name));
    const groupB_data = groupB_teams.map(t => findTeamInLeagues(t.name));
    const lastRoundPhase1 = 19;
    const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round <= lastRoundPhase1).map(m => new Date(m.date))));
    const scheduleStartDate = new Date(lastMatchDate);
    scheduleStartDate.setDate(scheduleStartDate.getDate() + 7);
    const scheduleA = generateSchedule(groupA_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1);
    const scheduleB = generateSchedule(groupB_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1);
    leagueState.schedule.push(...scheduleA, ...scheduleB);
    gameState.allMatches.push(...scheduleA, ...scheduleB);
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    leagueState.table = initializeLeagueTable([...groupA_data, ...groupB_data]);
    findNextUserMatch();
    updateLeagueTable('brasileirao_c');
    const qualifiedNames = qualified.map(t => t.name).join(', ');
    const isUserTeamQualified = qualified.some(t => t.name === gameState.userClub.name);
    addNews("Definidos os classificados na Série C!", `Os 8 times que avançam para a segunda fase são: ${qualifiedNames}.`, isUserTeamQualified, qualified[0].name);
}

function handleEndOfSerieCSecondPhase() {
    const leagueState = gameState.leagueStates['brasileirao_c'];
    if (leagueState.serieCState.phase !== 2) return;
    leagueState.serieCState.phase = 3;
    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    const groupA_table = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
    const groupB_table = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
    const finalists = [groupA_table[0], groupB_table[0]];
    leagueState.serieCState.finalists = finalists.map(t => t.name);
    const promoted = [groupA_table[0], groupA_table[1], groupB_table[0], groupB_table[1]];
    const promotedNames = promoted.map(t => t.name).join(', ');
    addNews("Acesso à Série B!", `Parabéns a ${promotedNames} pelo acesso à Série B!`, promoted.some(t => t.name === gameState.userClub.name), promoted[0].name);
    const finalistData = finalists.map(t => findTeamInLeagues(t.name));
    const lastRoundPhase2 = 25;
    const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round > 19 && m.round <= lastRoundPhase2).map(m => new Date(m.date))));
    const finalStartDate = new Date(lastMatchDate);
    finalStartDate.setDate(finalStartDate.getDate() + 7);
    const finalMatches = [
        { home: finalistData[0], away: finalistData[1], date: new Date(finalStartDate).toISOString(), status: 'scheduled', round: 26 },
        { home: finalistData[1], away: finalistData[0], date: new Date(new Date(finalStartDate).setDate(finalStartDate.getDate() + 7)).toISOString(), status: 'scheduled', round: 27 }
    ];
    leagueState.schedule.push(...finalMatches);
    gameState.allMatches.push(...finalMatches);
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    findNextUserMatch();
    addNews(`Final da Série C: ${finalists[0].name} x ${finalists[1].name}!`, "Os campeões de cada grupo disputam o título.", finalists.some(t => t.name === gameState.userClub.name), finalists[0].name);
}


function handleEndOfSeason() {
    if (gameState.isOnHoliday) stopHoliday();
    if(gameState.isOffSeason) return;

    awardPrizeMoney();
    gameState.isOffSeason = true;
    gameState.nextUserMatch = null;

    const tableA = getFullSeasonTable('brasileirao_a');
    if (tableA && tableA.length > 0) { const championA = tableA[0]; addNews(`${championA.name} é o campeão do Brasileirão Série A!`, ``, championA.name === gameState.userClub.name, championA.name); }
    const tableB = getFullSeasonTable('brasileirao_b');
    if (tableB && tableB.length > 0) { const championB = tableB[0]; addNews(`${championB.name} é o campeão da Série B!`, ``, championB.name === gameState.userClub.name, championB.name); }
    const scheduleC = gameState.leagueStates['brasileirao_c'].schedule;
    const finalMatch1 = scheduleC.find(m => m.round === 26);
    const finalMatch2 = scheduleC.find(m => m.round === 27);
    if (finalMatch1 && finalMatch2 && finalMatch1.status === 'played' && finalMatch2.status === 'played') { const score1 = finalMatch1.homeScore + finalMatch2.awayScore; const score2 = finalMatch1.awayScore + finalMatch2.homeScore; const champC = score1 >= score2 ? findTeamInLeagues(finalMatch1.home.name) : findTeamInLeagues(finalMatch1.away.name); addNews(`${champC.name} é o grande campeão da Série C!`, ``, champC.name === gameState.userClub.name, champC.name); }
    showInfoModal("Fim de Temporada!", "A temporada chegou ao fim! Avance os dias até 1 de Janeiro para processar as promoções/rebaixamentos e iniciar a nova temporada.");
    updateContinueButton();
}

function awardPrizeMoney() {
    const userClubName = gameState.userClub.name;
    const userLeagueId = gameState.currentLeagueId;
    const leagueState = gameState.leagueStates[userLeagueId];

    if (!leagueState) return;

    if (userLeagueId === 'brasileirao_a') {
        const table = getFullSeasonTable('brasileirao_a');
        const userTeamRow = table.find(t => t.name === userClubName);
        if (!userTeamRow) return;
        const position = table.indexOf(userTeamRow) + 1;
        if (prizeMoney.brasileirao_a[position]) {
            const amount = prizeMoney.brasileirao_a[position] * 1000000;
            addTransaction(amount, `Premiação (${position}º lugar) - Série A`);
        }
    } else if (userLeagueId === 'brasileirao_b') {
        const table = getFullSeasonTable('brasileirao_b');
        const userTeamRow = table.find(t => t.name === userClubName);
        if (!userTeamRow) return;
        const position = table.indexOf(userTeamRow) + 1;
        if (position <= 4 && prizeMoney.brasileirao_b[position]) {
            const amount = prizeMoney.brasileirao_b[position] * 1000000;
            addTransaction(amount, `Premiação (Acesso) - Série B`);
        }
    } else if (userLeagueId === 'brasileirao_c') {
        addTransaction(prizeMoney.brasileirao_c.participation_fee * 1000000, `Cota de participação - Série C`);
        const qualifiedForPhase2 = [...leagueState.serieCState.groups.A, ...leagueState.serieCState.groups.B];
        if (qualifiedForPhase2.includes(userClubName)) {
            addTransaction(prizeMoney.brasileirao_c.advancement_bonus * 1000000, `Bônus por avanço de fase - Série C`);
        }
    }
}

function processPromotionRelegation() {
    updatePlayerDevelopment();

    const tableA = getFullSeasonTable('brasileirao_a');
    const relegatedFromA = tableA.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    const tableB = getFullSeasonTable('brasileirao_b');
    const promotedFromB = tableB.slice(0, 4).map(t => findTeamInLeagues(t.name)).filter(Boolean);
    const relegatedFromB = tableB.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    const leagueStateC = gameState.leagueStates['brasileirao_c'];
    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    const groupA = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const k of tiebreakers) { if (a[k] > b[k]) return -1; if (a[k] < b[k]) return 1; } return 0; });
    const groupB = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const k of tiebreakers) { if (a[k] > b[k]) return -1; if (a[k] < b[k]) return 1; } return 0; });
    const promotedFromC = [...groupA.slice(0, 2), ...groupB.slice(0, 2)].map(t => findTeamInLeagues(t.name)).filter(Boolean);
    
    const tableCFirstPhase = getFullFirstPhaseTableC();
    const relegatedFromC = tableCFirstPhase.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);
    
    const promotedFromD = [
        { name: "Sampaio Corrêa", logo: "logo_sampaio_correa.png" },
        { name: "ASA", logo: "logo_asa.png" },
        { name: "Treze", logo: "logo_treze.png" },
        { name: "América-RN", logo: "logo_america_rn.png" }
    ];

    promotedFromD.forEach(team => {
        team.players = [];
        for (let i = 0; i < 22; i++) { team.players.push(generateNewPlayer(team)); }
        initializeAllPlayerDataForTeam(team);
    });
    
    leaguesData.brasileirao_a.teams = leaguesData.brasileirao_a.teams.filter(t => !relegatedFromA.some(r => r.name === t.name)).concat(promotedFromB);
    leaguesData.brasileirao_b.teams = leaguesData.brasileirao_b.teams.filter(t => !promotedFromB.some(p => p.name === t.name) && !relegatedFromB.some(r => r.name === t.name)).concat(relegatedFromA).concat(promotedFromC);
    leaguesData.brasileirao_c.teams = leaguesData.brasileirao_c.teams.filter(t => !promotedFromC.some(p => p.name === t.name) && !relegatedFromC.some(r => r.name === t.name)).concat(relegatedFromB).concat(promotedFromD);
    
    const userClubName = gameState.userClub.name;
    if (leaguesData.brasileirao_a.teams.some(t => t.name === userClubName)) {
        gameState.currentLeagueId = 'brasileirao_a';
    } else if (leaguesData.brasileirao_b.teams.some(t => t.name === userClubName)) {
        gameState.currentLeagueId = 'brasileirao_b';
    } else {
        gameState.currentLeagueId = 'brasileirao_c';
    }
}

function getFullSeasonTable(leagueId) {
    if (!leaguesData[leagueId]) return [];
    const fullTable = initializeLeagueTable(leaguesData[leagueId].teams);
    if (!gameState.leagueStates[leagueId]) return fullTable;
    const matches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'played');
    for (const match of matches) {
        const homeTeam = fullTable.find(t => t.name === match.home.name);
        const awayTeam = fullTable.find(t => t.name === match.away.name);
        if (!homeTeam || !awayTeam) continue;
        homeTeam.played++;
        awayTeam.played++;
        homeTeam.goalsFor += match.homeScore;
        homeTeam.goalsAgainst += match.awayScore;
        awayTeam.goalsFor += match.awayScore;
        awayTeam.goalsAgainst += match.homeScore;
        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
        if (match.homeScore > match.awayScore) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
        } else if (match.awayScore > match.homeScore) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
        } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
        }
    }
    return fullTable.sort((a, b) => {
        for (const key of leaguesData[leagueId].leagueInfo.tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });
}

function getFullFirstPhaseTableC() {
    const leagueId = 'brasileirao_c';
    const allTeamsInC = leaguesData[leagueId].teams;
    const fullTable = initializeLeagueTable(allTeamsInC);
    const matches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'played' && m.round <= 19);
    for (const match of matches) {
        const homeTeam = fullTable.find(t => t.name === match.home.name);
        const awayTeam = fullTable.find(t => t.name === match.away.name);
        if (!homeTeam || !awayTeam) continue;
        homeTeam.played++;
        awayTeam.played++;
        homeTeam.goalsFor += match.homeScore;
        homeTeam.goalsAgainst += match.awayScore;
        awayTeam.goalsFor += match.awayScore;
        awayTeam.goalsAgainst += match.homeScore;
        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
        if (match.homeScore > match.awayScore) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
        } else if (match.awayScore > match.homeScore) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
        } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
        }
    }
    return fullTable.sort((a, b) => {
        for (const key of leaguesData[leagueId].leagueInfo.tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });
}

// --- Funções de Contratos e Mercado de Transferências (IA e Jogador) ---
function aiTransferLogic() {
    if (gameState.isOffSeason) return;

    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name === gameState.userClub.name) continue;
            if (Math.random() > 0.10) continue;

            const teamOverallAvg = team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length;
            const teamReputation = (teamOverallAvg / 85) * (leagueId === 'brasileirao_a' ? 3 : (leagueId === 'brasileirao_b' ? 2 : 1));
            const weakestPlayer = [...team.players].sort((a, b) => a.overall - b.overall)[0];
            if (!weakestPlayer) continue;

            const potentialSignings = gameState.freeAgents
                .filter(p => p.position === weakestPlayer.position && p.overall > weakestPlayer.overall + 2)
                .sort((a, b) => b.overall - a.overall);

            if (potentialSignings.length > 0) {
                const targetPlayer = potentialSignings[0];
                const playerReputation = targetPlayer.overall / 80;
                const reputationDiff = teamReputation - playerReputation;
                const acceptanceChance = 0.5 + (reputationDiff * 0.5); 
                
                if (Math.random() < acceptanceChance) {
                    team.players = team.players.filter(p => p.name !== weakestPlayer.name);
                    team.players.push(targetPlayer);
                    gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== targetPlayer.name);
                    weakestPlayer.contractUntil = 0;
                    gameState.freeAgents.push(weakestPlayer);
                    addNews("Transferência!", `${team.name} contrata o agente livre ${targetPlayer.name} para reforçar seu elenco.`, false, team.name);
                }
            }
        }
    }
}

function checkExpiringContracts() {
    for (const player of gameState.userClub.players) {
        if (player.contractUntil !== null && player.contractUntil <= 2 && player.contractUntil > 0 && !player.notifiedAboutContract) {
            showUserNewsModal("Contrato Expirando!", `${player.name} tem apenas ${player.contractUntil} mes${player.contractUntil > 1 ? 'es' : ''} restantes em seu contrato. Se não for renovado, ele sairá de graça ao final do vínculo.`);
            player.notifiedAboutContract = true; 
        }
    }
}

function handleExpiredContracts() {
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            const expiredPlayers = team.players.filter(p => p.contractUntil === 0);
            if (expiredPlayers.length > 0) {
                team.players = team.players.filter(p => p.contractUntil !== 0);
                for (const player of expiredPlayers) {
                    player.contractUntil = 0;
                    gameState.freeAgents.push(player);
                    if (team.name === gameState.userClub.name) {
                        showUserNewsModal("Contrato Encerrado", `O contrato de ${player.name} chegou ao fim. Ele deixou o clube e agora é um agente livre.`);
                    }
                }
            }
        }
    }
     if (gameState.userClub.players.some(p => p.contractUntil === 0)) {
        setupInitialSquad();
    }
}

function aiContractManagement() {
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name === gameState.userClub.name) continue;

            const teamOverallAvg = team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length;

            for (const player of team.players) {
                if (player.contractUntil <= 6 && player.contractUntil > 0) {
                    const isImportant = player.overall > teamOverallAvg;
                    if (isImportant && player.age < 34 && Math.random() < 0.75) {
                        player.contractUntil += (player.age < 30 ? 36 : 12);
                    }
                } else if (player.contractUntil > 12) {
                    const isUnderperforming = player.overall < (teamOverallAvg - 5);
                    const isOld = player.age > 33;
                    if (isUnderperforming && isOld && Math.random() < 0.05) {
                         player.contractUntil = 0;
                    }
                }
            }
        }
    }
}


// --- Funções Utilitárias ---
function isSameDay(date1, date2) {
    if(!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
}

function findTeamInLeagues(teamName, isPlayerLookup = false) { 
    if (!teamName) return null; 
    if (isPlayerLookup) {
         for (const leagueId in leaguesData) {
            for (const team of leaguesData[leagueId].teams) {
                const player = team.players.find(p => p.name === teamName);
                if (player) return player;
            }
        }
    }
    for (const leagueId in leaguesData) { 
        const team = leaguesData[leagueId].teams.find(t => t.name === teamName); 
        if (team) return team; 
    }
    return null; 
}

function parseMarketValue(valueStr) {
    if (typeof valueStr !== 'string') return 0;
    const value = valueStr.replace('€', '').trim();
    const multiplier = value.slice(-1).toLowerCase();
    const numberPart = parseFloat(value.slice(0, -1));
    if (multiplier === 'm') return numberPart * 1000000;
    if (multiplier === 'k') return numberPart * 1000;
    return parseFloat(value);
}
