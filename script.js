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
    currency: 'BRL', // Controle da moeda
    clubFinances: { balance: 0, history: [] }, // Controle financeiro
    allMatches: [], // Armazena todos os jogos (oficiais + amistosos)
};
let holidayInterval = null;
let selectedPlayerInfo = null;
const MAX_SUBSTITUTES = 7;

const currencyRates = { BRL: 1, USD: 5.55, EUR: 6.42 };

// Estrutura de premiação em Milhões de Reais
const prizeMoney = {
    brasileirao_a: {
        1: 48.1, 2: 45.7, 3: 43.3, 4: 40.9, 5: 38.5, 6: 36.1, 7: 33.7, 8: 31.3,
        9: 28.8, 10: 26.4, 11: 20.7, 12: 19.2, 13: 17.8, 14: 17.3, 15: 16.8, 16: 16.3,
    },
    brasileirao_b: {
        1: 3.5, 2: 1.35, 3: 1.35, 4: 1.35
    },
    brasileirao_c: {
        advancement_bonus: 0.344,
        participation_fee: 1.4
    }
};

const positionMatrix = { 'GK': { 'GK': 0, 'CB': 4, 'LB': 4, 'RB': 4, 'CDM': 4, 'CM': 4, 'CAM': 4, 'LW': 4, 'RW': 4, 'ST': 4 }, 'CB': { 'GK': 4, 'CB': 0, 'LB': 1, 'RB': 1, 'CDM': 1, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 3, 'ST': 3 }, 'LB': { 'GK': 4, 'CB': 1, 'LB': 0, 'RB': 2, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 1, 'RW': 3, 'ST': 3 }, 'RB': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 0, 'CDM': 2, 'CM': 2, 'CAM': 3, 'LW': 3, 'RW': 1, 'ST': 3 }, 'CDM': { 'GK': 4, 'CB': 1, 'LB': 2, 'RB': 2, 'CDM': 0, 'CM': 1, 'CAM': 2, 'LW': 3, 'RW': 3, 'ST': 3 }, 'CM': { 'GK': 4, 'CB': 2, 'LB': 2, 'RB': 2, 'CDM': 1, 'CM': 0, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 2 }, 'CAM': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 2, 'CM': 1, 'CAM': 0, 'LW': 1, 'RW': 1, 'ST': 1 }, 'LW': { 'GK': 4, 'CB': 3, 'LB': 1, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 0, 'RW': 2, 'ST': 2 }, 'RW': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 1, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 0, 'ST': 2 }, 'ST': { 'GK': 4, 'CB': 3, 'LB': 3, 'RB': 3, 'CDM': 3, 'CM': 2, 'CAM': 1, 'LW': 2, 'RW': 2, 'ST': 0 }, };
// [X from left, Y from top] for HORIZONTAL pitch
const formationLayouts = {
    '4-4-2':    { 'GK': [7, 50],  'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'RM': [60, 85], 'CM1': [55, 60], 'CM2': [55, 40], 'LM': [60, 15], 'ST1': [85, 60], 'ST2': [85, 40] },
    '4-3-3':    { 'GK': [7, 50],  'RB': [30, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [30, 15], 'CM1': [55, 70], 'CM2': [50, 50], 'CM3': [55, 30], 'RW': [80, 80], 'ST': [88, 50], 'LW': [80, 20] },
    '3-5-2':    { 'GK': [7, 50],  'CB1': [25, 70], 'CB2': [22, 50], 'CB3': [25, 30], 'RWB': [55, 88], 'CM1': [58, 65], 'CDM': [40, 50], 'CM2': [58, 35], 'LWB': [55, 12], 'ST1': [85, 65], 'ST2': [85, 35] },
    '4-2-3-1':  { 'GK': [7, 50],  'RB': [35, 85], 'CB1': [25, 65], 'CB2': [25, 35], 'LB': [35, 15], 'CDM1': [45, 65], 'CDM2': [45, 35], 'RW': [70, 85], 'CAM': [65, 50], 'LW': [70, 15], 'ST': [88, 50] }
};
const PITCH_DIMS = { top: 0, bottom: 100, left: 0, right: 100, goalHeight: 30 };

// --- Funções de Notícias ---
function addNews(headline, body, isUserRelated = false, imageHint = null) { const newsItem = { date: new Date(gameState.currentDate), headline, body, imageHint }; gameState.newsFeed.unshift(newsItem); if (isUserRelated) showUserNewsModal(headline, body); }
function showUserNewsModal(headline, body) { document.getElementById('user-news-headline').innerText = headline; document.getElementById('user-news-body').innerText = body; document.getElementById('user-news-modal').classList.add('active'); }
function displayNewsFeed() { const container = document.getElementById('news-layout-container'); container.innerHTML = ''; if (gameState.newsFeed.length === 0) { container.innerHTML = '<p>Nenhuma notícia por enquanto.</p>'; return; } const mainNews = gameState.newsFeed[0]; const mainTeam = findTeamInLeagues(mainNews.imageHint); let mainImage = mainTeam ? `images/${mainTeam.logo}` : `images/${leaguesData[Object.keys(leaguesData)[0]].logo}`; container.innerHTML += ` <div class="news-article news-article-main"> <img src="${mainImage}" alt="Notícia principal"> <div class="news-article-content"> <h4>${mainNews.headline}</h4> <p class="news-body">${mainNews.body}</p> <span class="news-date">${mainNews.date.toLocaleDateString('pt-BR')}</span> </div> </div> `; const secondaryNewsContainer = document.createElement('div'); secondaryNewsContainer.id = 'news-list-secondary'; const secondaryNews = gameState.newsFeed.slice(1, 5); secondaryNews.forEach(item => { const itemTeam = findTeamInLeagues(item.imageHint); let itemImage = itemTeam ? `images/${itemTeam.logo}` : `images/logo_default.png`; secondaryNewsContainer.innerHTML += ` <div class="news-article news-article-secondary"> <img src="${itemImage}" alt="Notícia secundária"> <div class="news-article-content"> <h4>${item.headline}</h4> <span class="news-date">${item.date.toLocaleDateString('pt-BR')}</span> </div> </div> `; }); container.appendChild(secondaryNewsContainer); }

// --- Funções de UI ---
function openSettingsModal() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettingsModal() { document.getElementById('settings-modal').classList.remove('active'); }
function showInfoModal(headline, body) { document.getElementById('info-modal-headline').innerText = headline; document.getElementById('info-modal-body').innerText = body; document.getElementById('info-modal').classList.add('active'); }
function showFriendlyResultModal(match) { document.getElementById('friendly-result-headline').innerText = "Resultado do Amistoso"; document.getElementById('friendly-result-body').innerText = `${match.home.name} ${match.homeScore} x ${match.awayScore} ${match.away.name}`; document.getElementById('friendly-result-modal').classList.add('active'); }
function toggleFullScreen() { const doc = window.document; const docEl = doc.documentElement; const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen; const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen; if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) { requestFullScreen.call(docEl); } else { cancelFullScreen.call(doc); } }
function showScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); const next = document.getElementById(screenId); if (next) next.classList.add('active'); gameState.currentScreen = screenId; }
function showMainContent(contentId) { clearSelection(); const currentPanel = document.getElementById(gameState.currentMainContent); if(currentPanel) currentPanel.classList.remove('active'); const oldMenuItem = document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`); if (oldMenuItem) oldMenuItem.classList.remove('active'); const newPanel = document.getElementById(contentId); if(newPanel) newPanel.classList.add('active'); const newMenuItem = document.querySelector(`#sidebar li[data-content='${contentId}']`); if (newMenuItem) newMenuItem.classList.add('active'); gameState.currentMainContent = contentId; if (contentId === 'tactics-content') loadTacticsScreen(); if (contentId === 'calendar-content') { gameState.calendarDisplayDate = new Date(gameState.currentDate); updateCalendar(); } if (contentId === 'matches-content') { gameState.matchesView.leagueId = gameState.matchesView.leagueId || gameState.currentLeagueId; gameState.matchesView.round = findCurrentRound(gameState.matchesView.leagueId); displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); } if (contentId === 'league-content') { gameState.tableView.leagueId = gameState.tableView.leagueId || gameState.currentLeagueId; updateLeagueTable(gameState.tableView.leagueId); } if (contentId === 'news-content') displayNewsFeed(); if (contentId === 'finances-content') displayFinances(); }

// --- Funções de Inicialização do Jogo ---
function createManager() { const nameInput = document.getElementById('manager-name-input'); if (nameInput.value.trim() === '') { showInfoModal('Atenção', 'Por favor, digite seu nome.'); return; } gameState.managerName = nameInput.value.trim(); showScreen('start-screen'); }
function loadLeagues() { const leagueSelectionDiv = document.getElementById('league-selection'); leagueSelectionDiv.innerHTML = ''; for (const leagueId in leaguesData) { const league = leaguesData[leagueId]; const leagueCard = document.createElement('div'); leagueCard.className = 'league-card'; leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}"><span>${league.name}</span>`; leagueCard.addEventListener('click', () => loadTeams(leagueId)); leagueSelectionDiv.appendChild(leagueCard); } }
function loadTeams(leagueId) { gameState.currentLeagueId = leagueId; const teamSelectionDiv = document.getElementById('team-selection'); teamSelectionDiv.innerHTML = ''; const teams = leaguesData[leagueId].teams; for (const team of teams) { const teamCard = document.createElement('div'); teamCard.className = 'team-card'; teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`; teamCard.addEventListener('click', () => startGame(team)); teamSelectionDiv.appendChild(teamCard); } showScreen('select-team-screen'); }
function createClub() { const clubName = document.getElementById('club-name-input').value; if (!clubName) { showInfoModal("Atenção", "Por favor, preencha o nome do clube."); return; } gameState.currentLeagueId = Object.keys(leaguesData)[0]; const generatedPlayers = []; for (let i = 0; i < 22; i++) { generatedPlayers.push({ name: `*Jogador Gerado ${i + 1}`, position: "CM", attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 }, overall: 55 }); } const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers }; startGame(newClub); }
function setupInitialSquad() { gameState.squadManagement.startingXI = {}; gameState.squadManagement.substitutes = []; gameState.squadManagement.reserves = []; const todosJogadores = [...gameState.userClub.players].sort((a, b) => b.overall - a.overall); const formacao = gameState.tactics.formation; const posicoesDaFormacao = Object.keys(formationLayouts[formacao]); let jogadoresDisponiveis = [...todosJogadores]; for (const posicaoDoEsquema of posicoesDaFormacao) { const posicaoBase = posicaoDoEsquema.replace(/\d/g, ''); const indiceMelhorJogador = jogadoresDisponiveis.findIndex(p => p.position === posicaoBase); if (indiceMelhorJogador !== -1) { const jogadorEscolhido = jogadoresDisponiveis[indiceMelhorJogador]; gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadorEscolhido; jogadoresDisponiveis.splice(indiceMelhorJogador, 1); } } for (const posicaoDoEsquema of posicoesDaFormacao) { if (!gameState.squadManagement.startingXI[posicaoDoEsquema] && jogadoresDisponiveis.length > 0) { gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadoresDisponiveis.shift(); } } gameState.squadManagement.substitutes = jogadoresDisponiveis.splice(0, MAX_SUBSTITUTES); gameState.squadManagement.reserves = jogadoresDisponiveis; }
function startGame(team) { gameState.userClub = team; initializeClubFinances(); initializeSeason(); document.getElementById('header-manager-name').innerText = gameState.managerName; document.getElementById('header-club-name').innerText = gameState.userClub.name; document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`; populateLeagueSelectors(); showScreen('main-game-screen'); showMainContent('home-content'); }
function initializeSeason() { const year = 2024 + gameState.season - 1; gameState.isOffSeason = false; gameState.newsFeed = []; for(const leagueId in leaguesData) { const leagueInfo = leaguesData[leagueId]; const seasonStartDate = leagueInfo.leagueInfo.startDate ? `${year}-${leagueInfo.leagueInfo.startDate.substring(5)}` : `${year}-04-15`; const leagueStartDate = new Date(`${seasonStartDate}T12:00:00Z`); const isSerieC = leagueId === 'brasileirao_c'; const schedule = generateSchedule(leagueInfo.teams, leagueInfo.leagueInfo, leagueStartDate, 0, isSerieC ? 1 : undefined); gameState.leagueStates[leagueId] = { table: initializeLeagueTable(leagueInfo.teams), schedule: schedule, serieCState: { phase: 1, groups: { A: [], B: [] }, finalists: [] } }; } gameState.allMatches = []; for(const leagueId in gameState.leagueStates) { gameState.allMatches.push(...gameState.leagueStates[leagueId].schedule); } gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date)); gameState.currentDate = new Date(`${year}-01-01T12:00:00Z`); setupInitialSquad(); findNextUserMatch(); loadSquadTable(); updateLeagueTable(gameState.currentLeagueId); updateContinueButton(); addNews(`Começa a Temporada ${year}!`, `A bola vai rolar para a ${leaguesData[gameState.currentLeagueId].name}. Boa sorte, ${gameState.managerName}!`, true, gameState.userClub.name); }

// --- Funções de Finanças ---
function initializeClubFinances() { const clubFinancialData = typeof estimativaVerbaMedia2025 !== 'undefined' ? estimativaVerbaMedia2025.find(c => c.time === gameState.userClub.name) : null; let initialBudget = 5 * 1000000; if (clubFinancialData) { initialBudget = clubFinancialData.verba_media_estimada_milhoes_reais * 1000000; } gameState.clubFinances.balance = 0; gameState.clubFinances.history = []; addTransaction(initialBudget, "Verba inicial da temporada"); }
function addTransaction(amount, description) { gameState.clubFinances.history.unshift({ date: new Date(gameState.currentDate), description, amount }); gameState.clubFinances.balance += amount; }
function displayFinances() { const container = document.getElementById('finances-content'); if (!container) return; displayClubFinances(); displayOpponentFinances(); }
function displayClubFinances() { const tabContent = document.getElementById('club-finances-tab'); const { balance, history } = gameState.clubFinances; tabContent.innerHTML = ` <div class="finance-overview"> <div class="finance-box"> <h4>Balanço Atual</h4> <p class="${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</p> </div> </div> <div class="finance-chart-container"> <h4>Evolução Financeira</h4> <canvas id="finance-chart"></canvas> </div> <div class="finance-history-container"> <h4>Histórico de Transações</h4> <div class="table-container" id="finance-history-table"></div> </div> `; const historyTableContainer = document.getElementById('finance-history-table'); let tableHTML = `<table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>`; for (const item of history) { tableHTML += ` <tr> <td>${item.date.toLocaleDateString('pt-BR')}</td> <td>${item.description}</td> <td class="${item.amount >= 0 ? 'positive' : 'negative'}">${formatCurrency(item.amount)}</td> </tr> `; } tableHTML += `</tbody></table>`; historyTableContainer.innerHTML = tableHTML; renderFinanceChart(); }
function renderFinanceChart() { const ctx = document.getElementById('finance-chart')?.getContext('2d'); if (!ctx) return; const history = [...gameState.clubFinances.history].reverse(); const labels = history.map(item => item.date.toLocaleDateString('pt-BR')); let cumulativeBalance = 0; const data = history.map(item => { cumulativeBalance += item.amount; return cumulativeBalance; }); if (window.financeChartInstance) { window.financeChartInstance.destroy(); } window.financeChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Balanço do Clube', data: data, borderColor: 'rgb(61, 220, 151)', backgroundColor: 'rgba(61, 220, 151, 0.2)', tension: 0.1, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: function(value, index, values) { return formatCurrency(value); } } } } } }); }
function displayOpponentFinances() { const container = document.getElementById('opponent-finances-tab'); if (typeof estimativaVerbaMedia2025 === 'undefined') { container.innerHTML = '<h3>Erro</h3><p>Os dados financeiros (verba_times.js) não foram encontrados.</p>'; return; } container.innerHTML = `<h3>Verba Estimada dos Clubes (Início da Temporada)</h3>`; const tableContainer = document.createElement('div'); tableContainer.className = 'table-container'; let fullHtml = ''; const divisionsOrder = ['Série A', 'Série B', 'Série C']; const financesByDivision = estimativaVerbaMedia2025.reduce((acc, team) => { const { divisao } = team; if (!acc[divisao]) acc[divisao] = []; acc[divisao].push(team); return acc; }, {}); for (const division of divisionsOrder) { if (!financesByDivision[division]) continue; fullHtml += `<h4 style="margin-top: 20px; margin-bottom: 10px;">${division}</h4>`; fullHtml += `<table><thead><tr><th>Time</th><th>Verba Média Estimada</th><th>Análise</th></tr></thead><tbody>`; const sortedTeams = financesByDivision[division].sort((a, b) => b.verba_media_estimada_milhoes_reais - a.verba_media_estimada_milhoes_reais); for (const team of sortedTeams) { const formattedVerba = formatCurrency(team.verba_media_estimada_milhoes_reais * 1000000); const cleanAnalysis = team.analise.replace(/\[.*?\]/g, '').trim(); fullHtml += `<tr> <td>${team.time}</td> <td>${formattedVerba}</td> <td>${cleanAnalysis}</td> </tr>`; } fullHtml += '</tbody></table>'; } tableContainer.innerHTML = fullHtml; container.appendChild(tableContainer); }
function formatCurrency(valueInBRL) { const rate = currencyRates[gameState.currency]; const convertedValue = valueInBRL / rate; return new Intl.NumberFormat('default', { style: 'currency', currency: gameState.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedValue); }

// --- Lógica de Táticas ---
function handleTacticsInteraction(e) { const clickedElement = e.target.closest('[data-player-id], .player-slot, #substitutes-list, #reserves-list'); if (!clickedElement) { clearSelection(); return; } const clickedPlayerId = clickedElement.dataset.playerId; if (clickedPlayerId) { const player = gameState.userClub.players.find(p => p.name === clickedPlayerId); const sourceInfo = getPlayerLocation(player); if (selectedPlayerInfo) { if (selectedPlayerInfo.player.name === player.name) { clearSelection(); } else { const destPlayerInfo = { player, ...sourceInfo }; swapPlayers(selectedPlayerInfo, destPlayerInfo); clearSelection(); } } else { selectPlayer(player, sourceInfo.type, sourceInfo.id); } } else if (selectedPlayerInfo) { let destInfo; if (clickedElement.classList.contains('player-slot')) { destInfo = { type: 'field', id: clickedElement.dataset.position }; } else if (clickedElement.id === 'substitutes-list') { destInfo = { type: 'subs', id: 'substitutes-list' }; } else if (clickedElement.id === 'reserves-list') { destInfo = { type: 'reserves', id: 'reserves-list' }; } if (destInfo) { movePlayer(selectedPlayerInfo, destInfo); clearSelection(); } } }
function selectPlayer(player, sourceType, sourceId) { clearSelection(); selectedPlayerInfo = { player, sourceType, sourceId }; const element = document.querySelector(`[data-player-id="${player.name}"]`); if(element) element.classList.add('selected'); }
function clearSelection() { if (selectedPlayerInfo) { const element = document.querySelector(`[data-player-id="${selectedPlayerInfo.player.name}"]`); if(element) element.classList.remove('selected'); } selectedPlayerInfo = null; }
function getPlayerLocation(player) { for (const pos in gameState.squadManagement.startingXI) { if (gameState.squadManagement.startingXI[pos]?.name === player.name) { return { type: 'field', id: pos }; } } if (gameState.squadManagement.substitutes.some(p => p && p.name === player.name)) { return { type: 'subs', id: 'substitutes-list' }; } return { type: 'reserves', id: 'reserves-list' }; }
function removePlayerFromSource(playerInfo) { if (!playerInfo || !playerInfo.player) return; if (playerInfo.sourceType === 'field') { delete gameState.squadManagement.startingXI[playerInfo.sourceId]; } else if (playerInfo.sourceType === 'subs') { gameState.squadManagement.substitutes = gameState.squadManagement.substitutes.filter(p => p && p.name !== playerInfo.player.name); } else { gameState.squadManagement.reserves = gameState.squadManagement.reserves.filter(p => p && p.name !== playerInfo.player.name); } }
function addPlayerToDest(player, destInfo) { if (destInfo.type === 'field') { gameState.squadManagement.startingXI[destInfo.id] = player; } else if (destInfo.type === 'subs') { gameState.squadManagement.substitutes.push(player); } else { gameState.squadManagement.reserves.push(player); } }
function movePlayer(playerInfo, destInfo) { if (destInfo.type === 'subs' && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`); return; } removePlayerFromSource(playerInfo); addPlayerToDest(playerInfo.player, destInfo); loadTacticsScreen(); }
function swapPlayers(sourcePlayerInfo, destPlayerInfo) { const isMovingToSubs = destPlayerInfo.type === 'subs'; const isMovingFromSubs = sourcePlayerInfo.sourceType === 'subs'; if (!isMovingFromSubs && isMovingToSubs && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`); return; } removePlayerFromSource(sourcePlayerInfo); removePlayerFromSource(destPlayerInfo); addPlayerToDest(sourcePlayerInfo.player, { type: destPlayerInfo.type, id: destPlayerInfo.id }); addPlayerToDest(destPlayerInfo.player, { type: sourcePlayerInfo.sourceType, id: sourcePlayerInfo.sourceId }); loadTacticsScreen(); }
function calculateModifiedOverall(player, targetPosition) { if (!player || !targetPosition) return player ? player.overall : 0; const naturalPosition = player.position; const cleanTargetPosition = targetPosition.replace(/\d/g, ''); if (!positionMatrix[naturalPosition] || positionMatrix[naturalPosition][cleanTargetPosition] === undefined) { return Math.max(40, player.overall - 25); } const distance = positionMatrix[naturalPosition][cleanTargetPosition]; const penaltyFactor = 4; const penalty = distance * penaltyFactor; return Math.max(40, player.overall - penalty); }
function loadTacticsScreen() {
    const formation = gameState.tactics.formation;
    const field = document.querySelector('#field-container .field-background');
    const subsList = document.getElementById('substitutes-list');
    const reservesList = document.getElementById('reserves-list');
    field.innerHTML = ''; subsList.innerHTML = ''; reservesList.innerHTML = '';

    Object.keys(gameState.tactics).forEach(key => {
        const elementId = `tactic-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        const element = document.getElementById(elementId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = gameState.tactics[key];
            } else {
                element.value = gameState.tactics[key];
            }
        }
    });

    const positions = formationLayouts[formation];
    for (const pos in positions) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.dataset.position = pos;
        slot.style.left = `${positions[pos][0]}%`;
        slot.style.top = `${positions[pos][1]}%`;
        const player = gameState.squadManagement.startingXI[pos];
        if (player) {
            slot.appendChild(createPlayerChip(player, pos));
        } else {
            slot.innerText = pos;
        }
        field.appendChild(slot);
    }
    gameState.squadManagement.substitutes.forEach(player => subsList.appendChild(createSquadListPlayer(player)));
    gameState.squadManagement.reserves.forEach(player => reservesList.appendChild(createSquadListPlayer(player)));
    document.getElementById('subs-count').innerText = gameState.squadManagement.substitutes.length;

    if (selectedPlayerInfo) {
        const element = document.querySelector(`[data-player-id="${selectedPlayerInfo.player.name}"]`);
        if (element) element.classList.add('selected');
    }
}
function createPlayerChip(player, currentPosition) { const chip = document.createElement('div'); chip.className = 'player-chip'; chip.dataset.playerId = player.name; const modifiedOverall = calculateModifiedOverall(player, currentPosition); let overallClass = 'player-overall'; if (modifiedOverall < player.overall) { overallClass += ' penalty'; } chip.innerHTML = ` <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span> <span class="${overallClass}">${modifiedOverall}</span> <span class="player-pos">${player.position}</span> `; return chip; }
function createSquadListPlayer(player) { const item = document.createElement('div'); item.className = 'squad-list-player'; item.dataset.playerId = player.name; item.innerHTML = ` <div class="player-info"> <div class="player-name">${player.name}</div> <div class="player-pos">${player.position}</div> </div> <div class="player-overall">${player.overall}</div> `; return item; }

// --- Funções de UI (Tabelas, Calendário, Jogos) ---
function loadSquadTable() { const playerListDiv = document.getElementById('player-list-table'); if (!playerListDiv) return; const positionOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']; const sortedPlayers = [...gameState.userClub.players].sort((a, b) => { return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position); }); let tableHTML = `<table><thead><tr><th>Nome</th><th>Pos.</th><th>Veloc.</th><th>Finaliz.</th><th>Passe</th><th>Drible</th><th>Defesa</th><th>Físico</th><th>GERAL</th></tr></thead><tbody>`; for (const player of sortedPlayers) { tableHTML += `<tr><td>${player.name}</td><td>${player.position}</td><td>${player.attributes.pace}</td><td>${player.attributes.shooting}</td><td>${player.attributes.passing}</td><td>${player.attributes.dribbling}</td><td>${player.attributes.defending}</td><td>${player.attributes.physical}</td><td><b>${player.overall}</b></td></tr>`; } tableHTML += `</tbody></table>`; playerListDiv.innerHTML = tableHTML; }
function updateTableWithResult(leagueId, match) { if (!leagueId || !gameState.leagueStates[leagueId] || match.round === 'Amistoso') return; const leagueState = gameState.leagueStates[leagueId]; let tableToUpdate; if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase > 1) { tableToUpdate = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name) || leagueState.serieCState.groups.B.includes(t.name)); } else { tableToUpdate = leagueState.table; } const homeTeam = tableToUpdate.find(t => t.name === match.home.name); const awayTeam = tableToUpdate.find(t => t.name === match.away.name); if (!homeTeam || !awayTeam) return; homeTeam.played++; awayTeam.played++; homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore; awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore; homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst; awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst; if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; } else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; } else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; } }
function updateLeagueTable(leagueId) { const container = document.getElementById('league-table-container'); if (!container) return; const leagueState = gameState.leagueStates[leagueId]; if (!leagueState) return; const leagueInfo = leaguesData[leagueId]; const tiebreakers = leagueInfo.leagueInfo.tiebreakers; let tableHTML = ''; if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase === 2) { const groupA = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name)); const groupB = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name)); groupA.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); groupB.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); tableHTML += '<h4>Grupo A (Segunda Fase)</h4>'; tableHTML += renderTable(groupA, 1); tableHTML += '<h4 style="margin-top: 20px;">Grupo B (Segunda Fase)</h4>'; tableHTML += renderTable(groupB, 1); } else { const table = [...leagueState.table]; table.sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); tableHTML = renderTable(table); } container.innerHTML = tableHTML; }
function renderTable(tableData, startPos = 1) { let html = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`; tableData.forEach((team, index) => { const isUserTeam = team.name === gameState.userClub.name; html += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + startPos}</td><td>${team.name}</td><td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`; }); html += `</tbody></table>`; return html; }
function updateCalendar() { const container = document.getElementById('calendar-container'); if (!container || !gameState.calendarDisplayDate) return; const date = gameState.calendarDisplayDate; const month = date.getMonth(); const year = date.getFullYear(); const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0); let html = `<div class="calendar-header"><button id="prev-month-btn">◀</button><h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3><button id="next-month-btn">▶</button></div><div class="calendar-grid"><div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`; for (let i = 0; i < firstDay.getDay(); i++) { html += `<div class="calendar-day other-month"></div>`; } for (let i = 1; i <= lastDay.getDate(); i++) { const loopDate = new Date(year, month, i); const isCurrent = isSameDay(loopDate, gameState.currentDate); const matchOnThisDay = gameState.allMatches.find(m => isSameDay(new Date(m.date), loopDate) && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name)); let dayClasses = 'calendar-day'; let dayContent = `<span class="day-number">${i}</span>`; if (matchOnThisDay) { dayClasses += ' match-day'; const opponent = matchOnThisDay.home.name === gameState.userClub.name ? `vs ${matchOnThisDay.away.name}` : `@ ${matchOnThisDay.home.name}`; dayContent += `<div class="match-details">${opponent}</div>`; } if (isCurrent) { dayClasses += ' current-day'; } html += `<div class="${dayClasses}" data-date="${loopDate.toISOString().split('T')[0]}">${dayContent}</div>`; } html += '</div>'; container.innerHTML = html; document.getElementById('prev-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() - 1); updateCalendar(); } }); document.getElementById('next-month-btn').addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() + 1); updateCalendar(); } }); }
function displayRound(leagueId, roundNumber) { const container = document.getElementById('round-matches-container'); const roundDisplay = document.getElementById('round-display'); const prevBtn = document.getElementById('prev-round-btn'); const nextBtn = document.getElementById('next-round-btn'); const leagueState = gameState.leagueStates[leagueId]; if (!leagueState) return; const roundMatches = leagueState.schedule.filter(m => m.round === roundNumber); roundDisplay.innerText = `Rodada ${roundNumber}`; container.innerHTML = ''; if (!roundMatches || roundMatches.length === 0) { container.innerHTML = "<p>Nenhuma partida encontrada para esta rodada.</p>"; return; } let roundHTML = ''; for (const match of roundMatches) { const score = match.status === 'played' ? `${match.homeScore} - ${match.awayScore}` : 'vs'; roundHTML += ` <div class="match-card"> <div class="match-card-team home"> <span>${match.home.name}</span> <img src="images/${match.home.logo}" alt="${match.home.name}"> </div> <div class="match-score">${score}</div> <div class="match-card-team away"> <img src="images/${match.away.logo}" alt="${match.away.name}"> <span>${match.away.name}</span> </div> </div> `; } container.innerHTML = roundHTML; prevBtn.disabled = roundNumber === 1; const totalRounds = leagueState.schedule.length > 0 ? Math.max(...leagueState.schedule.map(m => m.round).filter(r => typeof r === 'number')) : 0; nextBtn.disabled = roundNumber >= totalRounds; }

// --- Funções de Avanço e Simulação ---
function advanceDay() { const today = new Date(gameState.currentDate); const nextDay = new Date(today); nextDay.setDate(nextDay.getDate() + 1); if (gameState.isOffSeason && nextDay.getMonth() === 0 && nextDay.getDate() === 1) { gameState.season++; processPromotionRelegation(); initializeSeason(); return; } gameState.currentDate = nextDay; simulateDayMatches(); Object.keys(gameState.leagueStates).forEach(id => updateLeagueTable(id)); updateContinueButton(); if (gameState.currentMainContent === 'calendar-content') updateCalendar(); checkSeasonEvents(); }
function updateContinueButton() { const button = document.getElementById('advance-day-button'); const displayDate = document.getElementById('current-date-display'); displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); button.disabled = gameState.isOnHoliday; if (gameState.isOffSeason) { button.innerText = "Avançar Pré-Temporada"; button.onclick = advanceDay; return; } if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) { button.innerText = "DIA DO JOGO"; button.onclick = promptMatchConfirmation; } else { button.innerText = "Avançar Dia"; button.onclick = advanceDay; } }
function simulateDayMatches() { const todayMatches = gameState.allMatches.filter(match => isSameDay(new Date(match.date), gameState.currentDate)); for (const match of todayMatches) { if (match.status === 'scheduled') { const isUserMatch = match.home.name === gameState.userClub.name || match.away.name === gameState.userClub.name; if (isUserMatch && !gameState.isOnHoliday) { continue; } simulateSingleMatch(match, isUserMatch); if (match.round !== 'Amistoso') { const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name)); updateTableWithResult(leagueId, match); } } } }
function simulateSingleMatch(match, isUserMatch) { const homeTeamData = findTeamInLeagues(match.home.name); const awayTeamData = findTeamInLeagues(match.away.name); let homeStrength, awayStrength; if (isUserMatch && match.home.name === gameState.userClub.name) { homeStrength = getTeamStrength(homeTeamData, true); awayStrength = getTeamStrength(awayTeamData, false); } else if (isUserMatch && match.away.name === gameState.userClub.name) { homeStrength = getTeamStrength(homeTeamData, false); awayStrength = getTeamStrength(awayTeamData, true); } else { homeStrength = getTeamStrength(homeTeamData, false); awayStrength = getTeamStrength(awayTeamData, false); } homeStrength *= 1.1; let homeScore = 0; let awayScore = 0; for (let i = 0; i < 10; i++) { const totalStrength = homeStrength + awayStrength; const homeChance = (homeStrength / totalStrength) * (0.5 + Math.random()); const awayChance = (awayStrength / totalStrength) * (0.5 + Math.random()); if (homeChance > 0.65) homeScore++; if (awayChance > 0.60) awayScore++; } match.homeScore = homeScore; match.awayScore = awayScore; match.status = 'played'; if (isUserMatch && match.round === 'Amistoso') { showFriendlyResultModal(match); } }
function getTeamStrength(teamData, isUser) { let strength = 0; if (isUser) { const startingXI = Object.values(gameState.squadManagement.startingXI); if (startingXI.length === 11 && startingXI.every(p => p)) { strength = startingXI.reduce((acc, player) => acc + calculateModifiedOverall(player, Object.keys(gameState.squadManagement.startingXI).find(pos => gameState.squadManagement.startingXI[pos].name === player.name)), 0) / 11; switch (gameState.tactics.mentality) { case 'very_attacking': strength *= 1.05; break; case 'attacking': strength *= 1.02; break; case 'defensive': strength *= 0.98; break; case 'very_defensive': strength *= 0.95; break; } } else { strength = teamData.players.slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11; } } else { strength = teamData.players.sort((a,b)=>b.overall-a.overall).slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11; } return strength; }
function findNextUserMatch() { gameState.nextUserMatch = gameState.allMatches.filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name) && new Date(m.date) >= gameState.currentDate).sort((a,b) => new Date(a.date) - new Date(b.date))[0] || null; }
function initializeLeagueTable(teams) { return teams.map(team => ({ name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })); }
function generateSchedule(teams, leagueInfo, startDate, roundOffset = 0, phase = undefined) { let currentMatchDate = new Date(startDate); let clubes = [...teams]; if (clubes.length % 2 !== 0) { clubes.push({ name: "BYE", logo: "logo_default.png" }); } const numTeams = clubes.length; const isSerieCPhase1 = phase === 1; const roundsToPlay = isSerieCPhase1 ? numTeams - 1 : (numTeams - 1) * 2; const matchesPerRound = numTeams / 2; let allMatches = []; for (let turn = 0; turn < (isSerieCPhase1 ? 1 : 2); turn++) { let tempClubes = [...clubes]; for (let r = 0; r < numTeams - 1; r++) { for (let i = 0; i < matchesPerRound; i++) { const home = turn === 0 ? tempClubes[i] : tempClubes[numTeams - 1 - i]; const away = turn === 0 ? tempClubes[numTeams - 1 - i] : tempClubes[i]; if(home.name !== "BYE" && away.name !== "BYE") allMatches.push({home, away}); } tempClubes.splice(1, 0, tempClubes.pop()); } } const schedule = []; for (let i = 0; i < allMatches.length; i++) { if (i > 0 && i % matchesPerRound === 0) { const gamesPerWeek = leagueInfo.gamesPerWeek || 1; const daysToAdd = gamesPerWeek === 2 ? (currentMatchDate.getDay() < 4 ? 3 : 4) : 7; currentMatchDate.setDate(currentMatchDate.getDate() + daysToAdd); } schedule.push({ ...allMatches[i], date: new Date(currentMatchDate).toISOString(), status: 'scheduled', round: Math.floor(i / matchesPerRound) + 1 + roundOffset }); } return schedule; }
function isSameDay(date1, date2) { if(!date1 || !date2) return false; return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate(); }

// --- Funções para o Modo Férias ---
function handleCalendarDayClick(e) { if (gameState.isOnHoliday) return; const dayElement = e.target.closest('.calendar-day:not(.other-month)'); if (!dayElement) return; const dateStr = dayElement.dataset.date; const clickedDate = new Date(dateStr + 'T12:00:00Z'); if (clickedDate <= gameState.currentDate) return; const modal = document.getElementById('holiday-confirmation-modal'); const dateDisplay = document.getElementById('holiday-target-date'); dateDisplay.innerText = clickedDate.toLocaleDateString('pt-BR'); document.getElementById('confirm-holiday-btn').dataset.endDate = clickedDate.toISOString(); modal.classList.add('active'); }
function startHoliday() { const endDateStr = document.getElementById('confirm-holiday-btn').dataset.endDate; if (!endDateStr) return; gameState.holidayEndDate = new Date(endDateStr); gameState.isOnHoliday = true; document.getElementById('holiday-confirmation-modal').classList.remove('active'); document.getElementById('cancel-holiday-btn').style.display = 'block'; updateContinueButton(); holidayInterval = setInterval(advanceDayOnHoliday, 250); }
function advanceDayOnHoliday() { if (new Date(gameState.currentDate) >= gameState.holidayEndDate) { stopHoliday(); return; } advanceDay(); }
function stopHoliday() { clearInterval(holidayInterval); holidayInterval = null; gameState.isOnHoliday = false; gameState.holidayEndDate = null; document.getElementById('cancel-holiday-btn').style.display = 'none'; updateContinueButton(); findNextUserMatch(); }

// --- Lógica da Simulação de Partida (NOVO MOTOR) ---
let matchInterval;
const SIMULATION_DURATION_MS = 4 * 60 * 1000;

function promptMatchConfirmation() { if (!gameState.nextUserMatch) return; document.getElementById('match-confirmation-modal').classList.add('active'); }

function startMatchSimulation() {
    document.getElementById('match-confirmation-modal').classList.remove('active');
    const startingXIKeys = Object.keys(gameState.squadManagement.startingXI);
    if (startingXIKeys.length !== 11 || startingXIKeys.some(key => !gameState.squadManagement.startingXI[key])) {
        showInfoModal("Escalação Incompleta", "Você precisa de 11 jogadores na escalação titular para começar a partida!");
        showMainContent('tactics-content');
        return;
    }

    showScreen('match-simulation-screen');
    
    setTimeout(() => {
        showNotification("Apito Inicial!");
        gameState.isMatchLive = true;
        gameState.isPaused = false;
        const userTeam = gameState.userClub;
        const opponentTeam = gameState.nextUserMatch.home.name === userTeam.name ? gameState.nextUserMatch.away : gameState.nextUserMatch.home;
        const opponentSquad = setupOpponentSquad(opponentTeam);
        gameState.matchState = {
            home: gameState.nextUserMatch.home.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics } : { team: opponentTeam, ...opponentSquad },
            away: gameState.nextUserMatch.away.name === userTeam.name ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics } : { team: opponentTeam, ...opponentSquad },
            score: { home: 0, away: 0 },
            gameTime: 0,
            elapsedRealTime: 0,
            half: 1,
            playerPositions: new Map(),
            playerRatings: new Map(),
            possession: 'home',
            playState: 'kickoff',
            stateTimer: 3000,
            ball: { y: 50, x: 50, targetY: 50, targetX: 50, speed: 0, owner: null }
        };
        initializeMatchPlayers();
        document.getElementById('match-home-team-name').innerText = gameState.matchState.home.team.name;
        document.getElementById('match-home-team-logo').src = `images/${gameState.matchState.home.team.logo}`;
        document.getElementById('match-away-team-name').innerText = gameState.matchState.away.team.name;
        document.getElementById('match-away-team-logo').src = `images/${gameState.matchState.away.team.logo}`;
        updateScoreboard();
        resizeCanvas();
        setPlayState('kickoff'); 
        matchInterval = setInterval(gameLoop, 50);
        setInterval(() => {
            if (gameState.isMatchLive && !gameState.isPaused) {
                updatePlayerRatings();
            }
        }, 30000);
    }, 1000); 
}

function setupOpponentSquad(team) { const todosJogadores = [...team.players].sort((a, b) => b.overall - a.overall); const startingXI = {}; const formationKey = Object.keys(formationLayouts)[Math.floor(Math.random() * 4)]; const formation = formationLayouts[formationKey]; const posicoesDaFormacao = Object.keys(formation); let jogadoresDisponiveis = [...todosJogadores]; for (const posicao of posicoesDaFormacao) { if (jogadoresDisponiveis.length > 0) { startingXI[posicao] = jogadoresDisponiveis.shift(); } } const substitutes = jogadoresDisponiveis.splice(0, 7); const reserves = jogadoresDisponiveis; const tactics = { mentality: 'balanced', defensiveLine: 'standard', onPossessionLoss: 'regroup' }; return { startingXI, substitutes, reserves, formation, tactics }; }
function initializeMatchPlayers() {
    const { home, away } = gameState.matchState;
    const allPlayers = [...Object.values(home.startingXI || {}), ...Object.values(away.startingXI || {})];
    
    allPlayers.forEach(player => {
        if (player) {
            gameState.matchState.playerRatings.set(player.name, 5.5 + Math.random() * 1.5);
            gameState.matchState.playerPositions.set(player.name, { x: 0, y: 0 });
        }
    });

    resetPlayersToKickoffPositions();
}

function gameLoop() {
    if (gameState.isPaused || !gameState.isMatchLive) return;
    const { ball } = gameState.matchState; 
    const interval = 50; 
    
    if (gameState.matchState.stateTimer <= 0) {
        gameState.matchState.elapsedRealTime += interval;
        gameState.matchState.gameTime = (gameState.matchState.elapsedRealTime / SIMULATION_DURATION_MS) * 90;
    } else {
        gameState.matchState.stateTimer -= interval;
    }

    if (gameState.matchState.gameTime >= 45 && gameState.matchState.half === 1) {
        gameState.matchState.half = 2;
        gameState.matchState.gameTime = 45;
        gameState.matchState.elapsedRealTime = SIMULATION_DURATION_MS / 2;
        document.getElementById('match-time-status').innerText = "INTERVALO";
        setPlayState('kickoff');
        togglePause(true);
    } else if (gameState.matchState.gameTime >= 90) {
        endMatch();
        return;
    }

    updateScoreboard();

    if (gameState.matchState.stateTimer <= 0) {
        switch (gameState.matchState.playState) {
            case 'kickoff': setPlayState('playing'); break;
            case 'playing': updatePlayLogic(); break;
            case 'goal': 
                setPlayState('kickoff', gameState.matchState.possession === 'home' ? 'away' : 'home'); 
                break;
            case 'goalKick':
                const teamGK = gameState.matchState[gameState.matchState.possession];
                const target = Object.values(teamGK.startingXI).find(p => p && (p.position === 'CB' || p.position === 'LB' || p.position === 'RB'));
                if (target) {
                    const targetPos = gameState.matchState.playerPositions.get(target.name);
                    ball.owner = target; ball.targetY = targetPos.y; ball.targetX = targetPos.x; ball.speed = 1.0;
                }
                setPlayState('playing');
                break;
            case 'corner':
                ball.targetX = gameState.matchState.possession === 'home' ? PITCH_DIMS.right - 15 : PITCH_DIMS.left + 15;
                ball.targetY = 50 + (Math.random() - 0.5) * 25;
                ball.speed = 1.5;
                gameState.matchState.stateTimer = 1500; 
                gameState.matchState.playState = 'playing_corner';
                break;
            case 'playing_corner':
                 if (ball.speed === 0) {
                    const winner = getClosestPlayer(ball).player;
                    if (winner && Math.random() < 0.25) { 
                        resolveShot(winner, true);
                    } else {
                        setPlayState('playing', getPlayerTeam(winner) === 'home' ? 'away' : 'home');
                        showNotification("Defesa afasta!");
                    }
                }
                break;
            case 'throwIn': setPlayState('playing'); break;
        }
    }

    moveBall();
    movePlayers();
    drawMatch();
}
function updatePlayLogic() { 
    const { ball, possession } = gameState.matchState; 
    if (!ball.owner) { 
        const closest = getClosestPlayer(ball); 
        if (closest.player) { 
            ball.owner = closest.player; 
            gameState.matchState.possession = getPlayerTeam(ball.owner); 
        } 
        return; 
    } 
    const ownerPlayer = ball.owner; 
    const ownerTeamKey = possession; 
    const opponentTeamKey = ownerTeamKey === 'home' ? 'away' : 'home'; 
    const opponent = getClosestPlayer(ball, opponentTeamKey); 
    if (opponent.distance < 3) { 
        const tacklePower = (opponent.player.attributes.defending * 0.5) + (Math.random() * 50); 
        const dribblePower = (ownerPlayer.attributes.dribbling * 0.5) + (Math.random() * 50); 
        if (tacklePower > dribblePower) { 
            ball.owner = opponent.player; 
            gameState.matchState.possession = opponentTeamKey; 
            showNotification(`Desarme de ${opponent.player.name}!`); 
            return; 
        } 
    } 
    const playerPos = gameState.matchState.playerPositions.get(ownerPlayer.name); 
    const isHomeTeam = ownerTeamKey === 'home'; 
    const goalX = isHomeTeam ? PITCH_DIMS.right : PITCH_DIMS.left; 
    const distToGoal = Math.abs(playerPos.x - goalX); 
    
    // CORREÇÃO: Chutes de longe muito mais difíceis
    const shootDistanceCondition = distToGoal < 22; // Só chuta de dentro ou perto da área
    const shootScore = (shootDistanceCondition && (isHomeTeam ? playerPos.x > 75 : playerPos.x < 25)) ? (ownerPlayer.attributes.shooting + (1 - distToGoal / 22) * 15) : 0;
    
    const targetPlayer = findBestPassTarget(ownerPlayer); 
    let passScore = 0; 
    if (targetPlayer) { 
        passScore = ownerPlayer.attributes.passing + 20; 
    } 
    const dribbleScore = ownerPlayer.attributes.dribbling - (opponent.distance < 5 ? 20 : 0); 
    const maxScore = Math.max(shootScore, passScore, dribbleScore); 
    if (maxScore > 0 && maxScore === shootScore) { 
        resolveShot(ownerPlayer); 
    } else if (maxScore > 0 && maxScore === passScore) { 
        const targetPos = gameState.matchState.playerPositions.get(targetPlayer.name); 
        ball.targetY = targetPos.y; 
        ball.targetX = targetPos.x; 
        ball.speed = 1.0 + (ownerPlayer.attributes.passing / 150); 
        ball.owner = targetPlayer; 
    } else { 
        ball.targetX += (isHomeTeam ? 5 : -5) * (ownerPlayer.attributes.pace / 100); 
        ball.targetY += (Math.random() - 0.5) * 5; 
        ball.speed = 0.3; 
    } 
}
function findBestPassTarget(passer) {
    const passerPos = gameState.matchState.playerPositions.get(passer.name);
    const teamKey = getPlayerTeam(passer);
    if (!teamKey) return null;
    const teammates = Object.values(gameState.matchState[teamKey].startingXI).filter(p => p && p.name !== passer.name);
    if (teammates.length === 0) return null;

    let bestTarget = null;
    let maxScore = -Infinity;

    for (const teammate of teammates) {
        const targetPos = gameState.matchState.playerPositions.get(teammate.name);
        let score = 0;
        const distForward = (teamKey === 'home') ? (targetPos.x - passerPos.x) : (passerPos.x - targetPos.x);
        const distToPasser = Math.hypot(passerPos.y - targetPos.y, passerPos.x - targetPos.x);

        if (distForward > -10 && distToPasser < 40) {
            score += distForward;
            const opponent = getClosestPlayer(targetPos, teamKey === 'home' ? 'away' : 'home');
            score += opponent.distance * 0.5;

            if (score > maxScore) {
                maxScore = score;
                bestTarget = teammate;
            }
        }
    }
    return bestTarget;
}

function resolveShot(shooter, isFromCorner = false) {
    const { ball, possession } = gameState.matchState;
    const isHomeShot = possession === 'home';
    const goalX = isHomeShot ? PITCH_DIMS.right : PITCH_DIMS.left;
    const defendingTeamKey = isHomeShot ? 'away' : 'home';
    const keeper = gameState.matchState[defendingTeamKey].startingXI['GK'];
    ball.targetX = goalX;
    ball.targetY = 50 + (Math.random() - 0.5) * PITCH_DIMS.goalHeight;
    ball.speed = 2.0;
    showNotification(`Chute de ${shooter.name}!`);

    // CORREÇÃO: Melhoria nos goleiros e ajuste na finalização
    const shotPower = (shooter.attributes.shooting * 0.75) + (Math.random() * 25);
    const savePower = (keeper.attributes.defending * 0.85) + (Math.random() * 25);

    if (shotPower > savePower) {
        const hitPostChance = 0.15;
        if (Math.random() < hitPostChance) {
            showNotification("NA TRAVE!");
            setPlayState('goalKick', defendingTeamKey);
        } else {
            gameState.matchState.score[possession]++;
            showNotification(`GOL! ${shooter.name} marca para o ${gameState.matchState[possession].team.name}!`);
            setPlayState('goal');
        }
    } else {
        showNotification(`Defesa do goleiro ${keeper.name}!`);
        if (isFromCorner) {
            setPlayState('playing', defendingTeamKey);
        } else {
            // Chance de escanteio após a defesa
            if (Math.random() > 0.4) {
                 setPlayState('corner', possession);
            } else {
                 setPlayState('goalKick', defendingTeamKey);
            }
        }
    }
}
function getClosestPlayer(target, teamKey = null) { let closestPlayer = null; let minDistance = Infinity; const teamsToScan = teamKey ? [teamKey] : ['home', 'away']; teamsToScan.forEach(key => { const team = gameState.matchState[key]; for(const player of Object.values(team.startingXI)) { if(!player) continue; const playerPos = gameState.matchState.playerPositions.get(player.name); const distance = Math.hypot(playerPos.y - target.y, playerPos.x - target.x); if (distance < minDistance) { minDistance = distance; closestPlayer = player; } } }); return { player: closestPlayer, distance: minDistance }; }
function getPlayerTeam(player) { if(!player) return null; return Object.values(gameState.matchState.home.startingXI).some(p => p && p.name === player.name) ? 'home' : 'away'; }
function moveBall() { const { ball } = gameState.matchState; if (ball.speed === 0) return; const distY = ball.targetY - ball.y; const distX = ball.targetX - ball.x; const distance = Math.hypot(distY, distX); if (distance < 1) { ball.y = ball.targetY; ball.x = ball.targetX; ball.speed = 0; if(gameState.matchState.playState === 'playing') { const closest = getClosestPlayer(ball); if(closest.player) { ball.owner = closest.player; gameState.matchState.possession = getPlayerTeam(ball.owner); } } } else { const moveSpeed = Math.min(ball.speed, distance); ball.y += (distY / distance) * moveSpeed; ball.x += (distX / distance) * moveSpeed; } if (gameState.matchState.playState === 'playing' || gameState.matchState.playState === 'playing_corner') { if (ball.y < PITCH_DIMS.top || ball.y > PITCH_DIMS.bottom) { setPlayState('throwIn', gameState.matchState.possession === 'home' ? 'away' : 'home'); ball.y = Math.max(PITCH_DIMS.top + 1, Math.min(PITCH_DIMS.bottom - 1, ball.y)); } else if (ball.x < PITCH_DIMS.left) { setPlayState('goalKick', 'home'); } else if (ball.x > PITCH_DIMS.right) { setPlayState('goalKick', 'away'); } } }
function getPlayerHomePosition(player, playerPosId, teamKey) {
    const team = gameState.matchState[teamKey];
    const [baseX, baseY] = team.formation[playerPosId]; 
    let tacticalX = baseX;
    let xShift = 0;
    switch (team.tactics.mentality) {
        case 'very_attacking': xShift = 5; break;
        case 'attacking':      xShift = 2.5;  break;
        case 'defensive':      xShift = -2.5; break;
        case 'very_defensive': xShift = -5;  break;
    }
    const isDefender = ['CB', 'RB', 'LB'].some(p => playerPosId.includes(p));
    if (isDefender) {
        switch (team.tactics.defensiveLine) {
            case 'higher': xShift += 4; break;
            case 'deeper': xShift -= 4; break;
        }
    }
    tacticalX += xShift;
    return teamKey === 'home' ? [tacticalX, baseY] : [100 - tacticalX, 100 - baseY];
}
function movePlayers() {
    if (gameState.matchState.stateTimer > 0 && gameState.matchState.playState !== 'playing') return;
    const { ball } = gameState.matchState;

    for (const teamKey of ['home', 'away']) {
        for (const [posId, player] of Object.entries(gameState.matchState[teamKey].startingXI)) {
            if (!player) continue;

            const playerPos = gameState.matchState.playerPositions.get(player.name);
            const [homeX, homeY] = getPlayerHomePosition(player, posId, teamKey);
            
            let targetX = homeX;
            let targetY = homeY;
            
            const attractionToBall = (player.position === 'GK') ? 0.05 : 0.25;
            targetY += (ball.y - targetY) * attractionToBall;
            targetX += (ball.x - targetX) * attractionToBall;

            if (getPlayerTeam(player) !== gameState.matchState.possession && ball.owner) {
                const opponent = getClosestPlayer(ball, teamKey).player;
                if (player === opponent) { 
                    const ownerPos = gameState.matchState.playerPositions.get(ball.owner.name);
                    const markingDistance = 2;
                    targetX = ownerPos.x + (teamKey === 'home' ? -markingDistance : markingDistance);
                    targetY = ownerPos.y;
                }
            } else if (getPlayerTeam(player) === gameState.matchState.possession && player !== ball.owner) {
                targetX += (teamKey === 'home' ? 10 : -10) * (player.attributes.pace / 100);
            }
            
            const playerMoveSpeed = 0.0008 * player.attributes.pace; 
            playerPos.y += (targetY - playerPos.y) * playerMoveSpeed;
            playerPos.x += (targetX - playerPos.x) * playerMoveSpeed;

            playerPos.x = Math.max(2, Math.min(98, playerPos.x));
            playerPos.y = Math.max(2, Math.min(98, playerPos.y));
        }
    }
}

// CORREÇÃO: Função de posicionamento no kickoff totalmente refeita.
function resetPlayersToKickoffPositions() {
    const { home, away, possession } = gameState.matchState;

    // Posiciona o time da casa
    for (const posId in home.startingXI) {
        const player = home.startingXI[posId];
        if (player) {
            const [x, y] = home.formation[posId];
            const playerPos = gameState.matchState.playerPositions.get(player.name);
            playerPos.x = x;
            playerPos.y = y;
            // Garante que o jogador esteja no seu campo
            if (playerPos.x >= 50) playerPos.x = 48;
        }
    }

    // Posiciona o time visitante
    for (const posId in away.startingXI) {
        const player = away.startingXI[posId];
        if (player) {
            const [x, y] = away.formation[posId];
            const playerPos = gameState.matchState.playerPositions.get(player.name);
            playerPos.x = 100 - x;
            playerPos.y = 100 - y;
            // Garante que o jogador esteja no seu campo
            if (playerPos.x < 50) playerPos.x = 52;
        }
    }
    
    // Ajusta a posição de um jogador para o pontapé inicial
    const kickoffTeamKey = possession;
    const kickoffTeam = gameState.matchState[kickoffTeamKey];
    const kicker = Object.values(kickoffTeam.startingXI).find(p => p && (p.position === 'ST' || p.position === 'CAM'));
    if (kicker) {
        const kickerPos = gameState.matchState.playerPositions.get(kicker.name);
        if (kickoffTeamKey === 'home') {
            kickerPos.x = 49;
            kickerPos.y = 50;
        } else {
            kickerPos.x = 51;
            kickerPos.y = 50;
        }
    }
}

function setPlayState(newState, teamToAct = null) {
    gameState.matchState.playState = newState;
    gameState.matchState.stateTimer = 3000; 
    const { ball } = gameState.matchState;

    switch(newState) {
        case 'kickoff':
            gameState.matchState.possession = teamToAct || (gameState.matchState.half === 1 ? 'home' : 'away');
            resetPlayersToKickoffPositions();
            ball.x = 50; ball.y = 50; ball.targetX = 50; ball.targetY = 50;
            ball.owner = getClosestPlayer({y: 50, x: 50}, gameState.matchState.possession).player;
            showNotification(gameState.matchState.half === 1 && gameState.matchState.gameTime < 1 ? "Apito Inicial!" : "Bola rolando!");
            break;
        case 'playing':
             if(ball.owner) gameState.matchState.possession = getPlayerTeam(ball.owner);
             gameState.matchState.stateTimer = 0;
            break;
        case 'goal':
            gameState.matchState.stateTimer = 5000;
            break;
        case 'goalKick':
            gameState.matchState.possession = teamToAct;
            ball.y = 50;
            ball.x = teamToAct === 'home' ? PITCH_DIMS.left + 5 : PITCH_DIMS.right - 5;
            ball.owner = gameState.matchState[teamToAct].startingXI['GK'];
            showNotification(`Tiro de meta para ${gameState.matchState[teamToAct].team.name}.`);
            break;
        case 'corner':
            gameState.matchState.possession = teamToAct;
            ball.x = teamToAct === 'home' ? PITCH_DIMS.right - 1 : PITCH_DIMS.left + 1;
            ball.y = Math.random() < 0.5 ? PITCH_DIMS.top + 1 : PITCH_DIMS.bottom - 1;
            showNotification(`Escanteio para ${gameState.matchState[teamToAct].team.name}!`);
            break;
        case 'throwIn':
            gameState.matchState.possession = teamToAct;
            showNotification(`Lateral para ${gameState.matchState[teamToAct].team.name}.`);
            break;
    }
}

function resizeCanvas() {
    const canvas = document.getElementById('match-pitch-canvas');
    const container = document.getElementById('match-pitch-container');
    if (!canvas || !container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasAspectRatio = 7 / 5; 
    
    let newWidth = containerWidth;
    let newHeight = newWidth / canvasAspectRatio;

    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * canvasAspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

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
    ctx.beginPath(); ctx.arc(width / 2, height / 2, height * 0.15, 0, 2 * Math.PI); ctx.stroke(); 

    const goalY = (100 - PITCH_DIMS.goalHeight) / 2 / 100 * height;
    const goalH = PITCH_DIMS.goalHeight / 100 * height;
    const goalW = 2 / 100 * width;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, goalY, goalW, goalH);
    ctx.strokeRect(width - goalW, goalY, goalW, goalH);

    const playerRadius = height / 40;
    const drawPlayer = (pos, color, hasBall) => { const x = (pos.x / 100) * width; const y = (pos.y / 100) * height; ctx.beginPath(); ctx.arc(x, y, playerRadius, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); if (hasBall) { ctx.strokeStyle = '#3DDC97'; ctx.lineWidth = 3; } else { ctx.strokeStyle = 'black'; ctx.lineWidth = 1; } ctx.stroke(); };
    for (const player of Object.values(gameState.matchState.home.startingXI)) { if (!player) continue; const pos = gameState.matchState.playerPositions.get(player.name); if(pos) drawPlayer(pos, '#c0392b', gameState.matchState.ball.owner === player); }
    for (const player of Object.values(gameState.matchState.away.startingXI)) { if (!player) continue; const pos = gameState.matchState.playerPositions.get(player.name); if(pos) drawPlayer(pos, '#f1c40f', gameState.matchState.ball.owner === player); }
    
    const ballRadius = playerRadius / 2;
    const ballPos = gameState.matchState.ball;
    const ballX = (ballPos.x / 100) * width;
    const ballY = (ballPos.y / 100) * height;
    ctx.beginPath(); ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill();
}
function updateScoreboard() {
    if (!gameState.matchState) return;
    const { score, gameTime } = gameState.matchState;
    document.getElementById('match-score-display').innerText = `${score.home} - ${score.away}`;
    
    const minutes = Math.floor(gameTime);
    const seconds = Math.floor((gameTime * 60) % 60);
    document.getElementById('match-clock').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const statusEl = document.getElementById('match-time-status');
    if (statusEl.innerText === 'FIM DE JOGO') return;
    if (gameState.isPaused) {
       if (gameState.matchState.half === 2 && gameTime >= 45) statusEl.innerText = 'INTERVALO';
       else statusEl.innerText = "PAUSA";
    } else {
        statusEl.innerText = gameState.matchState.half === 1 ? 'PRIMEIRO TEMPO' : 'SEGUNDO TEMPO';
    }
}
function togglePause(forcePause = null) { if (gameState.isMatchLive === false) return; gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused; document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused); document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚'; updateScoreboard(); }
function showNotification(message) { const area = document.getElementById('match-notification-area'); area.innerHTML = ''; const notification = document.createElement('div'); notification.className = 'match-notification'; notification.innerText = message; area.appendChild(notification); setTimeout(() => { if(notification) notification.remove(); }, 4000); }
function updatePlayerRatings() { if(!gameState.matchState) return; for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) { const performanceChange = (Math.random() - 0.47) * 0.2; let newRating = Math.max(0, Math.min(10, currentRating + performanceChange)); gameState.matchState.playerRatings.set(playerName, newRating); } }
function endMatch() { clearInterval(matchInterval); gameState.isMatchLive = false; document.getElementById('match-time-status').innerText = 'FIM DE JOGO'; const match = gameState.allMatches.find(m => isSameDay(new Date(m.date), new Date(gameState.nextUserMatch.date))); if (match) { match.status = 'played'; match.homeScore = gameState.matchState.score.home; match.awayScore = gameState.matchState.score.away; if (match.round !== 'Amistoso') { const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name)); updateTableWithResult(leagueId, match); } } showPostMatchReport(); findNextUserMatch(); }
function showPostMatchReport() { const { home, away, score } = gameState.matchState; const modal = document.getElementById('post-match-report-modal'); const headline = document.getElementById('post-match-headline'); const summary = document.getElementById('post-match-summary'); let winner, loser, winnerScore, loserScore; if (score.home > score.away) { winner = home.team.name; loser = away.team.name; winnerScore = score.home; loserScore = score.away; headline.innerText = `${winner} vence ${loser} por ${winnerScore} a ${loserScore}!`; } else if (score.away > score.home) { winner = away.team.name; loser = home.team.name; winnerScore = score.away; loserScore = score.home; headline.innerText = `${winner} surpreende e vence ${loser} fora de casa!`; } else { headline.innerText = `${home.team.name} e ${away.team.name} empatam em jogo disputado.`; summary.innerText = `A partida terminou com o placar de ${score.home} a ${score.away}. Ambos os times tiveram suas chances, mas a igualdade prevaleceu no placar final.`; modal.classList.add('active'); return; } const performanceFactor = Math.random(); if(performanceFactor > 0.7) { summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`; } else { summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`; } modal.classList.add('active'); }

// --- Lógica de Fim de Temporada e Fases ---
function checkSeasonEvents() { if (gameState.isOffSeason) return; const allLeaguesFinished = Object.values(gameState.leagueStates).every(ls => ls.schedule.every(m => m.status === 'played')); if (allLeaguesFinished) { handleEndOfSeason(); return; } if (gameState.currentLeagueId === 'brasileirao_c') { const leagueState = gameState.leagueStates['brasileirao_c']; const phase1Matches = leagueState.schedule.filter(m => m.round <= 19); if (phase1Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 1) { handleEndOfSerieCFirstPhase(); return; } const phase2Matches = leagueState.schedule.filter(m => m.round > 19 && m.round <= 25); if (phase2Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 2) { handleEndOfSerieCSecondPhase(); return; } } }
function handleEndOfSerieCFirstPhase() { const leagueState = gameState.leagueStates['brasileirao_c']; if (leagueState.serieCState.phase !== 1) return; leagueState.serieCState.phase = 2; const fullTable = getFullSeasonTable('brasileirao_c'); const qualified = fullTable.slice(0, 8); const groupA_teams = [qualified[0], qualified[3], qualified[4], qualified[7]]; const groupB_teams = [qualified[1], qualified[2], qualified[5], qualified[6]]; leagueState.serieCState.groups.A = groupA_teams.map(t => t.name); leagueState.serieCState.groups.B = groupB_teams.map(t => t.name); const groupA_data = groupA_teams.map(t => findTeamInLeagues(t.name)); const groupB_data = groupB_teams.map(t => findTeamInLeagues(t.name)); const lastRoundPhase1 = 19; const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round <= lastRoundPhase1).map(m => new Date(m.date)))); const scheduleStartDate = new Date(lastMatchDate); scheduleStartDate.setDate(scheduleStartDate.getDate() + 7); const scheduleA = generateSchedule(groupA_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1); const scheduleB = generateSchedule(groupB_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1); leagueState.schedule.push(...scheduleA, ...scheduleB); gameState.allMatches.push(...scheduleA, ...scheduleB); gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date)); leagueState.table = initializeLeagueTable([...groupA_data, ...groupB_data]); findNextUserMatch(); updateLeagueTable('brasileirao_c'); const qualifiedNames = qualified.map(t => t.name).join(', '); const isUserTeamQualified = qualified.some(t => t.name === gameState.userClub.name); addNews("Definidos os classificados na Série C!", `Os 8 times que avançam para a segunda fase são: ${qualifiedNames}.`, isUserTeamQualified, qualified[0].name); }
function handleEndOfSerieCSecondPhase() { const leagueState = gameState.leagueStates['brasileirao_c']; if (leagueState.serieCState.phase !== 2) return; leagueState.serieCState.phase = 3; const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers; const groupA_table = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); const groupB_table = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); const finalists = [groupA_table[0], groupB_table[0]]; leagueState.serieCState.finalists = finalists.map(t => t.name); const promoted = [groupA_table[0], groupA_table[1], groupB_table[0], groupB_table[1]]; const promotedNames = promoted.map(t => t.name).join(', '); addNews("Acesso à Série B!", `Parabéns a ${promotedNames} pelo acesso à Série B!`, promoted.some(t => t.name === gameState.userClub.name), promoted[0].name); const finalistData = finalists.map(t => findTeamInLeagues(t.name)); const lastRoundPhase2 = 25; const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round > 19 && m.round <= lastRoundPhase2).map(m => new Date(m.date)))); const finalStartDate = new Date(lastMatchDate); finalStartDate.setDate(finalStartDate.getDate() + 7); const finalMatches = [ { home: finalistData[0], away: finalistData[1], date: new Date(finalStartDate).toISOString(), status: 'scheduled', round: 26 }, { home: finalistData[1], away: finalistData[0], date: new Date(new Date(finalStartDate).setDate(finalStartDate.getDate() + 7)).toISOString(), status: 'scheduled', round: 27 } ]; leagueState.schedule.push(...finalMatches); gameState.allMatches.push(...finalMatches); gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date)); findNextUserMatch(); addNews(`Final da Série C: ${finalists[0].name} x ${finalists[1].name}!`, "Os campeões de cada grupo disputam o título.", finalists.some(t => t.name === gameState.userClub.name), finalists[0].name); }

function handleEndOfSeason() {
    if (gameState.isOnHoliday) stopHoliday();
    awardPrizeMoney();
    gameState.isOffSeason = true;
    gameState.nextUserMatch = null;
    const tableA = getFullSeasonTable('brasileirao_a');
    if (tableA && tableA.length > 0) {
        const championA = tableA[0];
        addNews(`${championA.name} é o campeão do Brasileirão Série A!`, ``, championA.name === gameState.userClub.name, championA.name);
    }
    const tableB = getFullSeasonTable('brasileirao_b');
    if (tableB && tableB.length > 0) {
        const championB = tableB[0];
        addNews(`${championB.name} é o campeão da Série B!`, ``, championB.name === gameState.userClub.name, championB.name);
    }
    const scheduleC = gameState.leagueStates['brasileirao_c'].schedule;
    const finalMatch1 = scheduleC.find(m => m.round === 26);
    const finalMatch2 = scheduleC.find(m => m.round === 27);
    if (finalMatch1 && finalMatch2 && finalMatch1.status === 'played' && finalMatch2.status === 'played') {
        const score1 = finalMatch1.homeScore + finalMatch2.awayScore;
        const score2 = finalMatch1.awayScore + finalMatch2.homeScore;
        const champC = score1 >= score2 ? findTeamInLeagues(finalMatch1.home.name) : findTeamInLeagues(finalMatch1.away.name);
        addNews(`${champC.name} é o grande campeão da Série C!`, ``, champC.name === gameState.userClub.name, champC.name);
    }
    showInfoModal("Fim de Temporada!", "A temporada chegou ao fim! Avance os dias até 1 de Janeiro para processar as promoções/rebaixamentos e iniciar a nova temporada.");
    updateContinueButton();
}

function awardPrizeMoney() { const userClubName = gameState.userClub.name; const userLeagueId = gameState.currentLeagueId; const leagueState = gameState.leagueStates[userLeagueId]; if (!leagueState) return; if (userLeagueId === 'brasileirao_a') { const table = getFullSeasonTable('brasileirao_a'); const userTeamRow = table.find(t => t.name === userClubName); const position = table.indexOf(userTeamRow) + 1; if (prizeMoney.brasileirao_a[position]) { const amount = prizeMoney.brasileirao_a[position] * 1000000; addTransaction(amount, `Premiação (${position}º lugar) - Série A`); } } else if (userLeagueId === 'brasileirao_b') { const table = getFullSeasonTable('brasileirao_b'); const userTeamRow = table.find(t => t.name === userClubName); const position = table.indexOf(userTeamRow) + 1; if (position <= 4 && prizeMoney.brasileirao_b[position]) { const amount = prizeMoney.brasileirao_b[position] * 1000000; addTransaction(amount, `Premiação (Acesso) - Série B`); } } else if (userLeagueId === 'brasileirao_c') { addTransaction(prizeMoney.brasileirao_c.participation_fee * 1000000, `Cota de participação - Série C`); const qualifiedForPhase2 = [...leagueState.serieCState.groups.A, ...leagueState.serieCState.groups.B]; if (qualifiedForPhase2.includes(userClubName)) { addTransaction(prizeMoney.brasileirao_c.advancement_bonus * 1000000, `Bônus por avanço de fase - Série C`); } } }

function processPromotionRelegation() {
    const tableA = getFullSeasonTable('brasileirao_a');
    const relegatedFromA = tableA.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    const tableB = getFullSeasonTable('brasileirao_b');
    const promotedFromB = tableB.slice(0, 4).map(t => findTeamInLeagues(t.name)).filter(Boolean);
    const relegatedFromB = tableB.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);
    
    const leagueStateC = gameState.leagueStates['brasileirao_c'];
    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    const groupA = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.A.includes(t.name)).sort((a,b)=>{ for(const k of tiebreakers) { if(a[k]>b[k]) return -1; if(a[k]<b[k]) return 1; } return 0;});
    const groupB = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.B.includes(t.name)).sort((a,b)=>{ for(const k of tiebreakers) { if(a[k]>b[k]) return -1; if(a[k]<b[k]) return 1; } return 0;});
    const promotedFromC = [...groupA.slice(0,2), ...groupB.slice(0,2)].map(t => findTeamInLeagues(t.name)).filter(Boolean);
    
    leaguesData.brasileirao_a.teams = leaguesData.brasileirao_a.teams.filter(t => !relegatedFromA.some(r => r.name === t.name)).concat(promotedFromB);
    leaguesData.brasileirao_b.teams = leaguesData.brasileirao_b.teams.filter(t => !promotedFromB.some(p => p.name === t.name) && !relegatedFromB.some(r => r.name === t.name)).concat(relegatedFromA).concat(promotedFromC);
    leaguesData.brasileirao_c.teams = leaguesData.brasileirao_c.teams.filter(t => !promotedFromC.some(p => p.name === t.name)).concat(relegatedFromB);

    if(promotedFromB.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_a';
    if(relegatedFromA.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_b';
    if(promotedFromC.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_b';
    if(relegatedFromB.some(t => t.name === gameState.userClub.name)) gameState.currentLeagueId = 'brasileirao_c';
}
function findTeamInLeagues(teamName) { if (!teamName) return null; for (const leagueId in leaguesData) { const team = leaguesData[leagueId].teams.find(t => t.name === teamName); if (team) return team; } return null; }
function getFullSeasonTable(leagueId) { const fullTable = initializeLeagueTable(leaguesData[leagueId].teams); const matches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'played'); for (const match of matches) { const homeTeam = fullTable.find(t => t.name === match.home.name); const awayTeam = fullTable.find(t => t.name === match.away.name); if (!homeTeam || !awayTeam) continue; homeTeam.played++; awayTeam.played++; homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore; awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore; homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst; awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst; if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; } else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; } else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; } } return fullTable.sort((a, b) => { for (const key of leaguesData[leagueId].leagueInfo.tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; }); }
function populateLeagueSelectors() { const selectors = [document.getElementById('league-table-selector'), document.getElementById('matches-league-selector')]; selectors.forEach(selector => { if (!selector) return; selector.innerHTML = ''; for (const leagueId in leaguesData) { const option = document.createElement('option'); option.value = leagueId; option.innerText = leaguesData[leagueId].name; selector.appendChild(option); } selector.value = gameState.currentLeagueId; }); }
function findCurrentRound(leagueId) { if (!gameState.leagueStates[leagueId]) return 1; const schedule = gameState.leagueStates[leagueId].schedule; const lastPlayedMatch = [...schedule].reverse().find(m => m.status === 'played' && new Date(m.date) <= gameState.currentDate && typeof m.round === 'number'); return lastPlayedMatch ? lastPlayedMatch.round + 1 : 1; }

// --- Funções de Amistosos ---
function openFriendlyModal() { const selector = document.getElementById('friendly-opponent-selector'); selector.innerHTML = ''; let allTeams = []; for (const leagueId in leaguesData) { allTeams.push(...leaguesData[leagueId].teams); } allTeams.filter(team => team.name !== gameState.userClub.name).sort((a,b) => a.name.localeCompare(b.name)).forEach(team => { const option = document.createElement('option'); option.value = team.name; option.innerText = team.name; selector.appendChild(option); }); document.getElementById('schedule-friendly-modal').classList.add('active'); }
function scheduleFriendlyMatch() { document.getElementById('schedule-friendly-modal').classList.remove('active'); const opponentName = document.getElementById('friendly-opponent-selector').value; const periodDays = parseInt(document.getElementById('friendly-period-selector').value, 10); const userStrength = getTeamStrength(gameState.userClub, true); const opponentData = findTeamInLeagues(opponentName); const opponentStrength = getTeamStrength(opponentData, false); const strengthDiff = userStrength - opponentStrength; let acceptanceChance = 0.5; if (strengthDiff > 15) acceptanceChance = 0.7; else if (strengthDiff > 5) acceptanceChance = 0.6; else if (strengthDiff < -15) acceptanceChance = 0.10; else if (strengthDiff < -5) acceptanceChance = 0.3; if (Math.random() > acceptanceChance) { showInfoModal('Convite Recusado', `${opponentName} recusou o convite para o amistoso.`); return; } const startDate = new Date(gameState.currentDate); const endDate = new Date(gameState.currentDate); endDate.setDate(endDate.getDate() + periodDays); let friendlyDate = null; let currentDate = new Date(startDate); currentDate.setDate(currentDate.getDate() + 1); while (currentDate <= endDate) { if (isDateAvailableForTeam(currentDate, gameState.userClub.name) && isDateAvailableForTeam(currentDate, opponentName)) { friendlyDate = new Date(currentDate); break; } currentDate.setDate(currentDate.getDate() + 1); } if (friendlyDate) { const newFriendly = { home: gameState.userClub, away: opponentData, date: friendlyDate.toISOString(), status: 'scheduled', round: 'Amistoso' }; gameState.allMatches.push(newFriendly); gameState.allMatches.sort((a,b) => new Date(a.date) - new Date(b.date)); findNextUserMatch(); updateContinueButton(); if (gameState.currentMainContent === 'calendar-content') updateCalendar(); showInfoModal('Amistoso Marcado!', `Amistoso contra ${opponentName} marcado para ${friendlyDate.toLocaleDateString('pt-BR')}!`); } else { showInfoModal('Sem Data Disponível', `${opponentName} aceitou o convite, mas não foi possível encontrar uma data compatível no período selecionado.`); } }
function isDateAvailableForTeam(date, teamName) { return !gameState.allMatches.some(match => (match.home.name === teamName || match.away.name === teamName) && isSameDay(new Date(match.date), date)); }

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
    document.getElementById('close-info-modal-btn').addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('confirm-info-modal-btn').addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('close-friendly-result-modal-btn').addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));
    document.getElementById('confirm-friendly-result-btn').addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullScreen);
    document.getElementById('settings-modal').addEventListener('click', (e) => { if (e.target.id === 'settings-modal') { closeSettingsModal(); } });
    document.getElementById('currency-selector')?.addEventListener('change', (e) => { gameState.currency = e.target.value; if (gameState.currentMainContent === 'finances-content') { displayFinances(); } });
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.addEventListener('click', () => { const tabId = btn.dataset.tab; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); btn.classList.add('active'); document.getElementById(`${tabId}-tab`).classList.add('active'); if(tabId === 'club-finances') renderFinanceChart(); }); });
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
}
function addMainScreenEventListeners() {
    document.getElementById('league-table-selector')?.addEventListener('change', (e) => { gameState.tableView.leagueId = e.target.value; updateLeagueTable(gameState.tableView.leagueId); });
    document.getElementById('matches-league-selector')?.addEventListener('change', (e) => { gameState.matchesView.leagueId = e.target.value; gameState.matchesView.round = findCurrentRound(e.target.value); displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); });
    document.getElementById('prev-round-btn')?.addEventListener('click', () => { if (gameState.matchesView.round > 1) { gameState.matchesView.round--; displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); } });
    document.getElementById('next-round-btn')?.addEventListener('click', () => { gameState.matchesView.round++; displayRound(gameState.matchesView.leagueId, gameState.matchesView.round); });
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
