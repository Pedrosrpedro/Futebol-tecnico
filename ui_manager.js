// ===================================================================================
// ARQUIVO UI_MANAGER.JS COMPLETO E CORRIGIDO
// ===================================================================================

// Este arquivo gerencia todas as interações e renderizações da Interface do Usuário.
// Ele depende de 'globals.js' para o estado e constantes, e 'utils.js' para utilitários,
// e chama funções de 'game_logic.js' para mudar o estado do jogo.

// --- Funções de UI (Telas, Modais, Notícias) ---

function addNews(headline, body, isUserRelated = false, imageHint = null) {
    // Adiciona uma nova notícia ao feed e, se for relevante para o usuário, exibe um modal.
    const newsItem = {
        date: new Date(gameState.currentDate),
        headline,
        body,
        imageHint
    };
    gameState.newsFeed.unshift(newsItem); // Adiciona no início da lista para mostrar as mais recentes
    if (isUserRelated) {
        showUserNewsModal(headline, body);
    }
}

function showUserNewsModal(headline, body) {
    // Exibe um modal de notícia importante para o usuário. Interrompe as férias se ativo.
    if (gameState.isOnHoliday) {
        stopHoliday(); // Se uma notícia importante aparecer durante as férias, interrompe as férias
    }
    document.getElementById('user-news-headline').innerText = headline;
    document.getElementById('user-news-body').innerText = body;
    document.getElementById('user-news-modal').classList.add('active');
}

function showScreen(screenId) {
    // Esconde todas as telas e mostra a tela com o ID especificado.
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const next = document.getElementById(screenId);
    if (next) next.classList.add('active');
    gameState.currentScreen = screenId;
}

function showMainContent(contentId) {
    // Esconde todos os painéis de conteúdo principal e mostra o painel com o ID especificado.
    // Também atualiza a barra lateral e recarrega o conteúdo da tela.
    clearSelection(); // Limpa qualquer seleção de jogador nas táticas
    document.getElementById(gameState.currentMainContent)?.classList.remove('active');
    document.querySelector(`#sidebar li[data-content='${gameState.currentMainContent}']`)?.classList.remove('active');

    document.getElementById(contentId)?.classList.add('active');
    document.querySelector(`#sidebar li[data-content='${contentId}']`)?.classList.add('active');

    gameState.currentMainContent = contentId;

    // Funções de inicialização/atualização para cada tela
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
    if (contentId === 'sponsorship-content') displaySponsorshipScreen(); // Patrocínios
    if (contentId === 'tickets-content') displayTicketsScreen(); // NOVO: Ingressos
}

function showInfoModal(headline, body) {
    // Exibe um modal genérico de informação.
    document.getElementById('info-modal-headline').innerText = headline;
    document.getElementById('info-modal-body').innerText = body;
    document.getElementById('info-modal').classList.add('active');
}

function showFriendlyResultModal(match) {
    // Exibe um modal com o resultado de uma partida amistosa.
    document.getElementById('friendly-result-headline').innerText = "Resultado do Amistoso";
    document.getElementById('friendly-result-body').innerText = `${match.home.name} ${match.homeScore} x ${match.awayScore} ${match.away.name}`;
    document.getElementById('friendly-result-modal').classList.add('active');
}

function showConfirmationModal(title, message, onConfirm) {
    // Exibe um modal de confirmação com botões de "Confirmar" e "Cancelar".
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('confirmation-modal-title').innerText = title;
    document.getElementById('confirmation-modal-body').innerText = message;

    const confirmBtn = document.getElementById('confirm-action-btn');
    const cancelBtn = document.getElementById('cancel-action-btn');

    // Clonar e substituir o botão para remover listeners antigos e adicionar um novo
    const confirmClone = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);

    confirmClone.addEventListener('click', () => {
        onConfirm(); // Executa a função de confirmação
        modal.classList.remove('active');
    });

    cancelBtn.onclick = () => modal.classList.remove('active'); // Fecha o modal ao cancelar

    modal.classList.add('active');
}

function updateContinueButton() {
    // Atualiza o texto e a funcionalidade do botão "Avançar Dia".
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    button.disabled = gameState.isOnHoliday; // Desabilita se estiver de férias

    if (gameState.isOffSeason) {
        button.innerText = "Avançar Pré-Temporada";
        button.onclick = advanceDay;
        return;
    }

    // Se for o dia do próximo jogo do usuário, muda o texto para "DIA DO JOGO"
    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "DIA DO JOGO";
        button.onclick = promptMatchConfirmation; // Chama modal de confirmação antes do jogo
    } else {
        button.innerText = "Avançar Dia";
        button.onclick = advanceDay; // Avança um dia normal
    }
}


// --- Funções de Renderização de Conteúdo Principal ---
function displayNewsFeed() {
    // Renderiza o feed de notícias na tela de notícias.
    const container = document.getElementById('news-layout-container');
    container.innerHTML = '';
    if (gameState.newsFeed.length === 0) {
        container.innerHTML = '<p>Nenhuma notícia por enquanto.</p>';
        return;
    }
    const mainNews = gameState.newsFeed[0];
    const mainTeam = findTeamInLeagues(mainNews.imageHint);
    let mainImage = mainTeam ? `images/${mainTeam.logo}` : `images/logo_default.png`; // Imagem padrão se não encontrar time

    container.innerHTML += `
        <div class="news-article news-article-main">
            <img src="${mainImage}" alt="Notícia principal" onerror="this.onerror=null; this.src='images/logo_default.png';">
            <div class="news-article-content">
                <h4>${mainNews.headline}</h4>
                <p class="news-body">${mainNews.body}</p>
                <span class="news-date">${mainNews.date.toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    `;

    const secondaryNewsContainer = document.createElement('div');
    secondaryNewsContainer.id = 'news-list-secondary';
    const secondaryNews = gameState.newsFeed.slice(1, 5); // Exibe as próximas 4 notícias secundárias
    secondaryNews.forEach(item => {
        const itemTeam = findTeamInLeagues(item.imageHint);
        let itemImage = itemTeam ? `images/${itemTeam.logo}` : `images/logo_default.png`;
        secondaryNewsContainer.innerHTML += `
            <div class="news-article news-article-secondary">
                <img src="${itemImage}" alt="Notícia secundária" onerror="this.onerror=null; this.src='images/logo_default.png';">
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
    // Carrega e exibe a tabela do elenco principal.
    const playerListDiv = document.getElementById('player-list-table');
    if (!playerListDiv) return;
    const positionOrder = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']; // Ordem de exibição por posição
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
    // Atualiza e exibe a tabela da liga selecionada.
    const container = document.getElementById('league-table-container');
    if (!container) return;
    const leagueState = gameState.leagueStates[leagueId];
    if (!leagueState) return;
    const leagueInfo = leaguesData[leagueId];
    const tiebreakers = leagueInfo.leagueInfo.tiebreakers;
    let tableHTML = '';

    // Lógica específica para a Série C fase 2 (mostra grupos separados)
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
    // Helper para renderizar uma tabela HTML de classificação.
    let html = `<table><thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>`;
    tableData.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        // Adiciona um logo na frente do nome do time
        const teamLogoSrc = `images/${team.logo}`;
        const teamNameCell = `<td><img src="${teamLogoSrc}" alt="${team.name}" style="width:20px; height:20px; vertical-align:middle; margin-right:5px;" onerror="this.onerror=null; this.src='images/logo_default.png';"> ${team.name}</td>`;

        html += `<tr class="${isUserTeam ? 'user-team-row' : ''}"><td>${index + startPos}</td>${teamNameCell}<td>${team.points}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

function updateCalendar() {
    // Atualiza e exibe o calendário mensal.
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
    // Remove e adiciona listeners para evitar duplicações
    const prevBtn = document.getElementById('prev-month-btn');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() - 1); updateCalendar(); } });

    const nextBtn = document.getElementById('next-month-btn');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => { if (!gameState.isOnHoliday) { gameState.calendarDisplayDate.setMonth(gameState.calendarDisplayDate.getMonth() + 1); updateCalendar(); } });
}

