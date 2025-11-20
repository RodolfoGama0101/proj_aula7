import { Injectable } from '@nestjs/common';
import { PontoDescarteDto } from './dtos/ponto-descarte.dto';
import { addDoc, collection, getCountFromServer, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from 'src/firebase';
import { RegistroDescarteDto } from './dtos/registro-descarte.dto';

@Injectable()
export class DescarteService {
    async cadastrarPontoDescarte(dados: PontoDescarteDto) {
        const docRef = await addDoc(collection(db, "pontos-coleta"), {
            name: dados.name,
            bairro: dados.bairro,
            snPublico: dados.snPublico,
            categoriaItemsAceitos: dados.categoriaItemsAceitos,
            latitude: dados.latitude,
            longitude: dados.longitude
        });

        return { id: docRef.id };
    }

    async cadastrarRegistroDescarte(dados: RegistroDescarteDto) {
        const docRef = await addDoc(collection(db, "registros-descarte"), {
            nomeUsuario: dados.nomeUsuario,
            idPontoDescarte: dados.idPontoDescarte,
            tipoResiduo: dados.tipoResiduo,
            dataDescarte: dados.dataDescarte
        }); 

        return { id: docRef.id };
    }

    async gerarRelatorioDescarte() {
    // 1. Buscamos TODOS os dados necessários de uma vez só (Mais rápido e menos leituras)
    const pontosSnapshot = await getDocs(collection(db, "pontos-coleta"));
    const registrosSnapshot = await getDocs(collection(db, "registros-descarte"));
    // Assumindo que você tem uma coleção de users. Se não tiver, avise.
    // const usersSnapshot = await getDocs(collection(db, "users")); 
    
    // Se não tiver coleção de users, podemos contar usuários únicos nos registros:
    const usuariosUnicos = new Set<string>();

    // 2. Variáveis para os cálculos
    const totalPontos = pontosSnapshot.size;
    
    const contagemPontos: Record<string, number> = {};
    const contagemResiduos: Record<string, number> = {};
    
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    const sessentaDiasAtras = new Date();
    sessentaDiasAtras.setDate(hoje.getDate() - 60);

    let qtdUltimos30Dias = 0;
    let qtdMesAnterior = 0; // Dias 30 a 60 atrás

    // 3. Iteração Única (Processamento em Memória)
    registrosSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Tratamento da Data: O Firestore devolve Timestamp, precisamos converter para JS Date
        let dataDescarte: Date;
        if (data.dataDescarte instanceof Timestamp) {
            dataDescarte = data.dataDescarte.toDate();
        } else {
            dataDescarte = new Date(data.dataDescarte);
        }

        // A. Contagem por Ponto (para achar o maior)
        const pontoId = data.idPontoDescarte;
        if (pontoId) {
            contagemPontos[pontoId] = (contagemPontos[pontoId] || 0) + 1;
        }

        // B. Contagem por Resíduo
        const residuo = data.tipoResiduo;
        if (residuo) {
            contagemResiduos[residuo] = (contagemResiduos[residuo] || 0) + 1;
        }

        // C. Contagem de Usuários Únicos (Pelo nome ou ID se tiver)
        if (data.nomeUsuario) {
            usuariosUnicos.add(data.nomeUsuario);
        }

        // D. Filtros de Data para Comparativo e Média
        if (dataDescarte >= trintaDiasAtras) {
            qtdUltimos30Dias++;
        } else if (dataDescarte >= sessentaDiasAtras && dataDescarte < trintaDiasAtras) {
            qtdMesAnterior++;
        }
    });

    // 4. Calculando os Vencedores (Função auxiliar abaixo)
    const pontoVencedor = this.obterMaiorOcorrencia(contagemPontos);
    const residuoVencedor = this.obterMaiorOcorrencia(contagemResiduos);

    // 5. Cálculo de Crescimento
    let percentualCrescimento = 0;
    if (qtdMesAnterior > 0) {
        percentualCrescimento = ((qtdUltimos30Dias - qtdMesAnterior) / qtdMesAnterior) * 100;
    } else if (qtdUltimos30Dias > 0) {
        percentualCrescimento = 100;
    }

    const stringCrescimento = (percentualCrescimento >= 0 ? '+' : '') + percentualCrescimento.toFixed(1) + '%';

    // 6. Montando o JSON final
    return {
        pontoMaisPopular: pontoVencedor 
            ? { id: pontoVencedor.key, totalRegistros: pontoVencedor.value } 
            : null,
        residuoMaisFrequente: residuoVencedor 
            ? { tipo: residuoVencedor.key, totalRegistros: residuoVencedor.value } 
            : null,
        mediaDiariaUltimos30Dias: Number((qtdUltimos30Dias / 30).toFixed(2)),
        totalUsuarios: usuariosUnicos.size, // ou usersSnapshot.size se tiver a collection
        totalPontos: totalPontos,
        comparativoMensal: {
            mesAtualQtd: qtdUltimos30Dias,
            mesAnteriorQtd: qtdMesAnterior,
            percentualCrescimento: stringCrescimento
        }
    };
  }

  // Helper simples para achar chave com maior valor
  private obterMaiorOcorrencia(mapa: Record<string, number>) {
    let maiorChave: string | null = null;
    let maiorValor = -1;

    Object.entries(mapa).forEach(([chave, valor]) => {
        if (valor > maiorValor) {
            maiorValor = valor;
            maiorChave = chave;
        }
    });

    return maiorChave ? { key: maiorChave, value: maiorValor } : null;
  }
}
