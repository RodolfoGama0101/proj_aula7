import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DescarteService } from './descarte.service';
import { PontoDescarteDto } from './dtos/ponto-descarte.dto';
import { RegistroDescarteDto } from './dtos/registro-descarte.dto';
import { BuscaFiltroDto } from './dtos/busca-filtro.dto';

@Controller('descarte')
export class DescarteController {

    constructor(private descarteService: DescarteService) {}

    @Post('ponto-descarte')
    addPontoColeta(@Body() dto: PontoDescarteDto) {
        return this.descarteService.cadastrarPontoDescarte(dto);
    }

    @Post('registro-descarte')
    addRegistroDescarte(@Body() dto: RegistroDescarteDto) {
        return this.descarteService.cadastrarRegistroDescarte(dto);
    }

    @Get('busca-filtro')
    buscaFiltro(@Query() filtro: BuscaFiltroDto) {
        return this.descarteService.buscaFiltro(filtro);
    }

    @Get('relatorio')
    getRelatorioDescarte() { 
        return this.descarteService.gerarRelatorioDescarte();
    }
}
