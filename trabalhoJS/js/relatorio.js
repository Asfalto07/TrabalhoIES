let usersChart;
let followersChart;
let currentUser = null;

// Função para carregar dados do usuário logado e criar os gráficos
async function loadUserData() {
    try {
        // Carregar usuário atual do servidor
        currentUser = await getCurrentUser();
        
        if (!currentUser) {
            console.error('Nenhum usuário logado');
            showNoDataMessage();
            return;
        }
        
        console.log('Usuário logado:', currentUser);
        
        // Processar dados para os gráficos
        const userCreationData = processUserCreationData(currentUser);
        const followersEvolution = processFollowersEvolution(currentUser);
        
        // Criar os gráficos
        createUserCreationChart(userCreationData);
        createFollowersEvolutionChart(followersEvolution);
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showNoDataMessage();
    }
}

// Função para processar data de criação do usuário
function processUserCreationData(user) {
    const creationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível';
    
    return {
        labels: [creationDate],
        data: [1],
        username: user.username
    };
}

// Função para processar evolução de seguidores do usuário logado
function processFollowersEvolution(user) {
    const allFollowersData = [];
    
    // Coletar todos os dados de seguidores de todas as contas
    if (user.contas && user.contas.length > 0) {
        user.contas.forEach(conta => {
            if (conta.followers && conta.followers.length > 0) {
                conta.followers.forEach(follower => {
                    allFollowersData.push({
                        data: new Date(follower.data),
                        numero: follower.numero,
                        platform: conta.platform,
                        username: conta.username
                    });
                });
            }
        });
    }
    
    console.log('Dados brutos coletados:', allFollowersData);
    
    // Ordenar por data (mais antiga primeiro)
    allFollowersData.sort((a, b) => a.data - b.data);
    
    console.log('Dados ordenados por data:', allFollowersData);
    
    // Agrupar por data - Pegar o valor real de cada data
    const groupedData = new Map();
    
    allFollowersData.forEach(item => {
        const dateKey = item.data.toLocaleDateString('pt-BR');
        
        if (!groupedData.has(dateKey)) {
            groupedData.set(dateKey, {
                total: item.numero,
                details: []
            });
        } else {
            // Se já existe uma entrada para esta data, manter o maior valor
            const existing = groupedData.get(dateKey);
            existing.total = Math.max(existing.total, item.numero);
        }
        
        const existing = groupedData.get(dateKey);
        existing.details.push({
            platform: item.platform,
            username: item.username,
            followers: item.numero
        });
    });
    
    console.log('Dados agrupados por data:', groupedData);
    
    // Converter para arrays ordenados
    const sortedEntries = Array.from(groupedData.entries()).sort((a, b) => {
        const dateA = parseDate(a[0]);
        const dateB = parseDate(b[0]);
        return dateA - dateB;
    });
    
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1].total);
    
    console.log('Dados finais processados:', { labels, data });
    
    // Se não houver dados, criar dados de exemplo
    if (labels.length === 0) {
        return {
            labels: ['Sem dados'],
            data: [0],
            hasData: false
        };
    }
    
    return {
        labels: labels,
        data: data,
        hasData: true
    };
}

// Função auxiliar para converter data brasileira para objeto Date
function parseDate(dateStr) {
    const parts = dateStr.split('/');
    // parts[0] = dia, parts[1] = mês, parts[2] = ano
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Função para criar o gráfico de criação do usuário
function createUserCreationChart(chartData) {
    const ctx = document.getElementById('usersChart');
    if (!ctx) {
        console.error('Canvas usersChart não encontrado');
        return;
    }
    
    // Destruir gráfico existente se houver
    if (usersChart) {
        usersChart.destroy();
    }
    
    usersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Data de Cadastro',
                data: chartData.data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 2,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value === 1 ? 'Usuário Cadastrado' : '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Status'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data de Cadastro'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Cadastro do Usuário: ${chartData.username}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Função para criar o gráfico de evolução de seguidores
function createFollowersEvolutionChart(chartData) {
    const ctx = document.getElementById('followersChart');
    if (!ctx) {
        console.error('Canvas followersChart não encontrado');
        return;
    }
    
    // Destruir gráfico existente se houver
    if (followersChart) {
        followersChart.destroy();
    }
    
    if (chartData.labels.length === 0 || chartData.labels[0] === 'Sem dados') {
        console.log('Nenhum dado de seguidores disponível');
        
        // Mostrar mensagem no canvas
        const canvasContext = ctx.getContext('2d');
        canvasContext.clearRect(0, 0, ctx.width, ctx.height);
        canvasContext.fillStyle = '#666';
        canvasContext.font = '16px Arial';
        canvasContext.textAlign = 'center';
        canvasContext.fillText('Nenhum dado de seguidores disponível', ctx.width / 2, ctx.height / 2);
        return;
    }
    
    console.log('Criando gráfico com dados:', chartData);
    
    followersChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Total de Seguidores',
                data: chartData.data,
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Seguidores',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatFollowers(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Evolução de Seguidores - ${currentUser.username}`,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `Data: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `Seguidores: ${formatFollowers(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Função para formatar números de seguidores
function formatFollowers(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString('pt-BR');
}

// Função para mostrar mensagem quando não há dados
function showNoDataMessage() {
    console.log('Mostrando mensagem de sem dados');
    
    // Criar gráfico vazio para dados do usuário
    const userCreationData = {
        labels: ['Sem dados'],
        data: [0],
        username: 'Usuário não encontrado'
    };
    createUserCreationChart(userCreationData);
    
    // Criar gráfico vazio para seguidores
    const followersData = {
        labels: [],
        data: [],
        hasData: false
    };
    createFollowersEvolutionChart(followersData);
}

// Carregar dados quando a página for carregada
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando gráficos...');
    setTimeout(() => {
        loadUserData();
    }, 100);
});

// Função para atualizar os gráficos
function refreshCharts() {
    console.log('Atualizando gráficos...');
    loadUserData();
}

// Função para adicionar novos dados de seguidores (simulação)
async function addFollowerData() {
    try {
        currentUser = await getCurrentUser();
        
        if (!currentUser || !currentUser.contas || currentUser.contas.length === 0) {
            alert('Nenhuma conta conectada para adicionar dados');
            return;
        }
        
        // Simular adição de novos dados
        const today = new Date().toISOString();
        
        currentUser.contas.forEach(conta => {
            if (conta.connected) {
                // Simular crescimento de seguidores (5% a 15% de aumento)
                const lastFollowers = conta.totalFollowers || 0;
                const growthRate = (Math.random() * 0.10) + 0.05; // 5% a 15%
                const newFollowers = Math.floor(lastFollowers * (1 + growthRate));
                
                // Adicionar novo registro
                if (!conta.followers) conta.followers = [];
                conta.followers.push({
                    data: today,
                    numero: newFollowers
                });
                
                conta.totalFollowers = newFollowers;
            }
        });
        
        // Salvar no servidor
        const response = await fetch(`http://localhost:3000/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentUser)
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar dados');
        }
        
        // Atualizar gráficos
        refreshCharts();
        
        alert('Dados de seguidores atualizados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao adicionar dados:', error);
        alert('Erro ao atualizar dados de seguidores');
    }
}