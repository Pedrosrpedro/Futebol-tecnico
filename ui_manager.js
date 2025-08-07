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

    // Carregar conteúdo dinâmico
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

// --- Funções de Interação com a UI que faltavam ---
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

function handleNegotiationOffer() {
    const { desiredBonus, minAcceptableBonus, desiredDuration } = negotiationState;
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

    const offerBonus = offerBonusRaw * currencyRates[gameState.currency]; // Convertendo para BRL
    negotiationState.rounds++;

    const bonusRatio = offerBonus / minAcceptableBonus;
    const durationDiff = Math.abs(offerDuration - desiredDuration);
    let acceptanceScore = (bonusRatio * 0.8) - (durationDiff * 0.2);

    if (acceptanceScore >= 1.0) {
        finalizeDeal(offerDuration * 12, offerBonus);
    } else if (negotiationState.rounds >= 4) {
        feedbackEl.innerText = "Sua proposta final não me agrada. Vou procurar outras oportunidades.";
        setTimeout(() => document.getElementById('negotiation-modal').classList.remove('active'), 2000);
    } else {
        if (bonusRatio < 0.85) {
            feedbackEl.innerText = "As luvas estão muito abaixo do que eu esperava. Precisa melhorar bastante.";
        } else if (durationDiff > 1) {
            feedbackEl.innerText = `Um contrato de ${offerDuration} anos não é o ideal para mim. Mas podemos conversar se as luvas compensarem.`;
        } else {
            feedbackEl.innerText = "Estamos perto. Melhore um pouco a proposta e podemos fechar negócio.";
        }
    }
}

function finalizeDeal(contractMonths, bonus) {
    const { player, type } = negotiationState;

    if (gameState.clubFinances.balance < bonus) {
        showInfoModal("Fundos Insuficientes", "Você não tem dinheiro para pagar as luvas do jogador.");
        document.getElementById('negotiation-modal').classList.remove('active');
        return;
    }

    addTransaction(-bonus, `Luvas de contrato para ${player.name}`);

    if (type === 'renew') {
        const playerInClub = gameState.userClub.players.find(p => p.name === player.name);
        playerInClub.contractUntil = contractMonths;
        showInfoModal("Contrato Renovado!", `${player.name} renovou seu contrato por ${formatContract(contractMonths)}!`);
    } else { // hire
        player.contractUntil = contractMonths;
        gameState.userClub.players.push(player);
        gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== player.name);
        setupInitialSquad(); // Atualiza a gestão do elenco
        showInfoModal("Contratação Realizada!", `Bem-vindo ao clube, ${player.name}!`);
        if(gameState.currentMainContent === 'transfer-market-content') displayTransferMarket();
    }
    
    document.getElementById('negotiation-modal').classList.remove('active');
    if(gameState.currentMainContent === 'contracts-content') displayContractsScreen();
}

function togglePause(forcePause = null) {
    if (gameState.isMatchLive === false) return;
    gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused;
    document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused);
    document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚';
    updateScoreboard();
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
        const { desiredDuration, desiredBonus } = negotiationState;
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
});```
