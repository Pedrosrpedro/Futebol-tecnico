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
    // NOVO: Estado para cada liga
    leagueStates: {},
    // NOVO: Controle de visualização
    matchesView: { leagueId: null, round: 1 },
    tableView: { leagueId: null },
};
let holidayInterval = null;
let selectedPlayerInfo = null;
const MAX_SUBSTITUTES = 7;

const positionMatrix = { 'GK': { 'GK': 0, 'CB': 4, 'LB': 4, 'RB': 4, 'CDM': 4, 'CM': 4, 'CAM': 4, 'LW': 4, 'RW': 4, 'ST': 4 }, 'CB': { 'GK': 4, 'CB': 0, 'LB': 1, 'RB': 1, 'CDM': 1, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 3, 'ST': 3 }, 'LB': { 'GK': 4, 'CB': 1, 'LB': 0, 'RB': 2, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 1, 'RW': 3, 'ST': 3 }, 'RB': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 0, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 1, 'ST': 3 }, 'CDM': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 2, 'CDM': 0, 'CM': 1, 'CAM': 2, 'LW': 3, 'RW': 3, 'ST': 3 }, 'CM': { 'GK': 4, 'CB': 2, 'LB': 2, 'RB': 2, 'CDM': 1, 'CM': 0, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 2 }, 'CAM': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 2, 'CM': 1, 'CAM': 0, 'LW': 1, 'RW': 1, 'ST': 1 }, 'LW': { 'GK': 4, 'CB': 3, 'LB': 1, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 0, 'RW': 2, 'ST': 2 }, 'RW': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 1, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 0, 'ST': 2 }, 'ST': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 0 }, };

const formationLayouts = {
    '4-4-2':    { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'RM': [50, 82], 'CM1': [55, 62], 'CM2': [55, 38], 'LM': [50, 18], 'ST1': [25, 60], 'ST2': [25, 40] },
    '4-3-3':    { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'CM1': [58, 72], 'CM2': [62, 50], 'CM3': [58, 28], 'RW': [30, 80], 'ST': [22, 50], 'LW': [30, 20] },
    '3-5-2':    { 'GK': [93, 50], 'CB1': [80, 70], 'CB2': [82, 50], 'CB3': [80, 30], 'RWB': [55, 85], 'CM1': [50, 65], 'CDM': [68, 50], 'CM2': [50, 35], 'LWB': [55, 15], 'ST1': [25, 65], 'ST2': [25, 35] },
    '4-2-3-1':  { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'CDM1': [65, 65], 'CDM2': [65, 35], 'RW': [42, 82], 'CAM': [45, 50], 'LW': [42, 18], 'ST': [20, 50] }
};

// --- Funções de Notícias ---
function addNews(headline, body, isUserRelated = false) {
    const newsItem = {
        date: new Date(gameState.currentDate),
        headline,
        body
    };
    gameState.newsFeed.unshift(newsItem);
    if (isUserRelated) showUserNewsModal(headline, body);
}

function showUserNewsModal(headline, body) {
    document.getElementById('user-news-headline').innerText = headline;
    document.getElementById('user-news-body').innerText = body;
    document.getElementById('user-news-modal').classList.add('active');
}

function displayNewsFeed() {
    const container = document.getElementById('news-feed-container');
    container.innerHTML = '';
    if (gameState.newsFeed.length === 0) {
        container.innerHTML = '<p>Nenhuma notícia por enquanto.</p>';
        return;
    }
    let newsHTML = '';
    gameState.newsFeed.forEach(item => {
        newsHTML += `
            <div class="news-article">
                <h4>${item.headline}</h4>
                <div class="news-date">${item.date.toLocaleDateString('pt-BR')}</div>
                <p class="news-body">${item.body}</p>
            </div>
        `;
    });
    container.innerHTML = newsHTML;
}

// --- Funções de UI ---
function openSettingsModal() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettingsModal() { document.getElementById('settings-modal').classList.remove('active'); }
function toggleFullScreen() { const doc = window.document; const docEl = doc.documentElement; const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen; const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen; if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) { requestFullScreen.call(docEl); } else { cancelFullScreen.call(doc); } }
function showScreen(screenId) { const current = document.getElementById(gameState.currentScreen); if (current) current.classList.remove('active'); const next = document.getElementById(screenId); if (next) next.classList.add('active'); gameState.currentScreen = screenId; }

function showMainContent(contentId) {
    clearSelection();
    const currentPanel = document.getElementById(gameState.currentMainContent);
    if(currentPanel) currentPanel.classList.remove('active');
    const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`);
    if (oldMenuItem) oldMenuItem.classList.remove('active');

    const newPanel = document.getElementById(contentId);
    if(newPanel) newPanel.classList.add('active');
    const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`);
    if (newMenuItem) newMenuItem.classList.add('active');
    gameState.currentMainContent = contentId;

    if (contentId === 'tactics-content') loadTacticsScreen();
    if (contentId === 'calendar-content') {
        gameState.calendarDisplayDate = new Date(gameState.currentDate);
        updateCalendar();
    }
    if (contentId === 'matches-content') {
        gameState.matchesView.leagueId = gameState.currentLeagueId;
        gameState.matchesView.round = findCurrentRound(gameState.currentLeagueId);
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    }
    if (contentId === 'league-content') {
        gameState.tableView.leagueId = gameState.currentLeagueId;
        updateLeagueTable(gameState.tableView.leagueId);
    }
    if (contentId === 'news-content') displayNewsFeed();
}

// --- Funções de Inicialização do Jogo ---
function createManager() { const nameInput = document.getElementById('manager-name-input'); if (nameInput.value.trim() === '') { alert('Por favor, digite seu nome.'); return; } gameState.managerName = nameInput.value.trim(); showScreen('start-screen'); }
function loadLeagues() { const leagueSelectionDiv = document.getElementById('league-selection'); leagueSelectionDiv.innerHTML = ''; for (const leagueId in leaguesData) { const league = leaguesData[leagueId]; const leagueCard = document.createElement('div'); leagueCard.className = 'league-card'; leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`; leagueCard.addEventListener('click', () => loadTeams(leagueId)); leagueSelectionDiv.appendChild(leagueCard); } }
function loadTeams(leagueId) { gameState.currentLeagueId = leagueId; const teamSelectionDiv = document.getElementById('team-selection'); teamSelectionDiv.innerHTML = ''; const teams = leaguesData[leagueId].teams; for (const team of teams) { const teamCard = document.createElement('div'); teamCard.className = 'team-card'; teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`; teamCard.addEventListener('click', () => startGame(team)); teamSelectionDiv.appendChild(teamCard); } showScreen('select-team-screen'); }
function createClub() { const clubName = document.getElementById('club-name-input').value; if (!clubName) { alert("Por favor, preencha o nome do clube."); return; } gameState.currentLeagueId = Object.keys(leaguesData)[0]; const generatedPlayers = []; for (let i = 0; i < 22; i++) { generatedPlayers.push({ name: `*Jogador Gerado ${i + 1}`, position: "CM", attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 }, overall: 55 }); } const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers }; startGame(newClub); }