function displayRound(leagueId, roundNumber) {
    // Exibe as partidas de uma rodada específica em uma liga.
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
                    <span>${match.home.name}</span> <img src="images/${match.home.logo}" alt="${match.home.name}" onerror="this.onerror=null; this.src='images/logo_default.png';">
                </div>
                <div class="match-score">${score}</div>
                <div class="match-card-team away">
                    <img src="images/${match.away.logo}" alt="${match.away.name}" onerror="this.onerror=null; this.src='images/logo_default.png';"> <span>${match.away.name}</span>
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
    // Preenche os seletores de liga na UI (tabela e jogos).
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
    // Encontra a rodada atual para uma dada liga (a próxima a ser jogada).
    if (!gameState.leagueStates[leagueId]) return 1;
    const schedule = gameState.leagueStates[leagueId].schedule;
    const lastPlayedMatch = [...schedule].reverse().find(m => m.status === 'played' && new Date(m.date) <= gameState.currentDate && typeof m.round === 'number');
    return lastPlayedMatch ? lastPlayedMatch.round + 1 : 1;
}

// --- Funções de Finanças ---
function displayFinances() {
    // Gerencia a exibição da tela de finanças.
    const container = document.getElementById('finances-content');
    if (!container) return;

    displayClubFinances();
    displayOpponentFinances();

    // Reanexa listeners para as abas, evitando duplicações
    container.querySelectorAll('.tab-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const tabId = newBtn.dataset.tab;
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            newBtn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function displayClubFinances() {
    // Exibe o balanço atual, histórico e gráfico financeiro do clube do usuário.
    const tabContent = document.getElementById('club-finances-tab');
    const { balance, history, fixedMonthlyExpenses } = gameState.clubFinances;

    tabContent.innerHTML = `
        <div class="finance-overview">
            <div class="finance-box">
                <h4>Balanço Atual</h4>
                <p class="${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</p>
            </div>
            <div class="finance-box">
                <h4>Despesa Mensal Fixa</h4>
                <p class="negative">${formatCurrency(fixedMonthlyExpenses)}</p>
            </div>
        </div>
        <div class="finance-chart-container">
            <h4>Evolução Financeira</h4>
            <canvas id="finance-chart"></canvas>
        </div>
        <div class="finance-history-container">
            <h4>Histórico de Transações</h4>
            <div class="table-container" id="finance-history-table"></div>
        </div>
    `;

    const historyTableContainer = document.getElementById('finance-history-table');
    let tableHTML = `<table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>`;
    for (const item of history) {
        tableHTML += `
            <tr>
                <td>${item.date.toLocaleDateString('pt-BR')}</td>
                <td>${item.description}</td>
                <td class="${item.amount >= 0 ? 'positive' : 'negative'}">${formatCurrency(item.amount)}</td>
            </tr>
        `;
    }
    tableHTML += `</tbody></table>`;
    historyTableContainer.innerHTML = tableHTML;
    renderFinanceChart();
}

function renderFinanceChart() {
    // Renderiza o gráfico de evolução financeira usando Chart.js.
    const ctx = document.getElementById('finance-chart')?.getContext('2d');
    if (!ctx) return;
    const history = [...gameState.clubFinances.history].reverse(); // Inverte para ter a ordem cronológica
    const labels = history.map(item => item.date.toLocaleDateString('pt-BR'));
    let cumulativeBalance = 0;
    const data = history.map(item => {
        cumulativeBalance += item.amount;
        return cumulativeBalance;
    });

    if (window.financeChartInstance) { // Destrói instância anterior para evitar sobreposição
        window.financeChartInstance.destroy();
    }
    window.financeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balanço do Clube',
                data: data,
                borderColor: 'rgb(61, 220, 151)',
                backgroundColor: 'rgba(61, 220, 151, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: function(value, index, values) { return formatCurrency(value); } } } }
        }
    });
}

function displayOpponentFinances() {
    // Exibe uma tabela com a verba estimada de outros clubes.
    const container = document.getElementById('opponent-finances-tab');
    if (typeof estimativaVerbaMedia2025 === 'undefined') {
        container.innerHTML = '<h3>Erro</h3><p>Os dados financeiros (verba_times.js) não foram encontrados.</p>';
        return;
    }
    container.innerHTML = `<h3>Verba Estimada dos Clubes (Início da Temporada)</h3>`;
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    let fullHtml = '';

    const divisionsOrder = ['Série A', 'Série B', 'Série C'];
    const financesByDivision = estimativaVerbaMedia2025.reduce((acc, team) => {
        const { divisao } = team;
        if (!acc[divisao]) acc[divisao] = [];
        acc[divisao].push(team);
        return acc;
    }, {});

    for (const division of divisionsOrder) {
        if (!financesByDivision[division]) continue;

        fullHtml += `<h4 style="margin-top: 20px; margin-bottom: 10px;">${division}</h4>`;
        fullHtml += `<table><thead><tr><th>Time</th><th>Verba Média Estimada</th><th>Análise</th></tr></thead><tbody>`;
        const sortedTeams = financesByDivision[division].sort((a, b) => b.verba_media_estimada_milhoes_reais - a.verba_media_estimada_milhoes_reais);

        for (const team of sortedTeams) {
            const formattedVerba = formatCurrency(team.verba_media_estimada_milhoes_reais * 1000000);
            const cleanAnalysis = (team.analise || '').replace(/\[.*?\]/g, '').trim(); // Remove tags e espaços
            fullHtml += `<tr>
                <td>${team.time}</td>
                <td>${formattedVerba}</td>
                <td>${cleanAnalysis}</td>
            </tr>`;
        }
        fullHtml += '</tbody></table>';
    }
    tableContainer.innerHTML = fullHtml;
    container.appendChild(tableContainer);
}

