
// --- Funções de UI (Telas, Modais, Notícias) ---

function addNews(headline, body, isUserRelated = false, imageHint = null) {
    const newsItem = {
        date: new Date(gameState.currentDate),
        headline,
        body,
        imageHint
    };
    gameState.newsFeed.unshift(newsItem);
    if (isUserRelated) {
        showUserNewsModal(headline, body);
    }
}

function showUserNewsModal(headline, body) {
    if (gameState.isOnHoliday) {
        stopHoliday();
    }
    document.getElementById('user-news-headline').innerText = headline;
    document.getElementById('user-news-body').innerText = body;
    document.getElementById('user-news-modal').classList.add('active');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const next = document.getElementById(screenId);
    if (next) next.classList.add('active');
    gameState.currentScreen = screenId;
}

function showMainContent(contentId) {
    clearSelection();
    document.getElementById(gameState.currentMainContent)?.classList.remove('active');
    document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`)?.classList.remove('active');
    
    document.getElementById(contentId)?.classList.add('active');
    document.querySelector(`#sidebar li[data-content='${contentId}']`)?.classList.add('active');
    
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

function showInfoModal(headline, body) {
    document.getElementById('info-modal-headline').innerText = headline;
    document.getElementById('info-modal-body').innerText = body;
    document.getElementById('info-modal').classList.add('active');
}

function showFriendlyResultModal(match) {
    document.getElementById('friendly-result-headline').innerText = "Resultado do Amistoso";
    document.getElementById('friendly-result-body').innerText = `${match.home.name} ${match.homeScore} x ${match.awayScore} ${match.away.name}`;
    document.getElementById('friendly-result-modal').classList.add('active');
}

function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-modal-title').innerText = title;
    document.getElementById('confirmation-modal-body').innerText = message;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    const cancelBtn = document.getElementById('cancel-action-btn');

    const confirmClone = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);
    
    confirmClone.addEventListener('click', () => {
        onConfirm();
        modal.classList.remove('active');
    });

    cancelBtn.onclick = () => modal.classList.remove('active');

    modal.classList.add('active');
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


// --- Funções de Setup de UI ---
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
    gameState.currentLeagueId = Object.keys(leaguesData)[0]; 
    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) {
        generatedPlayers.push({
            name: `*Jogador Gerado ${i + 1}`,
            position: "CM",
            attributes: { pace: 55, shooting: 55, passing: 55, dribbling: 55, defending: 55, physical: 55 },
            age: 23
        });
    }
    const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers };
    startGame(newClub);
}

function setupInitialSquad() {
    gameState.squadManagement.startingXI = {};
    gameState.squadManagement.substitutes = [];
    gameState.squadManagement.reserves = [];

    const todosJogadores = [...gameState.userClub.players].sort((a, b) => b.overall - a.overall);
    const formacao = gameState.tactics.formation;
    const posicoesDaFormacao = Object.keys(formationLayouts[formacao]);
    
    let jogadoresDisponiveis = [...todosJogadores];

    // Preenche titulares com jogadores na posição natural
    for (const posicaoDoEsquema of posicoesDaFormacao) {
        const posicaoBase = posicaoDoEsquema.replace(/\d/g, '');
        const indiceMelhorJogador = jogadoresDisponiveis.findIndex(p => p.position === posicaoBase);
        
        if (indiceMelhorJogador !== -1) {
            const jogadorEscolhido = jogadoresDisponiveis[indiceMelhorJogador];
            gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadorEscolhido;
            jogadoresDisponiveis.splice(indiceMelhorJogador, 1);
        }
    }

    // Preenche posições vazias com os melhores jogadores restantes
    for (const posicaoDoEsquema of posicoesDaFormacao) {
        if (!gameState.squadManagement.startingXI[posicaoDoEsquema] && jogadoresDisponiveis.length > 0) {
            gameState.squadManagement.startingXI[posicaoDoEsquema] = jogadoresDisponiveis.shift();
        }
    }

    gameState.squadManagement.substitutes = jogadoresDisponiveis.splice(0, MAX_SUBSTITUTES);
    gameState.squadManagement.reserves = jogadoresDisponiveis;
}