function setupInitialSquad() {
    gameState.squadManagement.startingXI = {};
    gameState.squadManagement.substitutes = [];
    gameState.squadManagement.reserves = [];
    const todosJogadores = [...gameState.userClub.players].sort((a, b) => b.overall - a.overall);
    const formacao = gameState.tactics.formation;
    const posicoesDaFormacao = Object.keys(formationLayouts[formacao]);
    let jogadoresDisponiveis = [...todosJogadores];

    for (const posicaoDoEsquema of posicoesDaFormacao) {
        const posicaoBase = posicaoDoEsquema.replace(/\d/g, '');
        const indiceMelhorJogador = jogadoresDisponiveis.findIndex(p => p.position === posicaoBase);
        if (indiceMelhorJogador !== -1) {
            const jogadorEscolhido = jogadoresDisponiveis[indiceMelhorJogador];
            gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadorEscolhido;
            jogadoresDisponiveis.splice(indiceMelhorJogador, 1);
        }
    }
    for (const posicaoDoEsquema of posicoesDaFormacao) {
        if (!gameState.squadManagement.startingXI[posicaoDoEsquema] && jogadoresDisponiveis.length > 0) {
            gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadoresDisponiveis.shift();
        }
    }
    gameState.squadManagement.substitutes = jogadoresDisponiveis.splice(0, MAX_SUBSTITUTES);
    gameState.squadManagement.reserves = jogadoresDisponiveis;
}

function startGame(team) {
    gameState.userClub = team;
    initializeSeason();
    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;
    populateLeagueSelectors();
    showScreen('main-game-screen');
    showMainContent('home-content');
}

function initializeSeason() {
    const year = 2024 + gameState.season;
    const firstMatchDate = new Date(`${year}-02-01T12:00:00Z`);
    gameState.currentDate = firstMatchDate;
    
    // Inicializa o estado para todas as ligas
    for(const leagueId in leaguesData) {
        const leagueInfo = leaguesData[leagueId];
        gameState.leagueStates[leagueId] = {
            table: initializeLeagueTable(leagueInfo.teams),
            schedule: generateSchedule(leagueInfo.teams, leagueInfo),
            serieCState: { phase: 1, groups: { A: [], B: [] }, finalists: [] }
        };
    }
    
    setupInitialSquad();
    findNextUserMatch();
    loadSquadTable();
    updateLeagueTable(gameState.currentLeagueId);
    updateContinueButton();
    addNews(`Começa a Temporada ${year}!`, `A bola vai rolar para a ${leaguesData[gameState.currentLeagueId].name}. Boa sorte, ${gameState.managerName}!`, true);
}

