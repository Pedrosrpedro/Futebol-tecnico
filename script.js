// MODIFICADO: Estado do Jogo expandido
const gameState = {
    managerName: null,
    userClub: null,
    currentLeagueId: null, // NOVO
    currentDate: null,     // NOVO
    leagueTable: [],       // NOVO
    schedule: [],          // NOVO
    nextUserMatch: null,   // NOVO
    currentScreen: 'manager-creation-screen',
    currentMainContent: 'home-content'
};

// --- Funções de Navegação (MODIFICADAS/NOVAS) ---
function showScreen(screenId) { /* ... sem alterações */ }
function showMainContent(contentId) { /* ... sem alterações */ }
function exitToStartScreen() { /* ... sem alterações */ }

// NOVO: Função para trocar de aba (Tabela/Calendário)
function openTab(evt, tabId) {
    const parent = evt.target.closest('.main-content-panel');
    parent.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    parent.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// --- Lógica de Inicialização do Jogo (MODIFICADA) ---

function createManager() { /* ... sem alterações */ }
function loadLeagues() { /* ... sem alterações */ }
function loadTeams(leagueId) {
    // MODIFICADO: Armazena o ID da liga selecionada
    gameState.currentLeagueId = leagueId;
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}"><span>${team.name}</span>`;
        teamCard.onclick = () => startGame(team);
        teamSelectionDiv.appendChild(teamCard);
    }
    showScreen('select-team-screen');
}
function createClub() { /* ... sem alterações */ }


// --- Função Principal de Início do Jogo (TOTALMENTE REFEITA) ---

function startGame(team) {
    gameState.userClub = team;
    const leagueInfo = leaguesData[gameState.currentLeagueId].leagueInfo;
    const teams = leaguesData[gameState.currentLeagueId].teams;

    // 1. Inicializa a data
    gameState.currentDate = new Date(leagueInfo.startDate + 'T12:00:00Z');

    // 2. Gera o calendário de jogos
    gameState.schedule = generateSchedule(teams, leagueInfo);

    // 3. Inicializa a tabela da liga
    gameState.leagueTable = initializeLeagueTable(teams);

    // 4. Encontra o próximo jogo do usuário
    findNextUserMatch();

    // 5. Atualiza a UI
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

// --- Funções de Conteúdo e UI (NOVAS E MODIFICADAS) ---

function loadSquadTable() { /* ... sem alterações */ }

/** NOVO: Avança um dia no jogo */
function advanceDay() {
    gameState.currentDate.setDate(gameState.currentDate.getDate() + 1);

    // Simula os jogos do dia
    simulateDayMatches();
    
    // Atualiza toda a UI que depende da data
    updateLeagueTable();
    updateCalendar();
    updateContinueButton();
}

/** NOVO: Atualiza o texto e estado do botão Avançar */
function updateContinueButton() {
    const button = document.getElementById('advance-day-button');
    const displayDate = document.getElementById('current-date-display');
    
    displayDate.innerText = gameState.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date))) {
        button.innerText = "AVANÇAR PARA JOGO";
        button.disabled = true; // Desabilita para forçar o usuário a jogar
    } else {
        button.innerText = "Avançar";
        button.disabled = false;
    }
}

/** NOVO: Simula todos os jogos agendados para o dia atual */
function simulateDayMatches() {
    const todayMatches = gameState.schedule.filter(match => isSameDay(new Date(match.date), gameState.currentDate));

    for (const match of todayMatches) {
        if (match.status === 'scheduled') {
            // Simplificação: gera um placar aleatório para jogos não-usuário
            if (match.home.name !== gameState.userClub.name && match.away.name !== gameState.userClub.name) {
                match.homeScore = Math.floor(Math.random() * 4); // 0-3 gols
                match.awayScore = Math.floor(Math.random() * 4);
                match.status = 'played';
                updateTableWithResult(match);
            }
        }
    }
}

/** NOVO: Atualiza a tabela com o resultado de uma partida */
function updateTableWithResult(match) {
    const homeTeam = gameState.leagueTable.find(t => t.name === match.home.name);
    const awayTeam = gameState.leagueTable.find(t => t.name === match.away.name);

    homeTeam.played++;
    awayTeam.played++;
    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) { // Vitória do time da casa
        homeTeam.wins++;
        homeTeam.points += 3;
        awayTeam.losses++;
    } else if (match.awayScore > match.homeScore) { // Vitória do visitante
        awayTeam.wins++;
        awayTeam.points += 3;
        homeTeam.losses++;
    } else { // Empate
        homeTeam.draws++;
        awayTeam.draws++;
        homeTeam.points += 1;
        awayTeam.points += 1;
    }
}