// --- Funções de Renderização de Conteúdo Principal ---
function displayNewsFeed() {
    const container = document.getElementById('news-layout-container');
    container.innerHTML = '';
    if (gameState.newsFeed.length === 0) {
        container.innerHTML = '<p>Nenhuma notícia por enquanto.</p>';
        return;
    }
    const mainNews = gameState.newsFeed[0];
    const mainTeam = findTeamInLeagues(mainNews.imageHint);
    let mainImage = mainTeam ? `images/${mainTeam.logo}` : `images/${leaguesData[Object.keys(leaguesData)[0]].logo}`;
    container.innerHTML += `
        <div class="news-article news-article-main">
            <img src="${mainImage}" alt="Notícia principal">
            <div class="news-article-content">
                <h4>${mainNews.headline}</h4>
                <p class="news-body">${mainNews.body}</p>
                <span class="news-date">${mainNews.date.toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    `;

    const secondaryNewsContainer = document.createElement('div');
    secondaryNewsContainer.id = 'news-list-secondary';
    const secondaryNews = gameState.newsFeed.slice(1, 5);
    secondaryNews.forEach(item => {
        const itemTeam = findTeamInLeagues(item.imageHint);
        let itemImage = itemTeam ? `images/${itemTeam.logo}` : `images/logo_default.png`;
        secondaryNewsContainer.innerHTML += `
            <div class="news-article news-article-secondary">
                <img src="${itemImage}" alt="Notícia secundária">
                <div class="news-article-content">
                    <h4>${item.headline}</h4>
                    <span class="news-date">${item.date.toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
        `;
    });
    container.appendChild(secondaryNewsContainer);
}

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
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td>${player.marketValue ? formatCurrency(player.marketValue) : 'N/A'}</td>
                <td>${formatContract(player.contractUntil) || 'N/A'}</td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    playerListDiv.innerHTML = tableHTML;
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

    let html = `
        <div class="calendar-header">
            <button id="prev-month-btn">◀</button>
            <h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button id="next-month-btn">▶</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>`;

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
        roundHTML += `
            <div class="match-card">
                <div class="match-card-team home">
                    <span>${match.home.name}</span> <img src="images/${match.home.logo}" alt="${match.home.name}">
                </div>
                <div class="match-score">${score}</div>
                <div class="match-card-team away">
                    <img src="images/${match.away.logo}" alt="${match.away.name}"> <span>${match.away.name}</span>
                </div>
            </div>
        `;
    }
    container.innerHTML = roundHTML;
    prevBtn.disabled = roundNumber === 1;
    const totalRounds = leagueState.schedule.length > 0 ? Math.max(...leagueState.schedule.map(m => m.round).filter(r => typeof r === 'number')) : 0;
    nextBtn.disabled = roundNumber >= totalRounds;
}

