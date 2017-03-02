
var express = require('express');
var app = express();
var mysql = require("mysql");
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


//CREANDO CONEXION CON LA BASE DE DATOS MYSQL

var pool    =    mysql.createPool({
      connectionLimit   :   100,
      host              :   'localhost',
      user              :   'root',
      password          :   '',
      database          :   'testchat',
      debug             :   false
});

//ARRAYS QUE ALMACENA LA CANTIDAD DE USUARIOS Y CONEXIONES

users = [];
connections = [];

//MUESTRA EN CONSOLA SI EL SERVIDOR ESTA ARRIBA Y PONEMOS EN ESCUCHA DEL PUERTO 3000

server.listen(process.env.PORT || 3000);
console.log('Server UP...');

//EL SERVIDOR SE INICIA CON LOCALHOST:3000, PERO LO QUE ABRE ES EL ARCHIVO INDEX.HTML

app.get('/', function(req,res){
	res.sendFile('index.html',{root:__dirname});
});

//INICIANDO CONEXION Y AGRAGANDO FUNCIONES PARA EL CHAT 

io.sockets.on('connection', function(socket){

//--------------------CONECTANDO AL CHAT--------------------------//

	connections.push(socket);
	console.log('Conectados: %s Sockets Conectados', connections.length);


//---------MOSTRAR REGISTRO DE MENSAJE-----------//

    pool.query('SELECT * FROM registrochat',function(err,rows){
      if(err) throw err;
    //  console.log('Data received from Db:\n');
    //  console.log(rows);
      socket.emit('showrows', rows);
    });

//----------------DESCONECTADO DEL CHAT----------------------//

	socket.on('disconnect', function(data){

			users.splice(users.indexOf(socket.username), 1);
			updateUsernames();
			connections.splice(connections.indexOf(socket), 1);
			console.log('Desconectados: %s Sockets Conectados', connections.length);

	});

//-----------------ENVIAR MENSAJE--------------------------//

	socket.on('mensaje enviado', function(data){
		//console.log(data);
		pool.getConnection(function(err,connection){
			if (err) {
				callback(false);
				return;
			}

			io.sockets.emit('nuevo mensaje', {msg: data, user: socket.username});



			connection.query("INSERT INTO `registrochat` (`usuario`,`texto`) VALUES ('"+socket.username+"','"+data+"')",function(err,rows){
	            connection.release();

	        });

		});

	});

//-----------------NUEVO USUARIO----------------------//

	socket.on('nuevo usuario', function(data, callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();

	});

	function updateUsernames(){
		io.sockets.emit('get users', users);
		console.log('Usuarios conectados: ', users);
	}

});