// --- Lógica de Táticas ---
function handleTacticsInteraction(e) {
    const clickedElement = e.target.closest('[data-player-id], .player-slot, #substitutes-list, #reserves-list');
    if (!clickedElement) { clearSelection(); return; }
    const clickedPlayerId = clickedElement.dataset.playerId;

    if (clickedPlayerId) {
        const player = gameState.userClub.players.find(p => p.name === clickedPlayerId);
        const sourceInfo = getPlayerLocation(player);
        if (selectedPlayerInfo) {
            if (selectedPlayerInfo.player.name === player.name) {
                clearSelection();
            } else {
                const destPlayerInfo = { player, ...sourceInfo };
                swapPlayers(selectedPlayerInfo, destPlayerInfo);
                clearSelection();
            }
        } else {
            selectPlayer(player, sourceInfo.type, sourceInfo.id);
        }
    } else if (selectedPlayerInfo) {
        let destInfo;
        if (clickedElement.classList.contains('player-slot')) {
            destInfo = { type: 'field', id: clickedElement.dataset.position };
        } else if (clickedElement.id === 'substitutes-list') {
            destInfo = { type: 'subs', id: 'substitutes-list' };
        } else if (clickedElement.id === 'reserves-list') {
            destInfo = { type: 'reserves', id: 'reserves-list' };
        }
        if (destInfo) {
            movePlayer(selectedPlayerInfo, destInfo);
            clearSelection();
        }
    }
}
function selectPlayer(player, sourceType, sourceId) { clearSelection(); selectedPlayerInfo = { player, sourceType, sourceId }; const element = document.querySelector(`[data-player-id="${player.name}"]`); if(element) element.classList.add('selected'); }
function clearSelection() { if (selectedPlayerInfo) { const element = document.querySelector(`[data-player-id="${selectedPlayerInfo.player.name}"]`); if(element) element.classList.remove('selected'); } selectedPlayerInfo = null; }
function getPlayerLocation(player) { for (const pos in gameState.squadManagement.startingXI) { if (gameState.squadManagement.startingXI[pos]?.name === player.name) { return { type: 'field', id: pos }; } } if (gameState.squadManagement.substitutes.some(p => p && p.name === player.name)) { return { type: 'subs', id: 'substitutes-list' }; } return { type: 'reserves', id: 'reserves-list' }; }
function removePlayerFromSource(playerInfo) { if (!playerInfo || !playerInfo.player) return; if (playerInfo.sourceType === 'field') { delete gameState.squadManagement.startingXI[playerInfo.sourceId]; } else if (playerInfo.sourceType === 'subs') { gameState.squadManagement.substitutes = gameState.squadManagement.substitutes.filter(p => p && p.name !== playerInfo.player.name); } else { gameState.squadManagement.reserves = gameState.squadManagement.reserves.filter(p => p && p.name !== playerInfo.player.name); } }
function addPlayerToDest(player, destInfo) { if (destInfo.type === 'field') { gameState.squadManagement.startingXI[destInfo.id] = player; } else if (destInfo.type === 'subs') { gameState.squadManagement.substitutes.push(player); } else { gameState.squadManagement.reserves.push(player); } }
function movePlayer(playerInfo, destInfo) { if (destInfo.type === 'subs' && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { alert(`O banco de reservas está cheio! (Máx. ${MAX_SUBSTITUTES})`); return; } removePlayerFromSource(playerInfo); addPlayerToDest(playerInfo.player, destInfo); loadTacticsScreen(); }
function swapPlayers(sourcePlayerInfo, destPlayerInfo) {
    const isMovingToSubs = destPlayerInfo.type === 'subs';
    const isMovingFromSubs = sourcePlayerInfo.sourceType === 'subs';
    if (!isMovingFromSubs && isMovingToSubs && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { alert(`O banco de reservas está cheio! (Máx. ${MAX_SUBSTITUTES})`); return; }
    removePlayerFromSource(sourcePlayerInfo); removePlayerFromSource(destPlayerInfo);
    addPlayerToDest(sourcePlayerInfo.player, { type: destPlayerInfo.type, id: destPlayerInfo.id }); addPlayerToDest(destPlayerInfo.player, { type: sourcePlayerInfo.sourceType, id: sourcePlayerInfo.sourceId });
    loadTacticsScreen();
}

function calculateModifiedOverall(player, targetPosition) {
    if (!player || !targetPosition) return player ? player.overall : 0;
    const naturalPosition = player.position;
    const cleanTargetPosition = targetPosition.replace(/\d/g, '');
    if (!positionMatrix[naturalPosition] || positionMatrix[naturalPosition][cleanTargetPosition] === undefined) { return Math.max(40, player.overall - 25); }
    const distance = positionMatrix[naturalPosition][cleanTargetPosition];
    const penaltyFactor = 4;
    const penalty = distance * penaltyFactor;
    return Math.max(40, player.overall - penalty);
}

function loadTacticsScreen() { const formation = gameState.tactics.formation; const field = document.querySelector('#field-container .field-background'); const subsList = document.getElementById('substitutes-list'); const reservesList = document.getElementById('reserves-list'); field.innerHTML = ''; subsList.innerHTML = ''; reservesList.innerHTML = ''; Object.keys(gameState.tactics).forEach(key => { const elementId = `tactic-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`; const element = document.getElementById(elementId); if (element) { if (element.type === 'checkbox') { element.checked = gameState.tactics[key]; } else { element.value = gameState.tactics[key]; } } }); const positions = formationLayouts[formation]; for (const pos in positions) { const slot = document.createElement('div'); slot.className = 'player-slot'; slot.dataset.position = pos; slot.style.top = `${positions[pos][0]}%`; slot.style.left = `${positions[pos][1]}%`; const player = gameState.squadManagement.startingXI[pos]; if (player) { slot.appendChild(createPlayerChip(player, pos)); } else { slot.innerText = pos; } field.appendChild(slot); } gameState.squadManagement.substitutes.forEach(player => subsList.appendChild(createSquadListPlayer(player))); gameState.squadManagement.reserves.forEach(player => reservesList.appendChild(createSquadListPlayer(player))); document.getElementById('subs-count').innerText = gameState.squadManagement.substitutes.length; if (selectedPlayerInfo) { const element = document.querySelector(`[data-player-id="${selectedPlayerInfo.player.name}"]`); if (element) element.classList.add('selected'); } }
function createPlayerChip(player, currentPosition) { const chip = document.createElement('div'); chip.className = 'player-chip'; chip.dataset.playerId = player.name; const modifiedOverall = calculateModifiedOverall(player, currentPosition); let overallClass = 'player-overall'; if (modifiedOverall < player.overall) { overallClass += ' penalty'; } chip.innerHTML = ` <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span> <span class="${overallClass}">${modifiedOverall}</span> <span class="player-pos">${player.position}</span> `; return chip; }
function createSquadListPlayer(player) { const item = document.createElement('div'); item.className = 'squad-list-player'; item.dataset.playerId = player.name; item.innerHTML = ` <div class="player-info"> <div class="player-name">${player.name}</div> <div class="player-pos">${player.position}</div> </div> <div class="player-overall">${player.overall}</div> `; return item; }

// --- Funções de UI (Tabelas, Calendário, Jogos) ---
function loadSquadTable() { const playerListDiv = document.getElementById('player-list-table'); if (!playerListDiv) return; const positionOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']; const sortedPlayers = [...gameState.userClub.players].sort((a, b) => { return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position); }); let tableHTML = `<table><thead><tr><th>Nome</th><th>Pos.</th><th>Veloc.</th><th>Finaliz.</th><th>Passe</th><th>Drible</th><th>Defesa</th><th>Físico</th><th>GERAL</th></tr></thead><tbody>`; for (const player of sortedPlayers) { tableHTML += `<tr><td>${player.name}</td><td>${player.position}</td><td>${player.attributes.pace}</td><td>${player.attributes.shooting}</td><td>${player.attributes.passing}</td><td>${player.attributes.dribbling}</td><td>${player.attributes.defending}</td><td>${player.attributes.physical}</td><td><b>${player.overall}</b></td></tr>`; } tableHTML += `</tbody></table>`; playerListDiv.innerHTML = tableHTML; }
function updateTableWithResult(leagueId, match) {
    const table = gameState.leagueStates[leagueId].table;
    const homeTeam = table.find(t => t.name === match.home.name);
    const awayTeam = table.find(t => t.name === match.away.name);
    if (!homeTeam || !awayTeam) return;
    homeTeam.played++; awayTeam.played++; homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore; awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore; homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst; awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst; if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; } else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; } else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; }
}

function updateLeagueTable(leagueId) {
    const container = document.getElementById('league-table-container');
    if (!container) return;
    const leagueState = gameState.leagueStates[leagueId];
    const leagueInfo = leaguesData[leagueId].leagueInfo;
    const tiebreakers = leagueInfo.tiebreakers;

    let tableHTML = '';

    if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase > 1) {
        const groupA = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name));
        const groupB = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name));
        groupA.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        groupB.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        
        tableHTML += '<h4>Grupo A</h4>';
        tableHTML += renderTable(groupA);
        tableHTML += '<h4 style="margin-top: 20px;">Grupo B</h4>';
        tableHTML += renderTable(groupB);
    } else {
        const table = [...leagueState.table];
        table.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        tableHTML = renderTable(table);
    }
    
    container.innerHTML = tableHTML;
}

