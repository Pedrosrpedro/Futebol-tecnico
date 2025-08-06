// A SER SALVO COMO: ui_manager.js

// --- Funções de Navegação e Setup Inicial ---
// ui_manager.js

// Adicione estas funções, de preferência no topo do arquivo.

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const next = document.getElementById(screenId);
    if (next) next.classList.add('active');
    gameState.currentScreen = screenId;
}

function showInfoModal(headline, body) {
    document.getElementById('info-modal-headline').innerText = headline;
    document.getElementById('info-modal-body').innerText = body;
    document.getElementById('info-modal').classList.add('active');
}

// ... continue com o resto do seu código no ui_manager.js, como a função populateLeagueSelectors, etc.

function createManager() {
    const nameInput = document.getElementById('manager-name-input');
    if (nameInput.value.trim() === '') {
        showInfoModal('Atenção', 'Por favor, digite seu nome.');
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
        showInfoModal("Atenção", "Por favor, preencha o nome do clube.");
        return;
    }
    gameState.currentLeagueId = 'brasileirao_c'; // Novo clube começa na Série C
    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) {
        generatedPlayers.push(generateNewPlayer({ name: clubName }));
    }
    const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers };
    startGame(newClub);
}

function startGame(team) {
    gameState.userClub = team;

    // Mescla todos os dados de diferentes arquivos em um só lugar
    mergeAllData();
    initializeFreeAgents();

    // Garante que todos os jogadores (de clubes e livres) tenham dados completos
    initializeAllPlayerData();
    
    initializeClubFinances();
    initializeSeason();

    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;

    populateLeagueSelectors();
    showScreen('main-game-screen');
    showMainContent('home-content');
    updateLeagueTable(gameState.currentLeagueId);
}


// --- Funções de UI ---
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); const next = document.getElementById(screenId); if (next) next.classList.add('active'); gameState.currentScreen = screenId; }
function showMainContent(contentId) {
    clearSelection();
    const currentPanel = document.getElementById(gameState.currentMainContent);
    if (currentPanel) currentPanel.classList.remove('active');
    const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`);
    if (oldMenuItem) oldMenuItem.classList.remove('active');
    const newPanel = document.getElementById(contentId);
    if (newPanel) newPanel.classList.add('active');
    const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`);
    if (newMenuItem) newMenuItem.classList.add('active');
    gameState.currentMainContent = contentId;

    if (contentId === 'squad-content') loadSquadTable();
    if (contentId === 'contracts-content') displayContractsScreen();
    if (contentId === 'tactics-content') loadTacticsScreen();
    if (contentId === 'transfer-market-content') displayTransferMarket();
    if (contentId === 'development-content') displayDevelopmentScreen();
    if (contentId === 'calendar-content') {
        gameState.calendarDisplayDate = new Date(gameState.currentDate);
        updateCalendar();
    }
    if (contentId === 'matches-content') {
        gameState.matchesView.leagueId = gameState.matchesView.leagueId || gameState.currentLeagueId;
        gameState.matchesView.round = findCurrentRound(gameState.matchesView.leagueId);
        document.getElementById('matches-league-selector').value = gameState.matchesView.leagueId;
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    }
    if (contentId === 'league-content') {
        gameState.tableView.leagueId = gameState.tableView.leagueId || gameState.currentLeagueId;
        document.getElementById('league-table-selector').value = gameState.tableView.leagueId;
        updateLeagueTable(gameState.tableView.leagueId);
    }
    if (contentId === 'news-content') displayNewsFeed();
    if (contentId === 'finances-content') displayFinances();
}
function showInfoModal(headline, body) { document.getElementById('info-modal-headline').innerText = headline; document.getElementById('info-modal-body').innerText = body; document.getElementById('info-modal').classList.add('active'); }
function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-modal-title').innerText = title;
    document.getElementById('confirmation-modal-body').innerText = message;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    const cancelBtn = document.getElementById('cancel-action-btn');

    // Clona o botão para remover listeners antigos e evitar acúmulo
    const confirmClone = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);
    
    confirmClone.addEventListener('click', () => {
        onConfirm();
        modal.classList.remove('active');
    });

    cancelBtn.onclick = () => modal.classList.remove('active');

    modal.classList.add('active');
}
function showFriendlyResultModal(match) { document.getElementById('friendly-result-headline').innerText = "Resultado do Amistoso"; document.getElementById('friendly-result-body').innerText = `${match.home.name} ${match.homeScore} x ${match.awayScore} ${match.away.name}`; document.getElementById('friendly-result-modal').classList.add('active'); }
function toggleFullScreen() { const doc = window.document; const docEl = doc.documentElement; const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen; const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen; if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) { requestFullScreen.call(docEl); } else { cancelFullScreen.call(doc); } }

// --- Funções de Renderização de Componentes ---