// --- Funções Específicas de Telas ---
function displayDevelopmentScreen() {
    // Exibe a tela de desenvolvimento de jogadores, mostrando mudanças de atributos e overall.
    const container = document.getElementById('development-content');
    if (!container) return;

    const youngPlayers = gameState.userClub.players.filter(p => p.age < 24).length;
    const peakPlayers = gameState.userClub.players.filter(p => p.age >= 24 && p.age < 30).length;
    const veteranPlayers = gameState.userClub.players.filter(p => p.age >= 30).length;

    container.innerHTML = `
        <h3>Desenvolvimento do Elenco</h3>
        <div class="team-dev-overview">
            <div class="team-dev-summary">
                <h4>Fases de Carreira</h4>
                <p><span class="positive-dot"></span> ${youngPlayers} Jogadores em desenvolvimento</p>
                <p><span class="stagnating-dot"></span> ${peakPlayers} Jogadores no auge</p>
                <p><span class="negative-dot"></span> ${veteranPlayers} Jogadores experientes</p>
            </div>
        </div>
        <div class="player-dev-grid"></div>
    `;

    const grid = container.querySelector('.player-dev-grid');
    grid.innerHTML = '';

    // Ordena jogadores por overall para exibição
    gameState.userClub.players.sort((a,b) => b.overall - a.overall).forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-dev-card';

        let overallChangeHtml = '';
        if (player.lastSeasonChanges && player.lastSeasonChanges.overallChange !== 0) {
            const change = player.lastSeasonChanges.overallChange;
            const changeClass = change > 0 ? 'positive' : 'negative';
            overallChangeHtml = ` <span class="${changeClass}">(${change > 0 ? '+' : ''}${change})</span>`;
        }

        let attributeChangesHtml = '<div class="attribute-changes">Sem mudanças na última temporada.</div>';
        if (player.lastSeasonChanges && Object.keys(player.lastSeasonChanges.attributeChanges).length > 0) {
            attributeChangesHtml = '<div class="attribute-changes">';
            for(const attr in player.lastSeasonChanges.attributeChanges) {
                const change = player.lastSeasonChanges.attributeChanges[attr];
                const changeClass = change > 0 ? 'positive' : 'negative';
                const formattedAttr = attr.charAt(0).toUpperCase() + attr.slice(1);
                attributeChangesHtml += `<span class="${changeClass}">${formattedAttr} ${change > 0 ? '+' : ''}${change}</span>`;
            }
            attributeChangesHtml += '</div>';
        }

        card.innerHTML = `
            <div class="player-dev-info">
                <div class="player-name">${player.name} <span class="text-secondary">(${player.age})</span></div>
                <p>Overall: <b>${player.overall}</b>${overallChangeHtml}</p>
                ${attributeChangesHtml}
            </div>
            <div class="player-dev-chart">
                 <!-- Gráfico ou visualização de evolução individual pode ser implementado aqui futuramente -->
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadTacticsScreen() {
    // Carrega e exibe a tela de táticas, incluindo o campo, jogadores e opções táticas.
    const formation = gameState.tactics.formation;
    const field = document.querySelector('#field-container .field-background');
    const subsList = document.getElementById('substitutes-list');
    const reservesList = document.getElementById('reserves-list');
    field.innerHTML = ''; subsList.innerHTML = ''; reservesList.innerHTML = '';

    // Popula os seletores de tática com os valores atuais do gameState
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

    // Renderiza os jogadores no campo
    const positions = formationLayouts[formation];
    for (const pos in positions) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.dataset.position = pos; // Posição tática (ex: CB1, CM2)
        slot.style.top = `${positions[pos][0]}%`;
        slot.style.left = `${positions[pos][1]}%`;
        const player = gameState.squadManagement.startingXI[pos]; // Jogador escalado naquela posição
        if (player) {
            slot.appendChild(createPlayerChip(player, pos));
        } else {
            slot.innerText = pos; // Se não tiver jogador, mostra o nome da posição
        }
        field.appendChild(slot);
    }
    // Renderiza os jogadores no banco e na reserva
    gameState.squadManagement.substitutes.forEach(player => subsList.appendChild(createSquadListPlayer(player)));
    gameState.squadManagement.reserves.forEach(player => reservesList.appendChild(createSquadListPlayer(player)));
    document.getElementById('subs-count').innerText = gameState.squadManagement.substitutes.length;

    // Garante que o jogador selecionado visualmente permaneça selecionado após a atualização
    if (gameState.selectedPlayerInfo) {
        const element = document.querySelector(`[data-player-id="${gameState.selectedPlayerInfo.player.name}"]`);
        if (element) element.classList.add('selected');
    }
}


// --- Funções de Táticas (UI) ---
function handleTacticsInteraction(e) {
    // Lida com cliques nos jogadores ou slots de posição na tela de táticas para arrastar e soltar.
    const clickedElement = e.target.closest('[data-player-id], .player-slot, #substitutes-list, #reserves-list');
    if (!clickedElement) {
        clearSelection(); // Se clicou fora, limpa a seleção
        return;
    }

    const clickedPlayerId = clickedElement.dataset.playerId;
    if (clickedPlayerId) { // Clicou em um jogador
        const player = gameState.userClub.players.find(p => p.name === clickedPlayerId);
        const sourceInfo = getPlayerLocation(player); // Onde o jogador está atualmente

        if (gameState.selectedPlayerInfo) { // Já havia um jogador selecionado
            if (gameState.selectedPlayerInfo.player.name === player.name) {
                clearSelection(); // Clicou no mesmo jogador, deseleciona
            } else {
                const destPlayerInfo = { player, ...sourceInfo };
                swapPlayers(gameState.selectedPlayerInfo, destPlayerInfo); // Troca os jogadores
                clearSelection();
            }
        } else { // Nenhum jogador selecionado, seleciona este
            selectPlayer(player, sourceInfo.type, sourceInfo.id);
        }
    } else if (gameState.selectedPlayerInfo) { // Havia um jogador selecionado e clicou em um slot vazio ou lista
        let destInfo;
        if (clickedElement.classList.contains('player-slot')) {
            destInfo = { type: 'field', id: clickedElement.dataset.position }; // Slot do campo
        } else if (clickedElement.id === 'substitutes-list') {
            destInfo = { type: 'subs', id: 'substitutes-list' }; // Lista de substitutos
        } else if (clickedElement.id === 'reserves-list') {
            destInfo = { type: 'reserves', id: 'reserves-list' }; // Lista de reservas
        }
        if (destInfo) {
            movePlayer(gameState.selectedPlayerInfo, destInfo); // Move o jogador selecionado para o destino
            clearSelection();
        }
    }
}

function selectPlayer(player, sourceType, sourceId) {
    // Marca um jogador como selecionado na UI.
    clearSelection();
    gameState.selectedPlayerInfo = { player, sourceType, sourceId };
    const element = document.querySelector(`[data-player-id="${player.name}"]`);
    if(element) element.classList.add('selected');
}

function clearSelection() {
    // Desmarca qualquer jogador selecionado na UI.
    if (gameState.selectedPlayerInfo) {
        const element = document.querySelector(`[data-player-id="${gameState.selectedPlayerInfo.player.name}"]`);
        if(element) element.classList.remove('selected');
    }
    gameState.selectedPlayerInfo = null;
}

function getPlayerLocation(player) {
    // Retorna a localização atual de um jogador no elenco (campo, banco, reserva).
    for (const pos in gameState.squadManagement.startingXI) {
        if (gameState.squadManagement.startingXI[pos]?.name === player.name) {
            return { type: 'field', id: pos };
        }
    }
    if (gameState.squadManagement.substitutes.some(p => p && p.name === player.name)) {
        return { type: 'subs', id: 'substitutes-list' };
    }
    return { type: 'reserves', id: 'reserves-list' };
}

function removePlayerFromSource(playerInfo) {
    // Remove um jogador de sua localização atual no elenco.
    if (!playerInfo || !playerInfo.player) return;

    if (playerInfo.sourceType === 'field') {
        delete gameState.squadManagement.startingXI[playerInfo.sourceId];
    } else if (playerInfo.sourceType === 'subs') {
        gameState.squadManagement.substitutes = gameState.squadManagement.substitutes.filter(p => p && p.name !== playerInfo.player.name);
    } else {
        gameState.squadManagement.reserves = gameState.squadManagement.reserves.filter(p => p && p.name !== playerInfo.player.name);
    }
}

function addPlayerToDest(player, destInfo) {
    // Adiciona um jogador a uma nova localização no elenco.
    if (destInfo.type === 'field') {
        gameState.squadManagement.startingXI[destInfo.id] = player;
    } else if (destInfo.type === 'subs') {
        gameState.squadManagement.substitutes.push(player);
    } else {
        gameState.squadManagement.reserves.push(player);
    }
}

function movePlayer(playerInfo, destInfo) {
    // Move um jogador de uma posição para outra.
    if (destInfo.type === 'subs' && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES && playerInfo.sourceType !== 'subs') {
        showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`);
        return;
    }
    removePlayerFromSource(playerInfo);
    addPlayerToDest(playerInfo.player, destInfo);
    loadTacticsScreen(); // Recarrega a tela para atualizar a UI
}

