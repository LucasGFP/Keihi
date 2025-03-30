// ==============================================
// Sistema de Autenticação
// ==============================================

const authService = {
  getLoggedUser: () => JSON.parse(localStorage.getItem('keihi_logged_user')),
  setLoggedUser: (user) => localStorage.setItem('keihi_logged_user', JSON.stringify(user)),
  logout: () => {
      localStorage.removeItem('keihi_logged_user');
      window.location.href = 'login.html';
  },
  login: (email, password) => {
      const users = JSON.parse(localStorage.getItem('keihi_users')) || [];
      const user = users.find(u => u.email === email && u.senha === password);
      
      if (user) {
          localStorage.setItem('keihi_logged_user', JSON.stringify(user));
          return { success: true, user };
      }
      return { success: false, message: 'E-mail ou senha incorretos' };
  },
  register: (name, email, password, confirmPassword) => {
      const users = JSON.parse(localStorage.getItem('keihi_users')) || [];
      
      // Validações
      if (users.some(u => u.email === email)) {
          return { success: false, message: 'E-mail já cadastrado' };
      }
      
      if (password.length < 7) {
          return { success: false, message: 'A senha deve ter no mínimo 7 caracteres' };
      }
      
      if (!/\d/.test(password)) {
          return { success: false, message: 'A senha deve conter números' };
      }
      
      if (password !== confirmPassword) {
          return { success: false, message: 'As senhas não coincidem' };
      }

      const newUser = {
          id: Date.now(),
          nome: name,
          email,
          senha: password,
          transacoes: []
      };

      users.push(newUser);
      localStorage.setItem('keihi_users', JSON.stringify(users));
      return { success: true, message: 'Cadastro realizado com sucesso!' };
  },
  
  // Função auxiliar para validar a força da senha
  validatePassword: (password) => {
      const errors = [];
      
      if (password.length < 7) {
          errors.push('A senha deve ter no mínimo 7 caracteres');
      }
      
      if (!/\d/.test(password)) {
          errors.push('A senha deve conter números');
      }
      
      return {
          isValid: errors.length === 0,
          errors: errors
      };
  }
};

// ==============================================
// Gerenciamento de Transações
// ==============================================

const transactionService = {
  getTransactions: () => {
      const user = authService.getLoggedUser();
      return user ? user.transacoes || [] : [];
  },
  addTransaction: (transaction) => {
      const user = authService.getLoggedUser();
      if (!user) return false;

      if (!user.transacoes) user.transacoes = [];
      user.transacoes.push({
          id: Date.now(),
          ...transaction
      });

      // Atualiza o usuário no localStorage
      authService.setLoggedUser(user);
      
      // Atualiza na lista de usuários
      const users = JSON.parse(localStorage.getItem('keihi_users')) || [];
      const index = users.findIndex(u => u.email === user.email);
      if (index !== -1) {
          users[index] = user;
          localStorage.setItem('keihi_users', JSON.stringify(users));
      }

      return true;
  },
  // No transactionService, atualize a função deleteTransaction
deleteTransaction: (transactionId) => {
  const user = authService.getLoggedUser();
  if (!user || !user.transacoes) return false;

  // Converter transactionId para número (pois vem como string do HTML)
  transactionId = Number(transactionId);
  
  user.transacoes = user.transacoes.filter(t => t.id !== transactionId);
  authService.setLoggedUser(user);

  // Atualiza na lista de usuários
  const users = JSON.parse(localStorage.getItem('keihi_users')) || [];
  const index = users.findIndex(u => u.email === user.email);
  if (index !== -1) {
      users[index] = user;
      localStorage.setItem('keihi_users', JSON.stringify(users));
  }

  return true;
}
};

// ==============================================
// Utilitários
// ==============================================

const utils = {
  formatDate: (dateString) => {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('pt-BR', options);
  },
  formatCurrency: (value) => {
      return value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2
      });
  },
  formatCategory: (category) => {
      const categories = {
          alimentacao: 'Alimentação',
          moradia: 'Moradia',
          transporte: 'Transporte',
          lazer: 'Lazer',
          saude: 'Saúde',
          educacao: 'Educação',
          salario: 'Salário',
          investimentos: 'Investimentos',
          outros: 'Outros'
      };
      return categories[category] || category;
  }
};