function populateLeagueSelectors() {
    const selectors = [document.getElementById('league-table-selector'), document.getElementById('matches-league-selector')];
    selectors.forEach(selector => {
        if (!selector) return;
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
    if (!gameState.leagueStates[leagueId]) return 1;
    const schedule = gameState.leagueStates[leagueId].schedule;
    const lastPlayedMatch = [...schedule].reverse().find(m => m.status === 'played' && new Date(m.date) <= gameState.currentDate && typeof m.round === 'number');
    return lastPlayedMatch ? lastPlayedMatch.round + 1 : 1;
}

// --- Funções de Finanças ---
function displayFinances() { const container = document.getElementById('finances-content'); if (!container) return; displayClubFinances(); displayOpponentFinances(); }
function displayClubFinances() { const tabContent = document.getElementById('club-finances-tab'); const { balance, history } = gameState.clubFinances; tabContent.innerHTML = ` <div class="finance-overview"> <div class="finance-box"> <h4>Balanço Atual</h4> <p class="${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</p> </div> </div> <div class="finance-chart-container"> <h4>Evolução Financeira</h4> <canvas id="finance-chart"></canvas> </div> <div class="finance-history-container"> <h4>Histórico de Transações</h4> <div class="table-container" id="finance-history-table"></div> </div> `; const historyTableContainer = document.getElementById('finance-history-table'); let tableHTML = `<table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>`; for (const item of history) { tableHTML += ` <tr> <td>${item.date.toLocaleDateString('pt-BR')}</td> <td>${item.description}</td> <td class="${item.amount >= 0 ? 'positive' : 'negative'}">${formatCurrency(item.amount)}</td> </tr> `; } tableHTML += `</tbody></table>`; historyTableContainer.innerHTML = tableHTML; renderFinanceChart(); }
function renderFinanceChart() { const ctx = document.getElementById('finance-chart')?.getContext('2d'); if (!ctx) return; const history = [...gameState.clubFinances.history].reverse(); const labels = history.map(item => item.date.toLocaleDateString('pt-BR')); let cumulativeBalance = 0; const data = history.map(item => { cumulativeBalance += item.amount; return cumulativeBalance; }); if (window.financeChartInstance) { window.financeChartInstance.destroy(); } window.financeChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Balanço do Clube', data: data, borderColor: 'rgb(61, 220, 151)', backgroundColor: 'rgba(61, 220, 151, 0.2)', tension: 0.1, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: function(value, index, values) { return formatCurrency(value); } } } } } }); }
function displayOpponentFinances() { const container = document.getElementById('opponent-finances-tab'); if (typeof estimativaVerbaMedia2025 === 'undefined') { container.innerHTML = '<h3>Erro</h3><p>Os dados financeiros (verba_times.js) não foram encontrados.</p>'; return; } container.innerHTML = `<h3>Verba Estimada dos Clubes (Início da Temporada)</h3>`; const tableContainer = document.createElement('div'); tableContainer.className = 'table-container'; let fullHtml = ''; const divisionsOrder = ['Série A', 'Série B', 'Série C']; const financesByDivision = estimativaVerbaMedia2025.reduce((acc, team) => { const { divisao } = team; if (!acc[divisao]) acc[divisao] = []; acc[divisao].push(team); return acc; }, {}); for (const division of divisionsOrder) { if (!financesByDivision[division]) continue; fullHtml += `<h4 style="margin-top: 20px; margin-bottom: 10px;">${division}</h4>`; fullHtml += `<table><thead><tr><th>Time</th><th>Verba Média Estimada</th><th>Análise</th></tr></thead><tbody>`; const sortedTeams = financesByDivision[division].sort((a, b) => b.verba_media_estimada_milhoes_reais - a.verba_media_estimada_milhoes_reais); for (const team of sortedTeams) { const formattedVerba = formatCurrency(team.verba_media_estimada_milhoes_reais * 1000000); const cleanAnalysis = team.analise.replace(/\[.*?\]/g, '').trim(); fullHtml += `<tr> <td>${team.time}</td> <td>${formattedVerba}</td> <td>${cleanAnalysis}</td> </tr>`; } fullHtml += '</tbody></table>'; } tableContainer.innerHTML = fullHtml; container.appendChild(tableContainer); }

// --- Funções Específicas de Telas ---
function displayDevelopmentScreen() {
    const container = document.getElementById('development-content');
    if (!container) return;

    // Simulação de dados de desenvolvimento
    const playersWithProgress = gameState.userClub.players.map(p => ({
        ...p,
        lastMonthChange: Math.round((Math.random() - 0.4) * 3), 
        potential: 70 + Math.floor(Math.random() * 25) 
    }));
    
    let improving = 0, stagnating = 0, declining = 0;
    playersWithProgress.forEach(p => {
        if (p.lastMonthChange > 0) improving++;
        else if (p.lastMonthChange < 0) declining++;
        else stagnating++;
    });

    container.innerHTML = `
        <h3>Desenvolvimento do Elenco</h3>
        <div class="team-dev-overview">
            <div class="team-dev-summary">
                <h4>Resumo Mensal</h4>
                <p><span class="positive-dot"></span> ${improving} Jogadores melhorando</p>
                <p><span class="stagnating-dot"></span> ${stagnating} Jogadores estagnados</p>
                <p><span class="negative-dot"></span> ${declining} Jogadores regredindo</p>
            </div>
        </div>
        <div class="player-dev-grid"></div>
    `;

    const grid = container.querySelector('.player-dev-grid');
    playersWithProgress.sort((a,b) => b.overall - a.overall).forEach(player => {
        let changeHtml = '';
        if (player.lastMonthChange > 0) {
            changeHtml = `<span class="positive">(+${player.lastMonthChange})</span>`;
        } else if (player.lastMonthChange < 0) {
            changeHtml = `<span class="negative">(${player.lastMonthChange})</span>`;
        }

        const card = document.createElement('div');
        card.className = 'player-dev-card';
        card.innerHTML = `
            <div class="player-dev-info">
                <div class="player-name">${player.name} <span class="text-secondary">(${player.age})</span></div>
                <p>Overall: <b>${player.overall}</b> ${changeHtml}</p>
                <p class="text-secondary">Potencial: ${player.potential}</p>
            </div>
            <div class="player-dev-chart">
                 <!-- Gráfico pode ser implementado aqui -->
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Funções de Interação com a UI ---
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
    holidayInterval = setInterval(advanceDayOnHoliday, 250);
}

function advanceDayOnHoliday() {
    if (new Date(gameState.currentDate) >= gameState.holidayEndDate) {
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

function openSettingsModal() { document.getElementById('settings-modal').classList.add('active'); }
function closeSettingsModal() { document.getElementById('settings-modal').classList.remove('active'); }
function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}

function openFriendlyModal() {
    const selector = document.getElementById('friendly-opponent-selector');
    selector.innerHTML = '';
    let allTeams = [];
    for (const leagueId in leaguesData) {
        allTeams.push(...leaguesData[leagueId].teams);
    }
    allTeams.filter(team => team.name !== gameState.userClub.name).sort((a,b) => a.name.localeCompare(b.name)).forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.innerText = team.name;
        selector.appendChild(option);
    });
    document.getElementById('schedule-friendly-modal').classList.add('active');
}

function scheduleFriendlyMatch() {
    document.getElementById('schedule-friendly-modal').classList.remove('active');
    const opponentName = document.getElementById('friendly-opponent-selector').value;
    const periodDays = parseInt(document.getElementById('friendly-period-selector').value, 10);
    const userStrength = getTeamStrength(gameState.userClub, true);
    const opponentData = findTeamInLeagues(opponentName);
    const opponentStrength = getTeamStrength(opponentData, false);
    const strengthDiff = userStrength - opponentStrength;
    let acceptanceChance = 0.5;
    if (strengthDiff > 15) acceptanceChance = 0.7;
    else if (strengthDiff > 5) acceptanceChance = 0.6;
    else if (strengthDiff < -15) acceptanceChance = 0.10;
    else if (strengthDiff < -5) acceptanceChance = 0.3;

    if (Math.random() > acceptanceChance) {
        showInfoModal('Convite Recusado', `${opponentName} recusou o convite para o amistoso.`);
        return;
    }

    const startDate = new Date(gameState.currentDate);
    const endDate = new Date(gameState.currentDate);
    endDate.setDate(endDate.getDate() + periodDays);

    let friendlyDate = null;
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    while (currentDate <= endDate) {
        if (isDateAvailableForTeam(currentDate, gameState.userClub.name) && isDateAvailableForTeam(currentDate, opponentName)) {
            friendlyDate = new Date(currentDate);
            break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (friendlyDate) {
        const newFriendly = { home: gameState.userClub, away: opponentData, date: friendlyDate.toISOString(), status: 'scheduled', round: 'Amistoso' };
        gameState.allMatches.push(newFriendly);
        gameState.allMatches.sort((a,b) => new Date(a.date) - new Date(b.date));
        findNextUserMatch();
        updateContinueButton();
        if (gameState.currentMainContent === 'calendar-content') updateCalendar();
        showInfoModal('Amistoso Marcado!', `Amistoso contra ${opponentName} marcado para ${friendlyDate.toLocaleDateString('pt-BR')}!`);
    } else {
        showInfoModal('Sem Data Disponível', `${opponentName} aceitou o convite, mas não foi possível encontrar uma data compatível no período selecionado.`);
    }
}

// --- Funções de Táticas ---
function handleTacticsInteraction(e) {
    const clickedElement = e.target.closest('[data-player-id], .player-slot, #substitutes-list, #reserves-list');
    if (!clickedElement) {
        clearSelection();
        return;
    }

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
function movePlayer(playerInfo, destInfo) { if (destInfo.type === 'subs' && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`); return; } removePlayerFromSource(playerInfo); addPlayerToDest(playerInfo.player, destInfo); loadTacticsScreen(); }
function swapPlayers(sourcePlayerInfo, destPlayerInfo) { const isMovingToSubs = destPlayerInfo.type === 'subs'; const isMovingFromSubs = sourcePlayerInfo.sourceType === 'subs'; if (!isMovingFromSubs && isMovingToSubs && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) { showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`); return; } removePlayerFromSource(sourcePlayerInfo); removePlayerFromSource(destPlayerInfo); addPlayerToDest(sourcePlayerInfo.player, { type: destPlayerInfo.type, id: destPlayerInfo.id }); addPlayerToDest(destPlayerInfo.player, { type: sourcePlayerInfo.sourceType, id: sourcePlayerInfo.sourceId }); loadTacticsScreen(); }
function calculateModifiedOverall(player, targetPosition) { if (!player || !targetPosition) return player ? player.overall : 0; const naturalPosition = player.position; const cleanTargetPosition = targetPosition.replace(/\d/g, ''); if (!positionMatrix[naturalPosition] || positionMatrix[naturalPosition][cleanTargetPosition] === undefined) { return Math.max(40, player.overall - 25); } const distance = positionMatrix[naturalPosition][cleanTargetPosition]; const penaltyFactor = 4; const penalty = distance * penaltyFactor; return Math.max(40, player.overall - penalty); }
function createPlayerChip(player, currentPosition) { const chip = document.createElement('div'); chip.className = 'player-chip'; chip.dataset.playerId = player.name; const modifiedOverall = calculateModifiedOverall(player, currentPosition); let overallClass = 'player-overall'; if (modifiedOverall < player.overall) { overallClass += ' penalty'; } chip.innerHTML = ` <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span> <span class="${overallClass}">${modifiedOverall}</span> <span class="player-pos">${player.position}</span> `; return chip; }
function createSquadListPlayer(player) { const item = document.createElement('div'); item.className = 'squad-list-player'; item.dataset.playerId = player.name; item.innerHTML = ` <div class="player-info"> <div class="player-name">${player.name}</div> <div class="player-pos">${player.position}</div> </div> <div class="player-overall">${player.overall}</div> `; return item; }
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
        slot.style.top = `${positions[pos][0]}%`;
        slot.style.left = `${positions[pos][1]}%`;
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


// --- Funções de Contratos e Transferências (UI) ---
function displayTransferMarket() {
    const container = document.getElementById('transfer-market-content');
    container.innerHTML = `
        <div class="tabs-container">
            <button class="tab-btn active" data-tab="search-players">Pesquisar Jogadores</button>
            <button class="tab-btn" data-tab="market-hub" disabled>Mercado</button>
        </div>
        <div id="search-players-tab" class="tab-content active"></div>
        <div id="market-hub-tab" class="tab-content"><p>Funcionalidade em desenvolvimento.</p></div>
    `;

    displayPlayerSearch();

    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            container.querySelector(`#${tabId}-tab`).classList.add('active');
        });
    });
}

