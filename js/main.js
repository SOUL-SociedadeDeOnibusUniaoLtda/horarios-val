//autor: jeanroldao@gmail.com
var SERVER_ENDPOINT = 'http://www.viacaoalvorada.com.br/json2/api.php?callback=?';
var SERVER_TIMEOUT = 20000;
var UPDATE_DELAY = 2000;
var ULTIMA_ATUALIZACAO = '01/07/2017 12:00'
var isOnline = navigator.onLine;

if (!console || !console.log) {
  console = {log: function(){}};
}

$.ajaxSetup({timeout: SERVER_TIMEOUT});

document.addEventListener("offline", function(){
  console.log('offline');
  isOnline = false;
}, false);

function checkUpdatesFromSoul() {
  
  if (!isOnline) {
    console.log('offline, skip update');
    return;
  }
  
  $('#span_conferindo').removeClass('hidden');
  $('#span_ultima_atualizacao').addClass('hidden');
  
  $.getJSON(SERVER_ENDPOINT, {
    noticias_hash: localStorage.getItem('noticias_hash'), 
    horarios_hash: localStorage.getItem('horarios_hash')
  }, function(response) {
    console.log('update ok');
    localStorage.setItem('ultimaAtualizacao', formatDateTime(new Date()));
 
    if (response.horarios_hash) {
      localStorage.setItem('horarios_hash', response.horarios_hash);
      atualizaTabelaHorarios(response.horarios);
    }

	atualizaListaLinha();
    
    if (response.noticias_hash) {
      localStorage.setItem('noticias_hash', response.noticias_hash);
      
      var noticias = response.noticias;
      
      var noticiasPorId = {};
      
      $(noticias).each(function(i, noticia) {
        noticiasPorId[noticia.id] = noticia;
      });
      
      $(tabelaNoticias).each(function(i, noticia) {
        if (noticia.lida && noticiasPorId[noticia.id]) {
          noticiasPorId[noticia.id].lida = true;
        }
      });
      
      tabelaNoticias = noticias;
      
      syncronizaNoticias();
      carregaAreaNoticias();
    }
  }).fail(function() {
    console.log('update failed');
  }).complete(function() {
    $('#span_conferindo').addClass('hidden');
    $('#span_ultima_atualizacao').removeClass('hidden');
    atualizaTextoDeUltimaAtualizacao();
  });
}

function atualizaListaLinha() {	
	var selectLinhas = $('#selectLinhas');
	var linhasAtual = selectLinhas.val();
	selectLinhas.find('option').remove();
	
	var linhas = {};
	tabelaHorarios.forEach(function(horario) {
		linhas[horario.linhaFiltro] = true;
	});
	
	Object.keys(linhas).sort(function(a, b) {
		var sa = a.split(' ');
		var sb = b.split(' ');
		return String(sa[1]).localeCompare(String(sb[1]))
			|| (sa[1] == '103' ? -String(sa[2]).localeCompare(String(sb[2])) : String(sa[2]).localeCompare(String(sb[2])));
	}).forEach(function(linha) {
	  var optionLinha = document.createElement('option');
	  optionLinha.value = linha;
	  optionLinha.text = linha;
	
	  selectLinhas.append(optionLinha);
	})
}

function atualizaTextoDeUltimaAtualizacao() {
  var ultimaAtualizacao = localStorage.getItem('ultimaAtualizacao');
  if (!ultimaAtualizacao) {
    ultimaAtualizacao = ULTIMA_ATUALIZACAO;
  }
  $('#data_ultima_atualizacao').text(ultimaAtualizacao);
  $('#span_ultima_atualizacao').removeClass('hidden');
}

function getUltimaAtualizacaoISOString() {
  var ultimaAtualizacao = localStorage.getItem('ultimaAtualizacao') || ULTIMA_ATUALIZACAO;
  var data = ultimaAtualizacao.split(' ');
  data[0] = data[0].split('/').reverse().join('/');
  var validDate = data.join(' ');
  return new Date(validDate).toISOString();
}

function syncronizaNoticias() {
  localStorage.setItem('tabelaNoticias', JSON.stringify(tabelaNoticias));
}

function busca(filtro) {
  //tabelaHorarios
  
  var listaFiltrada = [];
  for (var i = 0; i < tabelaHorarios.length; i++ ) {
    if (filtro(tabelaHorarios[i])) {
      listaFiltrada.push(tabelaHorarios[i]);
    }
  }
  return listaFiltrada;
}