function renderTable(tableData) {
    let html = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`;
    tableData.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        html += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + 1}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

function updateCalendar() {
    const container = document.getElementById('calendar-container'); if (!container || !gameState.calendarDisplayDate) return;
    const date = gameState.calendarDisplayDate; const month = date.getMonth(); const year = date.getFullYear();
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0);
    let html = `<div class="calendar-header"><button id="prev-month-btn">◀</button><h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3><button id="next-month-btn">▶</button></div><div class="calendar-grid"><div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;
    for (let i = 0; i < firstDay.getDay(); i++) { html += `<div class="calendar-day other-month"></div>`; }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i); const isCurrent = isSameDay(loopDate, gameState.currentDate);
        const matchOnThisDay = gameState.leagueStates[gameState.currentLeagueId].schedule.find(m => isSameDay(new Date(m.date), loopDate) && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name));
        let dayClasses = 'calendar-day'; let dayContent = `<span class="day-number">${i}</span>`;
        if (matchOnThisDay) { dayClasses += ' match-day'; const opponent = matchOnThisDay.home.name === gameState.userClub.name ? `vs ${matchOnThisDay.away.name}` : `@ ${matchOnThisDay.home.name}`; dayContent += `<div class="match-details">${opponent}</div>`; }
        if (isCurrent) { dayClasses += ' current-day'; }
        html += `<div class="${dayClasses}" data-date="${loopDate.toISOString().split('T')[0]}">${dayContent}</div>`;
    }
    html += '</div>'; container.innerHTML = html;
    document.getElementById('prev-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() - 1); updateCalendar(); } });
    document.getElementById('next-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() + 1); updateCalendar(); } });
}

function loadMatchesPage() {
    displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
}

function displayRound(leagueId, roundNumber) {
    const container = document.getElementById('round-matches-container');
    const roundDisplay = document.getElementById('round-display');
    const prevBtn = document.getElementById('prev-round-btn');
    const nextBtn = document.getElementById('next-round-btn');
    
    const leagueState = gameState.leagueStates[leagueId];
    if (!leagueState) return;

    const matchesPerRound = leaguesData[leagueId].teams.length / 2;
    const startIndex = (roundNumber - 1) * matchesPerRound;
    const endIndex = startIndex + matchesPerRound;
    const roundMatches = leagueState.schedule.slice(startIndex, endIndex);

    roundDisplay.innerText = `Rodada ${roundNumber}`;
    container.innerHTML = '';
    
    if (!roundMatches || roundMatches.length === 0) {
        container.innerHTML = "<p>Nenhuma partida encontrada para esta rodada.</p>";
        return;
    }

    let roundHTML = '';
    for (const match of roundMatches) {
        const score = match.status === 'played' ? `${match.homeScore} - ${match.awayScore}` : 'vs';
        roundHTML += `
            <div class="match-card">
                <div class="match-card-team home">
                    <span>${match.home.name}</span>
                    <img src="images/${match.home.logo}" alt="${match.home.name}">
                </div>
                <div class="match-score">${score}</div>
                <div class="match-card-team away">
                    <img src="images/${match.away.logo}" alt="${match.away.name}">
                    <span>${match.away.name}</span>
                </div>
            </div>
        `;
    }
    container.innerHTML = roundHTML;

    prevBtn.disabled = roundNumber === 1;
    const totalRounds = (leaguesData[leagueId].teams.length -1) * (leagueId === 'brasileirao_c' ? 1 : 2);
    nextBtn.disabled = roundNumber >= totalRounds;
}

// --- Funções de Avanço e Simulação ---
function advanceDay() { 
    gameState.currentDate.setDate(gameState.currentDate.getDate() + 1); 
    simulateDayMatches(); 
    updateLeagueTable(gameState.tableView.leagueId); 
    updateContinueButton(); 
    if(gameState.currentMainContent === 'calendar-content') updateCalendar();
    checkSeasonEvents();
}

function updateContinueButton() {
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    button.disabled = gameState.isOnHoliday;
    
    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "DIA DO JOGO";
        button.onclick = promptMatchConfirmation;
    } else {
        button.innerText = "Avançar";
        button.onclick = advanceDay;
    }
}