function displayPlayerSearch() {
    const container = document.getElementById('search-players-tab');
    container.innerHTML = `
        <div class="player-search-bar">
            <input type="text" id="player-search-input" placeholder="Nome do jogador...">
            <select id="filter-position"><option value="">Posição</option><option>GK</option><option>CB</option><option>RB</option><option>LB</option><option>CDM</option><option>CM</option><option>CAM</option><option>RW</option><option>LW</option><option>ST</option></select>
            <select id="filter-age"><option value="">Idade</option><option value="u21">Sub-21</option><option value="22-28">Auge (22-28)</option><option value="o29">Veterano (29+)</option></select>
            <select id="filter-value"><option value="">Valor</option><option value="0-1m">Até 1M</option><option value="1m-5m">1M - 5M</option><option value="5m-10m">5M - 10M</option><option value="o10m">Acima de 10M</option></select>
            <button id="search-player-btn">Pesquisar</button>
        </div>
        <div class="table-container" id="player-search-results">
            <p style="padding: 20px; text-align: center;">Use a busca e os filtros para encontrar jogadores.</p>
        </div>
    `;

    document.getElementById('search-player-btn').addEventListener('click', performSearch);
}

function performSearch() {
    const nameQuery = document.getElementById('player-search-input').value.toLowerCase();
    const posQuery = document.getElementById('filter-position').value;
    const ageQuery = document.getElementById('filter-age').value;
    const valueQuery = document.getElementById('filter-value').value;
    
    let results = [...gameState.freeAgents];

    if (nameQuery) {
        results = results.filter(p => p.name.toLowerCase().includes(nameQuery));
    }
    if (posQuery) {
        results = results.filter(p => p.position === posQuery);
    }
    if (ageQuery) {
        if (ageQuery === 'u21') results = results.filter(p => p.age <= 21);
        else if (ageQuery === '22-28') results = results.filter(p => p.age >= 22 && p.age <= 28);
        else if (ageQuery === 'o29') results = results.filter(p => p.age >= 29);
    }
    if (valueQuery) {
        const base = 1000000 * currencyRates.EUR; // Valores são em BRL, base é EUR
        if (valueQuery === '0-1m') results = results.filter(p => p.marketValue <= base);
        else if (valueQuery === '1m-5m') results = results.filter(p => p.marketValue > base && p.marketValue <= base * 5);
        else if (valueQuery === '5m-10m') results = results.filter(p => p.marketValue > base * 5 && p.marketValue <= base * 10);
        else if (valueQuery === 'o10m') results = results.filter(p => p.marketValue > base * 10);
    }

    const resultsContainer = document.getElementById('player-search-results');
    resultsContainer.innerHTML = renderPlayerList(results);
    addPlayerListEventListeners(resultsContainer);
}

