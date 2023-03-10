const bodyParser = require('body-parser');
const { Console } = require('console');
//-------------------------------------⬇️ Conexão com o Banco de Dados e criação das tabelas
function banco_de_dados ()
{
	process.env.ORA_SDTZ = 'UTC-3'; // garante horário de Brasília
	
	this.getConexao = async function ()
	{
		if (global.conexao)
			return global.conexao;

        const oracledb = require('oracledb');
        const dbConfig = require('./dbconfig.js');
        
        try
        {
		    global.conexao = await oracledb.getConnection(dbConfig);
		}
		catch (erro)
		{
			console.log('Não foi possível estabelecer conexão com o banco_de_dados!');
			process.exit(1);
		}

		return global.conexao;
	}

	this.estrutureSe = async function ()
	{
		try//cria tabela para o insert do bilhete
		{
			const conexao = await this.getConexao();
			const sql     = 'CREATE TABLE BILHETE (ID_USUARIO_BILHETE NUMBER(6)'+
			'CONSTRAINT PK_ID_USUARIO_BILHETE PRIMARY KEY,'+
			'HORA_CRIACAO VARCHAR2(8),'+
			'DATA_CRIACAO VARCHAR2(10))';
			await conexao.execute(sql);
			console.log('Tabela Bilhete criada!')
		}
		catch (erro)
		{} 
	
		try//cria tabela para o insert da recarga
		{
			const conexao = await this.getConexao();
			const sqlr     = 'CREATE TABLE RECARGA(COD_RECARGA NUMBER(6, 0) CONSTRAINT RECARGA_PK PRIMARY KEY,'+
			'TIPO VARCHAR2(20), DATA_RECARGA VARCHAR2(10),  HORA_RECARGA VARCHAR2(8),'+
			'VALOR_RECARGA NUMBER(5, 2), FK_ID_BILHETE NUMBER (6, 0),'+
			'FOREIGN KEY (FK_ID_BILHETE) REFERENCES BILHETE (ID_USUARIO_BILHETE))';
			await conexao.execute(sqlr);
			console.log('Tabela criada Recarga!');
		}
		catch (erro)
		{}

		try//cria a tabela de utilização se não existir
		{
			const conexao = await this.getConexao();
			const sqlr9    = 'CREATE TABLE UTILIZACAO(COD_UTILIZACAO NUMBER(6, 0) CONSTRAINT UTILIZACAO_PK PRIMARY KEY,TIPO VARCHAR2(10),'+
			'COD_RECARGA NUMBER (6, 0), DATA_UTILIZACAO VARCHAR2(19), DATA_VENCIMENTO VARCHAR2(19), FK_ID_BILHETE NUMBER (6, 0))';
			await conexao.execute(sqlr9);
			console.log('Tabela utilização criada');
		}
		catch (erro)
		{}
	}
}
//------------------------------------------------------------------------⬇️ insert Bilhete
function BILHETE (bd)//conexão com o bd sendo passada por parametro
{
	this.bd = bd;
	
	this.inclua = async function (Bilhete)//organiza os dados neste comando p/ ser executado no banco de dados  
	{
		const sql1 = "INSERT INTO BILHETE VALUES (:0,:1,:2)";
		const dados = [( parseInt(Bilhete.cdb)),( Bilhete.horacri),( Bilhete.datacri)];
	
		console.log(sql1, dados);
		await conexao.execute(sql1, dados);
		
		const sql2 = 'COMMIT';
		await conexao.execute(sql2);	
	}	
}	

function Bilhete (id)//adiciona dados como data e hora para ser enviados no comando acima
{
	this.cdb = id;//codigo do bilhete 
	this.datacri = new Date().toLocaleDateString();//data
	this.horacri = new Date().toLocaleTimeString();//hora
}	

function middleWareGlobal (req, res, next)
{
    console.time('Requisição'); // marca o início da requisição
    console.log('Método: '+req.method+'; URL: '+req.url); // retorna qual o método e url foi chamada

    next(); // função que chama as próximas ações

    console.log('Finalizou'); // será chamado após a requisição ser concluída

    console.timeEnd('Requisição'); // marca o fim da requisição
}

