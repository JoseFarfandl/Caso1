const http=require('http');
const url=require('url');
const fs=require('fs');
const querystring = require('querystring');

const mysql=require('mysql');

const conexion=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'tienda'
});

conexion.connect(error => {
    if (error)
        console.log('Problemas de conexion con mysql');
});

var mime = {
    'html' : 'text/html',
    'css'  : 'text/css',
    'jpg'  : 'image/jpg',
    'ico'  : 'image/x-icon',
    'mp3'  :	'audio/mpeg3',
    'mp4'  : 'video/mp4'
};


const servidor=http.createServer((pedido,respuesta) => {
    const objetourl = url.parse(pedido.url);
    let camino='public'+objetourl.pathname;
    if (camino=='public/')
        camino='public/index.html';
    encaminar(pedido,respuesta,camino);
});

servidor.listen(8888);


function encaminar (pedido,respuesta,camino) {

    switch (camino) {
        case 'public/creartabla': {
            crear(respuesta);
            break;
        }
        case 'public/alta': {
            alta(pedido,respuesta);
            break;
        }
        case 'public/listado': {
            listado(respuesta);
            break;
        }
        case 'public/consultaporcodigo': {
            consulta(pedido,respuesta);
            break;
        }
        default : {
            fs.exists(camino,function(existe){
                if (existe) {
                    fs.readFile(camino,function(error,contenido){
                        if (error) {
                            respuesta.writeHead(500, {'Content-Type': 'text/plain'});
                            respuesta.write('Error interno');
                            respuesta.end();
                        } else {
                            var vec = camino.split('.');
                            var extension=vec[vec.length-1];
                            var mimearchivo=mime[extension];
                            respuesta.writeHead(200, {'Content-Type': mimearchivo});
                            respuesta.write(contenido);
                            respuesta.end();
                        }
                    });
                } else {
                    respuesta.writeHead(404, {'Content-Type': 'text/html'});
                    respuesta.write('<!doctype html><html><head></head><body>Recurso inexistente</body></html>');
                    respuesta.end();
                }
            });
        }
    }
}


function alta(pedido,respuesta) {
    var info='';
    pedido.on('data', function(datosparciales){
        info += datosparciales;
    });
    pedido.on('end', function(){
        var formulario = querystring.parse(info);
        var registro={
            name:formulario['name'],
            editorial:formulario['editorial'],
            cat:formulario['cat'],
            cost:formulario['cost'],
            cant:formulario['cant']
        };
        conexion.query('insert into books set ?',registro, function (error,resultado){
            if (error) {
                console.log(error);
                return;
            }
        });
        respuesta.writeHead(200, {'Content-Type': 'text/html'});
        respuesta.write('<!doctype html><html><head></head><body>'+
            'Se cargo el articulo<br><a href="alta_libros.html">Retornar</a></body></html>');
        respuesta.end();
    });
}

function listado(respuesta) {
    conexion.query('select name,editorial,cat, cost, cant from books', function(error,filas){
        if (error) {
            console.log('error en el listado');
            return;
        }
        respuesta.writeHead(200, {'Content-Type': 'text/html'});
        var datos='';
        for(var f=0;f<filas.length;f++){
            datos+='name:'+filas[f].name+'<br>';
            datos+='editorial:'+filas[f].editorial+'<br>';
            datos+='cat:'+filas[f].cat+'<br>';
            datos+='cost:'+filas[f].cost+'<hr>';
        }
        respuesta.write('<!doctype html><html><head></head><body>');
        respuesta.write(datos);
        respuesta.write('<a href="index.html">Retornar</a>');
        respuesta.write('</body></html>');
        respuesta.end();
    });
}


function consulta(pedido,respuesta) {
    let info='';
    pedido.on('data', function(datosparciales){
        info += datosparciales;
    });
    pedido.on('end', () => {
        const formulario = querystring.parse(info);
        const dato=[formulario['name']];
        conexion.query('select name,editorial,cat,cost,cant from books where name=?',dato, (error,filas) => {
            if (error) {
                console.log('error en la consulta');
                return;
            }
            respuesta.writeHead(200, {'Content-Type': 'text/html'});
            let datos='';
            if (filas.length>0) {
                datos+='name:'+filas[0].name+'<br>';
                datos+='editorial:'+filas[0].editorial+'<br>';
                datos+='cat:'+filas[0].cat+'<br>';
                datos+='cost:'+filas[0].cost+'<br>';
                datos+='cant:'+filas[0].cant+'<hr>';
            } else {
                datos='No existe un artículo con dicho codigo.';
            }
            respuesta.write('<!doctype html><html><head></head><body>');
            respuesta.write(datos);
            respuesta.write('<a href="index.html">Retornar</a>');
            respuesta.write('</body></html>');
            respuesta.end();
        });
    });
}

console.log('Servidor web iniciado');