function renderPlayerList(players) {
    if (players.length === 0) return '<p style="padding: 20px; text-align: center;">Nenhum jogador encontrado.</p>';
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor de Mercado</th><th>Ação</th></tr></thead><tbody>`;
    for (const player of players) {
        tableHTML += `
            <tr data-player-name="${player.name}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td>${formatCurrency(player.marketValue)}</td>
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
            const playerName = e.target.dataset.playerName;
            const player = gameState.freeAgents.find(p => p.name === playerName);
            if (player) {
                openNegotiationModal(player, 'hire');
            }
        });
    });
}

function displayContractsScreen() {
    const container = document.getElementById('contracts-content');
    container.innerHTML = '<h3>Situação Contratual do Elenco</h3>';
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    const sortedPlayers = [...gameState.userClub.players].sort((a, b) => {
        const contractA = a.contractUntil === undefined ? 999 : a.contractUntil;
        const contractB = b.contractUntil === undefined ? 999 : b.contractUntil;
        return contractA - contractB;
    });

    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Contrato Restante</th><th>Ações</th></tr></thead><tbody>`;
    for (const player of sortedPlayers) {
        let contractClass = '';
        if (player.contractUntil <= 6) contractClass = 'negative';
        else if (player.contractUntil <= 12) contractClass = 'text-secondary';

        tableHTML += `
            <tr data-player-name="${player.name}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td class="${contractClass}">${formatContract(player.contractUntil) || 'N/A'}</td>
                <td>
                    <button class="renew-btn" data-player-name="${player.name}">Renovar</button> 
                    <button class="terminate-btn secondary" data-player-name="${player.name}">Rescindir</button>
                </td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);

    container.querySelectorAll('.renew-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === btn.dataset.playerName);
            openNegotiationModal(player, 'renew');
        });
    });
    container.querySelectorAll('.terminate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === btn.dataset.playerName);
            handleContractTermination(player);
        });
    });
}