function simulateDayMatches() {
    for (const leagueId in gameState.leagueStates) {
        const leagueState = gameState.leagueStates[leagueId];
        const todayMatches = leagueState.schedule.filter(match => isSameDay(new Date(match.date), gameState.currentDate));
        
        for (const match of todayMatches) {
            if (match.status === 'scheduled') {
                const isUserMatch = leagueId === gameState.currentLeagueId && (match.home.name === gameState.userClub.name || match.away.name === gameState.userClub.name);
                if (isUserMatch && !gameState.isOnHoliday) {
                    continue;
                }
                simulateSingleMatch(match, isUserMatch);
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

    // Adiciona vantagem de casa
    homeStrength *= 1.1;

    let homeScore = 0;
    let awayScore = 0;

    // Simula "chances" de gol
    for (let i = 0; i < 10; i++) {
        const totalStrength = homeStrength + awayStrength;
        const homeChance = (homeStrength / totalStrength) * (0.5 + Math.random());
        const awayChance = (awayStrength / totalStrength) * (0.5 + Math.random());
        
        if (homeChance > 0.65) homeScore++;
        if (awayChance > 0.60) awayScore++;
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'played';
}

function getTeamStrength(teamData, isUser) {
    let strength = 0;
    if (isUser) {
        const startingXI = Object.values(gameState.squadManagement.startingXI);
        if (startingXI.length === 11 && startingXI.every(p => p)) {
            strength = startingXI.reduce((acc, player) => acc + calculateModifiedOverall(player, Object.keys(gameState.squadManagement.startingXI).find(pos => gameState.squadManagement.startingXI[pos].name === player.name)), 0) / 11;
            
            // Bônus/pênalti tático
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
        strength = teamData.players.slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11;
    }
    return strength;
}


function findNextUserMatch() { 
    const schedule = gameState.leagueStates[gameState.currentLeagueId]?.schedule || [];
    gameState.nextUserMatch = schedule.filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name)).sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null; 
}
function initializeLeagueTable(teams) { return teams.map(team => ({ name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })); }

function generateSchedule(teams, leagueInfo) {
    let currentMatchDate = new Date(gameState.currentDate);
    currentMatchDate.setDate(currentMatchDate.getDate() + 7);

    let clubes = [...teams];
    if (clubes.length % 2 !== 0) { clubes.push({ name: "BYE", logo: "logo_default.png" }); }
    const numTeams = clubes.length;
    
    const isSerieCPhase1 = leagueInfo.format && leagueInfo.format.includes("Fases") && gameState.leagueStates['brasileirao_c']?.serieCState.phase === 1;
    let rounds = isSerieCPhase1 ? numTeams - 1 : (numTeams - 1) * 2;
    if (teams.length <= 4) rounds = (numTeams -1) * 2; // For Serie C groups
    
    const matchesPerRound = numTeams / 2;
    let allMatches = [];
    
    // Gerador de confrontos (Robin)
    const robin = (ts, isSecondHalf) => {
        let fixtures = [];
        for (let i = 0; i < ts.length / 2; i++) {
            const home = isSecondHalf ? ts[ts.length - 1 - i] : ts[i];
            const away = isSecondHalf ? ts[i] : ts[ts.length - 1 - i];
            if(home.name !== "BYE" && away.name !== "BYE") fixtures.push({home, away});
        }
        return fixtures;
    };
    
    for (let r = 0; r < numTeams - 1; r++) {
        allMatches.push(...robin(clubes, false));
        clubes.splice(1, 0, clubes.pop());
    }
    
    if(!isSerieCPhase1 && teams.length > 4) {
        for (let r = 0; r < numTeams - 1; r++) {
            allMatches.push(...robin(clubes, true));
            clubes.splice(1, 0, clubes.pop());
        }
    }

    const schedule = [];
    for (let i = 0; i < allMatches.length; i++) {
        if (i % matchesPerRound === 0 && i > 0) {
            if (currentMatchDate.getDay() < 4) currentMatchDate.setDate(currentMatchDate.getDate() + 3);
            else currentMatchDate.setDate(currentMatchDate.getDate() + 4);
        }
        schedule.push({ ...allMatches[i], date: new Date(currentMatchDate).toISOString(), status: 'scheduled', round: Math.floor(i / matchesPerRound) + 1 });
    }
    
    return schedule;
}


function isSameDay(date1, date2) { if(!date1 || !date2) return false; return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate(); }

// --- Funções para o Modo Férias ---
function handleCalendarDayClick(e) {
    if (gameState.isOnHoliday) return;

    const dayElement = e.target.closest('.calendar-day:not(.other-month)');
    if (!dayElement) return;

    const dateStr = dayElement.dataset.date;
    const clickedDate = new Date(dateStr + 'T12:00:00Z');
    
    if (clickedDate <= gameState.currentDate) return;

    const modal = document.getElementById('holiday-confirmation-modal');
    const dateDisplay = document.getElementById('holiday-target-date');
    dateDisplay.innerText = clickedDate.toLocaleDateString('pt-BR');
    
    document.getElementById('confirm-holiday-btn').dataset.endDate = clickedDate.toISOString();
    
    modal.classList.add('active');
}

function startHoliday() {
    const endDateStr = document.getElementById('confirm-holiday-btn').dataset.endDate;
    if (!endDateStr) return;

    gameState.holidayEndDate = new Date(endDateStr);
    gameState.isOnHoliday = true;

    document.getElementById('holiday-confirmation-modal').classList.remove('active');
    document.getElementById('cancel-holiday-btn').style.display = 'block';
    
    updateContinueButton();

    holidayInterval = setInterval(advanceDayOnHoliday, 500);
}

function advanceDayOnHoliday() {
    if (gameState.currentDate >= gameState.holidayEndDate) {
        stopHoliday();
        return;
    }
    advanceDay();
}

function stopHoliday() {
    clearInterval(holidayInterval);
    holidayInterval = null;
    gameState.isOnHoliday = false;
    gameState.holidayEndDate = null;
    
    document.getElementById('cancel-holiday-btn').style.display = 'none';
    updateContinueButton();
    findNextUserMatch();
}

// --- Lógica da Simulação de Partida (visual) ---
let matchInterval;

function promptMatchConfirmation() {
    if (!gameState.nextUserMatch) return;
    document.getElementById('match-confirmation-modal').classList.add('active');
}

function startMatchSimulation() {
    document.getElementById('match-confirmation-modal').classList.remove('active');
    
    const startingXIKeys = Object.keys(gameState.squadManagement.startingXI);
    if (startingXIKeys.length !== 11 || startingXIKeys.some(key => !gameState.squadManagement.startingXI[key])) {
        alert("Você precisa de 11 jogadores na escalação titular para começar a partida!");
        showMainContent('tactics-content');
        return;
    }

    gameState.isMatchLive = true;
    gameState.isPaused = false;

    const userTeam = gameState.userClub;
    const opponentTeam = gameState.nextUserMatch.home.name === userTeam.name ? gameState.nextUserMatch.away : gameState.nextUserMatch.home;
    const opponentSquad = setupOpponentSquad(opponentTeam);

    gameState.matchState = {
        home: gameState.nextUserMatch.home.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement } : { team: opponentTeam, ...opponentSquad },
        away: gameState.nextUserMatch.away.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement } : { team: opponentTeam, ...opponentSquad },
        score: { home: 0, away: 0 },
        gameTime: 0,
        half: 1,
        playerPositions: new Map(),
        ball: { x: 50, y: 50, owner: null },
        playerRatings: new Map()
    };

    initializeMatchPlayers();

    document.getElementById('match-home-team-name').innerText = gameState.matchState.home.team.name;
    document.getElementById('match-home-team-logo').src = `images/${gameState.matchState.home.team.logo}`;
    document.getElementById('match-away-team-name').innerText = gameState.matchState.away.team.name;
    document.getElementById('match-away-team-logo').src = `images/${gameState.matchState.away.team.logo}`;
    updateScoreboard();
    
    showScreen('match-simulation-screen');
    resizeCanvas(); 

    matchInterval = setInterval(gameLoop, 50);
    
    setInterval(() => {
        if (gameState.isMatchLive && !gameState.isPaused) {
            updatePlayerRatings();
        }
    }, 30000);
}

function setupOpponentSquad(team) {
    const todosJogadores = [...team.players].sort((a, b) => b.overall - a.overall);
    const startingXI = {};
    const formacao = Object.keys(formationLayouts)[Math.floor(Math.random() * 4)];
    const posicoesDaFormacao = Object.keys(formationLayouts[formacao]);
    let jogadoresDisponiveis = [...todosJogadores];

    for (const posicao of posicoesDaFormacao) {
        if (jogadoresDisponiveis.length > 0) {
            startingXI[posicao] = jogadoresDisponiveis.shift();
        }
    }
    const substitutes = jogadoresDisponiveis.splice(0, 7);
    const reserves = jogadoresDisponiveis;
    return { startingXI, substitutes, reserves };
}

function initializeMatchPlayers() {
    const { home, away } = gameState.matchState;
    const allPlayers = [
        ...Object.values(home.startingXI || {}), 
        ...Object.values(away.startingXI || {}),
        ...(home.substitutes || []),
        ...(away.substitutes || [])
    ];

    allPlayers.forEach(player => {
        if(player) {
            gameState.matchState.playerRatings.set(player.name, 5.5 + Math.random() * 1.5);
        }
    });
    
    const homeFormation = formationLayouts[gameState.tactics.formation];
    for(const pos in home.startingXI) {
        const player = home.startingXI[pos];
        if(player) gameState.matchState.playerPositions.set(player.name, [...homeFormation[pos]]);
    }
    
    const awayFormationKey = Object.keys(formationLayouts)[0];
    const awayFormation = formationLayouts[awayFormationKey];
    for(const pos in away.startingXI) {
        const player = away.startingXI[pos];
        if(player) {
            const [top, left] = awayFormation[pos];
            gameState.matchState.playerPositions.set(player.name, [100 - top, 100 - left]);
        }
    }
}

function gameLoop() {
    if (gameState.isPaused || !gameState.isMatchLive) return;

    const totalMatchDuration = 240;
    const halfTime = totalMatchDuration / 2;
    gameState.matchState.gameTime += 0.05 * (45 / halfTime) * 2;

    if (gameState.matchState.gameTime >= 45 && gameState.matchState.half === 1) {
        gameState.matchState.half = 2;
        gameState.matchState.gameTime = 45;
        togglePause(true);
        document.getElementById('match-time-status').innerText = "INTERVALO";
        for (const [playerName, pos] of gameState.matchState.playerPositions.entries()) {
            const teamSide = Object.values(gameState.matchState.home.startingXI).find(p => p.name === playerName) ? 'home' : 'away';
            if (teamSide === 'home') {
                pos[0] = 100 - pos[0];
                pos[1] = 100 - pos[1];
            } else {
                pos[0] = 100 - pos[0];
                pos[1] = 100 - pos[1];
            }
        }
    } else if (gameState.matchState.gameTime >= 90 && gameState.matchState.half === 2) {
        endMatch();
        return;
    }

    updateScoreboard();
    updateSimulationLogic();
    drawMatch();
}

function updateSimulationLogic() {
    for (const [player, pos] of gameState.matchState.playerPositions.entries()) {
        pos[0] += (Math.random() - 0.5) * 0.5;
        pos[1] += (Math.random() - 0.5) * 0.5;
        pos[0] = Math.max(2, Math.min(98, pos[0]));
        pos[1] = Math.max(2, Math.min(98, pos[1]));
    }
    
    if (Math.random() < 0.002) {
        const isHomeGoal = Math.random() > 0.5;
        if(isHomeGoal) gameState.matchState.score.home++;
        else gameState.matchState.score.away++;
        showNotification(`GOL! ${isHomeGoal ? gameState.matchState.home.team.name : gameState.matchState.away.team.name} marca!`);
    }
}

function resizeCanvas() {
    const canvas = document.getElementById('match-pitch-canvas');
    const container = document.getElementById('match-pitch-container');
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const canvasAspectRatio = 5 / 7;
    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / canvasAspectRatio;

    if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * canvasAspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    if(gameState.isMatchLive) drawMatch();
}

function drawMatch() {
    const canvas = document.getElementById('match-pitch-canvas');
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke();
    ctx.beginPath(); ctx.arc(width / 2, height / 2, height * 0.1, 0, 2 * Math.PI); ctx.stroke();

    const playerRadius = height / 40;
    const drawPlayer = (pos, color) => {
        const x = (pos[1] / 100) * width;
        const y = (pos[0] / 100) * height;
        ctx.beginPath(); ctx.arc(x, y, playerRadius, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'black'; ctx.stroke();
    };
    
    for (const player of Object.values(gameState.matchState.home.startingXI)) {
        if (!player) continue;
        const pos = gameState.matchState.playerPositions.get(player.name);
        if(pos) drawPlayer(pos, '#c0392b');
    }
    for (const player of Object.values(gameState.matchState.away.startingXI)) {
        if (!player) continue;
        const pos = gameState.matchState.playerPositions.get(player.name);
        if(pos) drawPlayer(pos, '#f1c40f');
    }
}

function updateScoreboard() {
    if (!gameState.matchState) return;
    const { score, gameTime, half } = gameState.matchState;
    document.getElementById('match-score-display').innerText = `${score.home} - ${score.away}`;
    
    const minutes = Math.floor(gameTime);
    document.getElementById('match-clock').innerText = `${minutes.toString().padStart(2, '0')}:00`;

    const statusEl = document.getElementById('match-time-status');
    if (statusEl.innerText === 'FIM DE JOGO') return;

    if(half === 1 && statusEl.innerText !== 'INTERVALO' && !gameState.isPaused) {
        statusEl.innerText = 'PRIMEIRO TEMPO';
    } else if (half === 2 && !gameState.isPaused) {
        statusEl.innerText = 'SEGUNDO TEMPO';
    }
}

function togglePause(forcePause = null) {
    if (gameState.isMatchLive === false) return;
    gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused;

    document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused);
    document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚';

    const statusEl = document.getElementById('match-time-status');
    if (gameState.isPaused && statusEl.innerText !== 'INTERVALO') {
         statusEl.innerText = "PAUSA";
    } else if (!gameState.isPaused) {
        updateScoreboard();
    }
}

function showNotification(message) {
    const area = document.getElementById('match-notification-area');
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerText = message;
    area.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 5000);
}

