document.addEventListener('DOMContentLoaded', () => {

    const database = { leagues, players };
    const mainContent = document.getElementById('main-content');
    
    // GameState agora guarda as informações do manager e do jogo
    let gameState = {
        manager: {
            firstName: '',
            lastName: '',
            nationality: '',
            familyFeature: false,
        },
        difficulty: {
            budgets: 'Medium',
            jobSecurity: 'Normal',
        },
        playerTeamId: null,
        currentDate: new Date(2025, 0, 1), // Início da temporada em Jan/2025
    };

    // =====================================================================
    // FUNÇÕES DO FLUXO DE NOVO JOGO
    // =====================================================================

    function showMainMenu() {
        mainContent.innerHTML = `
            <div class="main-menu-container">
                <button class="menu-button" id="new-game">Novo Jogo</button>
                <button class="menu-button" id="load-game" disabled>Carregar Jogo</button>
                <button class="menu-button" id="credits">Créditos</button>
                <button class="menu-button" id="quit-game">Sair</button>
            </div>
        `;
        document.getElementById('new-game').addEventListener('click', showManagerCreationScreen);
        document.getElementById('credits').addEventListener('click', () => alert('Criado por você com a ajuda da IA!'));
        document.getElementById('quit-game').addEventListener('click', () => mainContent.innerHTML = `<h2>Obrigado por jogar!</h2>`);
    }

    function showManagerCreationScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Quem é você?</h2>
                <div class="form-group">
                    <label for="first-name">Nome:</label>
                    <input type="text" id="first-name" placeholder="Seu nome">
                </div>
                <div class="form-group">
                    <label for="last-name">Sobrenome:</label>
                    <input type="text" id="last-name" placeholder="Seu sobrenome">
                </div>
                <div class="form-group">
                    <label for="nationality">Nacionalidade:</label>
                    <select id="nationality">
                        <option>Brasileiro</option>
                        <option>Português</option>
                        <option>Argentino</option>
                        <option>Inglês</option>
                        <option>Alemão</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Vida Pessoal:</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="family-feature" />
                        <label for="family-feature">Toggle</label>
                    </div>
                </div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-main">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
        document.getElementById('next-step').addEventListener('click', () => {
            // Salvar dados no gameState
            gameState.manager.firstName = document.getElementById('first-name').value || 'Manager';
            gameState.manager.lastName = document.getElementById('last-name').value || 'Padrão';
            gameState.manager.nationality = document.getElementById('nationality').value;
            gameState.manager.familyFeature = document.getElementById('family-feature').checked;
            showDifficultyScreen();
        });
    }

    function showDifficultyScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Configuração de Dificuldade</h2>
                <div class="form-group">
                    <label for="budgets">Orçamentos:</label>
                    <select id="budgets">
                        <option>Baixo</option>
                        <option selected>Médio</option>
                        <option>Alto</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="job-security">Segurança no Emprego:</label>
                    <select id="job-security">
                        <option>Alta</option>
                        <option selected>Normal</option>
                        <option>Baixa</option>
                    </select>
                </div>
                 <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-manager">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.difficulty.budgets = document.getElementById('budgets').value;
            gameState.difficulty.jobSecurity = document.getElementById('job-security').value;
            selectLeagueScreen();
        });
    }

    // =====================================================================
    // FUNÇÕES DE SELEÇÃO DE TIME (Mantidas e adaptadas)
    // =====================================================================
    
    function selectLeagueScreen() {
        const leagueButtonsHTML = database.leagues.map(league => `<button class="menu-button" data-league-id="${league.id}">${league.name}</button>`).join('');
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Selecione uma Liga</h2>
                ${leagueButtonsHTML}
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-difficulty">Voltar</button>
                </div>
            </div>
        `;
        document.querySelectorAll('[data-league-id]').forEach(button => {
            button.addEventListener('click', (e) => selectTeamScreen(e.target.getAttribute('data-league-id')));
        });
        document.getElementById('back-to-difficulty').addEventListener('click', showDifficultyScreen);
    }
    
    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        const teamButtonsHTML = league.teams.sort((a,b) => b.overall - a.overall)
            .map(team => `<button class="menu-button" data-team-id="${team.id}">${team.name} (OVR: ${team.overall})</button>`).join('');
        
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Selecione um Time</h2>
                ${teamButtonsHTML}
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-leagues">Voltar</button>
                </div>
            </div>
        `;
        document.querySelectorAll('[data-team-id]').forEach(button => {
            button.addEventListener('click', (e) => startGame(parseInt(e.currentTarget.getAttribute('data-team-id'))));
        });
        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }

    function startGame(teamId) {
        gameState.playerTeamId = teamId;
        showClubHub();
    }

    // =====================================================================
    // TELAS PRINCIPAIS DO JOGO (Hub, Elenco, Calendário, Família)
    // =====================================================================

    function showClubHub() {
        const team = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        
        // Botão de Vida Pessoal só aparece se a opção foi marcada
        const familyButtonHTML = gameState.manager.familyFeature ? `
            <button class="hub-action-button" id="hub-family">
                <img src="images/family_icon.png" alt="Família">
                <span>Vida Pessoal</span>
            </button>
        ` : '';

        mainContent.innerHTML = `
            <h2>Painel do Clube - ${team.name}</h2>
            <div class="club-hub-actions">
                <button class="hub-action-button" id="hub-squad">
                    <img src="images/squad_icon.png" alt="Elenco">
                    <span>Elenco</span>
                </button>
                <button class="hub-action-button" id="hub-calendar">
                    <img src="images/calendar_icon.png" alt="Calendário">
                    <span>Calendário</span>
                </button>
                <button class="hub-action-button" id="hub-stadium">
                    <img src="images/stadium_icon.png" alt="Estádio">
                    <span>Estádio</span>
                </button>
                ${familyButtonHTML}
            </div>
            <div class="navigation-buttons">
                <button class="menu-button" id="back-to-main">Sair para Menu</button>
            </div>
        `;

        document.getElementById('hub-squad').addEventListener('click', showSquadScreen);
        document.getElementById('hub-calendar').addEventListener('click', showCalendarScreen);
        document.getElementById('hub-stadium').addEventListener('click', () => alert('Editor de Estádio em desenvolvimento!'));
        if (gameState.manager.familyFeature) {
            document.getElementById('hub-family').addEventListener('click', showFamilyScreen);
        }
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }

    // (RE)IMPLEMENTADA: Função para mostrar a tela de elenco
    function showSquadScreen() {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId);
        const tableRowsHTML = squad.map(player => `
            <tr>
                <td>${player.name}</td>
                <td>${player.pos}</td>
                <td>${player.age}</td>
                <td>${player.overall}</td>
            </tr>
        `).join('');

        mainContent.innerHTML = `
            <div class="squad-container">
                <h2>Elenco Principal</h2>
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th></tr></thead>
                    <tbody>${tableRowsHTML}</tbody>
                </table>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-hub">Voltar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }

    // NOVA: Função para mostrar o calendário
    function showCalendarScreen() {
        // Simples gerador de jogos "dummy"
        const myTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const leagueTeams = database.leagues.find(l => l.teams.some(t => t.id === myTeam.id)).teams;
        const opponents = leagueTeams.filter(t => t.id !== myTeam.id).slice(0, 5); // Pega 5 oponentes

        let fixtureHTML = '';
        for (let i = 0; i < opponents.length; i++) {
            let gameDate = new Date(gameState.currentDate);
            gameDate.setDate(gameDate.getDate() + (i * 7));
            fixtureHTML += `
                <tr>
                    <td>${gameDate.toLocaleDateString('pt-BR')}</td>
                    <td>${myTeam.name}</td>
                    <td>vs</td>
                    <td>${opponents[i].name}</td>
                    <td>Brasileirão Série A</td>
                </tr>
            `;
        }
        
        mainContent.innerHTML = `
            <div class="calendar-container">
                <h2>Próximas Partidas</h2>
                <table class="data-table">
                    <thead><tr><th>Data</th><th colspan="3">Confronto</th><th>Competição</th></tr></thead>
                    <tbody>${fixtureHTML}</tbody>
                </table>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-hub">Voltar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }

    // NOVA: Função para mostrar a tela de família
    function showFamilyScreen() {
        mainContent.innerHTML = `
            <div class="family-container">
                <h2>Vida Pessoal</h2>
                <p>Status da sua família. Clique para adicionar membros.</p>
                <div class="family-grid">
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                    <div class="family-slot">+</div>
                </div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-hub">Voltar</button>
                </div>
            </div>
        `;
        document.querySelectorAll('.family-slot').forEach(slot => {
            slot.addEventListener('click', () => alert('Funcionalidade de adicionar membros da família em desenvolvimento!'));
        });
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    showMainMenu();
});