function handleContractTermination(player) {
    const yearsLeft = Math.max(0, (player.contractUntil || 0) / 12);
    const terminationFee = (player.marketValue || 0) * 0.5 * yearsLeft;

    showConfirmationModal(
        'Rescindir Contrato',
        `Rescindir o contrato de ${player.name} custará ${formatCurrency(terminationFee)}. Deseja continuar?`,
        () => {
            if (gameState.clubFinances.balance < terminationFee) {
                showInfoModal("Fundos Insuficientes", "Você não tem dinheiro suficiente para pagar a cláusula de rescisão.");
                return;
            }

            addTransaction(-terminationFee, `Rescisão de contrato de ${player.name}`);
            gameState.userClub.players = gameState.userClub.players.filter(p => p.name !== player.name);
            
            player.contractUntil = 0;
            gameState.freeAgents.push(player);

            setupInitialSquad();
            showInfoModal("Contrato Rescindido", `${player.name} não é mais jogador do seu clube.`);
            displayContractsScreen();
        }
    );
}

function openNegotiationModal(player, type) {
    negotiationState = {
        player,
        type, 
        rounds: 0,
        minAcceptableBonus: (player.marketValue || 50000) * 0.10 * (player.overall / 80),
        desiredBonus: (player.marketValue || 50000) * 0.20 * (player.overall / 75),
        desiredDuration: player.age < 25 ? 5 : (player.age < 32 ? 3 : 2)
    };
    
    negotiationState.desiredBonus *= (0.9 + Math.random() * 0.2);
    negotiationState.minAcceptableBonus = Math.max(10000, negotiationState.desiredBonus * 0.7);

    document.getElementById('negotiation-title').innerText = type === 'renew' ? 'Renovação de Contrato' : 'Contratar Jogador';
    document.getElementById('negotiation-player-name').innerText = player.name;
    document.getElementById('negotiation-player-age').innerText = player.age;
    document.getElementById('negotiation-player-pos').innerText = player.position;
    document.getElementById('negotiation-player-ovr').innerText = player.overall;

    document.getElementById('player-demand-duration').innerText = negotiationState.desiredDuration;
    document.getElementById('player-demand-bonus').innerText = formatCurrency(negotiationState.desiredBonus);
    document.getElementById('player-feedback').innerText = "Aguardando sua proposta...";

    document.getElementById('offer-duration').value = type === 'renew' ? Math.round(player.contractUntil / 12) : negotiationState.desiredDuration;
    document.getElementById('offer-bonus').value = '';
    
    document.getElementById('negotiation-modal').classList.add('active');
}

