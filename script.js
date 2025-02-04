// Remova estas linhas
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBOJitMoSPQtWiYIXsy1T4v814tRLhnS-M",
    authDomain: "aplicativo-registra-horas.firebaseapp.com",
    projectId: "aplicativo-registra-horas",
    storageBucket: "aplicativo-registra-horas.firebasestorage.app",
    messagingSenderId: "509122969210",
    appId: "1:509122969210:web:273660fcb9fd30df04c5c3",
    measurementId: "G-HL98RX8XBG"
};

// Inicialize o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

    const novoRegistro = { data, diaSemana, entrada, almocoEntrada, almocoSaida, saida };

    // Salva no Firestore
    db.collection("registros").add(novoRegistro)
        .then(() => {
            alert("Registro salvo com sucesso!");
            carregarRegistros();
        })
        .catch((error) => {
            console.error("Erro ao salvar registro: ", error);
        });

    // Limpar os campos de input após salvar
    document.getElementById("entrada").value = "";
    document.getElementById("almocoEntrada").value = "";
    document.getElementById("almocoSaida").value = "";
    document.getElementById("saida").value = "";
}

// Função para carregar registros do Firestore
function carregarRegistros() {
    const tabela = document.querySelector("#registros-tabela tbody");
    tabela.innerHTML = "";

    db.collection("registros").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const reg = doc.data();
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
                btnEditar.onclick = () => editarRegistro(doc.id);
                cellAcoes.appendChild(btnEditar);
            });
        })
        .catch((error) => {
            console.error("Erro ao carregar registros: ", error);
        });
}

// Função para editar registros
function editarRegistro(id) {
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

    const registroAtualizado = { data, diaSemana, entrada, almocoEntrada, almocoSaida, saida };

    // Atualiza o registro no Firestore
    db.collection("registros").doc(id).update(registroAtualizado)
        .then(() => {
            alert("Registro atualizado com sucesso!");
            carregarRegistros();
        })
        .catch((error) => {
            console.error("Erro ao atualizar registro: ", error);
        });
}

// Função para exportar registros em CSV
function exportarCSV() {
    db.collection("registros").get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert("Nenhum registro para exportar.");
                return;
            }

            // Criar o cabeçalho do CSV
            let csv = "Data,Dia da Semana,Entrada,Entrada Almoço,Saída Almoço,Saída\n";

            // Adicionar cada registro
            querySnapshot.forEach((doc) => {
                const reg = doc.data();
                csv += `${reg.data},${reg.diaSemana},${reg.entrada},${reg.almocoEntrada},${reg.almocoSaida},${reg.saida}\n`;
            });

            // Criar um blob e baixar o arquivo
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "registros.csv";
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch((error) => {
            console.error("Erro ao exportar CSV: ", error);
        });
}

// Função para limpar registros
function limparRegistros() {
    if (confirm("Tem certeza que deseja apagar todos os registros?")) {
        db.collection("registros").get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref.delete();
                });
                alert("Todos os registros foram apagados.");
                carregarRegistros();
            })
            .catch((error) => {
                console.error("Erro ao limpar registros: ", error);
            });
    }
}

// Função para calcular horas trabalhadas
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

// Função para validar horários
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