async function inclusao (req, res)
{
    const Bilhetecriado = new Bilhete (req.body.id);//requisição do codigo do bilhete e passando para a função Bilhete que está logo acima
    try
    {
        await  global.Bilhetes.inclua(Bilhetecriado);//global..é conexão com o banco de dados e inclua é a função que faz o insert
		console.log('Insert do Bilhete concluído!!!');//insert concluido exibe no terminal a mensagem
	}
	catch (err)//pego o erro 
	{
		console.log('Erro no incluir');//avisa no terminal que deu erro
		console.log(err)//exibe no terminal o erro
    }
}
//-------------------------------------------------------------------------⬇️ insert Recarga
function RECARGA (bd)
{
	this.bd = bd;
	
	this.inserir_recarga = async function (Recarga)//reuni os dados no comando para ser executado no bd 
	{

		const sql3 = "INSERT INTO RECARGA VALUES (:0,:1,:2,:3,:4,:5)";
		const dados2 = [(parseInt(Recarga.cdr)),(Recarga.tipo),(Recarga.datacri),
			(Recarga.horacri),(Recarga.valor),(parseInt(Recarga.cdb))];
	
		console.log(sql3, dados2);
		await conexao.execute(sql3, dados2);//excuta o comando no bd
		
		const sql4 = 'COMMIT';
		await conexao.execute(sql4);//comita as informações
	}	

    this.recupereUm = async function (code)
	{
		const conexao = await this.bd.getConexao();
		
		const sql = "SELECT COD_RECARGA,TIPO,DATA_RECARGA FROM RECARGA WHERE FK_ID_BILHETE=:0";
		const dados = [code];
		ret =  await conexao.execute(sql,dados);
		return ret.rows;
	}
}
//
async function inclusaoRec (req,res)
{
    const Recarga_escolhida = new Recarga (req.body.tipo, req.body.cdb);//requisição do tipo do bilhete e o codigo do bilhete
    try
    {	
        await  global.Recargas.inserir_recarga(Recarga_escolhida);//conexão com bd e a função para 
		const  sucesso = new Comunicado('Insert da Recarga concluído!');//exibe no terminal se ocorreu com o sucesso o insert da recarga
		return res.status(201).json(sucesso);//retorna para o front se deu certo o insert da recarga
	}
	catch (err)//retorno do try caso de erro
	{
		console.log('Erro no incluir da recarga');//exibe no terminal 
		console.log(err)//exibe no terminal o erro 
		const  erro2 = new Comunicado ('O número do Bilhete digitado não é valido');//texto que será enviado p o front
        return res.status(409).json(erro2);// retorna p o front a mensagem acima
    }
}

function createRandomNumber() {//função p gerar numeros aleatorio
    const randomNumber = (Math.random() * (1000000 - 100000) + 100000).toFixed(0);
    return randomNumber;
}

function Recarga(tipo,cdb)//tipo do bilhete e codigo do bilhete como parametro
{
	console.log(cdb);

	switch(tipo) //para inserir os dados do tipo e o valor do bilhete
	{
		case 'Bilhete Único - R$3,10':
			console.log('Bilhete escolhido tipo unico');
			this.tipo = 'Unico';
			this.valor = 3.1 ;
		break;

		case 'Bilhete Duplo - R$7,20':
			console.log('Bilhete escolhido tipo duplo');
			this.tipo = 'Duplo';
			this.valor = 7.2 ;
		break;

		case 'Bilhete 7 dias - R$14,40':
			console.log('Bilhete escolhido tipo 7dias');
			this.tipo = '7 Dias';
			this.valor = 14.4 ;
		break;

		case 'Bilhete 30 dias - R$35,50':
			console.log('Bilhete escolhido tipo 30dias');
			this.tipo = '30 Dias';
			this.valor = 35.5;
		break;
	}

	this.cdb = cdb;//codigo do bilhete
	this.datacri = new Date().toLocaleDateString();//data da recarga"dd mm yyyy"
	this.horacri = new Date().toLocaleTimeString();//hora da recarga
	this.cdr = createRandomNumber();//chama a função para criar um numero aleatorio p o codigo da recarga
}

function Comunicado (mensagem)
{
	this.mensagem  = mensagem;//p mandar mensagens no para o front
}

