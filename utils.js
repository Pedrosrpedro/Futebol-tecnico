// --- Funções Utilitárias Gerais ---
// Este arquivo contém funções reutilizáveis que não modificam diretamente o gameState,
// mas auxiliam na manipulação de dados e formatação.

function isSameDay(date1, date2) {
    // Verifica se duas datas são o mesmo dia (ignorando hora, minuto, segundo).
    if(!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function findTeamInLeagues(teamName, isPlayerLookup = false) {
    // Procura por um jogador específico pelo nome em todos os times de todas as ligas.
    // Retorna o objeto jogador se isPlayerLookup for true.
    // Caso contrário, procura por um time.
    if (!teamName) return null;
    if (isPlayerLookup) {
         for (const leagueId in leaguesData) {
            for (const team of leaguesData[leagueId].teams) {
                const player = team.players.find(p => p.name === teamName);
                if (player) return player;
            }
        }
    }
    // Procura por um time em todas as ligas.
    for (const leagueId in leaguesData) {
        const team = leaguesData[leagueId].teams.find(t => t.name === teamName);
        if (team) return team;
    }
    return null;
}

function parseMarketValue(valueStr) {
    // Converte strings de valor de mercado (ex: "1.2M", "500K") para números.
    if (typeof valueStr !== 'string') return valueStr; // Se já for número, retorna
    const value = valueStr.replace('€', '').trim(); // Remove Euro symbol if present
    let multiplier = 1;
    let numberPartStr = value;

    if (value.slice(-1).toLowerCase() === 'm') {
        multiplier = 1000000;
        numberPartStr = value.slice(0, -1);
    } else if (value.slice(-1).toLowerCase() === 'k') {
        multiplier = 1000;
        numberPartStr = value.slice(0, -1);
    }

    const numberPart = parseFloat(numberPartStr.replace(',', '.')); // Handle comma as decimal separator
    if (isNaN(numberPart)) return 0;

    return numberPart * multiplier;
}

function formatCurrency(valueInBRL) {
    // Formata um valor numérico em BRL para a moeda selecionada pelo usuário.
    if (typeof valueInBRL !== 'number') return 'N/A';
    const rate = currencyRates[gameState.currency];
    const convertedValue = valueInBRL / rate;

    if (Math.abs(convertedValue) >= 1000000) {
        // Formata em milhões (M)
        const valueInMillions = (convertedValue / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(',0', '');
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency }).format(0).replace('0,00', '') + valueInMillions + 'M';
    } else if (Math.abs(convertedValue) >= 1000) {
        // Formata em milhares (k)
        const valueInThousands = Math.round(convertedValue / 1000).toLocaleString('pt-BR');
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency }).format(0).replace('0,00', '') + valueInThousands + 'k';
    }

    // Formata valor normal (sem casas decimais para inteiros, com para decimais)
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: gameState.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertedValue);
}

function formatContract(months) {
    // Formata o número de meses de contrato para uma string legível (ex: "2 anos e 6 meses").
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