function swapPlayers(sourcePlayerInfo, destPlayerInfo) {
    // Troca dois jogadores de posição.
    const isMovingToSubs = destPlayerInfo.type === 'subs';
    const isMovingFromSubs = sourcePlayerInfo.sourceType === 'subs';

    // Evita adicionar mais jogadores do que o permitido no banco
    if (!isMovingFromSubs && isMovingToSubs && gameState.squadManagement.substitutes.length >= MAX_SUBSTITUTES) {
        showInfoModal('Banco Cheio', `O banco de reservas já tem o máximo de ${MAX_SUBSTITUTES} jogadores.`);
        return;
    }

    removePlayerFromSource(sourcePlayerInfo);
    removePlayerFromSource(destPlayerInfo);
    addPlayerToDest(sourcePlayerInfo.player, { type: destPlayerInfo.type, id: destPlayerInfo.id });
    addPlayerToDest(destPlayerInfo.player, { type: sourcePlayerInfo.sourceType, id: sourcePlayerInfo.sourceId });
    loadTacticsScreen(); // Recarrega a tela para atualizar a UI
}

function calculateModifiedOverall(player, targetPosition) {
    // Calcula o overall de um jogador em uma posição específica, aplicando penalidades se não for sua posição natural.
    if (!player || !targetPosition) return player ? player.overall : 0;
    const naturalPosition = player.position;
    const cleanTargetPosition = targetPosition.replace(/\d/g, ''); // Remove números da posição (ex: CB1 -> CB)

    if (!positionMatrix[naturalPosition] || positionMatrix[naturalPosition][cleanTargetPosition] === undefined) {
        return Math.max(40, player.overall - 25); // Penalidade grande se a posição é irreconhecível ou muito diferente
    }
    const distance = positionMatrix[naturalPosition][cleanTargetPosition]; // Distância da posição natural para a nova
    const penaltyFactor = 4; // Fator de penalidade por distância
    const penalty = distance * penaltyFactor;
    return Math.max(40, player.overall - penalty); // Garante um mínimo de overall
}

function createPlayerChip(player, currentPosition) {
    // Cria o elemento visual (chip) para um jogador no campo de táticas.
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.dataset.playerId = player.name; // ID para identificação
    const modifiedOverall = calculateModifiedOverall(player, currentPosition); // Overall ajustado pela posição
    let overallClass = 'player-overall';
    if (modifiedOverall < player.overall) {
        overallClass += ' penalty'; // Adiciona classe para overall com penalidade
    }
    chip.innerHTML = `
        <span class="player-name">${player.name.split(' ').slice(-1).join(' ')}</span>
        <span class="${overallClass}">${modifiedOverall}</span>
        <span class="player-pos">${player.position}</span>
    `;
    return chip;
}

function createSquadListPlayer(player) {
    // Cria o elemento visual para um jogador nas listas de banco/reservas.
    const item = document.createElement('div');
    item.className = 'squad-list-player';
    item.dataset.playerId = player.name;
    item.innerHTML = `
        <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-pos">${player.position}</div>
        </div>
        <div class="player-overall">${player.overall}</div>
    `;
    return item;
}