/** NOVO: Renderiza a tabela de classificação na tela */
function updateLeagueTable() {
    const container = document.getElementById('league-table-container');
    const tiebreakers = leaguesData[gameState.currentLeagueId].leagueInfo.tiebreakers;

    // Ordena a tabela usando os critérios de desempate
    gameState.leagueTable.sort((a, b) => {
        for (const key of tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });

    let tableHTML = `
        <table>
            <thead>
                <tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr>
            </thead>
            <tbody>
    `;
    gameState.leagueTable.forEach((team, index) => {
        const isUserTeam = team.name === gameState.userClub.name;
        tableHTML += `
            <tr class="${isUserTeam ? 'user-team-row' : ''}">
                <td>${index + 1}</td>
                <td>${team.name}</td>
                <td>${team.points}</td>
                <td>${team.played}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDifference}</td>
            </tr>
        `;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

/** NOVO: Renderiza o calendário do mês atual */
function updateCalendar() {
    const container = document.getElementById('calendar-container');
    const date = gameState.currentDate;
    const month = date.getMonth();
    const year = date.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `
        <div class="calendar-header">
            <button onclick="changeMonth(-1)"><</button>
            <h3>${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button onclick="changeMonth(1)">></button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekday">Dom</div><div class="calendar-weekday">Seg</div><div class="calendar-weekday">Ter</div><div class="calendar-weekday">Qua</div><div class="calendar-weekday">Qui</div><div class="calendar-weekday">Sex</div><div class="calendar-weekday">Sáb</div>
    `;

    // Dias em branco antes do primeiro dia do mês
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }

    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const loopDate = new Date(year, month, i);
        const hasMatch = gameState.schedule.some(m => isSameDay(new Date(m.date), loopDate));
        html += `<div class="calendar-day ${hasMatch ? 'match-day' : ''}">${i}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

/** NOVO: Muda o mês do calendário */
function changeMonth(direction) {
    gameState.currentDate.setMonth(gameState.currentDate.getMonth() + direction);
    updateCalendar();
    updateContinueButton(); // Atualiza a data no header também
}


// --- Funções Auxiliares (NOVAS) ---

/** NOVO: Encontra o próximo jogo agendado para o usuário */
function findNextUserMatch() {
    gameState.nextUserMatch = gameState.schedule
        .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

/** NOVO: Gera a estrutura inicial da tabela */
function initializeLeagueTable(teams) {
    return teams.map(team => ({
        name: team.name, logo: team.logo,
        played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    }));
}

/** NOVO: Gera o calendário completo da liga (algoritmo round-robin) */
function generateSchedule(teams, leagueInfo) {
    const schedule = [];
    let roundDate = new Date(leagueInfo.startDate + 'T12:00:00Z');
    
    // Para ter um número par de times
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) {
        clubes.push({ name: "BYE" }); // Time "fantasma" para folga
    }
    const numRounds = clubes.length - 1;

    for (let round = 0; round < numRounds; round++) {
        // Jogos de ida
        for (let i = 0; i < clubes.length / 2; i++) {
            const home = clubes[i];
            const away = clubes[clubes.length - 1 - i];
            if (home.name !== "BYE" && away.name !== "BYE") {
                schedule.push({ home, away, date: roundDate.toISOString(), status: 'scheduled' });
            }
        }
        
        // Gira os times, mantendo o primeiro fixo
        clubes.splice(1, 0, clubes.pop());
        
        // Avança a data para o próximo jogo
        roundDate.setDate(roundDate.getDate() + (round % 2 === 0 ? 3 : 4)); // Alterna meio e fim de semana
    }
    
    // Gera os jogos de volta (invertendo mando)
    const returnGames = schedule.map(match => {
        roundDate.setDate(roundDate.getDate() + (schedule.indexOf(match) % (clubes.length/2) === 0 ? 4 : 3) );
        return { home: match.away, away: match.home, date: roundDate.toISOString(), status: 'scheduled' };
    });

    return [...schedule, ...returnGames].sort((a,b) => new Date(a.date) - new Date(b.date));
}

/** NOVO: Helper para verificar se duas datas são no mesmo dia */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    loadLeagues();
});