// ==============================================
// Controle de Interface
// ==============================================

const uiController = {
  init: function() {
      this.checkAuth();
      this.setupEventListeners();
      this.displayWelcomeMessage();
      
      if (document.getElementById('transacoes')) {
          this.updateUI();
      }
  },
  displayWelcomeMessage: function() {
    const user = authService.getLoggedUser();
    if (user && user.nome) {
      document.getElementById('welcome-message').textContent = `Bem-vindo(a), ${user.nome}!`;
    }
  },
  
  checkAuth: function() {
      const currentPage = window.location.pathname.split('/').pop();
      const protectedPages = ['index.html', 'site.html'];
      const publicPages = ['login.html', 'cadastro.html'];
      
      const user = authService.getLoggedUser();
      
      // Redirecionar se tentar acessar área protegida sem login
      if (!user && protectedPages.includes(currentPage)) {
          window.location.href = 'login.html';
          return false;
      }
      
      // Redirecionar se tentar acessar login/cadastro já logado
      if (user && publicPages.includes(currentPage)) {
          window.location.href = 'index.html';
          return false;
      }
      
      return true;
  },
  
  setupEventListeners: function() {
      // Login
      if (document.getElementById('form-login')) {
          document.getElementById('form-login').addEventListener('submit', (e) => {
              e.preventDefault();
              const email = document.getElementById('email').value;
              const senha = document.getElementById('senha').value;
              
              const result = authService.login(email, senha);
              if (result.success) {
                  window.location.href = 'index.html';
              } else {
                  alert(result.message);
              }
          });
      }
      
      // Cadastro
      // No setupEventListeners:
        if (document.getElementById('form-cadastro')) {
          document.getElementById('form-cadastro').addEventListener('submit', (e) => {
              e.preventDefault();
              const nome = document.getElementById('nome').value;
              const email = document.getElementById('email-cadastro').value;
              const senha = document.getElementById('senha-cadastro').value;
              const confirmarSenha = document.getElementById('confirmar-senha').value;
              
              // Validação em tempo real (opcional)
              const validation = authService.validatePassword(senha);
              if (!validation.isValid) {
                  alert(validation.errors.join('\n'));
                  return;
              }
              
              const result = authService.register(nome, email, senha, confirmarSenha);
              alert(result.message);
              if (result.success) {
                  window.location.href = 'login.html';
              }
          });
        }
      
      // Adicionar transação
      if (document.getElementById('form-transacao')) {
          document.getElementById('adicionar').addEventListener('click', () => this.addTransaction());
          
          document.getElementById('form-transacao').addEventListener('submit', (e) => {
              e.preventDefault();
              this.addTransaction();
          });
      }
      
      // Logout
      if (document.getElementById('btn-logout')) {
          document.getElementById('btn-logout').addEventListener('click', authService.logout);
      }
  },
  
  addTransaction: function() {
      const getElement = (id) => document.getElementById(id);
      
      const transaction = {
          descricao: getElement('descricao').value.trim(),
          valor: parseFloat(getElement('valor').value),
          tipo: getElement('tipo').value,
          data: getElement('data').value,
          categoria: getElement('categoria').value
      };
      
      // Validações
      if (!transaction.descricao) {
          alert('Por favor, insira uma descrição!');
          getElement('descricao').focus();
          return;
      }
      
      if (isNaN(transaction.valor)) {
          alert('Por favor, insira um valor válido!');
          getElement('valor').focus();
          return;
      }
      
      if (!transaction.data) {
          alert('Por favor, selecione uma data!');
          return;
      }
      
      if (transactionService.addTransaction(transaction)) {
          // Limpar formulário
          getElement('descricao').value = '';
          getElement('valor').value = '';
          getElement('data').valueAsDate = new Date();
          getElement('descricao').focus();
          
          // Atualizar interface
          this.updateUI();
          
          // Feedback visual
          const feedback = document.createElement('div');
            feedback.className = 'alert alert-success mt-3'; // Sempre verde
            feedback.innerHTML = `<i class="fas fa-check-circle"></i>
            Transação ${transaction.tipo === 'entrada' ? 'de entrada' : 'de saída'} adicionada com sucesso!`;
          document.getElementById('form-transacao').appendChild(feedback);
          
          setTimeout(() => feedback.remove(), 3000);
      } else {
          alert('Erro ao adicionar transação!');
      }
  },
  
  updateUI: function() {
      this.updateTransactionsTable();
      this.updateSummaryCards();
      this.updateChart();
  },
  
  updateTransactionsTable: function() {
      const transactions = transactionService.getTransactions();
      const tbody = document.querySelector('#transacoes tbody');
      tbody.innerHTML = '';
      
      transactions.forEach(transaction => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${utils.formatDate(transaction.data)}</td>
              <td>${transaction.descricao}</td>
              <td>${utils.formatCategory(transaction.categoria)}</td>
              <td class="${transaction.tipo === 'entrada' ? 'text-success' : 'text-danger'}">
                  ${utils.formatCurrency(transaction.valor)}
              </td>
              <td>
                  <span class="badge ${transaction.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}">
                      ${transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
              </td>
              <td>
                  <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${transaction.id}">
                      <i class="fas fa-trash-alt"></i>
                  </button>
              </td>
          `;
          tbody.appendChild(row);
      });
      
      // Adicionar eventos de exclusão
      document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const transactionId = e.currentTarget.getAttribute('data-id');
            if (confirm('Tem certeza que deseja excluir esta transação?')) {
                if (transactionService.deleteTransaction(transactionId)) {
                    this.updateUI();
                    alert('Transação removida com sucesso!');
                } else {
                    alert('Erro ao remover transação!');
                }
            }
        });
    });
  },
  
  updateSummaryCards: function() {
      const transactions = transactionService.getTransactions();
      
      let income = 0;
      let expense = 0;
      
      transactions.forEach(t => {
          if (t.tipo === 'entrada') {
              income += t.valor;
          } else {
              expense += t.valor;
          }
      });
      
      document.getElementById('total-entradas').textContent = utils.formatCurrency(income);
      document.getElementById('total-saidas').textContent = utils.formatCurrency(expense);
      
      const balance = income - expense;
      const balanceElement = document.getElementById('saldo');
      balanceElement.textContent = utils.formatCurrency(balance);
      balanceElement.className = `card-text fs-4 fw-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`;
  },
  
  updateChart: function() {
      const transactions = transactionService.getTransactions();
      const ctx = document.getElementById('graficoCategorias')?.getContext('2d');
      if (!ctx) return;
      
      // Destruir gráfico anterior se existir
      if (window.chartInstance) {
          window.chartInstance.destroy();
      }
      
      // Processar dados (apenas saídas)
      const categories = {};
      transactions
          .filter(t => t.tipo === 'saida')
          .forEach(t => {
              categories[t.categoria] = (categories[t.categoria] || 0) + t.valor;
          });
      
      // Criar novo gráfico
      window.chartInstance = new Chart(ctx, {
          type: 'pie',
          data: {
              labels: Object.keys(categories).map(utils.formatCategory),
              datasets: [{
                  data: Object.values(categories),
                  backgroundColor: [
                      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                      '#FF9F40', '#8AC24A', '#F06292', '#7986CB', '#A1887F'
                  ],
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 12,
                        font: {
                            size: 10  // Tamanho menor para as legendas
                        }
                    }
                  },
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percent = Math.round((value / total) * 100);
                              return `${label}: ${utils.formatCurrency(value)} (${percent}%)`;
                          }
                      }
                  }
              }
          }
      });
  }
};

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => uiController.init());

// Configurar data padrão no formulário
if (document.getElementById('data')) {
  document.getElementById('data').valueAsDate = new Date();
}