//-------------------------------------------------------------------⬇️Ativação do Bilhete
function Recharge(cdr,tipo)//function Recharge(cdr,tipo,data)
{
	this.cdr=cdr;
	this.tipo=tipo;
}
 
//------------------------------------------------------⬇️Cria a lista de recargas no front
async function list (req, res)
{
	const code = req.params.code;

    let rec;
	try
	{
	    rec = await global.Recargas.recupereUm(code);
	}    
    catch(erro)
    {}

	if (rec.length==0)
	{
		return res.status(200).json([]);
	}
	else
	{
		const ret=[];
		for (i=0;i<rec.length;i++) ret.push (new Recharge (rec[i][0],rec[i][1]));
		return res.status(200).json(ret);
	}
} 

//--------------------------------------------------------------------
function ATIVADOS (bd)//conexão com o bd sendo passada por parametro AQUI ESTA O SQL SELECT
{
	this.bd = bd;
	
	this.inUtiliz = async function (Ativado)//organiza os dados neste comando p/ ser executado no banco de dados  
	{
		const sql1 = "INSERT INTO UTILIZACAO VALUES (:0,:1,:2,:3,:4,:5)";
		const dados = [(Ativado.cdu),(Ativado.tipo),( parseInt(Ativado.cdr)),( Ativado.dataU),(Ativado.dataV),(parseInt(Ativado.cdb))];
	
		console.log(sql1, dados);
		await conexao.execute(sql1, dados);
		const sql2 = 'COMMIT';
		await conexao.execute(sql2);	
	}	
	this.ExisteAtivacao = async function (code)
	{
		const conexao = await this.bd.getConexao();
		
		const sql = "SELECT DATA_VENCIMENTO FROM UTILIZACAO WHERE COD_RECARGA=:0";
		const dados = [code];
		ret =  await conexao.execute(sql,dados);
		
		return ret.rows;
	}
	this.RegistrosRec = async function (CDB)
	{
		const conexao = await this.bd.getConexao();
		
		const sql = "SELECT DATA_CRIACAO FROM BILHETE WHERE ID_USUARIO_BILHETE=:0" 
		const dados = [CDB];
		ret =  await conexao.execute(sql,dados);
		return ret.rows;
	}
	this.GetDataAndType = async function (code)
	{
		const conexao = await this.bd.getConexao();
		
		const sql = "SELECT DATA_UTILIZACAO,TIPO FROM UTILIZACAO WHERE COD_RECARGA=:0";
		const dados = [code];
		ret =  await conexao.execute(sql,dados);
		return ret.rows;
	}
}	