function formatTime(time) {
  var horas, minutos;
  if (time.getHours) {
    horas = time.getHours();
    minutos = time.getMinutes();
  } else {
    time = time.split(':');
    if (time.length > 1) {
      horas = time[0];
      minutos = time[1];
    } else {
      horas = Math.floor(time[0] / 100);
      minutos = time[0] % 100;
    }
  }
  if (horas < 10) {
    horas = "0" + (+horas);
  }
  if (minutos < 10) {
    minutos = "0" + (+minutos);
  }
  return horas + ":" + minutos;
}

function formatData(data) {
  if (data.getDate) {
    var dia = data.getDate();
    if (dia < 10) {
      dia = "0" + (+dia);
    }
    var mes = data.getMonth() + 1;
    if (mes < 10) {
      mes = "0" + (+mes);
    }
    
    var ano = data.getFullYear();
   return dia + '/' + mes + '/' + ano;
  } else {
    return data.split(' ').shift().split('-').reverse().join('/');
  }
}

function formatDateTime(dateTime) {
  return formatData(dateTime) + ' ' + formatTime(dateTime);
}

function parseTime(timeString) {
  var data = new Date();
  var horaMinuto = timeString.split(':');
  
  data.setHours(horaMinuto[0]);
  
  if (horaMinuto.length > 1) {
    data.setMinutes(horaMinuto[1]);
  }
  
  return data;
}

function getAndroidVersion() {
  var ua = navigator.userAgent; 
  var match = ua.match(/Android\s([0-9\.]*)/);
  return match ? match[1] : false;
};

$(window).resize(function(){
  if ($('.navbar-default .navbar-inner').width() != $('body').width()) {
    $('.navbar-default .navbar-inner').width($('body').width());
  }
});

function carregaAreaNoticias() {

  var novasNoticias = $(tabelaNoticias).filter(function(){ return !this.lida });
  if (novasNoticias.length > 0) {
    $('#span_noticias_count').text(novasNoticias.length + ' ' + (novasNoticias.length == 1 ? 'nova' : 'novas'));
    $('#span_noticias_novas').show();
  } else {
    $('#span_noticias_novas').hide();
  }
  
  var listaNoticias = $('#area_noticias');
  listaNoticias.find('.noticia_carregada').remove();
  var template = listaNoticias.find('li:first');
  
  $(tabelaNoticias).each(function(i, noticia){
    var noticiaArea = template.clone();
    
    noticiaArea.find('h4').text(formatData(noticia.data));
    noticiaArea.find('#noticia_titulo').text(noticia.titulo);
    noticiaArea.find('#noticia_texto').html(noticia.texto);
    
    if (!noticia.lida) {
      noticiaArea
        .addClass('texto_negrito')
        .find('h4')
          .append('<span class="nao_lida_label"> (Não lida)</span>')
        .end();
    }
    
    noticiaArea.click(function() {
      console.log('noticia clicada');
      
      if (!noticia.lida) {
        noticia.lida = true;
        syncronizaNoticias();
      }
      
      $(this)
        .find('.glyphicon')
          .toggleClass('glyphicon-chevron-down glyphicon-chevron-right')
        .end()
        .find('.nao_lida_label')
          .remove()
        .end()
        .find('#btnNoticiasLerMais,#btnNoticiasLerMenos')
          .toggle()
        .end()
        .removeClass('texto_negrito')
        .find('#noticia_texto')
          .slideToggle('fast')
        .end();
    });
    
    noticiaArea
      .addClass('noticia_carregada')
      .appendTo(listaNoticias)
      .show();
  });
}

function capitalize(str) {
  return $(str.split(' ')).map(function(i, v){
    return v.charAt(0).toUpperCase() + v.substring(1).toLowerCase();
  }).toArray().join(' ');
}