function updatePlayerRatings() {
    if(!gameState.matchState) return;
    for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) {
        const performanceChange = (Math.random() - 0.47) * 0.2;
        let newRating = Math.max(0, Math.min(10, currentRating + performanceChange));
        gameState.matchState.playerRatings.set(playerName, newRating);
    }
}

function endMatch() {
    clearInterval(matchInterval);
    gameState.isMatchLive = false;
    document.getElementById('match-time-status').innerText = 'FIM DE JOGO';
    
    const match = gameState.leagueStates[gameState.currentLeagueId].schedule.find(m => isSameDay(new Date(m.date), new Date(gameState.nextUserMatch.date)));
    if (match) {
        match.status = 'played';
        match.homeScore = gameState.matchState.score.home;
        match.awayScore = gameState.matchState.score.away;
        updateTableWithResult(gameState.currentLeagueId, match);
    }
    
    showPostMatchReport();
    findNextUserMatch();
}

function showPostMatchReport() {
    const { home, away, score } = gameState.matchState;
    const modal = document.getElementById('post-match-report-modal');
    const headline = document.getElementById('post-match-headline');
    const summary = document.getElementById('post-match-summary');
    
    let winner, loser, winnerScore, loserScore;
    if (score.home > score.away) {
        winner = home.team.name; loser = away.team.name;
        winnerScore = score.home; loserScore = score.away;
        headline.innerText = `${winner} vence ${loser} por ${winnerScore} a ${loserScore}!`;
    } else if (score.away > score.home) {
        winner = away.team.name; loser = home.team.name;
        winnerScore = score.away; loserScore = score.home;
        headline.innerText = `${winner} surpreende e vence ${loser} fora de casa!`;
    } else {
        headline.innerText = `${home.team.name} e ${away.team.name} empatam em jogo disputado.`;
        summary.innerText = `A partida terminou com o placar de ${score.home} a ${score.away}. Ambos os times tiveram suas chances, mas a igualdade prevaleceu no placar final.`;
        modal.classList.add('active');
        return;
    }
    
    const performanceFactor = Math.random();
    if(performanceFactor > 0.7) {
        summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`;
    } else {
        summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`;
    }
    modal.classList.add('active');
}