// No seu arquivo ui_manager.js, substitua esta função:
function handleNegotiationOffer() {
    const { minAcceptableBonus, desiredDuration } = negotiationState;
    const feedbackEl = document.getElementById('player-feedback');
    
    let offerDuration = parseInt(document.getElementById('offer-duration').value, 10);
    let offerBonusStr = document.getElementById('offer-bonus').value.trim();
    
    if (isNaN(offerDuration) || offerDuration <= 0) {
        feedbackEl.innerText = "Por favor, insira uma duração de contrato válida.";
        return;
    }

    let offerBonusRaw = 0;
    if (offerBonusStr.toLowerCase().endsWith('m')) {
        offerBonusRaw = parseFloat(offerBonusStr.slice(0, -1)) * 1000000;
    } else if (offerBonusStr.toLowerCase().endsWith('k')) {
        offerBonusRaw = parseFloat(offerBonusStr.slice(0, -1)) * 1000;
    } else {
        offerBonusRaw = parseFloat(offerBonusStr);
    }
    
    if (isNaN(offerBonusRaw)) {
        feedbackEl.innerText = "Por favor, insira um valor de luvas válido (ex: 500k, 1.2M).";
        return;
    }

    const offerBonus = offerBonusRaw; // Usamos o valor em BRL diretamente
    negotiationState.rounds++;

    // LÓGICA DE ACEITAÇÃO MELHORADA
    const bonusRatio = offerBonus / minAcceptableBonus;
    const durationDiff = Math.abs(offerDuration - desiredDuration);
    
    // O jogador fica mais feliz se o bônus for alto e a duração for a que ele quer.
    let acceptanceScore = (bonusRatio * 0.8) - (durationDiff * 0.1); 

    if (acceptanceScore >= 0.95) { // Precisa de uma oferta boa para aceitar
        finalizeDeal(offerDuration * 12); // Chamamos a finalizeDeal que calcula o custo final
    } else if (negotiationState.rounds >= 4) {
        feedbackEl.innerText = "Sua proposta final não me agrada. Vou procurar outras oportunidades.";
        setTimeout(() => document.getElementById('negotiation-modal').classList.remove('active'), 2000);
    } else {
        // Feedbacks mais úteis
        if (bonusRatio < 0.8) {
            feedbackEl.innerText = "As luvas que você ofereceu estão muito abaixo do que eu esperava.";
        } else if (durationDiff > 1) {
            feedbackEl.innerText = `Um contrato de ${offerDuration} anos não é o ideal para mim, mas a proposta de luvas está interessante. Melhore um pouco mais.`;
        } else {
            feedbackEl.innerText = "Estamos quase lá. Melhore um pouco a proposta e podemos fechar negócio.";
        }
    }
}
function finalizeDeal(contractMonths) {
    // O parâmetro 'bonus' que existia antes foi removido, pois o custo agora é calculado.
    const { player, type } = negotiationState;
    const isRenewal = type === 'renew';

    // 1. Calcula o custo total da negociação usando a nova função.
    const cost = calculateNegotiationCost(player, isRenewal);

    // 2. Verifica se o clube tem saldo para pagar o custo total (luvas + taxas).
    if (gameState.clubFinances.balance < cost) {
        showInfoModal("Dinheiro Insuficiente", `Você não tem verba suficiente para pagar as taxas de contrato (${formatCurrency(cost)}).`);
        document.getElementById('negotiation-modal').classList.remove('active');
        return;
    }

    // 3. Deduz o custo total do saldo do clube.
    addTransaction(-cost, `Taxas de Contrato: ${player.name} (${isRenewal ? 'Renovação' : 'Nova Contratação'})`);

    // 4. O resto da lógica para adicionar/atualizar o jogador continua a mesma.
    if (type === 'renew') {
        const playerInClub = gameState.userClub.players.find(p => p.name === player.name);
        playerInClub.contractUntil = contractMonths;
        showInfoModal("Contrato Renovado!", `${player.name} renovou seu contrato por ${formatContract(contractMonths)}!`);
    } else { // hire
        player.contractUntil = contractMonths;
        if (!player.attributes) { 
            player.attributes = { pace: 80, shooting: 80, passing: 80, dribbling: 80, defending: 50, physical: 65 };
            player.overall = calculatePlayerOverall(player);
        }
        updateMarketValue(player); 
        
        gameState.userClub.players.push(player);
        gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== player.name);
        setupInitialSquad();
        showInfoModal("Contratação Realizada!", `Bem-vindo ao clube, ${player.name}!`);
        if(gameState.currentMainContent === 'transfer-market-content') displayTransferMarket();
    }
    
    document.getElementById('negotiation-modal').classList.remove('active');
    if(gameState.currentMainContent === 'contracts-content') displayContractsScreen();
}

