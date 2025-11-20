import { Injectable } from '@nestjs/common';
import { PontoDescarteDto } from './dtos/ponto-descarte.dto';
import { addDoc, collection, getCountFromServer, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from 'src/firebase';
import { RegistroDescarteDto } from './dtos/registro-descarte.dto';
import { BuscaFiltroDto } from './dtos/busca-filtro.dto';

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

    async buscaFiltro(filtro: BuscaFiltroDto) {
    
    const registrosRef = collection(db, "registros-descarte");
    const snapshot = await getDocs(registrosRef);

    const termo = filtro.keyword ? filtro.keyword.toLowerCase() : null;

    const resultados = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataDescarte: data.dataDescarte instanceof Timestamp 
             ? data.dataDescarte.toDate() 
             : new Date(data.dataDescarte)
        };
      })
      .filter((registro: any) => {
        if (!termo) return true;

        const matchNome = registro.nomeUsuario?.toLowerCase().includes(termo);
        const matchTipo = registro.tipoResiduo?.toLowerCase().includes(termo);
        const matchIdPonto = registro.idPontoDescarte?.toLowerCase().includes(termo);

        const dataString = registro.dataDescarte.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        const matchData = dataString.includes(termo);

        return matchNome || matchTipo || matchIdPonto || matchData;
      });

    return resultados;
  }

    async gerarRelatorioDescarte() {
        const pontosSnapshot = await getDocs(collection(db, "pontos-coleta"));
        const registrosSnapshot = await getDocs(collection(db, "registros-descarte"));
        
        const mapNomes: Record<string, string> = {};
        pontosSnapshot.forEach(doc => {
            const d = doc.data();
            mapNomes[doc.id] = d.name;
        });

        const usuariosUnicos = new Set<string>();
        const totalPontos = pontosSnapshot.size;
        
        const contagemPontos: Record<string, number> = {};
        const contagemResiduos: Record<string, number> = {};
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        const sessentaDiasAtras = new Date();
        sessentaDiasAtras.setDate(hoje.getDate() - 60);

        let qtdUltimos30Dias = 0;
        let qtdMesAnterior = 0;

        registrosSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            
            let dataDescarte: Date;
            if (data.dataDescarte instanceof Timestamp) {
                dataDescarte = data.dataDescarte.toDate();
            } else {
                dataDescarte = new Date(data.dataDescarte);
            }

            const pontoId = data.idPontoDescarte;
            if (pontoId) {
                contagemPontos[pontoId] = (contagemPontos[pontoId] || 0) + 1;
            }

            const residuo = data.tipoResiduo;
            if (residuo) {
                contagemResiduos[residuo] = (contagemResiduos[residuo] || 0) + 1;
            }

            if (data.nomeUsuario) {
                usuariosUnicos.add(data.nomeUsuario);
            }

            if (dataDescarte >= trintaDiasAtras) {
                qtdUltimos30Dias++;
            } else if (dataDescarte >= sessentaDiasAtras && dataDescarte < trintaDiasAtras) {
                qtdMesAnterior++;
            }
        });

        const pontoVencedor = this.obterMaiorOcorrencia(contagemPontos);
        const residuoVencedor = this.obterMaiorOcorrencia(contagemResiduos);

        let percentualCrescimento = 0;
        if (qtdMesAnterior > 0) {
            percentualCrescimento = ((qtdUltimos30Dias - qtdMesAnterior) / qtdMesAnterior) * 100;
        } else if (qtdUltimos30Dias > 0) {
            percentualCrescimento = 100;
        }

        const stringCrescimento = (percentualCrescimento >= 0 ? '+' : '') + percentualCrescimento.toFixed(1) + '%';

        return {
            pontoMaisPopular: pontoVencedor 
                ? { 
                    id: pontoVencedor.key, 
                    name: mapNomes[pontoVencedor.key] || 'Nome não encontrado', // <--- AQUI APARECE O NOME
                    totalRegistros: pontoVencedor.value 
                  } 
                : null,
            residuoMaisFrequente: residuoVencedor 
                ? { tipo: residuoVencedor.key, totalRegistros: residuoVencedor.value } 
                : null,
            mediaDiariaUltimos30Dias: Number((qtdUltimos30Dias / 30).toFixed(2)),
            totalUsuarios: usuariosUnicos.size,
            totalPontos: totalPontos,
            comparativoMensal: {
                mesAtualQtd: qtdUltimos30Dias,
                mesAnteriorQtd: qtdMesAnterior,
                percentualCrescimento: stringCrescimento
            }
        };
    }

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

    async listarTodosPontos() {
        const snapshot = await getDocs(collection(db, "pontos-coleta"));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
}
