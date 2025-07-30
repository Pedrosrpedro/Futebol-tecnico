// Aguarda o carregamento completo do HTML para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- BASE DE DADOS INICIAL ---
    // Vamos começar com uma estrutura para as ligas e alguns times do Brasil.
    const database = {
        leagues: [
            {
                id: "bra_a",
                name: "Brasileirão Série A",
                country: "Brasil",
                division: 1,
                teams: [
                    { id: 101, name: "Athletico Paranaense", overall: 75, budget: 15000000 },
                    { id: 102, name: "Atlético Goianiense", overall: 70, budget: 5000000 },
                    { id: 103, name: "Atlético Mineiro", overall: 78, budget: 25000000 },
                    { id: 104, name: "Bahia", overall: 74, budget: 12000000 },
                    { id: 105, name: "Botafogo", overall: 76, budget: 18000000 },
                    { id: 106, name: "Corinthians", overall: 77, budget: 22000000 },
                    { id: 107, name: "Criciúma", overall: 68, budget: 4000000 },
                    { id: 108, name: "Cruzeiro", overall: 74, budget: 14000000 },
                    { id: 109, name: "Cuiabá", overall: 71, budget: 6000000 },
                    { id: 110, name: "Flamengo", overall: 81, budget: 40000000 },
                    { id: 111, name: "Fluminense", overall: 78, budget: 20000000 },
                    { id: 112, name: "Fortaleza", overall: 75, budget: 13000000 },
                    { id: 113, name: "Grêmio", overall: 77, budget: 19000000 },
                    { id: 114, name: "Internacional", overall: 78, budget: 23000000 },
                    { id: 115, name: "Juventude", overall: 69, budget: 4500000 },
                    { id: 116, name: "Palmeiras", overall: 82, budget: 45000000 },
                    { id: 117, name: "Red Bull Bragantino", overall: 76, budget: 17000000 },
                    { id: 118, name: "São Paulo", overall: 79, budget: 28000000 },
                    { id: 119, name: "Vasco da Gama", overall: 73, budget: 16000000 },
                    { id: 120, name: "Vitória", overall: 70, budget: 7000000 },
                ]
            },
            {
                id: "bra_b",
                name: "Brasileirão Série B",
                country: "Brasil",
                division: 2,
                teams: [
                    // Adicionaremos os times da Série B no próximo passo
                ]
            }
            // Outras ligas serão adicionadas aqui
        ]
        // Os jogadores serão adicionados aqui posteriormente
    };

    const mainContent = document.getElementById('main-content');

    // --- FUNÇÕES DE LÓGICA DO JOGO ---

    function showMainMenu() {
        mainContent.innerHTML = `
            <div class="button-container">
                <button id="new-game-existing-club" class="button">Treinar um Clube Existente</button>
                <button id="new-game-create-club" class="button">Criar um Novo Clube</button>
            </div>
        `;

        document.getElementById('new-game-existing-club').addEventListener('click', () => {
            selectLeagueScreen();
        });

        document.getElementById('new-game-create-club').addEventListener('click', () => {
            alert("Modo 'Criar um Novo Clube' em desenvolvimento!");
        });
    }

    function selectLeagueScreen() {
        let leagueButtonsHTML = database.leagues.map(league => {
            return `<button class="button" data-league-id="${league.id}">${league.name}</button>`;
        }).join('');

        mainContent.innerHTML = `
            <h2>Selecione uma Liga</h2>
            <div class="button-container">
                ${leagueButtonsHTML}
                <button id="back-to-main" class="button">Voltar</button>
            </div>
        `;
        
        document.querySelectorAll('[data-league-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const leagueId = e.target.getAttribute('data-league-id');
                selectTeamScreen(leagueId);
            });
        });

        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }
    
    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        if (!league) {
            alert('Liga não encontrada!');
            showMainMenu();
            return;
        }

        let teamButtonsHTML = league.teams.map(team => {
            return `<button class="button" data-team-id="${team.id}">${team.name} (Overall: ${team.overall})</button>`;
        }).join('');

        mainContent.innerHTML = `
            <h2>Selecione um Time de ${league.name}</h2>
            <div class="button-container">
                ${teamButtonsHTML}
                <button id="back-to-leagues" class="button">Voltar</button>
            </div>
        `;

        document.querySelectorAll('[data-team-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const teamId = parseInt(e.target.getAttribute('data-team-id'));
                alert(`Você selecionou o time com ID: ${teamId}. O painel do clube será implementado aqui!`);
                // Futuramente, aqui chamaremos a função que inicia o jogo com o time selecionado
            });
        });

        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }


    // --- INICIALIZAÇÃO DO JOGO ---
    showMainMenu();

});