$(function () {

  var txtPesquisar = $('#txtPesquisar');
  var txtHoraInicial = $('#txtHoraInicial');
  var txtHoraFinal = $('#txtHoraFinal');
  var selectDia = $('#selectDia');
  var selectLinhas = $('#selectLinhas');
  var btnPesquisar = $('#btnPesquisar');
  var btnVoltar = $('#btnVoltar');
  
  
  if (window.cordova) {
    document.addEventListener("deviceready", function() {
      
      if (typeof datePicker != 'undefined') {
        
        $('#filtroHoraNormal').addClass('hidden');
        $('#filtroHoraPlugin').removeClass('hidden');
        
        txtHoraInicial = $('#txtHoraInicialPlugin').val(txtHoraInicial.val());
        txtHoraFinal = $('#txtHoraFinalPlugin').val(txtHoraFinal.val());

        
        $('input[type=timepicker]').click(function() {
          var input = $(this);
          var options = {
            date: parseTime(input.val()),
            mode: 'time',
            is24Hour: true,
            androidTheme: datePicker.ANDROID_THEMES.THEME_HOLO_DARK
          };

          datePicker.show(options, function(date){
            input.val(formatTime(date));
          });
        });
          
      }
    }, false);
  } else {
  
    // Teste se timepicker é suportado, 
    // se nao for usa campos alterativos para selecionar horas e minutos
    txtHoraInicial.val(txtHoraInicial.attr('placeholder'));
    if (txtHoraInicial.val()) {
      $([txtHoraInicial, txtHoraFinal]).each(function(i, v) {
        v.val('');
        v.attr('type', 'number');
        v.attr('maxlength', '2');
        v.width(v.width() / 3);
        v.focus(function(){ 
          this.select();
        });
        
        v.parent().append($('<span>').append(v.css({display: 'inline'})));
        v.parent().css({display: 'block'});
        var v1 = $(v[0]).attr('placeholder', 'Hora');
        var v2 = v.clone().attr('placeholder', 'Minuto').appendTo(v.parent());
        
        var MAX_VALUES = [23, 59];
        $([v1, v2]).each(function(i, campo) {
          var divCampo = $('<div></div>').css({textAlign: 'center'});
          
          campo.after(divCampo);
          campo.appendTo(divCampo);
          
          var btnDivUp = $('<span><button><span class="glyphicon glyphicon-plus"></span></button><span>');
          btnDivUp.css({}).width(campo.width());
          btnDivUp.click(function(){
            var valor = +campo.val() + 1;
            if (valor > MAX_VALUES[i]) {
              valor = 0;
            }
            if (valor < 10) {
              valor = '0' + valor;
            }
            campo.val(valor);
          });
          
          var btnDivDown = $('<span><button><span class="glyphicon glyphicon-minus"></span></button><span>');
          btnDivDown.css({}).width(campo.width());
          btnDivDown.click(function(){
            var valor = +campo.val() - 1;
            if (valor < 0) {
              valor = MAX_VALUES[i];
            }
            if (valor < 10) {
              valor = '0' + valor;
            }
            campo.val(valor);
          });
          
          campo.before(btnDivDown);
          campo.after(btnDivUp);
        });
        
        v.val=function(value) {
          if (arguments.length == 0) {
            return formatTime(v1.val() + ':' + v2.val());
          } else {
            var horaMin = ['', ''];
            if (value) {
              horaMin = formatTime(value).split(':');
            }
            v1.val(horaMin[0]);
            v2.val(horaMin[1]);
            return this;
          }
        };
      });
      
    }
  }
 
  $('#topo_fixo').click(function(){
    $('body,html').animate({scrollTop: 0}, 'slow');
  });
  
  var noticiasVoltar = function(){
    $('.area_conteudo').hide();
    $('#conteudo_form,#conteudo_tabela').show();
    // recarrega lidas/nao lidas
    carregaAreaNoticias();
    
    if (window.cordova) {
      document.removeEventListener("backbutton", noticiasVoltar, false);
    } else if (history.pushState) {
      console.log('pushState: back');
      window.onpopstate = null;
      //document.removeEventListener("popstate", noticiasVoltar, false);
    }
  };
  
  $('#btnNoticias').click(function(){
    $('.area_conteudo').hide();
    $('#conteudo_noticias').show();
    
    if (window.cordova) {
      document.addEventListener("backbutton", noticiasVoltar, false);
    } 
	/*else if (history.pushState) {
      if (document.origin == 'null') {
        window.location = '#noticias';
      } else {
        history.pushState({page:'noticias'}, 'noticias', '/noticias');
      }
      window.onpopstate = noticiasVoltar;
    }*/
  });
  
  /*
  if (!window.cordova && history.pushState && document.origin != 'null') {
    history.replaceState({page:'home'}, 'home', '/home');
    $('#btnVoltarNoticias').click(function(){
      history.back();
    });
  } else {  
  */
  $('#btnVoltarNoticias').click(noticiasVoltar);
  
  
  carregaAreaNoticias();
  
  // conferir novas noticias depois do UPDATE_DELAY, 
  // para não ficar muito tempo na tela preta 
  // esperando carregar as noticias em internet lenta
  setTimeout(checkUpdatesFromSoul, UPDATE_DELAY);
  
  $('#checkLembrarFiltros').click(function() {
    $('.clsLabelLembrar').toggle();
  });
 
  txtHoraInicial.val('05:00');

  txtHoraFinal.val('01:00');
  
  var diaSemana = new Date().getDay();
  
  if (diaSemana == 0) {
    selectDia.val('DOMINGO');
  } else if (diaSemana == 6) {
    selectDia.val('SABADO');
  }
  
  if (!selectLinhas.attr('multiple')) {
    selectLinhas.attr('multiple', true);
  }
  selectLinhas.val([]);
  
  //var android = getAndroidVersion();
  //if (android && android < '4') {}
  var selectLinhasMaxHeight = selectDia.height() * 2;
  if (selectLinhas.height() > selectLinhasMaxHeight) {
    selectLinhas.height(selectLinhasMaxHeight);
  }
  
  btnPesquisar.click(function() {
    $('#conteudo_tabela').slideUp(function(){
      $(table).remove();
      table = null;
      
      btnPesquisar.text('Pesquisando...');
      setTimeout(function(){
      
        var selecao = selectLinhas.val() || [];
        
        var resultado = [];
        var horaInicial = formatTime(txtHoraInicial.val());
        var horaFinal = formatTime(txtHoraFinal.val());
        
        if (horaInicial < horaFinal) {
          resultado = busca(function(item){
            return (
              (selecao.length == 0 || selecao.indexOf(item.linhaFiltro) != -1)
              && item.dia == selectDia.val()
              && item.hora >= horaInicial
              && item.hora <= horaFinal
            );
          });
        } else {
          resultado = busca(function(item){
            return (
              (selecao.length == 0 || selecao.indexOf(item.linhaFiltro) != -1)
              && item.dia == selectDia.val()
              && item.hora >= horaInicial
            );
          });
          
          resultado = resultado.concat(busca(function(item){
            return (
              (selecao.length == 0 || selecao.indexOf(item.linhaFiltro) != -1)
              && item.dia == selectDia.val()
              && item.hora <= horaFinal
            );
          }));
        }
        
        btnPesquisar.text('Pesquisar');
        btnPesquisar.blur();
        montaGrid(resultado);
        $('#conteudo_tabela').show();
        $('body,html').animate({scrollTop:btnPesquisar.position().top - 75}, 'slow');

      }, 300);
    });
  });
  
  atualizaTextoDeUltimaAtualizacao();
  if (navigator && navigator.splashscreen && navigator.splashscreen.hide) {
    console.log('navigator.splashscreen.hide()');
    navigator.splashscreen.hide();
  }
});

