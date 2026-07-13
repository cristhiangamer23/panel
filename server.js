const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;


// ================= DATABASE =================

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
        rejectUnauthorized:false
    }

});




// ================= CREAR TABLAS =================


async function iniciarBaseDatos(){

try{


await pool.query(`


CREATE TABLE IF NOT EXISTS usuarios (

id SERIAL PRIMARY KEY,

username VARCHAR(50) UNIQUE NOT NULL,

pass VARCHAR(100) NOT NULL,

role VARCHAR(50) NOT NULL,

activity VARCHAR(20) DEFAULT 'Inactivo'

);



CREATE TABLE IF NOT EXISTS actualizaciones (

id SERIAL PRIMARY KEY,

titulo TEXT NOT NULL,

mensaje TEXT NOT NULL,

fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


`);





// ================= USUARIOS INICIALES =================


const usuariosIniciales = [


{

username:"Cristhian",

pass:"2040@",

role:"Dueño",

activity:"Activo"

},


{

username:"Zarl",

pass:"2050@",

role:"Owner 2",

activity:"Activo"

},


{

username:"Alan",

pass:"2060@",

role:"Director Recursos Humanos",

activity:"Activo"

}


];





for(const usuario of usuariosIniciales){


let existe = await pool.query(

"SELECT * FROM usuarios WHERE username=$1",

[

usuario.username

]

);




if(existe.rows.length===0){


await pool.query(

`

INSERT INTO usuarios

(username,pass,role,activity)

VALUES($1,$2,$3,$4)

`,

[

usuario.username,

usuario.pass,

usuario.role,

usuario.activity

]

);



console.log(
"✅ Usuario creado:",
usuario.username
);



}


}




console.log("✅ PostgreSQL conectado");


}

catch(error){

console.log(error);

}


}


iniciarBaseDatos();







// ================= CONFIG =================


app.use(cors({

origin:true,

credentials:true

}));


app.use(express.json());


app.use(express.urlencoded({

extended:true

}));



app.use(session({

secret:"BuenosAiresRP2026",

resave:false,

saveUninitialized:false,


cookie:{


maxAge:1000*60*60*24


}


}));



app.use(express.static("public"));









// ================= PERMISOS =================



function esDueno(usuario){

return usuario &&
usuario.role==="Dueño";

}



function puedeGestionarStaff(usuario){

return usuario &&
(
usuario.role==="Dueño" ||
usuario.role==="Director Recursos Humanos"
);

}



function puedeCrearActualizacion(usuario){

return usuario &&
(
usuario.role==="Dueño" ||
usuario.role==="Owner 2"
);

}









// ================= LOGIN =================



app.post("/api/login",async(req,res)=>{


try{


const {

user,

pass

}=req.body;



const result = await pool.query(

`

SELECT *

FROM usuarios

WHERE username=$1

AND pass=$2

`,

[

user,

pass

]

);




if(result.rows.length===0){


return res.json({

success:false

});


}



const usuario=result.rows[0];




req.session.user={


id:usuario.id,

user:usuario.username,

role:usuario.role,

activity:usuario.activity


};



res.json({

success:true,

user:req.session.user

});


}



catch(error){


console.log(error);


res.status(500).json({

error:"Error servidor"

});


}


});









// ================= SESSION =================



app.get("/api/session",(req,res)=>{


if(!req.session.user){


return res.json({

logged:false

});


}



res.json({

logged:true,

user:req.session.user

});


});









// ================= STAFF =================



app.get("/api/staff",async(req,res)=>{


const result = await pool.query(

`

SELECT *

FROM usuarios

ORDER BY id ASC

`

);



res.json(result.rows);


});








// ================= AGREGAR STAFF =================



app.post("/api/staff",async(req,res)=>{


if(!esDueno(req.session.user)){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

INSERT INTO usuarios

(username,pass,role,activity)

VALUES($1,$2,$3,$4)

`,

[

req.body.user,

"1234",

req.body.role,

req.body.activity

]

);



res.json({

success:true

});


});









// ================= EDITAR STAFF =================



app.put("/api/staff/:id",async(req,res)=>{


if(!puedeGestionarStaff(req.session.user)){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

UPDATE usuarios

SET

username=$1,

role=$2,

activity=$3

WHERE id=$4

`,

[

req.body.user,

req.body.role,

req.body.activity,

req.params.id

]


);



res.json({

success:true

});


});









// ================= ELIMINAR STAFF =================



app.delete("/api/staff/:id",async(req,res)=>{


if(!esDueno(req.session.user)){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

DELETE FROM usuarios

WHERE id=$1

`,

[

req.params.id

]

);



res.json({

success:true

});


});









// ================= ACTUALIZACIONES =================



app.get("/api/posts",async(req,res)=>{


const result = await pool.query(

`

SELECT *

FROM actualizaciones

ORDER BY id DESC

`

);



res.json(result.rows);


});








app.post("/api/posts",async(req,res)=>{


if(!puedeCrearActualizacion(req.session.user)){


return res.status(403).json({

error:"Sin permisos"

});


}




const result = await pool.query(

`

INSERT INTO actualizaciones

(titulo,mensaje)

VALUES($1,$2)

RETURNING *

`,

[

req.body.titulo,

req.body.mensaje

]


);



res.json({

success:true,

post:result.rows[0]

});


});









app.delete("/api/posts/:id",async(req,res)=>{


if(!esDueno(req.session.user)){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

DELETE FROM actualizaciones

WHERE id=$1

`,

[

req.params.id

]

);



res.json({

success:true

});


});









// ================= SERVIDOR =================



app.listen(PORT,()=>{


console.log(

`🚀 Buenos Aires RP funcionando en puerto ${PORT}`

);


});