// --- Funções de Contratos e Transferências (UI) ---
function displayTransferMarket() {
    // Gerencia a exibição da tela do mercado de transferências, incluindo abas e filtros.
    const container = document.getElementById('transfer-market-content');
    container.innerHTML = `
        <div class="tabs-container">
            <button class="tab-btn active" data-tab="search-players">Agentes Livres</button>
            <button class="tab-btn" data-tab="market-hub">Comprar Jogadores</button>
        </div>
        <div id="search-players-tab" class="tab-content active"></div>
        <div id="market-hub-tab" class="tab-content"></div>
    `;

    displayPlayerSearch(); // Exibe a aba de Agentes Livres por padrão
    displayMarketHub(); // Prepara a aba de Compra de Jogadores

    // Reanexa listeners para as abas, evitando duplicações
    container.querySelectorAll('.tab-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn); // Substitui para remover listeners antigos
        newBtn.addEventListener('click', () => {
            const tabId = newBtn.dataset.tab;
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            newBtn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function displayMarketHub() {
    // Prepara a interface para a busca de jogadores de outros clubes.
    const container = document.getElementById('market-hub-tab');
    container.innerHTML = `
        <div class="player-search-bar">
            <input type="text" id="market-search-input" placeholder="Nome do jogador...">
            <select id="market-filter-league"><option value="">Campeonato</option></select>
            <select id="market-filter-team"><option value="">Clube</option></select>
            <select id="market-filter-position"><option value="">Posição</option></select>
            <button id="market-search-btn">Pesquisar</button>
        </div>
        <div class="table-container" id="market-search-results">
            <p style="padding: 20px; text-align: center;">Use a busca e os filtros para encontrar jogadores em outros clubes.</p>
        </div>
    `;

    const leagueSelector = document.getElementById('market-filter-league');
    for (const leagueId in leaguesData) {
        leagueSelector.innerHTML += `<option value="${leagueId}">${leaguesData[leagueId].name}</option>`;
    }

    const positionSelector = document.getElementById('market-filter-position');
    const positions = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
    positions.forEach(pos => positionSelector.innerHTML += `<option value="${pos}">${pos}</option>`);

    // Listener para carregar times ao selecionar uma liga
    const newLeagueSelector = leagueSelector.cloneNode(true);
    leagueSelector.parentNode.replaceChild(newLeagueSelector, leagueSelector);
    newLeagueSelector.addEventListener('change', () => {
        const teamSelector = document.getElementById('market-filter-team');
        teamSelector.innerHTML = '<option value="">Clube</option>'; // Reseta o seletor de time
        const selectedLeagueId = newLeagueSelector.value;
        if (selectedLeagueId) {
            leaguesData[selectedLeagueId].teams.forEach(team => {
                if (team.name !== gameState.userClub.name) { // Não mostra o próprio time
                    teamSelector.innerHTML += `<option value="${team.name}">${team.name}</option>`;
                }
            });
        }
    });

    // Reanexa listener para o botão de pesquisa
    const searchBtn = document.getElementById('market-search-btn');
    const newSearchBtn = searchBtn.cloneNode(true);
    searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
    newSearchBtn.addEventListener('click', performMarketSearch);
}

function performMarketSearch() {
    // Executa a busca de jogadores em outros clubes com base nos filtros.
    const nameQuery = document.getElementById('market-search-input').value.toLowerCase();
    const leagueQuery = document.getElementById('market-filter-league').value;
    const teamQuery = document.getElementById('market-filter-team').value;
    const posQuery = document.getElementById('market-filter-position').value;

    let allPlayers = [];
    // Coleta todos os jogadores de todos os times (exceto o do usuário)
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name !== gameState.userClub.name) {
                team.players.forEach(p => allPlayers.push({ ...p, teamName: team.name, leagueId: leagueId }));
            }
        }
    }

    let results = allPlayers;
    // Aplica os filtros
    if (leagueQuery) results = results.filter(p => p.leagueId === leagueQuery);
    if (teamQuery) results = results.filter(p => p.teamName === teamQuery);
    if (nameQuery) results = results.filter(p => p.name.toLowerCase().includes(nameQuery));
    if (posQuery) results = results.filter(p => p.position === posQuery);

    const resultsContainer = document.getElementById('market-search-results');
    resultsContainer.innerHTML = renderMarketPlayerList(results);

    // Reanexa listeners para os botões "Fazer Proposta"
    resultsContainer.querySelectorAll('.propose-purchase-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerName = e.target.dataset.playerName;
            const teamName = e.target.dataset.teamName;
            handlePurchaseOffer(playerName, teamName);
        });
    });
}

function renderMarketPlayerList(players) {
    // Renderiza a lista de jogadores encontrados na aba "Comprar Jogadores".
    if (players.length === 0) return '<p style="padding: 20px; text-align: center;">Nenhum jogador encontrado.</p>';

    let tableHTML = `<table><thead><tr><th>Nome</th><th>Clube</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor de Mercado</th><th>Contrato</th><th>Ação</th></tr></thead><tbody>`;
    for (const player of players) {
        tableHTML += `
            <tr data-player-name="${player.name}" data-team-name="${player.teamName}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td>${formatCurrency(player.marketValue)}</td>
                <td>${formatContract(player.contractUntil) || 'N/A'}</td>
                <td><button class="propose-purchase-btn" data-player-name="${player.name}" data-team-name="${player.teamName}">Fazer Proposta</button></td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    return tableHTML;
}

function handlePurchaseOffer(playerName, teamName) {
    // Lida com a tentativa de fazer uma proposta de compra. (Funcionalidade futura)
    const player = findTeamInLeagues(playerName, true); // Procura o objeto jogador
    if (!player) return;

    // Por enquanto, apenas um modal de informação
    showInfoModal("Função em Desenvolvimento", `A lógica para fazer uma proposta de compra por ${playerName} do ${teamName} ainda não foi implementada. Fique ligado para futuras atualizações!`);
}


function displayPlayerSearch() {
    // Prepara a interface para a busca de agentes livres.
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
            <p style="padding: 20px; text-align: center;">Use a busca e os filtros para encontrar agentes livres.</p>
        </div>
    `;
    // Reanexa listener para o botão de pesquisa de agentes livres
    const searchBtn = document.getElementById('search-player-btn');
    const newSearchBtn = searchBtn.cloneNode(true);
    searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
    newSearchBtn.addEventListener('click', performSearch);
}

function performSearch() {
    // Executa a busca de agentes livres com base nos filtros.
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
        // Assume que os valores de mercado já estão em BRL após a inicialização
        const base = 1000000;
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
    // Renderiza a lista de agentes livres.
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
    // Adiciona listeners aos botões "Propor Contrato" na lista de jogadores.
    container.querySelectorAll('.propose-contract-btn').forEach(btn => {
        // Clone e substitua para garantir que listeners antigos sejam removidos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
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
    // Exibe a tela de contratos, mostrando a situação contratual dos jogadores do time do usuário.
    const container = document.getElementById('contracts-content');
    container.innerHTML = '<h3>Situação Contratual do Elenco</h3>';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    // Ordena jogadores pelos meses restantes de contrato (os que expiram primeiro aparecem no topo)
    const sortedPlayers = [...gameState.userClub.players].sort((a, b) => {
        const contractA = a.contractUntil === undefined ? 999 : a.contractUntil; // Joga indefinidos para o final
        const contractB = b.contractUntil === undefined ? 999 : b.contractUntil;
        return contractA - contractB;
    });

    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Contrato Restante</th><th>Salário Mensal</th><th>Ações</th></tr></thead><tbody>`;
    for (const player of sortedPlayers) {
        let contractClass = '';
        if (player.contractUntil !== null && player.contractUntil <= 6) contractClass = 'negative';
        else if (player.contractUntil !== null && player.contractUntil <= 12) contractClass = 'text-secondary';

        tableHTML += `
            <tr data-player-name="${player.name}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td class="${contractClass}">${formatContract(player.contractUntil) || 'N/A'}</td>
                <td>${formatCurrency(calculatePlayerWage(player))}</td>
                <td>
                    <button class="renew-btn" data-player-name="${player.name}">Renovar</button>
                    <button class="terminate-btn secondary" data-player-name="${player.name}">Rescindir</button>
                </td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);

    // Reanexa listeners para os botões "Renovar" e "Rescindir"
    container.querySelectorAll('.renew-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === newBtn.dataset.playerName);
            openNegotiationModal(player, 'renew');
        });
    });
    container.querySelectorAll('.terminate-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === newBtn.dataset.playerName);
            handleContractTermination(player);
        });
    });
}

