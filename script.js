function salvarRegistro() {
    const entrada = document.getElementById("entrada").value;
    const almocoEntrada = document.getElementById("almocoEntrada").value;
    const almocoSaida = document.getElementById("almocoSaida").value;
    const saida = document.getElementById("saida").value;
    if (!entrada || !saida) return;

    if (!validarHorarios(entrada, almocoEntrada, almocoSaida, saida)) {
        return;
    }


    const hoje = new Date();
    const data = hoje.toLocaleDateString("pt-BR");
    const diaSemana = hoje.toLocaleDateString("pt-BR", { weekday: "long" });
    const mesAno = hoje.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");

    const novoRegistro = { data, diaSemana, entrada, almocoEntrada, almocoSaida, saida };
    let registros = JSON.parse(localStorage.getItem(`registros-${mesAno}`)) || [];
    registros.push(novoRegistro);
    localStorage.setItem(`registros-${mesAno}`, JSON.stringify(registros));
    carregarRegistros();

    // Limpar os campos de input após salvar
    document.getElementById("entrada").value = "";
    document.getElementById("almocoEntrada").value = "";
    document.getElementById("almocoSaida").value = "";
    document.getElementById("saida").value = "";
}

function calcularHorasTrabalhadas(entrada, almocoEntrada, almocoSaida, saida) {
    const entradaTime = new Date(`1970-01-01T${entrada}`);
    const almocoEntradaTime = new Date(`1970-01-01T${almocoEntrada}`);
    const almocoSaidaTime = new Date(`1970-01-01T${almocoSaida}`);
    const saidaTime = new Date(`1970-01-01T${saida}`);

    const horasManha = (almocoEntradaTime - entradaTime) / (1000 * 60 * 60);
    const horasTarde = (saidaTime - almocoSaidaTime) / (1000 * 60 * 60);
    const totalHoras = horasManha + horasTarde;

    return totalHoras.toFixed(2); // Retorna o total com 2 casas decimais
}

function carregarRegistros() {
    const tabela = document.querySelector("#registros-tabela tbody");
    tabela.innerHTML = "";

    const hoje = new Date();
    const mesAno = hoje.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
    let registros = JSON.parse(localStorage.getItem(`registros-${mesAno}`)) || [];

    registros.forEach((reg, index) => {
        let row = tabela.insertRow();
        row.insertCell(0).textContent = reg.data;
        row.insertCell(1).textContent = reg.diaSemana;
        row.insertCell(2).textContent = reg.entrada;
        row.insertCell(3).textContent = reg.almocoEntrada;
        row.insertCell(4).textContent = reg.almocoSaida;
        row.insertCell(5).textContent = reg.saida;

        // Adicionar coluna de horas trabalhadas
        const horasTrabalhadas = calcularHorasTrabalhadas(reg.entrada, reg.almocoEntrada, reg.almocoSaida, reg.saida);
        row.insertCell(6).textContent = horasTrabalhadas;

        // Botão de edição
        let cellAcoes = row.insertCell(7);
        let btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => editarRegistro(index);
        cellAcoes.appendChild(btnEditar);
    });
}

function editarRegistro(index) {
    const hoje = new Date();
    const mesAno = hoje.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
    let registros = JSON.parse(localStorage.getItem(`registros-${mesAno}`)) || [];
    let reg = registros[index];

    // Preencher os campos do formulário
    document.getElementById("entrada").value = reg.entrada;
    document.getElementById("almocoEntrada").value = reg.almocoEntrada;
    document.getElementById("almocoSaida").value = reg.almocoSaida;
    document.getElementById("saida").value = reg.saida;

    // Remover o registro antigo
    registros.splice(index, 1);
    localStorage.setItem(`registros-${mesAno}`, JSON.stringify(registros));

    // Atualizar a lista de registros
    carregarRegistros();
}

function exportarCSV() {
    const hoje = new Date();
    const mesAno = hoje.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
    let registros = JSON.parse(localStorage.getItem(`registros-${mesAno}`)) || [];

    if (registros.length === 0) {
        alert("Nenhum registro para exportar.");
        return;
    }

    // Criar o cabeçalho do CSV
    let csv = "Data,Dia da Semana,Entrada,Entrada Almoço,Saída Almoço,Saída\n";

    // Adicionar cada registro
    registros.forEach(reg => {
        csv += `${reg.data},${reg.diaSemana},${reg.entrada},${reg.almocoEntrada},${reg.almocoSaida},${reg.saida}\n`;
    });

    // Criar um blob e baixar o arquivo
    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = `registros-${mesAno}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function limparRegistros() {
    if (confirm("Tem certeza que deseja apagar todos os registros do mês atual?")) {
        const hoje = new Date();
        const mesAno = hoje.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
        localStorage.removeItem(`registros-${mesAno}`);
        carregarRegistros(); // Atualiza a tabela após limpar os registros
    }
}
function validarHorarios(entrada, almocoEntrada, almocoSaida, saida) {
    const entradaTime = new Date(`1970-01-01T${entrada}`);
    const almocoEntradaTime = new Date(`1970-01-01T${almocoEntrada}`);
    const almocoSaidaTime = new Date(`1970-01-01T${almocoSaida}`);
    const saidaTime = new Date(`1970-01-01T${saida}`);

    if (entradaTime >= saidaTime) {
        alert("A entrada deve ser antes da saída.");
        return false;
    }
    if (almocoEntrada && almocoSaida && (almocoEntradaTime <= entradaTime || almocoSaidaTime >= saidaTime)) {
        alert("O horário de almoço deve estar entre a entrada e a saída.");
        return false;
    }
    return true;
}



// Carregar registros ao iniciar a página
carregarRegistros();