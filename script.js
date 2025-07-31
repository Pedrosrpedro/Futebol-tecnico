// --- Estado do Jogo ---
const gameState = {
    managerName: null,
    userClub: null,
    currentLeagueId: null,
    currentDate: null,
    leagueTable: [],
    schedule: [],
    nextUserMatch: null,
    currentScreen: 'manager-creation-screen',
    currentMainContent: 'home-content',
    tactics: {
        formation: '4-2-3-1',
    },
    // Gerenciamento detalhado do time
    squadManagement: {
        startingXI: {}, // Ex: { 'ST': playerObject, 'GK': playerObject2 }
        substitutes: [],
        reserves: [],
    }
};

// --- Dados do Jogo (Constantes) ---
const MAX_SUBSTITUTES = 7;

// Matriz de Posições para calcular penalidades de 'overall'.
// O número representa a "distância" entre as posições. 0 = perfeito, 4 = muito ruim.
const positionMatrix = {
    'GK': { 'GK': 0, 'CB': 4, 'LB': 4, 'RB': 4, 'CDM': 4, 'CM': 4, 'CAM': 4, 'LW': 4, 'RW': 4, 'ST': 4 },
    'CB': { 'GK': 4, 'CB': 0, 'LB': 1, 'RB': 1, 'CDM': 1, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 3, 'ST': 3 },
    'LB': { 'GK': 4, 'CB': 1, 'LB': 0, 'RB': 2, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 1, 'RW': 3, 'ST': 3 },
    'RB': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 0, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 1, 'ST': 3 },
    'CDM': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 2, 'CDM': 0, 'CM': 1, 'CAM': 2, 'LW': 3, 'RW': 3, 'ST': 3 },
    'CM': { 'GK': 4, 'CB': 2, 'LB': 2, 'RB': 2, 'CDM': 1, 'CM': 0, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 2 },
    'CAM': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 2, 'CM': 1, 'CAM': 0, 'LW': 1, 'RW': 1, 'ST': 1 },
    'LW': { 'GK': 4, 'CB': 3, 'LB': 1, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 0, 'RW': 2, 'ST': 2 },
    'RW': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 1, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 0, 'ST': 2 },
    'ST': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 0 },
};

// Coordenadas [top, left] em % para cada posição em cada formação
const formationLayouts = {
    '4-4-2': { 'GK': [88, 50], 'LB': [68, 15], 'CB1': [75, 35], 'CB2': [75, 65], 'RB': [68, 85], 'LM': [45, 15], 'CM1': [50, 35], 'CM2': [50, 65], 'RM': [45, 85], 'ST1': [20, 35], 'ST2': [20, 65] },
    '4-3-3': { 'GK': [88, 50], 'LB': [70, 15], 'CB1': [75, 35], 'CB2': [75, 65], 'RB': [70, 85], 'CM1': [50, 25], 'CM2': [55, 50], 'CM3': [50, 75], 'LW': [25, 15], 'ST': [20, 50], 'RW': [25, 85] },
    '3-5-2': { 'GK': [88, 50], 'CB1': [75, 20], 'CB2': [80, 50], 'CB3': [75, 80], 'LWB': [45, 10], 'CDM': [60, 50], 'CM1': [45, 35], 'CM2': [45, 65], 'RWB': [45, 90], 'ST1': [20, 35], 'ST2': [20, 65] },
    '4-2-3-1': { 'GK': [88, 50], 'LB': [70, 15], 'CB1': [75, 35], 'CB2': [75, 65], 'RB': [70, 85], 'CDM1': [58, 35], 'CDM2': [58, 65], 'CAM': [38, 50], 'LW': [35, 18], 'RW': [35, 82], 'ST': [18, 50] },
};


// --- Funções de Navegação ---

/** Mostra uma tela principal e esconde as outras */
function showScreen(screenId) {
    const current = document.getElementById(gameState.currentScreen);
    if (current) {
        current.classList.remove('active');
    }
    const next = document.getElementById(screenId);
    if (next) {
        next.classList.add('active');
    }
    gameState.currentScreen = screenId;
}

/** Mostra um painel de conteúdo dentro da tela principal do jogo */
function showMainContent(contentId) {
    const currentPanel = document.getElementById(gameState.currentMainContent);
    if(currentPanel) currentPanel.classList.remove('active');
    
    const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`);
    if (oldMenuItem) {
        oldMenuItem.classList.remove('active');
    }

    const newPanel = document.getElementById(contentId);
    if(newPanel) newPanel.classList.add('active');
    
    const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`);
    if (newMenuItem) {
        newMenuItem.classList.add('active');
    }
    
    gameState.currentMainContent = contentId;

    if (contentId === 'tactics-content') {
        loadTacticsScreen();
    }
}

// --- Lógica de Inicialização do Jogo ---