function handleContractTermination(player) {
    // Lida com a rescisão de contrato de um jogador do time do usuário.
    const yearsLeft = Math.max(0, (player.contractUntil || 0) / 12);
    // Custo de rescisão: 50% do valor de mercado por ano restante de contrato
    const terminationFee = (player.marketValue || 0) * 0.5 * yearsLeft;

    showConfirmationModal(
        'Rescindir Contrato',
        `Rescindir o contrato de ${player.name} custará ${formatCurrency(terminationFee)}. Deseja continuar?`,
        () => { // Callback de confirmação
            if (gameState.clubFinances.balance < terminationFee) {
                showInfoModal("Fundos Insuficientes", "Você não tem dinheiro suficiente para pagar a cláusula de rescisão.");
                return;
            }
            addTransaction(-terminationFee, `Rescisão de contrato de ${player.name}`);
            gameState.userClub.players = gameState.userClub.players.filter(p => p.name !== player.name); // Remove do elenco
            
            player.contractUntil = 0; // Marca como contrato encerrado
            gameState.freeAgents.push(player); // Torna-o agente livre

            setupInitialSquad(); // Reorganiza a escalação se necessário
            showInfoModal("Contrato Rescindido", `${player.name} não é mais jogador do seu clube.`);
            displayContractsScreen(); // Atualiza a tela de contratos
        }
    );
}

function openNegotiationModal(player, type) {
    // Abre o modal de negociação de contrato (renovação ou contratação).
    gameState.negotiationState = {
        player,
        type,
        rounds: 0,
        // Cálculos iniciais da demanda do jogador
        minAcceptableBonus: (player.marketValue || 50000) * 0.10 * (player.overall / 80),
        desiredBonus: (player.marketValue || 50000) * 0.20 * (player.overall / 75),
        desiredDuration: player.age < 25 ? 5 : (player.age < 32 ? 3 : 2)
    };

    // Adiciona aleatoriedade às demandas do jogador
    gameState.negotiationState.desiredBonus *= (0.9 + Math.random() * 0.2);
    gameState.negotiationState.minAcceptableBonus = Math.max(10000, gameState.negotiationState.desiredBonus * 0.7);

    document.getElementById('negotiation-title').innerText = type === 'renew' ? 'Renovação de Contrato' : 'Contratar Jogador';
    document.getElementById('negotiation-player-name').innerText = player.name;
    document.getElementById('negotiation-player-age').innerText = player.age;
    document.getElementById('negotiation-player-pos').innerText = player.position;
    document.getElementById('negotiation-player-ovr').innerText = player.overall;

    document.getElementById('player-demand-duration').innerText = gameState.negotiationState.desiredDuration;
    document.getElementById('player-demand-bonus').innerText = formatCurrency(gameState.negotiationState.desiredBonus);
    document.getElementById('player-feedback').innerText = "Aguardando sua proposta...";

    // Preenche os campos da proposta com valores iniciais
    document.getElementById('offer-duration').value = type === 'renew' ? Math.round(player.contractUntil / 12) : gameState.negotiationState.desiredDuration;
    document.getElementById('offer-bonus').value = ''; // Limpa o campo de luvas
    
    document.getElementById('negotiation-modal').classList.add('active');
}

function handleNegotiationOffer() {
    // Processa a proposta do usuário no modal de negociação.
    const { player, type, minAcceptableBonus, desiredDuration } = gameState.negotiationState;
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

    const offerBonus = offerBonusRaw;
    gameState.negotiationState.rounds++; // Incrementa o contador de rodadas

    const bonusRatio = offerBonus / minAcceptableBonus; // Quão boa a oferta de bônus é
    const durationDiff = Math.abs(offerDuration - desiredDuration); // Diferença na duração proposta

    // Score de aceitação: Mais peso para o bônus, penalidade para a diferença de duração
    let acceptanceScore = (bonusRatio * 0.8) - (durationDiff * 0.1);

    if (acceptanceScore >= 0.95) { // Se o score for alto o suficiente, o acordo é fechado
        finalizeDeal(offerDuration * 12, offerBonus);
    } else if (gameState.negotiationState.rounds >= 4) { // Limite de 4 rodadas de negociação
        feedbackEl.innerText = "Sua proposta final não me agrada. Vou procurar outras oportunidades.";
        setTimeout(() => document.getElementById('negotiation-modal').classList.remove('active'), 2000);
    } else { // Feedback para o usuário sobre a proposta
        if (bonusRatio < 0.8) {
            feedbackEl.innerText = "As luvas que você ofereceu estão muito abaixo do que eu esperava. Precisa melhorar bastante.";
        } else if (durationDiff > 1) {
            feedbackEl.innerText = `Um contrato de ${offerDuration} anos não é o ideal para mim. Mas podemos conversar se as luvas compensarem.`;
        } else {
            feedbackEl.innerText = "Estamos quase lá. Melhore um pouco a proposta e podemos fechar negócio.";
        }
    }
}

