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

function populateLeagueSelectors() { const selectors = [document.getElementById('league-table-selector'), document.getElementById('matches-league-selector')]; selectors.forEach(selector => { if (!selector) return; selector.innerHTML = ''; for (const leagueId in leaguesData) { const option = document.createElement('option'); option.value = leagueId; option.innerText = leaguesData[leagueId].name; selector.appendChild(option); } selector.value = gameState.currentLeagueId; }); }
function findCurrentRound(leagueId) { if (!gameState.leagueStates[leagueId]) return 1; const schedule = gameState.leagueStates[leagueId].schedule; const lastPlayedMatch = [...schedule].reverse().find(m => m.status === 'played' && new Date(m.date) <= gameState.currentDate && typeof m.round === 'number'); return lastPlayedMatch ? lastPlayedMatch.round + 1 : 1; }
function openFriendlyModal() { const selector = document.getElementById('friendly-opponent-selector'); selector.innerHTML = ''; let allTeams = []; for (const leagueId in leaguesData) { allTeams.push(...leaguesData[leagueId].teams); } allTeams.filter(team => team.name !== gameState.userClub.name).sort((a,b) => a.name.localeCompare(b.name)).forEach(team => { const option = document.createElement('option'); option.value = team.name; option.innerText = team.name; selector.appendChild(option); }); document.getElementById('schedule-friendly-modal').classList.add('active'); }
function scheduleFriendlyMatch() { document.getElementById('schedule-friendly-modal').classList.remove('active'); const opponentName = document.getElementById('friendly-opponent-selector').value; const periodDays = parseInt(document.getElementById('friendly-period-selector').value, 10); const userStrength = getTeamStrength(gameState.userClub, true); const opponentData = findTeamInLeagues(opponentName); const opponentStrength = getTeamStrength(opponentData, false); const strengthDiff = userStrength - opponentStrength; let acceptanceChance = 0.5; if (strengthDiff > 15) acceptanceChance = 0.7; else if (strengthDiff > 5) acceptanceChance = 0.6; else if (strengthDiff < -15) acceptanceChance = 0.10; else if (strengthDiff < -5) acceptanceChance = 0.3; if (Math.random() > acceptanceChance) { showInfoModal('Convite Recusado', `${opponentName} recusou o convite para o amistoso.`); return; } const startDate = new Date(gameState.currentDate); const endDate = new Date(gameState.currentDate); endDate.setDate(endDate.getDate() + periodDays); let friendlyDate = null; let currentDate = new Date(startDate); currentDate.setDate(currentDate.getDate() + 1); while (currentDate <= endDate) { if (isDateAvailableForTeam(currentDate, gameState.userClub.name) && isDateAvailableForTeam(currentDate, opponentName)) { friendlyDate = new Date(currentDate); break; } currentDate.setDate(currentDate.getDate() + 1); } if (friendlyDate) { const newFriendly = { home: gameState.userClub, away: opponentData, date: friendlyDate.toISOString(), status: 'scheduled', round: 'Amistoso' }; gameState.allMatches.push(newFriendly); gameState.allMatches.sort((a,b) => new Date(a.date) - new Date(b.date)); findNextUserMatch(); updateContinueButton(); if (gameState.currentMainContent === 'calendar-content') updateCalendar(); showInfoModal('Amistoso Marcado!', `Amistoso contra ${opponentName} marcado para ${friendlyDate.toLocaleDateString('pt-BR')}!`); } else { showInfoModal('Sem Data Disponível', `${opponentName} aceitou o convite, mas não foi possível encontrar uma data compatível no período selecionado.`); } }
function isDateAvailableForTeam(date, teamName) { return !gameState.allMatches.some(match => (match.home.name === teamName || match.away.name === teamName) && isSameDay(new Date(match.date), date)); }