// --- Lógica de Fim de Temporada e Fases ---
function checkSeasonEvents() {
    for (const leagueId in gameState.leagueStates) {
        const remainingMatches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'scheduled');
        if (remainingMatches.length > 0) return;
    }

    if (gameState.leagueStates['brasileirao_c'].serieCState.phase === 1) {
        handleEndOfSerieCFirstPhase();
        return;
    }
    if (gameState.leagueStates['brasileirao_c'].serieCState.phase === 2) {
        handleEndOfSerieCSecondPhase();
        return;
    }

    handleEndOfSeason();
}

function handleEndOfSerieCFirstPhase() {
    const leagueState = gameState.leagueStates['brasileirao_c'];
    leagueState.serieCState.phase = 2;
    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    const qualified = [...leagueState.table].sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }).slice(0, 8);
    
    const groupA_teams = [qualified[0], qualified[3], qualified[4], qualified[7]];
    const groupB_teams = [qualified[1], qualified[2], qualified[5], qualified[6]];
    leagueState.serieCState.groups.A = groupA_teams.map(t => t.name);
    leagueState.serieCState.groups.B = groupB_teams.map(t => t.name);

    const groupA_data = groupA_teams.map(t => leaguesData.brasileirao_c.teams.find(team => team.name === t.name));
    const groupB_data = groupB_teams.map(t => leaguesData.brasileirao_c.teams.find(team => team.name === t.name));

    const scheduleA = generateSchedule(groupA_data, leaguesData.brasileirao_c.leagueInfo);
    const scheduleB = generateSchedule(groupB_data, leaguesData.brasileirao_c.leagueInfo);
    leagueState.schedule = [...scheduleA, ...scheduleB];
    
    leagueState.table = initializeLeagueTable([...groupA_data, ...groupB_data]);
    findNextUserMatch();
    updateLeagueTable('brasileirao_c');
    
    const qualifiedNames = qualified.map(t => t.name).join(', ');
    const isUserTeamQualified = qualified.some(t => t.name === gameState.userClub.name);
    addNews("Definidos os classificados na Série C!", `Os 8 times que avançam para a segunda fase são: ${qualifiedNames}.`, isUserTeamQualified);
}

function handleEndOfSerieCSecondPhase() {
    const leagueState = gameState.leagueStates['brasileirao_c'];
    leagueState.serieCState.phase = 3;
    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;

    const groupA = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
    const groupB = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });

    const finalists = [groupA[0], groupB[0]];
    leagueState.serieCState.finalists = finalists.map(t => t.name);
    
    const promoted = [groupA[0], groupA[1], groupB[0], groupB[1]];
    const promotedNames = promoted.map(t => t.name).join(', ');
    addNews("Acesso à Série B!", `Parabéns a ${promotedNames} pelo acesso à Série B!`, promoted.some(t => t.name === gameState.userClub.name));

    const finalistData = finalists.map(t => leaguesData.brasileirao_c.teams.find(team => team.name === t.name));
    const finalMatches = [
        { home: finalistData[0], away: finalistData[1], date: new Date(gameState.currentDate.setDate(gameState.currentDate.getDate() + 7)).toISOString(), status: 'scheduled' },
        { home: finalistData[1], away: finalistData[0], date: new Date(gameState.currentDate.setDate(gameState.currentDate.getDate() + 7)).toISOString(), status: 'scheduled' }
    ];
    leagueState.schedule = finalMatches;
    findNextUserMatch();
    addNews(`Final da Série C: ${finalists[0].name} x ${finalists[1].name}!`, "Os campeões de cada grupo disputam o título.", finalists.some(t => t.name === gameState.userClub.name));
}


function handleEndOfSeason() {
    if (gameState.isOnHoliday) stopHoliday();
    
    // Processar campeões e notícias
    for (const leagueId in leaguesData) {
        const table = [...gameState.leagueStates[leagueId].table].sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference);
        const champion = table[0];
        addNews(`${champion.name} é o campeão da ${leaguesData[leagueId].name}!`, ``, champion.name === gameState.userClub.name && leagueId === gameState.currentLeagueId);
    }
    
    processPromotionRelegation();
    
    gameState.season++;
    alert("Fim da temporada! As ligas foram atualizadas. Iniciando nova temporada...");
    initializeSeason();
}

