const API_URL = 'http://localhost:3000/descarte';

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');

    const btnIndex = Array.from(document.querySelectorAll('.tab-content')).findIndex(el => el.id === tabId);
    document.querySelectorAll('.nav-btn')[btnIndex].classList.add('active');

    if (tabId === 'tab-registro-descarte') carregarPontosDropdown();
    if (tabId === 'tab-relatorio') carregarRelatorio();
}

document.getElementById('form-ponto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const categorias = [];
    document.querySelectorAll('input[name="categorias"]:checked').forEach(cb => {
        categorias.push(cb.value);
    });

    const payload = {
        name: formData.get('name'),
        bairro: formData.get('bairro'),
        snPublico: formData.get('snPublico') === 'on',
        latitude: Number(formData.get('latitude')),
        longitude: Number(formData.get('longitude')),
        categoriaItemsAceitos: categorias
    };

    try {
        const res = await fetch(`${API_URL}/ponto-descarte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Ponto cadastrado com sucesso!');
            e.target.reset();
        } else {
            showToast('Erro ao cadastrar ponto.');
        }
    } catch (error) {
        console.error(error);
        showToast('Erro de conexão.');
    }
});

async function carregarPontosDropdown() {
    const select = document.getElementById('select-pontos');
    select.innerHTML = '<option value="">Carregando...</option>';

    try {
        const res = await fetch(`${API_URL}/pontos`);
        const pontos = await res.json();

        select.innerHTML = '<option value="">Selecione um ponto</option>';
        pontos.forEach(ponto => {
            const option = document.createElement('option');
            option.value = ponto.id;
            option.textContent = `${ponto.name} (${ponto.bairro})`;
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar (verifique backend)</option>';
        console.error('Precisa da rota GET /pontos no backend', error);
    }
}

document.getElementById('form-descarte').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const payload = {
        nomeUsuario: formData.get('nomeUsuario'),
        idPontoDescarte: formData.get('idPontoDescarte'),
        tipoResiduo: formData.get('tipoResiduo'),
        dataDescarte: new Date(formData.get('dataDescarte')).toISOString() // Envia formato ISO
    };

    try {
        const res = await fetch(`${API_URL}/registro-descarte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Descarte registrado!');
            e.target.reset();
        } else {
            showToast('Erro ao registrar.');
        }
    } catch (error) {
        showToast('Erro de conexão.');
    }
});

async function buscarHistorico() {
    const termo = document.getElementById('busca-input').value;
    const tbody = document.querySelector('#tabela-historico tbody');
    tbody.innerHTML = '<tr><td colspan="4">Buscando...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/busca-filtro?keyword=${encodeURIComponent(termo)}`);
        const dados = await res.json();

        tbody.innerHTML = '';
        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Nenhum registro encontrado.</td></tr>';
            return;
        }

        dados.forEach(item => {
            const dataF = new Date(item.dataDescarte).toLocaleDateString('pt-BR');

            const row = `
                <tr>
                    <td>${dataF}</td>
                    <td>${item.nomeUsuario}</td>
                    <td>${item.tipoResiduo}</td>
                    <td><small>${item.idPontoDescarte}</small></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4">Erro na busca.</td></tr>';
    }
}

async function carregarRelatorio() {
    try {
        const res = await fetch(`${API_URL}/relatorio`);
        const data = await res.json();

        document.getElementById('rel-usuarios').innerText = data.totalUsuarios;
        document.getElementById('rel-pontos').innerText = data.totalPontos;
        document.getElementById('rel-media').innerText = data.mediaDiariaUltimos30Dias;
        document.getElementById('rel-crescimento').innerText = data.comparativoMensal.percentualCrescimento;

        const elCresc = document.getElementById('rel-crescimento');
        if (data.comparativoMensal.percentualCrescimento.includes('+')) {
            elCresc.style.color = 'green';
        } else {
            elCresc.style.color = 'red';
        }

        document.getElementById('rel-pop-ponto').innerText = data.pontoMaisPopular ? data.pontoMaisPopular.name : 'N/A';
        document.getElementById('rel-pop-residuo').innerText = data.residuoMaisFrequente ? data.residuoMaisFrequente.tipo : 'N/A';

    } catch (error) {
        console.error("Erro ao carregar relatório", error);
    }
}

function showToast(msg) {
    const x = document.getElementById("toast");
    x.innerText = msg;
    x.className = "toast show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}