function createManager() {
    const nameInput = document.getElementById('manager-name-input');
    if (nameInput.value.trim() === '') {
        alert('Por favor, digite seu nome.');
        return;
    }
    gameState.managerName = nameInput.value.trim();
    showScreen('start-screen');
}

function loadLeagues() {
    const leagueSelectionDiv = document.getElementById('league-selection');
    leagueSelectionDiv.innerHTML = '';
    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const leagueCard = document.createElement('div');
        leagueCard.className = 'league-card';
        leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`;
        leagueCard.addEventListener('click', () => loadTeams(leagueId));
        leagueSelectionDiv.appendChild(leagueCard);
    }
}

function loadTeams(leagueId) {
    gameState.currentLeagueId = leagueId;
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`;
        teamCard.addEventListener('click', () => startGame(team));
        teamSelectionDiv.appendChild(teamCard);
    }
    showScreen('select-team-screen');
}

function createClub() {
    const clubName = document.getElementById('club-name-input').value;
    if (!clubName) {
        alert("Por favor, preencha o nome do clube.");
        return;
    }
    
    gameState.currentLeagueId = Object.keys(leaguesData)[0]; 

    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) {
        generatedPlayers.push({
            name: `*Jogador Gerado ${i + 1}`,
            position: "Genérico",
            attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 },
            overall: 55
        });
    }

    const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers };
    startGame(newClub);
}

function startGame(team) {
    gameState.userClub = team;
    const leagueInfo = leaguesData[gameState.currentLeagueId].leagueInfo;
    const teams = leaguesData[gameState.currentLeagueId].teams;

    // Inicializa o gerenciamento do elenco
    gameState.squadManagement.reserves = [...gameState.userClub.players];
    gameState.squadManagement.startingXI = {};
    gameState.squadManagement.substitutes = [];

    gameState.currentDate = new Date(leagueInfo.startDate + 'T12:00:00');
    gameState.schedule = generateSchedule(teams, leagueInfo);
    gameState.leagueTable = initializeLeagueTable(teams);
    findNextUserMatch();

    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;
    
    loadSquadTable();
    updateLeagueTable();
    updateCalendar();
    updateContinueButton();
    
    showScreen('main-game-screen');
    showMainContent('home-content');
}

// --- Funções de Táticas ---

/** Calcula o 'overall' modificado de um jogador fora de posição */
function calculateModifiedOverall(player, targetPosition) {
    if (!player || !targetPosition || targetPosition === 'SUB' || targetPosition === 'RES') return player.overall;
    
    const naturalPosition = player.position;
    // A penalidade é progressiva. Cada "ponto de distância" na matriz tira 4 de overall.
    const penaltyFactor = 4; 
    
    const distance = positionMatrix[naturalPosition]?.[targetPosition.replace(/\d/g, '')] ?? 4; // Remove números (CB1 -> CB) e calcula
    const penalty = distance * penaltyFactor;

    return Math.max(40, player.overall - penalty); // Garante que o overall não seja menor que 40
}

/** Cria o 'chip' de um jogador (o elemento arrastável) */
function createPlayerChip(player, currentPosition) {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.draggable = true;
    chip.dataset.playerId = player.name; // Usando o nome como ID único

    const modifiedOverall = calculateModifiedOverall(player, currentPosition);
    let overallClass = 'player-overall';
    if (modifiedOverall < player.overall) {
        overallClass += ' penalty';
    }

    chip.innerHTML = `
        <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span>
        <span class="${overallClass}">${modifiedOverall}</span>
        <span class="player-pos">${player.position}</span>
    `;

    chip.addEventListener('dragstart', handleDragStart);
    chip.addEventListener('dragend', handleDragEnd);
    return chip;
}