function finalizeDeal(contractMonths, bonus) {
    // Finaliza o processo de negociação de contrato, aplicando as mudanças ao jogador e às finanças.
    const { player, type } = gameState.negotiationState;
    const isRenewal = type === 'renew';

    const cost = calculateNegotiationCost(player, isRenewal); // Calcula o custo de negociação

    if (gameState.clubFinances.balance < cost + bonus) { // Verifica saldo para custo total (taxas + bônus)
        showInfoModal("Dinheiro Insuficiente", `Você não tem verba suficiente para pagar as taxas e luvas do contrato (${formatCurrency(cost + bonus)}).`);
        document.getElementById('negotiation-modal').classList.remove('active');
        return;
    }

    addTransaction(-(cost + bonus), `Custos de Contrato: ${player.name} (${isRenewal ? 'Renovação' : 'Nova Contratação'})`);

    if (type === 'renew') {
        const playerInClub = gameState.userClub.players.find(p => p.name === player.name);
        if (playerInClub) {
             playerInClub.contractUntil = contractMonths;
             playerInClub.notifiedAboutContract = false; // Reseta notificação após renovação
        }
        showInfoModal("Contrato Renovado!", `${player.name} renovou seu contrato por ${formatContract(contractMonths)}!`);
    } else { // Contratar jogador livre
        player.contractUntil = contractMonths;
        // Garante que o jogador contratado tenha atributos e valor calculados, se não tiver (caso de agentes livres gerados)
        if (!player.attributes || Object.keys(player.attributes).length === 0) {
            player.attributes = { pace: 80, shooting: 80, passing: 80, dribbling: 80, defending: 50, physical: 65 }; // Atributos default
            player.overall = calculatePlayerOverall(player);
        }
        updateMarketValue(player, true); // Garante que o valor de mercado esteja atualizado em BRL

        gameState.userClub.players.push(player); // Adiciona ao elenco do usuário
        gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== player.name); // Remove dos agentes livres
        setupInitialSquad(); // Reorganiza a escalação após a nova contratação
        showInfoModal("Contratação Realizada!", `Bem-vindo ao clube, ${player.name}!`);
        if(gameState.currentMainContent === 'transfer-market-content') displayTransferMarket(); // Atualiza a tela de mercado
    }
    
    document.getElementById('negotiation-modal').classList.remove('active');
    if(gameState.currentMainContent === 'contracts-content') displayContractsScreen(); // Atualiza a tela de contratos
}

// --- Funções de Patrocínio (UI) ---
function displaySponsorshipScreen() {
    // Exibe a tela de patrocínios.
    const container = document.getElementById('sponsorship-content');
    const sponsor = gameState.clubSponsor;

    if (!sponsor) {
        container.innerHTML = '<h3>Patrocínios</h3><p>Seu clube ainda não possui um patrocinador principal ou não há patrocinadores disponíveis para sua divisão.</p>';
        return;
    }

    const divisionMap = { 'brasileirao_a': 1, 'brasileirao_b': 2, 'brasileirao_c': 3 };
    const currentDivision = divisionMap[gameState.currentLeagueId];
    // Filtra outros patrocinadores que o clube poderia ter (da mesma divisão ou superiores).
    const otherSponsors = sponsorsData.filter(s => s.minDivision >= currentDivision && s.name !== sponsor.name);

    let otherSponsorsHTML = '';
    if (otherSponsors.length > 0) {
        otherSponsorsHTML = otherSponsors.map(s => `
            <div class="other-sponsor-card">
                <img src="images/sponsors/${s.logo}" alt="${s.name}" class="other-sponsor-logo" onerror="this.onerror=null; this.src='images/logo_default.png';">
                <div class="other-sponsor-info">
                    <h4>${s.name}</h4>
                    <p>${formatCurrency(s.monthlyIncome)} / mês</p>
                </div>
            </div>
        `).join('');
    } else {
        otherSponsorsHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum outro patrocinador disponível para sua divisão no momento.</p>';
    }

    container.innerHTML = `
        <h3>Patrocinador Principal</h3>
        <div class="main-sponsor-card">
            <div class="sponsor-logo-container">
                <img src="images/sponsors/${sponsor.logo}" alt="Logo ${sponsor.name}" class="sponsor-logo" onerror="this.onerror=null; this.src='images/logo_default.png';">
            </div>
            <div class="sponsor-details">
                <h2>${sponsor.name}</h2>
                <p class="sponsor-description">${sponsor.description}</p>
                <div class="sponsor-finance">
                    <span>Receita Mensal</span>
                    <span class="sponsor-income">${formatCurrency(sponsor.monthlyIncome)}</span>
                </div>
            </div>
        </div>
        <h3 style="margin-top: 30px;">Outros Patrocinadores da Divisão</h3>
        <div class="other-sponsors-grid">
            ${otherSponsorsHTML}
        </div>
    `;
}

// --- Funções de Ingressos (UI) (NOVO) ---
function displayTicketsScreen() {
    // Exibe a tela de ingressos, mostrando informações do estádio, público e receita.
    const container = document.getElementById('tickets-content');
    const stadium = getStadiumInfo(); // Pega info do estádio
    const { probableAttendance, revenue } = calculateTicketRevenue(); // Calcula público e receita

    container.innerHTML = `
        <h3>Informações do Estádio e Ingressos</h3>
        <div class="stadium-info-card">
            <h4>${stadium.name}</h4>
            <p>Capacidade Máxima: <b>${stadium.capacity.toLocaleString('pt-BR')}</b> Torcedores</p>
            <div class="ticket-price-control">
                <label for="ticket-price-input">Valor do Ingresso:</label>
                <input type="number" id="ticket-price-input" min="1" step="1" value="${gameState.userTicketPrice}">
                <span>${formatCurrency(1).replace('1,00', '')}</span> <!-- Exibe o símbolo da moeda -->
            </div>
        </div>

        <div class="match-day-projections-card">
            <h4>Projeção para o Próximo Jogo em Casa</h4>
            <p>Público Provável: <b id="probable-attendance-display">${probableAttendance.toLocaleString('pt-BR')}</b> Torcedores</p>
            <p>Receita Estimada: <b id="estimated-revenue-display">${formatCurrency(revenue)}</b></p>
            <div class="attendance-feedback">
                <!-- Feedback sobre o preço do ingresso e público -->
                <p id="ticket-price-feedback"></p>
            </div>
        </div>
    `;

    const ticketPriceInput = document.getElementById('ticket-price-input');
    const probableAttendanceDisplay = document.getElementById('probable-attendance-display');
    const estimatedRevenueDisplay = document.getElementById('estimated-revenue-display');
    const ticketPriceFeedback = document.getElementById('ticket-price-feedback');

    // Listener para atualizar a projeção ao mudar o preço do ingresso
    const newTicketPriceInput = ticketPriceInput.cloneNode(true);
    ticketPriceInput.parentNode.replaceChild(newTicketPriceInput, ticketPriceInput); // Substitui para evitar listeners duplicados
    
    newTicketPriceInput.addEventListener('input', () => {
        let newPrice = parseInt(newTicketPriceInput.value, 10);
        if (isNaN(newPrice) || newPrice <= 0) {
            newPrice = 1; // Preço mínimo
        }
        gameState.userTicketPrice = newPrice; // Atualiza o preço no gameState

        const { probableAttendance: newAttendance, revenue: newRevenue } = calculateTicketRevenue();
        probableAttendanceDisplay.innerText = newAttendance.toLocaleString('pt-BR');
        estimatedRevenueDisplay.innerText = formatCurrency(newRevenue);

        // Feedback visual sobre o preço
        const baseTicketPriceForLeague = BASE_TICKET_PRICE[gameState.currentLeagueId] || 70;
        const priceRatio = newPrice / baseTicketPriceForLeague;
        if (priceRatio > 1.5) {
            ticketPriceFeedback.className = 'negative';
            ticketPriceFeedback.innerText = 'Preço muito alto! Isso pode afastar muitos torcedores.';
        } else if (priceRatio > 1.1) {
            ticketPriceFeedback.className = 'text-secondary';
            ticketPriceFeedback.innerText = 'Preço um pouco alto, pode reduzir o público.';
        } else if (priceRatio < 0.8) {
            ticketPriceFeedback.className = 'positive';
            ticketPriceFeedback.innerText = 'Preço baixo! Atrairá mais torcedores, mas a receita por torcedor será menor.';
        } else {
            ticketPriceFeedback.className = '';
            ticketPriceFeedback.innerText = 'Preço equilibrado para sua divisão. Bom público esperado.';
        }
    });
}