// --- Seção de Contratos, Desenvolvimento e Mercado (UI) ---
function displayContractsScreen() {
    const container = document.getElementById('contracts-content');
    container.innerHTML = '<h3>Situação Contratual do Elenco</h3>';
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    const sortedPlayers = [...gameState.userClub.players].sort((a, b) => (a.contractUntil || 999) - (b.contractUntil || 999));
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Contrato Restante</th><th>Ações</th></tr></thead><tbody>`;
    for (const player of sortedPlayers) {
        let contractClass = '';
        if (player.contractUntil <= 6) contractClass = 'negative';
        else if (player.contractUntil <= 12) contractClass = 'text-secondary';
        tableHTML += `<tr data-player-name="${player.name}">
                        <td>${player.name}</td><td>${player.age}</td><td>${player.position}</td>
                        <td><b>${player.overall}</b></td><td class="${contractClass}">${formatContract(player.contractUntil)}</td>
                        <td><button class="renew-btn" data-player-name="${player.name}">Renovar</button> <button class="terminate-btn secondary" data-player-name="${player.name}">Rescindir</button></td>
                      </tr>`;
    }
    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);
    container.querySelectorAll('.renew-btn').forEach(btn => btn.addEventListener('click', () => openNegotiationModal(gameState.userClub.players.find(p => p.name === btn.dataset.playerName), 'renew')));
    container.querySelectorAll('.terminate-btn').forEach(btn => btn.addEventListener('click', () => handleContractTermination(gameState.userClub.players.find(p => p.name === btn.dataset.playerName))));
}

function displayDevelopmentScreen() {
    const container = document.getElementById('development-content');
    const players = gameState.userClub.players;
    let improvingCount = 0, decliningCount = 0, stagnatingCount = 0;
    let playerHTML = '';
    players.forEach(player => {
        const dev = predictPlayerDevelopment(player);
        if (dev.overallChange > 0) improvingCount++;
        else if (dev.overallChange < 0) decliningCount++;
        else stagnatingCount++;
        let overallChangeClass = dev.overallChange > 0 ? 'positive' : (dev.overallChange < 0 ? 'negative' : '');
        let overallChangeString = dev.overallChange > 0 ? `+${dev.overallChange}` : (dev.overallChange !== 0 ? dev.overallChange : '-');
        let attributesHTML = Object.entries(dev.attributeChanges).map(([key, value]) => `<span class="${value.startsWith('+') ? 'positive' : 'negative'}">${key.charAt(0).toUpperCase() + key.slice(1)} ${value}</span>`).join('');
        playerHTML += `<div class="player-dev-card"><div class="player-dev-info"><h4>${player.name} (${player.age})</h4><p>Overall: ${player.overall} <span class="${overallChangeClass}">(${overallChangeString})</span></p><div class="attribute-changes">${attributesHTML || "Sem mudanças previstas."}</div></div><div class="player-dev-chart"><canvas id="chart-player-${player.name.replace(/\s/g, '')}"></canvas></div></div>`;
    });
    container.innerHTML = `<h3>Desenvolvimento do Elenco</h3><div class="team-dev-overview"><div class="team-dev-chart-container"><canvas id="team-dev-chart"></canvas></div><div class="team-dev-summary"><p><span class="positive-dot"></span> Jogadores Evoluindo: ${improvingCount}</p><p><span class="stagnating-dot"></span> Jogadores Estagnados: ${stagnatingCount}</p><p><span class="negative-dot"></span> Jogadores Regredindo: ${decliningCount}</p></div></div><div class="player-dev-grid">${playerHTML}</div>`;
    new Chart(document.getElementById('team-dev-chart').getContext('2d'), { type: 'doughnut', data: { labels: ['Evoluindo', 'Regredindo', 'Estagnado'], datasets: [{ data: [improvingCount, decliningCount, stagnatingCount], backgroundColor: ['#3DDC97', '#f75c6c', '#4a525a'], borderColor: '#2C333A', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

function displayTransferMarket() {
    const container = document.getElementById('transfer-market-content');
    container.innerHTML = `<div class="tabs-container"><button class="tab-btn active" data-tab="search-players">Pesquisar Jogadores</button><button class="tab-btn" data-tab="top-free-agents">Top 20 Agentes Livres</button><button class="tab-btn" data-tab="market-hub" disabled>Mercado</button></div><div id="search-players-tab" class="tab-content active"></div><div id="top-free-agents-tab" class="tab-content"></div><div id="market-hub-tab" class="tab-content"><p>Funcionalidade em desenvolvimento.</p></div>`;
    displayTopFreeAgents();
    displayPlayerSearch();
    container.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { const tabId = btn.dataset.tab; container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); btn.classList.add('active'); container.querySelector(`#${tabId}-tab`).classList.add('active'); }));
}