function formatContract(months) {
    if (months === undefined || months === null || months <= 0) {
        return "Sem contrato";
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    let result = '';
    if (years > 0) {
        result += `${years} ano${years > 1 ? 's' : ''}`;
    }
    if (remainingMonths > 0) {
        if (years > 0) result += ' e ';
        result += `${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
    }
    return result || "Expirando";
}

// --- Funções Utilitárias de UI ---
function formatCurrency(valueInBRL) {
    if (typeof valueInBRL !== 'number') return 'N/A';
    const rate = currencyRates[gameState.currency];
    const convertedValue = valueInBRL / rate;

    if (Math.abs(convertedValue) >= 1000000) {
        const valueInMillions = (convertedValue / 1000000).toFixed(1).replace('.0', '');
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency }).format(0).replace('0,00', '') + valueInMillions + 'M';
    } else if (Math.abs(convertedValue) >= 1000) {
        const valueInThousands = Math.round(convertedValue / 1000);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency }).format(0).replace('0,00', '') + valueInThousands + 'k';
    }

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertedValue);
}

// --- Funções de Match UI ---
function promptMatchConfirmation() {
    if (!gameState.nextUserMatch) return;
    document.getElementById('match-confirmation-modal').classList.add('active');
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

function togglePause(forcePause = null) {
    if (gameState.isMatchLive === false) return;
    gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused;
    document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused);
    document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚';
    updateScoreboard();
}

function showNotification(message) {
    const area = document.getElementById('match-notification-area');
    area.innerHTML = '';
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerText = message;
    area.appendChild(notification);
    setTimeout(() => { if(notification) notification.remove(); }, 3500);
}

function updatePlayerRatings() {
    if(!gameState.matchState) return;
    for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) {
        const performanceChange = (Math.random() - 0.47) * 0.2;
        let newRating = Math.max(0, Math.min(10, currentRating + performanceChange));
        gameState.matchState.playerRatings.set(playerName, newRating);
    }
}

function showPostMatchReport() {
    const { home, away, score } = gameState.matchState;
    const modal = document.getElementById('post-match-report-modal');
    const headline = document.getElementById('post-match-headline');
    const summary = document.getElementById('post-match-summary');
    let winner, loser, winnerScore, loserScore;
    if (score.home > score.away) {
        winner = home.team.name;
        loser = away.team.name;
        winnerScore = score.home;
        loserScore = score.away;
        headline.innerText = `${winner} vence ${loser} por ${winnerScore} a ${loserScore}!`;
    } else if (score.away > score.home) {
        winner = away.team.name;
        loser = home.team.name;
        winnerScore = score.away;
        loserScore = score.home;
        headline.innerText = `${winner} surpreende e vence ${loser} fora de casa!`;
    } else {
        headline.innerText = `${home.team.name} e ${away.team.name} empatam em jogo disputado.`;
        summary.innerText = `A partida terminou com o placar de ${score.home} a ${score.away}. Ambos os times tiveram suas chances, mas a igualdade prevaleceu no placar final.`;
        modal.classList.add('active');
        return;
    }
    const performanceFactor = Math.random();
    if (performanceFactor > 0.7) {
        summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`;
    } else {
        summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`;
    }
    modal.classList.add('active');
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

    const playerRadius = Math.min(width / 50, height / 35);
    const drawPlayer = (pos, color, hasBall) => { const x = (pos.x / 100) * width; const y = (pos.y / 100) * height; ctx.beginPath(); ctx.arc(x, y, playerRadius, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); if (hasBall) { ctx.strokeStyle = '#3DDC97'; ctx.lineWidth = 3; } else { ctx.strokeStyle = 'black'; ctx.lineWidth = 1; } ctx.stroke(); };
    
    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        const color = teamKey === 'home' ? '#c0392b' : '#f1c40f';
        for (const player of Object.values(team.startingXI)) {
            if (!player) continue;
            const pos = gameState.matchState.playerPositions.get(player.name);
            if(pos) drawPlayer(pos, color, gameState.matchState.ball.owner === player);
        }
    }
    
    const ballRadius = playerRadius / 2;
    const ballPos = gameState.matchState.ball;
    const ballX = (ballPos.x / 100) * width;
    const ballY = (ballPos.y / 100) * height;
    ctx.beginPath(); ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill();
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
    document.querySelectorAll('#sidebar li').forEach(item => {
        item.addEventListener('click', () => showMainContent(item.dataset.content));
    });
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
        if (gameState.currentMainContent === 'finances-content') displayFinances();
        if (gameState.currentMainContent === 'squad-content') loadSquadTable();
        if (gameState.currentMainContent === 'contracts-content') displayContractsScreen();
        if (gameState.currentMainContent === 'transfer-market-content') displayTransferMarket();
    });

    document.getElementById('open-friendly-modal-btn').addEventListener('click', openFriendlyModal);
    document.getElementById('close-friendly-modal-btn').addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('cancel-schedule-friendly-btn').addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('confirm-schedule-friendly-btn').addEventListener('click', scheduleFriendlyMatch);
    document.getElementById('tactics-content')?.addEventListener('click', handleTacticsInteraction);
    document.querySelectorAll('#tactics-content select, #tactics-content input[type="checkbox"]').forEach(element => {
        element.addEventListener('change', (e) => {
            e.stopPropagation();
            const tacticKey = e.target.id.replace('tactic-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
            if (e.target.type === 'checkbox') {
                gameState.tactics[tacticKey] = e.target.checked;
            } else {
                gameState.tactics[tacticKey] = e.target.value;
            }
            if (tacticKey === 'formation') {
                setupInitialSquad();
            }
            loadTacticsScreen();
        });
    });
    document.querySelectorAll('.panel-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelName = e.currentTarget.dataset.panel;
            document.getElementById('tactics-layout-container').classList.toggle(`${panelName}-collapsed`);
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
        updateContinueButton();
    });

    document.getElementById('close-negotiation-modal-btn').addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
    document.getElementById('submit-offer-btn').addEventListener('click', handleNegotiationOffer);
    document.getElementById('accept-demand-btn').addEventListener('click', () => {
        const { desiredDuration } = negotiationState;
        finalizeDeal(desiredDuration * 12, desiredBonus);
    });
    document.getElementById('walk-away-btn').addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
}

function addMainScreenEventListeners() {
    document.getElementById('league-table-selector')?.addEventListener('change', (e) => {
        gameState.tableView.leagueId = e.target.value;
        updateLeagueTable(gameState.tableView.leagueId);
    });
    document.getElementById('matches-league-selector')?.addEventListener('change', (e) => {
        gameState.matchesView.leagueId = e.target.value;
        gameState.matchesView.round = findCurrentRound(e.target.value);
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    });
    document.getElementById('prev-round-btn')?.addEventListener('click', () => {
        if (gameState.matchesView.round > 1) {
            gameState.matchesView.round--;
            displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
        }
    });
    document.getElementById('next-round-btn')?.addEventListener('click', () => {
        gameState.matchesView.round++;
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
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