function Ativado (cdb,cdr,tipo)//adiciona dados como data e hora para ser enviados no comando acima
{
	this.cdu = createRandomNumber();
	this.cdb = cdb;//codigo do bilhete 
	this.dataU = new Date(). toLocaleString();
	this.tipo = tipo;
	this.cdr = cdr;
	switch(tipo)
	{
		case'Unico': const data = new Date();
		data.setMinutes(data.getMinutes() + 40);
		this.dataV=data.toLocaleString();
		break;
		case'Duplo':   const data1= new Date();
		data1.setMinutes(data1.getMinutes() + 80);
		this.dataV = data1.toLocaleString();
		break;
		case'7 Dias':   const data2= new Date();
		data2.setDate(data2.getDate() + 7);
		this.dataV = data2.toLocaleString();
		break;
		case'30 Dias':   const data3= new Date();
		data3.setMonth(data3.getMonth() + 1);
		this.dataV = data3.toLocaleString();
		break;
		default: console.log('Erro no switch da Utilização');
		break;
	}
}	
//
async function incluAtivado (req, res)
{
	const coderec = parseInt(req.body.cdr);

	let rec;
	try
	{
	    rec = await global.UseRecharge.ExisteAtivacao(coderec);
	}    
    catch(erro)
    {}

	if (rec.length==0)
	{
		console.log(coderec+' não era um codigo ativado');
		const recAtivada = new Ativado (req.body.cdb,coderec,req.body.tipo);//requisição do codigo do bilhete e passando para a função Bilhete que está logo acima
		try
		{
			await global.UseRecharge.inUtiliz(recAtivada);//global..é conexão com o banco de dados e inclua é a função que faz o insert
			console.log('Utilizou!');//insert concluido exibe no terminal a mensagem
			res.status(200).json(['Bilhete Ativo!']);
		}
		catch (err)//pego o erro 
		{
			console.log(err)//exibe no terminal o erro
		}
	}else{
		console.log('O codigo ja esta ativado');
		console.log('Agora sera vista a validade do codigo da recarga');
		const dataAtual = new Date().toLocaleString();
		const ret=[];
		let i=0;
		ret.push (rec[i][0]);
		const dataVencimento = ret;

		if(dataAtual<dataVencimento){
		    const recAtivada = new Ativado (req.body.cdb,coderec,req.body.tipo);//requisição do codigo do bilhete e passando para a função Bilhete que está logo acima
			try
			{
				await  global.UseRecharge.inUtiliz(recAtivada);//global..é conexão com o banco de dados e inclua é a função que faz o insert
				console.log('Insert da Utilizacao feito');//insert concluido exibe no terminal a mensagem
				res.status(200).json('Recarga Ativa!');
			}
			catch (err)//pego o erro 
			{
				console.log('Erro no utilizar bilhete ja ativo');//avisa no terminal que deu erro
				console.log(err)//exibe no terminal o erro
			}	
		}else{
			console.log('Recarga Expirada!');
			res.status(409).json('Recarga Expirada!');
		}
	}
}
//
function cdbBilhete(data,anything)
{
	this.anything=anything;
	this.data=data;
}
//
async function GerenList (req, res)
{
	const cdb = req.params.cdb;
    let rec;
	try
	{
	    rec = await global.UseRecharge.RegistrosRec(cdb);
	}    
    catch(erro)
    {}

	let rech;
	try
	{
	    rech = await global.Recargas.recupereUm(cdb);
	}
	catch(erro)
    {}


	if (rec.length==0)
	{
		return res.status(200).json([]);
	}
	else
	{
		const ret=[];
		i=0;
		j=0;
		ret.push (new cdbBilhete ((rec[i][0]),(('Data de geração :').bold())));
		ret.push (new cdbBilhete (('<br>'),(' ')));
		ret.push (new cdbBilhete ((('Datas de recargas :').bold()),(' ')));
		for (i=0;i<rech.length;i++) ret.push (new cdbBilhete ((('- Bilhete ')+(rech[i][1])),rech[i][2]));
		const aux=[];
		for (i=0;i<rech.length;i++) aux.push (parseInt(rech[i][0]));
		const cdr=[];
		for(i=1;i<ret.length;i++,j++){
			cdr[j]=parseInt(ret[i].anything);
		}		
		ret.push (new cdbBilhete (('<br>'),(' ')));
		ret.push (new cdbBilhete ((('Datas de ativação :').bold()),(' ')));
		console.log(aux);
		let control=0;
		while(control!==aux.length){
			let ajude;
			ajude =aux.pop();
			let meor;
			try
			{
				meor = await global.UseRecharge.GetDataAndType(ajude);
			}
			catch(erro)
			{}

			for (i=0;i<meor.length;i++) ret.push (new cdbBilhete ((('- Bilhete ')+meor[i][1]),((meor[i][0]).substr(0,10))));
		}
		return res.status(200).json(ret);
	}
} 
//-------------------------------------------------------------------------------⬇️ Servidor
async function server ()
{
    const bd = new banco_de_dados ();
	await bd.estrutureSe();
    global.Bilhetes = new BILHETE (bd);
	global.Recargas = new RECARGA (bd);
	global.UseRecharge = new ATIVADOS(bd);

    const express = require('express');
    const app = express();
	const cors = require('cors')
	const fs = require("fs");
	const { response } = require("express");
	const PORT = 3000;

    app.use(express.json());   
	app.use(cors()); 
    app.use(middleWareGlobal);
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*");
		app.use(cors());
		next();
	  });
    app.post  ('/Bilhete'       , inclusao); 
	app.post  ('/Recarga'       , inclusaoRec);
	app.get   ('/Recarga/:code' , list);
	app.post  ('/Utilizar'       , incluAtivado);
	app.get   ('/Gerenciamento/:cdb' , GerenList);

    console.log ('Servidor ativo na porta 3000');
    app.listen(3000);
}
server();