function processPromotionRelegation() {
    const tableA = [...gameState.leagueStates['brasileirao_a'].table].sort((a,b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    const relegatedFromA = tableA.slice(-4).map(t => findTeamInLeagues(t.name));
    
    const tableB = [...gameState.leagueStates['brasileirao_b'].table].sort((a,b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    const promotedFromB = tableB.slice(0, 4).map(t => findTeamInLeagues(t.name));
    const relegatedFromB = tableB.slice(-4).map(t => findTeamInLeagues(t.name));

    const tableC_groupsA = gameState.leagueStates['brasileirao_c'].table.filter(t => gameState.leagueStates['brasileirao_c'].serieCState.groups.A.includes(t.name)).sort((a,b) => b.points - a.points);
    const tableC_groupsB = gameState.leagueStates['brasileirao_c'].table.filter(t => gameState.leagueStates['brasileirao_c'].serieCState.groups.B.includes(t.name)).sort((a,b) => b.points - a.points);
    const promotedFromC = [tableC_groupsA[0], tableC_groupsA[1], tableC_groupsB[0], tableC_groupsB[1]].map(t => findTeamInLeagues(t.name));

    // Trocas
    leaguesData.brasileirao_a.teams = leaguesData.brasileirao_a.teams.filter(t => !relegatedFromA.some(r => r.name === t.name)).concat(promotedFromB);
    leaguesData.brasileirao_b.teams = leaguesData.brasileirao_b.teams.filter(t => !promotedFromB.some(p => p.name === t.name) && !relegatedFromB.some(r => r.name === t.name)).concat(relegatedFromA).concat(promotedFromC);
    leaguesData.brasileirao_c.teams = leaguesData.brasileirao_c.teams.filter(t => !promotedFromC.some(p => p.name === t.name)).concat(relegatedFromB);
    
    // Atualiza o clube do usuário se ele foi promovido/rebaixado
    if(promotedFromB.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_a';
    if(relegatedFromA.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_b';
    if(promotedFromC.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_b';
    if(relegatedFromB.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_c';
}

function findTeamInLeagues(teamName) {
    for (const leagueId in leaguesData) {
        const team = leaguesData[leagueId].teams.find(t => t.name === teamName);
        if (team) return team;
    }
    return null;
}

function populateLeagueSelectors() {
    const selectors = [document.getElementById('league-table-selector'), document.getElementById('matches-league-selector')];
    selectors.forEach(selector => {
        selector.innerHTML = '';
        for (const leagueId in leaguesData) {
            const option = document.createElement('option');
            option.value = leagueId;
            option.innerText = leaguesData[leagueId].name;
            selector.appendChild(option);
        }
        selector.value = gameState.currentLeagueId;
    });
}

function findCurrentRound(leagueId) {
    const schedule = gameState.leagueStates[leagueId].schedule;
    const lastPlayedMatch = [...schedule].reverse().find(m => m.status === 'played' && new Date(m.date) <= gameState.currentDate);
    return lastPlayedMatch ? lastPlayedMatch.round + 1 : 1;
}

// --- Event Listeners ---
function initializeEventListeners() {
    document.getElementById('confirm-manager-name-btn').addEventListener('click', createManager);
    document.getElementById('go-to-new-club-btn').addEventListener('click', () => showScreen('new-club-screen'));
    document.getElementById('go-to-select-league-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('create-new-club-btn').addEventListener('click', createClub);
    document.getElementById('new-club-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-league-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-team-back-btn').addEventListener('click', () => showScreen('select-league-screen'));
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.reload());
    document.querySelectorAll('#sidebar li').forEach(item => { item.addEventListener('click', () => showMainContent(item.dataset.content)); });
    
    document.getElementById('calendar-content').addEventListener('click', handleCalendarDayClick);
    document.getElementById('confirm-holiday-btn').addEventListener('click', startHoliday);
    document.getElementById('cancel-holiday-btn').addEventListener('click', stopHoliday);
    document.getElementById('close-holiday-modal-btn').addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));
    document.getElementById('cancel-holiday-btn-modal').addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));
    document.getElementById('close-user-news-modal-btn').addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));
    document.getElementById('confirm-user-news-btn').addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));

    document.getElementById('league-table-selector').addEventListener('change', (e) => {
        gameState.tableView.leagueId = e.target.value;
        updateLeagueTable(gameState.tableView.leagueId);
    });
    const matchesSelector = document.getElementById('matches-league-selector');
    matchesSelector.addEventListener('change', (e) => {
        gameState.matchesView.leagueId = e.target.value;
        gameState.matchesView.round = findCurrentRound(gameState.matchesView.leagueId);
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    });
    document.getElementById('prev-round-btn').addEventListener('click', () => {
        if (gameState.matchesView.round > 1) {
            gameState.matchesView.round--;
            displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
        }
    });
    document.getElementById('next-round-btn').addEventListener('click', () => {
        gameState.matchesView.round++;
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    });


    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullScreen);
    document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') { closeSettingsModal(); } });
    
    const tacticsContent = document.getElementById('tactics-content');
    if (tacticsContent) { tacticsContent.addEventListener('click', handleTacticsInteraction); }
    
    document.querySelectorAll('#tactics-content select, #tactics-content input[type="checkbox"]').forEach(element => {
        element.addEventListener('change', (e) => {
            e.stopPropagation();
            const tacticKey = e.target.id.replace('tactic-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
            if (e.target.type === 'checkbox') { gameState.tactics[tacticKey] = e.target.checked; } else { gameState.tactics[tacticKey] = e.target.value; }
            if (tacticKey === 'formation') { Object.values(gameState.squadManagement.startingXI).forEach(player => { if(player) gameState.squadManagement.reserves.push(player); }); gameState.squadManagement.startingXI = {}; }
            loadTacticsScreen();
        });
    });
    
    document.querySelectorAll('.panel-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelName = e.currentTarget.dataset.panel;
            const container = document.getElementById('tactics-layout-container');
            container.classList.toggle(`${panelName}-collapsed`);
            document.querySelector(`.tactics-${panelName}-column`).classList.toggle('collapsed');
        });
    });

    document.getElementById('confirm-and-play-btn').addEventListener('click', startMatchSimulation);
    document.getElementById('cancel-play-btn').addEventListener('click', () => {
        document.getElementById('match-confirmation-modal').classList.remove('active');
        showMainContent('tactics-content');
    });
    document.getElementById('close-confirmation-modal-btn').addEventListener('click', () => {
        document.getElementById('match-confirmation-modal').classList.remove('active');
    });
    document.getElementById('pause-match-btn').addEventListener('click', () => togglePause());
    document.getElementById('resume-match-btn').addEventListener('click', () => togglePause());
    document.getElementById('close-post-match-btn').addEventListener('click', () => {
        document.getElementById('post-match-report-modal').classList.remove('active');
        showScreen('main-game-screen');
        updateLeagueTable(gameState.currentLeagueId);
        updateContinueButton();
    });
}

document.addEventListener('DOMContentLoaded', () => { 
    initializeEventListeners(); 
    loadLeagues();
    window.addEventListener('resize', resizeCanvas);
});
