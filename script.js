import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import {
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOJitMoSPQtWiYIXsy1T4v814tRLhnS-M",
  authDomain: "aplicativo-registra-horas.firebaseapp.com",
  projectId: "aplicativo-registra-horas",
  storageBucket: "aplicativo-registra-horas.firebasestorage.app",
  messagingSenderId: "509122969210",
  appId: "1:509122969210:web:273660fcb9fd30df04c5c3",
  measurementId: "G-HL98RX8XBG",
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para salvar registros no Firestore
async function salvarRegistro() {
    const dataRegistro = document.getElementById("dataRegistro").value;
    const entrada = document.getElementById("entrada").value;
    const almocoEntrada = document.getElementById("almocoEntrada").value;
    const almocoSaida = document.getElementById("almocoSaida").value;
    const saida = document.getElementById("saida").value;
    
    if (!dataRegistro || !entrada || !saida) return;

    if (!validarHorarios(entrada, almocoEntrada, almocoSaida, saida)) {
        return;
    }

    // Converter manualmente o formato da data para garantir precisão
    const partesData = dataRegistro.split("-"); // Divide em [YYYY, MM, DD]
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`; // DD/MM/YYYY
    const diaSemana = new Date(`${dataRegistro}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });

    // Criar timestamp corretamente sem fuso horário afetando a data
    const timestamp = new Date(`${dataRegistro}T00:00:00`).getTime();

    const novoRegistro = {
        data: dataFormatada,
        diaSemana,
        entrada,
        almocoEntrada,
        almocoSaida,
        saida,
        timestamp
    };

    try {
        await addDoc(collection(db, "registros"), novoRegistro);
        carregarRegistros();
    } catch (error) {
        console.error("Erro ao salvar registro: ", error);
    }

    document.getElementById("dataRegistro").value = "";
    document.getElementById("entrada").value = "";
    document.getElementById("almocoEntrada").value = "";
    document.getElementById("almocoSaida").value = "";
    document.getElementById("saida").value = "";
}



// Função para carregar registros do Firestore
async function carregarRegistros() {
    const tabela = document.querySelector("#registros-tabela tbody");
    tabela.innerHTML = "";

    try {
        const q = query(collection(db, "registros"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const reg = doc.data();
            let row = tabela.insertRow();
            row.insertCell(0).textContent = reg.data;
            row.insertCell(1).textContent = reg.diaSemana;
            row.insertCell(2).textContent = reg.entrada;
            row.insertCell(3).textContent = reg.almocoEntrada || "-";
            row.insertCell(4).textContent = reg.almocoSaida || "-";
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

            // Botão de exclusão
            let btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = () => excluirRegistro(doc.id);
            cellAcoes.appendChild(btnExcluir);
        });
    } catch (error) {
        console.error("Erro ao carregar registros: ", error);
    }
}

async function excluirRegistro(id) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    try {
      await deleteDoc(doc(db, "registros", id));
      carregarRegistros(); // Atualiza a tabela após a exclusão
      alert("Registro excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir registro: ", error);
    }
  }
}

// Função para editar registros
async function editarRegistro(id) {
    try {
        const docRef = doc(db, "registros", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const reg = docSnap.data();

            // Converter data para o formato YYYY-MM-DD (aceito pelo input type="date")
            const partesData = reg.data.split("/");
            const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            document.getElementById("dataRegistro").value = dataFormatada;
            document.getElementById("entrada").value = reg.entrada;
            document.getElementById("almocoEntrada").value = reg.almocoEntrada;
            document.getElementById("almocoSaida").value = reg.almocoSaida;
            document.getElementById("saida").value = reg.saida;

            // Alterar o botão "Salvar" para "Atualizar"
            const btnSalvar = document.querySelector("#form-registro button");
            btnSalvar.textContent = "Atualizar";
            btnSalvar.onclick = () => atualizarRegistro(id);
        } else {
            alert("Registro não encontrado!");
        }
    } catch (error) {
        console.error("Erro ao buscar registro: ", error);
    }
}


// Função para atualizar registros
async function atualizarRegistro(id) {
    const dataRegistro = document.getElementById("dataRegistro").value;
    const entrada = document.getElementById("entrada").value;
    const almocoEntrada = document.getElementById("almocoEntrada").value;
    const almocoSaida = document.getElementById("almocoSaida").value;
    const saida = document.getElementById("saida").value;

    if (!dataRegistro || !entrada || !saida) return;

    if (!validarHorarios(entrada, almocoEntrada, almocoSaida, saida)) {
        return;
    }

    // Converter a data para o formato correto DD/MM/YYYY
    const partesData = dataRegistro.split("-"); // Divide em [YYYY, MM, DD]
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`; // DD/MM/YYYY
    const diaSemana = new Date(`${dataRegistro}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });

    // Criar timestamp corretamente sem erro de fuso horário
    const timestamp = new Date(`${dataRegistro}T00:00:00`).getTime();

    const registroAtualizado = {
        data: dataFormatada,
        diaSemana,
        entrada,
        almocoEntrada,
        almocoSaida,
        saida,
        timestamp
    };

    try {
        await updateDoc(doc(db, "registros", id), registroAtualizado);
        alert("Registro atualizado com sucesso!");
        carregarRegistros();

        // Restaura o botão "Salvar"
        const btnSalvar = document.querySelector("#form-registro button");
        btnSalvar.textContent = "Salvar";
        btnSalvar.onclick = salvarRegistro;
    } catch (error) {
        console.error("Erro ao atualizar registro: ", error);
    }
}



// Função para exportar registros em CSV
async function exportarCSV() {
  try {
    const querySnapshot = await getDocs(collection(db, "registros"));
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
  } catch (error) {
    console.error("Erro ao exportar CSV: ", error);
  }
}

// Função para limpar registros
async function limparRegistros() {
  if (confirm("Tem certeza que deseja apagar todos os registros?")) {
    try {
      const querySnapshot = await getDocs(collection(db, "registros"));
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      alert("Todos os registros foram apagados.");
      carregarRegistros();
    } catch (error) {
      console.error("Erro ao limpar registros: ", error);
    }
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
  if (
    almocoEntrada &&
    almocoSaida &&
    (almocoEntradaTime <= entradaTime || almocoSaidaTime >= saidaTime)
  ) {
    alert("O horário de almoço deve estar entre a entrada e a saída.");
    return false;
  }
  return true;
}

// Expor as funções no escopo global
window.salvarRegistro = salvarRegistro;
window.exportarCSV = exportarCSV;
window.limparRegistros = limparRegistros;
window.editarRegistro = editarRegistro;
window.excluirRegistro = excluirRegistro;
// Carregar registros ao iniciar a página
carregarRegistros();

// Configura o botão "Salvar" inicialmente
document.querySelector("#form-registro button").onclick = salvarRegistro;
document.addEventListener("DOMContentLoaded", () => {
    const tabela = document.getElementById("registros-tabela");
    const btnToggle = document.getElementById("toggle-registros");

    btnToggle.addEventListener("click", () => {
        if (tabela.style.display === "none") {
            tabela.style.display = "table";
            btnToggle.textContent = "Esconder Registros";
        } else {
            tabela.style.display = "none";
            btnToggle.textContent = "Mostrar Registros";
        }
    });
});