function loadSquadTable() {
    const playerListDiv = document.getElementById('player-list-table');
    if (!playerListDiv) return;
    const positionOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
    const sortedPlayers = [...gameState.userClub.players].sort((a, b) => {
        return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });
    
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor</th><th>Contrato</th></tr></thead><tbody>`;
    for (const player of sortedPlayers) {
        tableHTML += `
            <tr>
                <td>${player.name}</td>
                <td>${player.age || 'N/A'}</td>
                <td>${player.position}</td>
                <td><b>${player.overall || 'N/A'}</b></td>
                <td>${player.marketValue ? formatCurrency(player.marketValue) : 'N/A'}</td>
                <td>${formatContract(player.contractUntil)}</td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    playerListDiv.innerHTML = tableHTML;
}

function updateContinueButton() {
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    button.disabled = gameState.isOnHoliday;
    if (gameState.isOffSeason) {
        button.innerText = "Avançar Pré-Temporada";
        button.onclick = advanceDay;
        return;
    }
    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "DIA DO JOGO";
        button.onclick = promptMatchConfirmation;
    } else {
        button.innerText = "Avançar Dia";
        button.onclick = advanceDay;
    }
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

function updateLeagueTable(leagueId) {
    const container = document.getElementById('league-table-container');
    if (!container) return;
    const leagueState = gameState.leagueStates[leagueId];
    if (!leagueState) return;
    const leagueInfo = leaguesData[leagueId];
    const tiebreakers = leagueInfo.leagueInfo.tiebreakers;
    let tableHTML = '';
    if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase === 2) {
        const groupA = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name));
        const groupB = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name));
        groupA.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        groupB.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        tableHTML += '<h4>Grupo A (Segunda Fase)</h4>';
        tableHTML += renderTable(groupA, 1);
        tableHTML += '<h4 style="margin-top: 20px;">Grupo B (Segunda Fase)</h4>';
        tableHTML += renderTable(groupB, 1);
    } else {
        const table = [...leagueState.table];
        table.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
        tableHTML = renderTable(table);
    }
    container.innerHTML = tableHTML;
}

