// --- Estado do Jogo ---
const gameState = {
    managerName: null, userClub: null, currentLeagueId: null, currentDate: null, leagueTable: [],
    schedule: [], nextUserMatch: null, currentScreen: 'manager-creation-screen', currentMainContent: 'home-content',
    calendarDisplayDate: null, // NOVO: Para navegação no calendário
    tactics: {
        formation: '4-2-3-1', mentality: 'balanced', attackingWidth: 'normal',
        buildUp: 'play_out_defence', chanceCreation: 'mixed', tempo: 'normal',
        onPossessionLoss: 'counter_press', onPossessionGain: 'counter', lineOfEngagement: 'mid_block',
        defensiveLine: 'standard', tackling: 'stay_on_feet', offsideTrap: false
    },
    squadManagement: { startingXI: {}, substitutes: [], reserves: [], }
};
let selectedPlayerInfo = null;
const MAX_SUBSTITUTES = 7;

// NOVO: Matriz de distância de posições para calcular a penalidade de overall.
// 0: Posição natural, 1: Muito próxima, 2: Próxima, 3: Distante, 4: Muito distante
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


// COORDENADAS ATUALIZADAS PARA CAMPO VERTICAL E MAIS ESPAÇADO
const formationLayouts = {
    '4-4-2':    { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'RM': [50, 82], 'CM1': [55, 62], 'CM2': [55, 38], 'LM': [50, 18], 'ST1': [25, 60], 'ST2': [25, 40] },
    '4-3-3':    { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'CM1': [58, 72], 'CM2': [62, 50], 'CM3': [58, 28], 'RW': [30, 80], 'ST': [22, 50], 'LW': [30, 20] },
    '3-5-2':    { 'GK': [93, 50], 'CB1': [80, 70], 'CB2': [82, 50], 'CB3': [80, 30], 'RWB': [55, 85], 'CM1': [50, 65], 'CDM': [68, 50], 'CM2': [50, 35], 'LWB': [55, 15], 'ST1': [25, 65], 'ST2': [25, 35] },
    '4-2-3-1':  { 'GK': [93, 50], 'RB': [75, 82], 'CB1': [78, 62], 'CB2': [78, 38], 'LB': [75, 18], 'CDM1': [65, 65], 'CDM2': [65, 35], 'RW': [42, 82], 'CAM': [45, 50], 'LW': [42, 18], 'ST': [20, 50] }
};

// Funções de UI (Modal, Telas, etc.)
function openSettingsModal() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettingsModal() { document.getElementById('settings-modal').classList.remove('active'); }
function toggleFullScreen() { const doc = window.document; const docEl = doc.documentElement; const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen; const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen; if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) { requestFullScreen.call(docEl); } else { cancelFullScreen.call(doc); } }
function showScreen(screenId) { const current = document.getElementById(gameState.currentScreen); if (current) { current.classList.remove('active'); } const next = document.getElementById(screenId); if (next) { next.classList.add('active'); } gameState.currentScreen = screenId; }
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
    if (contentId === 'tactics-content') { loadTacticsScreen(); }
    if (contentId === 'calendar-content') {
        gameState.calendarDisplayDate = new Date(gameState.currentDate);
        updateCalendar();
    }
}