function montaGrid(lista) {

  var table = getTable();
  if (lista.length == 0) {
    criaLinha(table, ['<b>Sem linhas para essa pesquisa, mude o filtro para resultados diferentes</b>']);
  } else {
  
    var total_linhas = lista.length;
    var tr = document.createElement('tr');
    //var th = document.createElement('th');
    var prural = total_linhas == 1 ? '' : 's';
    tr.innerHTML = '<th colspan="3">' + total_linhas + ' linha'+prural+' encontrada'+prural+'</th>';
    $('thead', table).append(tr);
    //criaLinha(table, ['', '', total_linhas + ' linhas encontradas']);
    criaLinha(table, ['Hora', 'Linha', 'Descri&ccedil;&atilde;o'], 'thead');
    for (var i = 0; i < total_linhas; i++) {
      var linha = lista[i];
      criaLinha(table, [linha.hora, linha.linha, linha.descricao]);
    }
  }
}

var table = null;
function getTable() {
  if (table != null) {
    table.parentNode.removeChild(table);
  }
  table = document.createElement('table');
  table.className = 'table table-bordered';
  table.appendChild(document.createElement('thead'));
  table.appendChild(document.createElement('tbody'));
  
  $('#conteudo_tabela').append(table);
  return table;
}

function criaLinha(table, campos, tablePart) {
  tablePart = tablePart || 'tbody';
  var tr = document.createElement('tr');
  for (var i = 0; i < campos.length; i++) {
    var td = document.createElement(tablePart == 'tbody' ? 'td' : 'th');
    if (typeof campos[i] != 'object') {
      td.innerHTML = campos[i];
    } else {
      td.appendChild(campos[i]);
    }
    tr.appendChild(td);
  }
  $(tablePart, table).append(tr);
}