/** Função principal para carregar e desenhar a tela de táticas */
function loadTacticsScreen() {
    const formation = gameState.tactics.formation;
    const field = document.querySelector('#field-container .field-background');
    const subsList = document.getElementById('substitutes-list');
    const reservesList = document.getElementById('reserves-list');

    // Limpa tudo antes de redesenhar
    field.innerHTML = '';
    subsList.innerHTML = '';
    reservesList.innerHTML = '';

    // Desenha os slots no campo
    const positions = formationLayouts[formation];
    for (const pos in positions) {
        const slot = document.createElement('div');
        slot.className = 'player-slot drop-zone';
        slot.dataset.position = pos;
        slot.style.top = `${positions[pos][0] - 8}%`;
        slot.style.left = `${positions[pos][1] - 8}%`;
        slot.innerText = pos;

        const player = gameState.squadManagement.startingXI[pos];
        if (player) {
            slot.appendChild(createPlayerChip(player, pos));
            slot.innerText = '';
        }
        
        field.appendChild(slot);
    }

    // Popula as listas
    gameState.squadManagement.substitutes.forEach(player => {
        subsList.appendChild(createPlayerChip(player, 'SUB'));
    });
    gameState.squadManagement.reserves.forEach(player => {
        reservesList.appendChild(createPlayerChip(player, 'RES'));
    });
    
    document.getElementById('subs-count').innerText = gameState.squadManagement.substitutes.length;

    // Adiciona os listeners para as drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

// --- Handlers de Drag and Drop ---
let draggedPlayerId = null;
let sourceZoneInfo = null;

function handleDragStart(e) {
    e.target.classList.add('dragging');
    draggedPlayerId = e.target.dataset.playerId;
    const sourceZone = e.target.closest('.drop-zone');
    
    if (sourceZone.classList.contains('player-slot')) {
        sourceZoneInfo = { type: 'field', position: sourceZone.dataset.position };
    } else if (sourceZone.id === 'substitutes-list') {
        sourceZoneInfo = { type: 'subs' };
    } else {
        sourceZoneInfo = { type: 'reserves' };
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedPlayerId = null;
    sourceZoneInfo = null;
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (!draggedPlayerId) return;

    const draggedPlayer = gameState.userClub.players.find(p => p.name === draggedPlayerId);
    
    const destZone = e.currentTarget;
    let destInfo;
    if (destZone.classList.contains('player-slot')) {
        destInfo = { type: 'field', position: destZone.dataset.position };
    } else if (destZone.id === 'substitutes-list') {
        destInfo = { type: 'subs' };
    } else {
        destInfo = { type: 'reserves' };
    }
    
    const playerInDestElement = destZone.querySelector('.player-chip');
    const playerInDest = playerInDestElement ? gameState.userClub.players.find(p => p.name === playerInDestElement.dataset.playerId) : null;
    
    // --- LÓGICA DE MOVIMENTAÇÃO ---
    // 1. Remove jogador da sua origem
    if (sourceZoneInfo.type === 'field') {
        delete gameState.squadManagement.startingXI[sourceZoneInfo.position];
    } else if (sourceZoneInfo.type === 'subs') {
        gameState.squadManagement.substitutes = gameState.squadManagement.substitutes.filter(p => p.name !== draggedPlayer.name);
    } else {
        gameState.squadManagement.reserves = gameState.squadManagement.reserves.filter(p => p.name !== draggedPlayer.name);
    }
    
    // 2. Adiciona o jogador que estava no destino (se houver) para a origem do arrastado
    if (playerInDest) {
        if (sourceZoneInfo.type === 'field') {
            gameState.squadManagement.startingXI[sourceZoneInfo.position] = playerInDest;
        } else if (sourceZoneInfo.type === 'subs') {
            gameState.squadManagement.substitutes.push(playerInDest);
        } else {
            gameState.squadManagement.reserves.push(playerInDest);
        }
    }

    // 3. Adiciona o jogador arrastado ao novo destino
    if (destInfo.type === 'field') {
        gameState.squadManagement.startingXI[destInfo.position] = draggedPlayer;
    } else if (destInfo.type === 'subs') {
        if (gameState.squadManagement.substitutes.length < MAX_SUBSTITUTES || playerInDest) {
            gameState.squadManagement.substitutes.push(draggedPlayer);
        } else {
             // Devolve o jogador para a origem se o banco estiver cheio e não for uma troca
             if (sourceZoneInfo.type === 'field') gameState.squadManagement.startingXI[sourceZoneInfo.position] = draggedPlayer;
             else if (sourceZoneInfo.type === 'subs') gameState.squadManagement.substitutes.push(draggedPlayer);
             else gameState.squadManagement.reserves.push(draggedPlayer);
             alert(`O banco de reservas está cheio! (Máx. ${MAX_SUBSTITUTES})`);
        }
    } else { // 'reserves'
        gameState.squadManagement.reserves.push(draggedPlayer);
    }

    loadTacticsScreen();
}

// --- Funções de Avanço e Simulação ---

function advanceDay() {
    gameState.currentDate.setDate(gameState.currentDate.getDate() + 1);
    simulateDayMatches();
    updateLeagueTable();
    updateCalendar();
    updateContinueButton();
}

function updateContinueButton() {
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "JOGAR PARTIDA";
        button.disabled = true;
    } else {
        button.innerText = "Avançar";
        button.disabled = false;
    }
}

function simulateDayMatches() {
    const todayMatches = gameState.schedule.filter(match => isSameDay(new Date(match.date), gameState.currentDate));
    for (const match of todayMatches) {
        if (match.status === 'scheduled') {
            if (match.home.name !== gameState.userClub.name && match.away.name !== gameState.userClub.name) {
                match.homeScore = Math.floor(Math.random() * 4);
                match.awayScore = Math.floor(Math.random() * 4);
                match.status = 'played';
                updateTableWithResult(match);
            }
        }
    }
}

// --- Funções de Atualização da Interface (UI) ---

function loadSquadTable() {
    const playerListDiv = document.getElementById('player-list-table');
    if (!gameState.userClub || !gameState.userClub.players) return;
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Pos.</th><th>Veloc.</th><th>Finaliz.</th><th>Passe</th><th>Drible</th><th>Defesa</th><th>Físico</th><th>GERAL</th></tr></thead><tbody>`;
    for (const player of gameState.userClub.players) {
        tableHTML += `<tr><td>${player.name}</td><td>${player.position}</td><td>${player.attributes.pace}</td><td>${player.attributes.shooting}</td><td>${player.attributes.passing}</td><td>${player.attributes.dribbling}</td><td>${player.attributes.defending}</td><td>${player.attributes.physical}</td><td><b>${player.overall}</b></td></tr>`;
    }
    tableHTML += `</tbody></table>`;
    playerListDiv.innerHTML = tableHTML;
}

function updateTableWithResult(match) {
    const homeTeam = gameState.leagueTable.find(t => t.name === match.home.name);
    const awayTeam = gameState.leagueTable.find(t => t.name === match.away.name);
    if (!homeTeam || !awayTeam) return;

    homeTeam.played++;
    awayTeam.played++;
    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) {
        homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++;
    } else if (match.awayScore > match.homeScore) {
        awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++;
    } else {
        homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1;
    }
}

function updateLeagueTable() {
    const container = document.getElementById('league-table-container');
    const tiebreakers = leaguesData[gameState.currentLeagueId].leagueInfo.tiebreakers;
    gameState.leagueTable.sort((a, b) => {
        for (const key of tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });
    let tableHTML = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`;
    gameState.leagueTable.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        tableHTML += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + 1}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

function updateCalendar() {
    const container = document.getElementById('calendar-container');
    const date = gameState.currentDate;
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `<div class="calendar-header"><h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3></div>
                <div class="calendar-grid"><div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;
    for (let i = 0; i < firstDay.getDay(); i++) { html += `<div class="calendar-day other-month"></div>`; }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const isCurrent = isSameDay(loopDate, gameState.currentDate);
        const hasMatch = gameState.schedule.some(m => isSameDay(new Date(m.date), loopDate));
        let dayClasses = 'calendar-day';
        if (hasMatch) dayClasses += ' match-day';
        if (isCurrent) dayClasses += ' current-day';
        html += `<div class="${dayClasses}">${i}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

// --- Funções Auxiliares ---

function findNextUserMatch() {
    gameState.nextUserMatch = gameState.schedule
        .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function initializeLeagueTable(teams) {
    return teams.map(team => ({
        name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    }));
}

function generateSchedule(teams, leagueInfo) {
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) { clubes.push({ name: "BYE" }); }
    const numTeams = clubes.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const firstHalfMatches = [];
    for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = clubes[match];
            const away = clubes[numTeams - 1 - match];
            if (home.name !== "BYE" && away.name !== "BYE") {
                firstHalfMatches.push({ home, away });
            }
        }
        clubes.splice(1, 0, clubes.pop());
    }
    const secondHalfMatches = firstHalfMatches.map(match => ({ home: match.away, away: match.home }));
    const allMatches = [...firstHalfMatches, ...secondHalfMatches];
    const schedule = [];
    let roundDate = new Date(leagueInfo.startDate + 'T12:00:00Z');
    for (let i = 0; i < allMatches.length; i++) {
        if (i > 0 && i % matchesPerRound === 0) {
            roundDate.setDate(roundDate.getDate() + (roundDate.getDay() === 3 ? 3 : 4));
        }
        schedule.push({ ...allMatches[i], date: new Date(roundDate).toISOString(), status: 'scheduled' });
    }
    return schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// --- Central de Eventos ---

function initializeEventListeners() {
    document.getElementById('confirm-manager-name-btn').addEventListener('click', createManager);
    document.getElementById('go-to-new-club-btn').addEventListener('click', () => showScreen('new-club-screen'));
    document.getElementById('go-to-select-league-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('create-new-club-btn').addEventListener('click', createClub);
    document.getElementById('new-club-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-league-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-team-back-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('advance-day-button').addEventListener('click', advanceDay);
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.reload());
    
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.addEventListener('click', () => showMainContent(item.dataset.content));
    });
    
    document.getElementById('tactic-formation').addEventListener('change', (e) => {
        // Antes de mudar a formação, todos os jogadores do campo voltam para a reserva
        Object.values(gameState.squadManagement.startingXI).forEach(player => {
            gameState.squadManagement.reserves.push(player);
        });
        gameState.squadManagement.startingXI = {}; // Limpa os titulares
        
        gameState.tactics.formation = e.target.value;
        loadTacticsScreen();
    });
}

// --- Inicialização do Jogo ---
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadLeagues();
});