// Funções de Inicialização do Jogo
function createManager() { const nameInput = document.getElementById('manager-name-input'); if (nameInput.value.trim() === '') { alert('Por favor, digite seu nome.'); return; } gameState.managerName = nameInput.value.trim(); showScreen('start-screen'); }
function loadLeagues() { const leagueSelectionDiv = document.getElementById('league-selection'); leagueSelectionDiv.innerHTML = ''; for (const leagueId in leaguesData) { const league = leaguesData[leagueId]; const leagueCard = document.createElement('div'); leagueCard.className = 'league-card'; leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`; leagueCard.addEventListener('click', () => loadTeams(leagueId)); leagueSelectionDiv.appendChild(leagueCard); } }
function loadTeams(leagueId) { gameState.currentLeagueId = leagueId; const teamSelectionDiv = document.getElementById('team-selection'); teamSelectionDiv.innerHTML = ''; const teams = leaguesData[leagueId].teams; for (const team of teams) { const teamCard = document.createElement('div'); teamCard.className = 'team-card'; teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`; teamCard.addEventListener('click', () => startGame(team)); teamSelectionDiv.appendChild(teamCard); } showScreen('select-team-screen'); }
function createClub() { const clubName = document.getElementById('club-name-input').value; if (!clubName) { alert("Por favor, preencha o nome do clube."); return; } gameState.currentLeagueId = Object.keys(leaguesData)[0]; const generatedPlayers = []; for (let i = 0; i < 22; i++) { generatedPlayers.push({ name: `*Jogador Gerado ${i + 1}`, position: "CM", attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 }, overall: 55 }); } const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers }; startGame(newClub); }
function startGame(team) { gameState.userClub = team; const leagueInfo = leaguesData[gameState.currentLeagueId].leagueInfo; const teams = leaguesData[gameState.currentLeagueId].teams; gameState.squadManagement.reserves = [...gameState.userClub.players]; gameState.squadManagement.startingXI = {}; gameState.squadManagement.substitutes = []; gameState.currentDate = new Date(leagueInfo.startDate + 'T12:00:00'); gameState.schedule = generateSchedule(teams, leagueInfo); gameState.leagueTable = initializeLeagueTable(teams); findNextUserMatch(); document.getElementById('header-manager-name').innerText = gameState.managerName; document.getElementById('header-club-name').innerText = gameState.userClub.name; document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`; loadSquadTable(); updateLeagueTable(); updateContinueButton(); showScreen('main-game-screen'); showMainContent('home-content'); }

// Lógica de Táticas (Seleção e Movimentação)
function handleTacticsInteraction(e) {
    const clickedElement = e.target.closest('[data-player-id], .player-slot, .player-list');
    if (!clickedElement) { clearSelection(); return; }

    const clickedPlayerId = clickedElement.dataset.playerId;

    // Caso 1: Clicou em um jogador
    if (clickedPlayerId) {
        const player = gameState.userClub.players.find(p => p.name === clickedPlayerId);
        const sourceInfo = getPlayerLocation(player);

        if (selectedPlayerInfo) {
            // Se o jogador clicado é o mesmo que já estava selecionado, deselecione-o.
            if (selectedPlayerInfo.player.name === player.name) {
                clearSelection();
            } else { // Se for um jogador diferente, troque-os de lugar.
                const destPlayerInfo = { player, ...sourceInfo };
                swapPlayers(selectedPlayerInfo, destPlayerInfo);
                clearSelection();
            }
        } else { // Se nenhum jogador estava selecionado, selecione este.
            selectPlayer(player, sourceInfo.type, sourceInfo.id);
        }
    }
    // Caso 2: Clicou em um local (slot vazio, banco, reservas) com um jogador já selecionado
    else if (selectedPlayerInfo) {
        let destInfo;
        if (clickedElement.classList.contains('player-slot')) {
            destInfo = { type: 'field', id: clickedElement.dataset.position };
        } else if (clickedElement.closest('#substitutes-list')) {
            destInfo = { type: 'subs', id: 'substitutes-list' };
        } else if (clickedElement.closest('#reserves-list')) {
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
function getPlayerLocation(player) { for (const pos in gameState.squadManagement.startingXI) { if (gameState.squadManagement.startingXI[pos]?.name === player.name) { return { type: 'field', id: pos }; } } if (gameState.squadManagement.substitutes.some(p => p.name === player.name)) { return { type: 'subs', id: 'substitutes-list' }; } return { type: 'reserves', id: 'reserves-list' }; }

function removePlayerFromSource(playerInfo) {
    if (!playerInfo || !playerInfo.player) return; // Guarda de segurança
    if (playerInfo.sourceType === 'field') {
        delete gameState.squadManagement.startingXI[playerInfo.sourceId];
    } else if (playerInfo.sourceType === 'subs') {
        gameState.squadManagement.substitutes = gameState.squadManagement.substitutes.filter(p => p && p.name !== playerInfo.player.name);
    } else {
        gameState.squadManagement.reserves = gameState.squadManagement.reserves.filter(p => p && p.name !== playerInfo.player.name);
    }
}
function addPlayerToDest(player, destInfo) { if (destInfo.type === 'field') { gameState.squadManagement.startingXI[destInfo.id] = player; } else if (destInfo.type === 'subs') { gameState.squadManagement.substitutes.push(player); } else { gameState.squadManagement.reserves.push(player); } }
function movePlayer(playerInfo, destInfo) { if (destInfo.type === 'subs' && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { alert(`O banco de reservas está cheio! (Máx. ${MAX_SUBSTITUTES})`); return; } removePlayerFromSource(playerInfo); addPlayerToDest(playerInfo.player, destInfo); loadTacticsScreen(); }

// CORRIGIDO: Lógica de troca de jogadores simplificada e corrigida
function swapPlayers(sourcePlayerInfo, destPlayerInfo) {
    // Verifica se a troca envolve o banco e se ele está cheio
    const isMovingToSubs = destPlayerInfo.type === 'subs';
    const isMovingFromSubs = sourcePlayerInfo.sourceType === 'subs';
    if (!isMovingFromSubs && isMovingToSubs && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) {
         alert(`O banco de reservas está cheio! (Máx. ${MAX_SUBSTITUTES})`); return;
    }

    // Remove ambos os jogadores de suas posições originais
    removePlayerFromSource(sourcePlayerInfo);
    removePlayerFromSource(destPlayerInfo);

    // Adiciona cada jogador na posição do outro
    addPlayerToDest(sourcePlayerInfo.player, { type: destPlayerInfo.type, id: destPlayerInfo.id });
    addPlayerToDest(destPlayerInfo.player, { type: sourcePlayerInfo.sourceType, id: sourcePlayerInfo.sourceId });

    loadTacticsScreen();
}


// NOVO: Função para calcular o overall modificado do jogador
function calculateModifiedOverall(player, targetPosition) {
    if (!player || !targetPosition) return player ? player.overall : 0;

    const naturalPosition = player.position;
    const cleanTargetPosition = targetPosition.replace(/\d/g, ''); // Remove números (ex: CB1 -> CB)

    // Verifica se a posição natural e o alvo existem na matriz
    if (!positionMatrix[naturalPosition] || positionMatrix[naturalPosition][cleanTargetPosition] === undefined) {
        return Math.max(40, player.overall - 25); // Penalidade padrão alta se a posição for desconhecida
    }

    const distance = positionMatrix[naturalPosition][cleanTargetPosition];
    const penaltyFactor = 4; // Ajuste este valor para aumentar/diminuir a penalidade por distância
    const penalty = distance * penaltyFactor;

    return Math.max(40, player.overall - penalty); // Garante que o overall não caia abaixo de 40
}

function loadTacticsScreen() { const formation = gameState.tactics.formation; const field = document.querySelector('#field-container .field-background'); const subsList = document.getElementById('substitutes-list'); const reservesList = document.getElementById('reserves-list'); field.innerHTML = ''; subsList.innerHTML = ''; reservesList.innerHTML = ''; Object.keys(gameState.tactics).forEach(key => { const elementId = `tactic-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`; const element = document.getElementById(elementId); if (element) { if (element.type === 'checkbox') { element.checked = gameState.tactics[key]; } else { element.value = gameState.tactics[key]; } } }); const positions = formationLayouts[formation]; for (const pos in positions) { const slot = document.createElement('div'); slot.className = 'player-slot'; slot.dataset.position = pos; slot.style.top = `${positions[pos][0]}%`; slot.style.left = `${positions[pos][1]}%`; const player = gameState.squadManagement.startingXI[pos]; if (player) { slot.appendChild(createPlayerChip(player, pos)); } else { slot.innerText = pos; } field.appendChild(slot); } gameState.squadManagement.substitutes.forEach(player => subsList.appendChild(createSquadListPlayer(player))); gameState.squadManagement.reserves.forEach(player => reservesList.appendChild(createSquadListPlayer(player))); document.getElementById('subs-count').innerText = gameState.squadManagement.substitutes.length; if (selectedPlayerInfo) { const element = document.querySelector(`[data-player-id="${selectedPlayerInfo.player.name}"]`); if (element) element.classList.add('selected'); } }

// ATUALIZADO: createPlayerChip para usar o overall modificado
function createPlayerChip(player, currentPosition) {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.dataset.playerId = player.name;
    const modifiedOverall = calculateModifiedOverall(player, currentPosition);
    let overallClass = 'player-overall';
    if (modifiedOverall < player.overall) {
        overallClass += ' penalty'; // Adiciona classe para estilização em vermelho
    }
    chip.innerHTML = `
        <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span>
        <span class="${overallClass}">${modifiedOverall}</span>
        <span class="player-pos">${player.position}</span>
    `;
    return chip;
}
function createSquadListPlayer(player) { const item = document.createElement('div'); item.className = 'squad-list-player'; item.dataset.playerId = player.name; item.innerHTML = ` <div class="player-info"> <div class="player-name">${player.name}</div> <div class="player-pos">${player.position}</div> </div> <div class="player-overall">${player.overall}</div> `; return item; }

// Funções de UI (Tabelas, Calendário)
function loadSquadTable() { const playerListDiv = document.getElementById('player-list-table'); if (!playerListDiv) return; const positionOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']; const sortedPlayers = [...gameState.userClub.players].sort((a, b) => { return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position); }); let tableHTML = `<table><thead><tr><th>Nome</th><th>Pos.</th><th>Veloc.</th><th>Finaliz.</th><th>Passe</th><th>Drible</th><th>Defesa</th><th>Físico</th><th>GERAL</th></tr></thead><tbody>`; for (const player of sortedPlayers) { tableHTML += `<tr><td>${player.name}</td><td>${player.position}</td><td>${player.attributes.pace}</td><td>${player.attributes.shooting}</td><td>${player.attributes.passing}</td><td>${player.attributes.dribbling}</td><td>${player.attributes.defending}</td><td>${player.attributes.physical}</td><td><b>${player.overall}</b></td></tr>`; } tableHTML += `</tbody></table>`; playerListDiv.innerHTML = tableHTML; }
function updateTableWithResult(match) { const homeTeam = gameState.leagueTable.find(t => t.name === match.home.name); const awayTeam = gameState.leagueTable.find(t => t.name === match.away.name); if (!homeTeam || !awayTeam) return; homeTeam.played++; awayTeam.played++; homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore; awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore; homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst; awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst; if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; } else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; } else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; } }
function updateLeagueTable() { const container = document.getElementById('league-table-container'); if (!container) return; const tiebreakers = leaguesData[gameState.currentLeagueId].leagueInfo.tiebreakers; gameState.leagueTable.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); let tableHTML = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`; gameState.leagueTable.forEach((team, index) => { const isUserTeam = team.name === gameState.userClub.name; tableHTML += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + 1}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`; }); tableHTML += `</tbody></table>`; container.innerHTML = tableHTML; }

// ATUALIZADO: Lógica do calendário para usar a data de exibição
function updateCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container || !gameState.calendarDisplayDate) return;

    const date = gameState.calendarDisplayDate;
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `
        <div class="calendar-header">
            <button id="prev-month-btn">◀</button>
            <h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button id="next-month-btn">▶</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;

    for (let i = 0; i < firstDay.getDay(); i++) { html += `<div class="calendar-day other-month"></div>`; }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const isCurrent = isSameDay(loopDate, gameState.currentDate);
        const matchOnThisDay = gameState.schedule.find(m => isSameDay(new Date(m.date), loopDate));
        let dayClasses = 'calendar-day';
        let dayContent = `<span class="day-number">${i}</span>`;
        if (matchOnThisDay) {
            dayClasses += ' match-day';
            const opponent = matchOnThisDay.home.name === gameState.userClub.name ? `vs ${matchOnThisDay.away.name}` : `@ ${matchOnThisDay.home.name}`;
            dayContent += `<div class="match-details">${opponent}</div>`;
        }
        if (isCurrent) { dayClasses += ' current-day'; }
        html += `<div class="${dayClasses}">${dayContent}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;

    // Adiciona os event listeners aos novos botões
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() - 1);
        updateCalendar();
    });
    document.getElementById('next-month-btn').addEventListener('click', () => {
        gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() + 1);
        updateCalendar();
    });
}

// Funções de Avanço e Simulação
function advanceDay() { gameState.currentDate.setDate(gameState.currentDate.getDate() + 1); simulateDayMatches(); updateLeagueTable(); updateContinueButton(); if(gameState.currentMainContent === 'calendar-content') { gameState.calendarDisplayDate = new Date(gameState.currentDate); updateCalendar();} }
function updateContinueButton() { const button = document.getElementById('advance-day-button'); const displayDate = document.getElementById('current-date-display'); displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) { button.innerText = "JOGAR PARTIDA"; button.disabled = true; } else { button.innerText = "Avançar"; button.disabled = false; } }
function simulateDayMatches() { const todayMatches = gameState.schedule.filter(match => isSameDay(new Date(match.date), gameState.currentDate)); for (const match of todayMatches) { if (match.status === 'scheduled') { if (match.home.name !== gameState.userClub.name && match.away.name !== gameState.userClub.name) { match.homeScore = Math.floor(Math.random() * 4); match.awayScore = Math.floor(Math.random() * 4); match.status = 'played'; updateTableWithResult(match); } } } }
function findNextUserMatch() { gameState.nextUserMatch = gameState.schedule .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name)) .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null; }
function initializeLeagueTable(teams) { return teams.map(team => ({ name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })); }

// ATUALIZADO: Geração de calendário para 2 jogos por semana
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
    let currentRoundDate = new Date(leagueInfo.startDate + 'T12:00:00Z');
    let dateIncrement = 3; // Inicia com 3 para ir de Sábado para Terça/Quarta

    for (let i = 0; i < allMatches.length; i += matchesPerRound) {
        const roundMatches = allMatches.slice(i, i + matchesPerRound);
        for(const match of roundMatches) {
            schedule.push({ ...match, date: new Date(currentRoundDate).toISOString(), status: 'scheduled' });
        }
        // Alterna o incremento entre 3 e 4 dias para jogos de fim de semana e meio de semana
        currentRoundDate.setDate(currentRoundDate.getDate() + dateIncrement);
        dateIncrement = 7 - dateIncrement;
    }
    return schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function isSameDay(date1, date2) { if(!date1 || !date2) return false; return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate(); }

// Event Listeners
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

    document.querySelectorAll('#sidebar li').forEach(item => { item.addEventListener('click', () => showMainContent(item.dataset.content)); });

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
            if (tacticKey === 'formation') {
                // Ao mudar de formação, move todos os titulares para os reservas
                Object.values(gameState.squadManagement.startingXI).forEach(player => {
                    if(player) gameState.squadManagement.reserves.push(player);
                });
                gameState.squadManagement.startingXI = {};
            }
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
}

// Inicialização do Jogo
document.addEventListener('DOMContentLoaded', () => { initializeEventListeners(); loadLeagues(); });