function renderTable(tableData, startPos = 1) {
    let html = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`;
    tableData.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        html += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + startPos}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

function updateCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container || !gameState.calendarDisplayDate) return;
    const date = gameState.calendarDisplayDate;
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let html = `<div class="calendar-header"><button id="prev-month-btn">◀</button><h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3><button id="next-month-btn">▶</button></div><div class="calendar-grid"><div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const isCurrent = isSameDay(loopDate, gameState.currentDate);
        const matchOnThisDay = gameState.allMatches.find(m => isSameDay(new Date(m.date), loopDate) && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name));
        let dayClasses = 'calendar-day';
        let dayContent = `<span class="day-number">${i}</span>`;
        if (matchOnThisDay) {
            dayClasses += ' match-day';
            const opponent = matchOnThisDay.home.name === gameState.userClub.name ? `vs ${matchOnThisDay.away.name}` : `@ ${matchOnThisDay.home.name}`;
            dayContent += `<div class="match-details">${opponent}</div>`;
        }
        if (isCurrent) {
            dayClasses += ' current-day';
        }
        html += `<div class="${dayClasses}" data-date="${loopDate.toISOString().split('T')[0]}">${dayContent}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    document.getElementById('prev-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() - 1); updateCalendar(); } });
    document.getElementById('next-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() + 1); updateCalendar(); } });
}

function displayRound(leagueId, roundNumber) {
    const container = document.getElementById('round-matches-container');
    const roundDisplay = document.getElementById('round-display');
    const prevBtn = document.getElementById('prev-round-btn');
    const nextBtn = document.getElementById('next-round-btn');
    const leagueState = gameState.leagueStates[leagueId];
    if (!leagueState) return;
    const roundMatches = leagueState.schedule.filter(m => m.round === roundNumber);
    roundDisplay.innerText = `Rodada ${roundNumber}`;
    container.innerHTML = '';
    if (!roundMatches || roundMatches.length === 0) {
        container.innerHTML = "<p>Nenhuma partida encontrada para esta rodada.</p>";
        return;
    }
    let roundHTML = '';
    for (const match of roundMatches) {
        const score = match.status === 'played' ? `${match.homeScore} - ${match.awayScore}` : 'vs';
        roundHTML += ` <div class="match-card"> <div class="match-card-team home"> <span>${match.home.name}</span> <img src="images/${match.home.logo}" alt="${match.home.name}"> </div> <div class="match-score">${score}</div> <div class="match-card-team away"> <img src="images/${match.away.logo}" alt="${match.away.name}"> <span>${match.away.name}</span> </div> </div> `;
    }
    container.innerHTML = roundHTML;
    prevBtn.disabled = roundNumber === 1;
    const totalRounds = leagueState.schedule.length > 0 ? Math.max(...leagueState.schedule.map(m => m.round).filter(r => typeof r === 'number')) : 0;
    nextBtn.disabled = roundNumber >= totalRounds;
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
    document.getElementById('calendar-container').addEventListener('click', handleCalendarDayClick);
    document.getElementById('confirm-holiday-btn').addEventListener('click', startHoliday);
    document.getElementById('cancel-holiday-btn').addEventListener('click', stopHoliday);
    document.getElementById('close-holiday-modal-btn').addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));
    document.getElementById('cancel-holiday-btn-modal').addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));
    document.getElementById('close-user-news-modal-btn').addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));
    document.getElementById('confirm-user-news-btn').addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));
    document.getElementById('close-info-modal-btn').addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('confirm-info-modal-btn').addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('close-friendly-result-modal-btn').addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));
    document.getElementById('confirm-friendly-result-btn').addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullScreen);
    document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') { closeSettingsModal(); } });
    
    document.getElementById('currency-selector')?.addEventListener('change', (e) => {
        gameState.currency = e.target.value;
        if(gameState.userClub) {
            if (gameState.currentMainContent === 'finances-content') displayFinances();
            if (gameState.currentMainContent === 'squad-content') loadSquadTable();
            if (gameState.currentMainContent === 'contracts-content') displayContractsScreen();
            if (gameState.currentMainContent === 'transfer-market-content') displayTransferMarket();
        }
    });

    document.getElementById('open-friendly-modal-btn').addEventListener('click', openFriendlyModal);
    document.getElementById('close-friendly-modal-btn').addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('cancel-schedule-friendly-btn').addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('confirm-schedule-friendly-btn').addEventListener('click', scheduleFriendlyMatch);
    document.getElementById('tactics-content')?.addEventListener('click', handleTacticsInteraction);
    document.querySelectorAll('#tactics-content select, #tactics-content input[type="checkbox"]').forEach(element => { element.addEventListener('change', (e) => { e.stopPropagation(); const tacticKey = e.target.id.replace('tactic-', '').replace(/-([a-z])/g, g => g[1].toUpperCase()); if (e.target.type === 'checkbox') { gameState.tactics[tacticKey] = e.target.checked; } else { gameState.tactics[tacticKey] = e.target.value; } if (tacticKey === 'formation') { setupInitialSquad(); } loadTacticsScreen(); }); });
    document.querySelectorAll('.panel-toggle-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); const panelName = e.currentTarget.dataset.panel; const container = document.getElementById('tactics-layout-container'); container.classList.toggle(`${panelName}-collapsed`); }); });
    document.getElementById('confirm-and-play-btn').addEventListener('click', startMatchSimulation);
    document.getElementById('cancel-play-btn').addEventListener('click', () => { document.getElementById('match-confirmation-modal').classList.remove('active'); showMainContent('tactics-content'); });
    document.getElementById('close-confirmation-modal-btn').addEventListener('click', () => { document.getElementById('match-confirmation-modal').classList.remove('active'); });
    document.getElementById('pause-match-btn').addEventListener('click', () => togglePause());
    document.getElementById('resume-match-btn').addEventListener('click', () => togglePause());
    document.getElementById('close-post-match-btn').addEventListener('click', () => { document.getElementById('post-match-report-modal').classList.remove('active'); showScreen('main-game-screen'); updateContinueButton(); });
    
    document.getElementById('close-negotiation-modal-btn').addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
    document.getElementById('submit-offer-btn').addEventListener('click', handleNegotiationOffer);
    document.getElementById('accept-demand-btn').addEventListener('click', () => {
        const { desiredDuration, desiredBonus } = negotiationState;
        finalizeDeal(desiredDuration * 12, desiredBonus);
    });
    document.getElementById('walk-away-btn').addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
}

function addMainScreenEventListeners() {
    document.getElementById('league-table-selector')?.addEventListener('change', (e) => { gameState.tableView.leagueId = e.target.value; updateLeagueTable(gameState.tableView.leagueId); });
    document.getElementById('matches-league-selector')?.addEventListener('change', (e) => { gameState.matchesView.leagueId = e.target.value; gameState.matchesView.round = findCurrentRound(e.target.value); displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); });
    document.getElementById('prev-round-btn')?.addEventListener('click', () => { if (gameState.matchesView.round > 1) { gameState.matchesView.round--; displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); } });
    document.getElementById('next-round-btn')?.addEventListener('click', () => { gameState.matchesView.round++; displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); });
    
    document.querySelector('#finances-content .tabs-container')?.addEventListener('click', (e) => {
        if(e.target.classList.contains('tab-btn')) {
            const tabId = e.target.dataset.tab;
            document.querySelectorAll('#finances-content .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#finances-content .tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            if(tabId === 'club-finances') renderFinanceChart();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadLeagues();
    window.addEventListener('resize', resizeCanvas);
    
    const observer = new MutationObserver((mutations) => {
        for(let mutation of mutations) {
            if (mutation.attributeName === 'class' && mutation.target.id === 'main-game-screen' && mutation.target.classList.contains('active')) {
                addMainScreenEventListeners();
                break;
            }
        }
    });
    
    observer.observe(document.getElementById('main-game-screen'), { attributes: true });
});