// --- Funções de Match UI ---
function promptMatchConfirmation() {
    // Exibe um modal de confirmação antes de iniciar uma partida do usuário.
    if (!gameState.nextUserMatch) return;
    document.getElementById('match-confirmation-modal').classList.add('active');
}

function updateScoreboard() {
    // Atualiza o placar e o relógio na tela de simulação de partida.
    if (!gameState.matchState) return;
    const { score, gameTime } = gameState.matchState;
    document.getElementById('match-score-display').innerText = `${score.home} - ${score.away}`;
    
    const minutes = Math.floor(gameTime);
    const seconds = Math.floor((gameTime * 60) % 60);
    document.getElementById('match-clock').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const statusEl = document.getElementById('match-time-status');
    if (statusEl.innerText === 'FIM DE JOGO') return; // Não atualiza se o jogo já acabou
    
    if (gameState.isPaused) {
       if (gameState.matchState.half === 2 && gameTime >= 45) statusEl.innerText = 'INTERVALO';
       else statusEl.innerText = "PAUSA";
    } else {
        statusEl.innerText = gameState.matchState.half === 1 ? 'PRIMEIRO TEMPO' : 'SEGUNDO TEMPO';
    }
}

function togglePause(forcePause = null) {
    // Alterna o estado de pausa da simulação da partida.
    if (gameState.isMatchLive === false) return; // Só funciona se a partida estiver ativa
    gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused;
    document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused);
    document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚';
    updateScoreboard(); // Atualiza o placar para refletir o estado de pausa
}

function showNotification(message) {
    // Exibe uma notificação temporária na tela da partida.
    const area = document.getElementById('match-notification-area');
    area.innerHTML = ''; // Limpa notificações anteriores
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerText = message;
    area.appendChild(notification);
    setTimeout(() => { if(notification) notification.remove(); }, 3500); // Remove após 3.5 segundos
}

function updatePlayerRatings() {
    // (Funcionalidade de Match Engine) Atualiza as notas de desempenho dos jogadores durante a partida.
    // Esta função é chamada periodicamente, a lógica real de cálculo de rating está no game_logic.
    if(!gameState.matchState) return;
    for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) {
        const performanceChange = (Math.random() - 0.47) * 0.2; // Pequena flutuação aleatória
        let newRating = Math.max(0, Math.min(10, currentRating + performanceChange));
        gameState.matchState.playerRatings.set(playerName, newRating);
    }
}

function showPostMatchReport() {
    // Exibe o modal de relatório pós-partida.
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

    // Gerador de resumo aleatório pós-jogo
    const performanceFactor = Math.random();
    if (performanceFactor > 0.7) {
        summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`;
    } else if (performanceFactor < 0.3) {
        summary.innerText = `Uma partida eletrizante! O ${winner} conseguiu a vitória nos últimos minutos, mostrando garra e determinação. O ${loser} lutou bravamente, mas não foi o suficiente.`;
    }
    else {
        summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`;
    }
    modal.classList.add('active');
}

function resizeCanvas() {
    // Ajusta o tamanho do canvas do campo para ser responsivo.
    const canvas = document.getElementById('match-pitch-canvas');
    const container = document.getElementById('match-pitch-container');
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasAspectRatio = 7 / 5; // Proporção do campo (altura/largura)

    let newWidth = containerWidth;
    let newHeight = newWidth / canvasAspectRatio;

    // Se a altura calculada for maior que a do contêiner, ajusta pela altura
    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * canvasAspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    // Redesenha a partida se já estiver ativa para se adaptar ao novo tamanho
    if(gameState.isMatchLive) drawMatch();
}

function drawMatch() {
    // Desenha o campo, jogadores e bola no canvas.
    const canvas = document.getElementById('match-pitch-canvas');
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height); // Limpa o canvas

    // Desenha o campo e linhas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Cor das linhas
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height); // Linhas externas
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); // Linha do meio
    ctx.beginPath(); ctx.arc(width / 2, height / 2, height * 0.15, 0, 2 * Math.PI); ctx.stroke(); // Círculo central

    // Desenha os gols
    const goalY = (100 - PITCH_DIMS.goalHeight) / 2 / 100 * height;
    const goalH = PITCH_DIMS.goalHeight / 100 * height;
    const goalW = 2 / 100 * width; // Largura do gol (2% da largura do campo)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, goalY, goalW, goalH); // Gol da esquerda
    ctx.strokeRect(width - goalW, goalY, goalW, goalH); // Gol da direita

    // Raio dos jogadores
    const playerRadius = Math.min(width / 50, height / 35);
    const drawPlayer = (pos, color, hasBall) => {
        // Converte coordenadas de 0-100% para pixels do canvas
        const x = (pos.x / 100) * width;
        const y = (pos.y / 100) * height;
        ctx.beginPath();
        ctx.arc(x, y, playerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        // Desenha uma borda especial se o jogador tiver a bola
        if (hasBall) {
            ctx.strokeStyle = '#3DDC97'; // Cor de destaque para quem tem a bola
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
        }
        ctx.stroke();
    };

    // Desenha todos os jogadores
    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        const color = teamKey === 'home' ? '#c0392b' : '#f1c40f'; // Cores dos times
        for (const player of Object.values(team.startingXI)) {
            if (!player) continue;
            const pos = gameState.matchState.playerPositions.get(player.name);
            if(pos) drawPlayer(pos, color, gameState.matchState.ball.owner === player);
        }
    }

    // Desenha a bola
    const ballRadius = playerRadius / 2;
    const ballPos = gameState.matchState.ball;
    const ballX = (ballPos.x / 100) * width;
    const ballY = (ballPos.y / 100) * height;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}