function displayTopFreeAgents() {
    const container = document.getElementById('top-free-agents-tab');
    const top20 = [...gameState.freeAgents].sort((a,b) => b.overall - a.overall).slice(0, 20);
    container.innerHTML = `<div class="table-container">${renderPlayerList(top20)}</div>`;
    addPlayerListEventListeners(container);
}

function displayPlayerSearch() {
    const container = document.getElementById('search-players-tab');
    container.innerHTML = `
        <div class="player-search-bar">
            <input type="text" id="player-search-input" placeholder="Nome do jogador...">
            <select id="pos-filter"><option value="">Posição</option><option>GK</option><option>CB</option><option>LB</option><option>RB</option><option>CDM</option><option>CM</option><option>CAM</option><option>LW</option><option>RW</option><option>ST</option></select>
            <input type="number" id="min-age-filter" placeholder="Idade Mín." min="15" max="50">
            <input type="number" id="max-age-filter" placeholder="Idade Máx." min="15" max="50">
            <button id="player-search-btn">Pesquisar</button>
            <button id="show-all-free-agents-btn" class="secondary">Mostrar Todos</button>
        </div>
        <div class="table-container" id="player-search-results"><p style="padding: 20px; text-align: center;">Use os filtros para encontrar jogadores.</p></div>`;

    document.getElementById('player-search-btn').addEventListener('click', applyPlayerSearchFilters);
    document.getElementById('show-all-free-agents-btn').addEventListener('click', applyPlayerSearchFilters);
}

function applyPlayerSearchFilters(event) {
    const resultsContainer = document.getElementById('player-search-results');
    let results = [...gameState.freeAgents];

    if (event && event.currentTarget.id !== 'show-all-free-agents-btn') {
        const nameQuery = document.getElementById('player-search-input').value.toLowerCase();
        const posQuery = document.getElementById('pos-filter').value;
        const minAge = parseInt(document.getElementById('min-age-filter').value, 10) || 0;
        const maxAge = parseInt(document.getElementById('max-age-filter').value, 10) || 99;

        results = results.filter(p => {
            const nameMatch = nameQuery ? p.name.toLowerCase().includes(nameQuery) : true;
            const posMatch = posQuery ? p.position === posQuery : true;
            const ageMatch = p.age >= minAge && p.age <= maxAge;
            return nameMatch && posMatch && ageMatch;
        });
    }

    results.sort((a, b) => b.overall - a.overall);
    resultsContainer.innerHTML = renderPlayerList(results);
    addPlayerListEventListeners(resultsContainer);
}


function renderPlayerList(players) {
    if (players.length === 0) return '<p style="padding: 20px; text-align: center;">Nenhum jogador encontrado.</p>';
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor de Mercado</th><th>Ação</th></tr></thead><tbody>`;
    for (const player of players) {
        tableHTML += `<tr data-player-name="${player.name}">
                        <td>${player.name}</td><td>${player.age}</td><td>${player.position}</td>
                        <td><b>${player.overall}</b></td><td>${formatCurrency(player.marketValue)}</td>
                        <td><button class="propose-contract-btn" data-player-name="${player.name}">Propor Contrato</button></td>
                      </tr>`;
    }
    tableHTML += `</tbody></table>`;
    return tableHTML;
}

function addPlayerListEventListeners(container) {
    container.querySelectorAll('.propose-contract-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const player = gameState.freeAgents.find(p => p.name === e.target.dataset.playerName);
            if (player) openNegotiationModal(player, 'hire');
        });
    });
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
        if(gameState.userClub) { // Only update if game has started
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
    
    // Listeners do modal de negociação
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
    
    // Listener para as abas de finanças, que são criadas dinamicamente
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
