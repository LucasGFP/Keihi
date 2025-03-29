document.addEventListener("DOMContentLoaded", function () {
  // Configuração inicial
  const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
  document.getElementById("data").valueAsDate = new Date();
  let graficoCategorias;

  // Funções auxiliares (mantidas iguais)
  const formatarData = (dataString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dataString).toLocaleDateString("pt-BR", options);
  };

  const formatarMoeda = (valor) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatarCategoria = (categoria) => {
    const categorias = {
      alimentacao: "Alimentação",
      moradia: "Moradia",
      transporte: "Transporte",
      lazer: "Lazer",
      saude: "Saúde",
      educacao: "Educação",
      salario: "Salário",
      investimentos: "Investimentos",
      outros: "Outros",
    };
    return categorias[categoria] || categoria;
  };

  // Atualiza a tabela, totais e gráficos
  const atualizarTabela = () => {
    const tbody = document.querySelector("#transacoes tbody");
    tbody.innerHTML = "";

    let totalEntradas = 0;
    let totalSaidas = 0;

    transacoes.forEach((transacao, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td>${formatarCategoria(transacao.categoria)}</td>
                <td class="${
                  transacao.tipo === "entrada"
                    ? "text-success fw-bold"
                    : "text-danger fw-bold"
                }">
                    ${formatarMoeda(transacao.valor)}
                </td>
                <td>
                    <span class="badge ${
                      transacao.tipo === "entrada" ? "bg-success" : "bg-danger"
                    }">
                        ${transacao.tipo === "entrada" ? "Entrada" : "Saída"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

      tbody.appendChild(row);

      if (transacao.tipo === "entrada") {
        totalEntradas += transacao.valor;
      } else {
        totalSaidas += transacao.valor;
      }
    });

    // Atualiza totais
    document.getElementById("total-entradas").textContent =
      formatarMoeda(totalEntradas);
    document.getElementById("total-saidas").textContent =
      formatarMoeda(totalSaidas);

    const saldo = totalEntradas - totalSaidas;
    const saldoElement = document.getElementById("saldo");
    saldoElement.textContent = formatarMoeda(saldo);
    saldoElement.className = `card-text fs-4 fw-bold ${
      saldo >= 0 ? "text-success" : "text-danger"
    }`;

    // Salva no localStorage
    localStorage.setItem("transacoes", JSON.stringify(transacoes));

    // Atualiza gráfico
    atualizarGrafico();

    // Adiciona eventos aos botões de excluir
    document.querySelectorAll(".btn-excluir").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.closest(".btn-excluir").dataset.id);
        excluirTransacao(index);
      });
    });
  };

  // Função para atualizar o gráfico
  const atualizarGrafico = () => {
    // Agrupa gastos por categoria (apenas saídas)
    const gastosPorCategoria = {};
    transacoes
      .filter((t) => t.tipo === "saida")
      .forEach((t) => {
        gastosPorCategoria[t.categoria] =
          (gastosPorCategoria[t.categoria] || 0) + t.valor;
      });

    const categorias = Object.keys(gastosPorCategoria).map(formatarCategoria);
    const valores = Object.values(gastosPorCategoria);

    // Cores para as categorias
    const cores = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8AC24A",
      "#F06292",
      "#7986CB",
      "#A1887F",
    ];

    // Obtém o contexto do canvas
    const ctx = document.getElementById("graficoCategorias").getContext("2d");

    // Se o gráfico já existe, atualiza os dados
    if (graficoCategorias) {
      graficoCategorias.data.labels = categorias;
      graficoCategorias.data.datasets[0].data = valores;
      graficoCategorias.update();
    } else {
      // Cria um novo gráfico
      graficoCategorias = new Chart(ctx, {
        type: "pie",
        data: {
          labels: categorias,
          datasets: [
            {
              data: valores,
              backgroundColor: cores,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${formatarMoeda(value)} (${percentage}%)`;
                },
              },
            },
            legend: {
              position: "right",
            },
          },
        },
      });
    }
  };

  // Adiciona nova transação (mantida igual)
  const adicionarTransacao = () => {
    const descricao = document.getElementById("descricao").value.trim();
    const valor = parseFloat(document.getElementById("valor").value);
    const tipo = document.getElementById("tipo").value;
    const data = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;

    if (!descricao || isNaN(valor) || !data) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    transacoes.push({
      descricao,
      valor,
      tipo,
      data,
      categoria,
    });

    // Limpa o formulário
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("data").valueAsDate = new Date();
    document.getElementById("descricao").focus();

    atualizarTabela();
  };

  // Exclui transação (mantida igual)
  const excluirTransacao = (index) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      transacoes.splice(index, 1);
      atualizarTabela();
    }
  };

  // Event Listeners (mantidos iguais)
  document
    .getElementById("adicionar")
    .addEventListener("click", adicionarTransacao);

  document
    .getElementById("form-transacao")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        adicionarTransacao();
      }
    });

  // Inicializa a tabela e o gráfico
  atualizarTabela();
});
