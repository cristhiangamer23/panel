const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { Pool } = require("pg");


const app = express();

const PORT = process.env.PORT || 10000;


// ================= POSTGRESQL =================


const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
        rejectUnauthorized:false
    }

});



// ================= CREAR TABLAS =================


async function setupDatabase(){

try{


await pool.query(`

CREATE TABLE IF NOT EXISTS usuarios (

id SERIAL PRIMARY KEY,

user VARCHAR(50) UNIQUE NOT NULL,

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



// Crear usuario principal

const existe =
await pool.query(

"SELECT * FROM usuarios WHERE user='Cristhian'"

);



if(existe.rows.length===0){


await pool.query(

`

INSERT INTO usuarios
(user,pass,role,activity)

VALUES($1,$2,$3,$4)

`,

[

"Cristhian",

"2040@",

"Dueño",

"Activo"

]


);


console.log("Usuario Dueño creado");


}



console.log("✅ Base de datos conectada");


}

catch(error){

console.log(
"Error DB:",
error
);

}


}


setupDatabase();





// ================= MIDDLEWARE =================


app.use(cors({

origin:true,

credentials:true

}));


app.use(express.json());


app.use(express.urlencoded({

extended:true

}));



app.use(session({

secret:"BuenosAiresRP-Panel",

resave:false,

saveUninitialized:false,

cookie:{

maxAge:1000*60*60*24

}

}));


app.use(express.static("public"));






// ================= LOGIN =================



app.post("/api/login",async(req,res)=>{


try{


const {
user,
pass
}=req.body;



const result =
await pool.query(

`

SELECT *

FROM usuarios

WHERE user=$1

AND pass=$2

`,

[
user,
pass
]

);



if(result.rows.length===0){


return res.json({

success:false,

message:"Datos incorrectos"

});


}



const usuario =
result.rows[0];



req.session.user={

id:usuario.id,

user:usuario.user,

role:usuario.role,

activity:usuario.activity

};



res.json({

success:true,

user:req.session.user

});



}

catch(error){

res.status(500).json({

error:"Error servidor"

});

}


});








// ================= SESION =================



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






// ================= LOGOUT =================



app.post("/api/logout",(req,res)=>{


req.session.destroy();


res.json({

success:true

});


});









// ================= STAFF =================



app.get("/api/staff",async(req,res)=>{


const result =
await pool.query(

`

SELECT *

FROM usuarios

ORDER BY id ASC

`

);



res.json(result.rows);


});






// CREAR STAFF


app.post("/api/staff",async(req,res)=>{


if(!req.session.user ||
req.session.user.role!=="Dueño"){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

INSERT INTO usuarios

(user,pass,role,activity)

VALUES

($1,$2,$3,$4)

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







// EDITAR STAFF



app.put("/api/staff/:id",async(req,res)=>{


if(!req.session.user ||
req.session.user.role!=="Dueño"){


return res.status(403).json({

error:"Sin permisos"

});


}




await pool.query(

`

UPDATE usuarios

SET

user=$1,

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







// ELIMINAR STAFF



app.delete("/api/staff/:id",async(req,res)=>{


if(!req.session.user ||
req.session.user.role!=="Dueño"){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

DELETE FROM usuarios

WHERE id=$1

`,

[req.params.id]

);



res.json({

success:true

});


});









// ================= ACTUALIZACIONES =================





app.get("/api/posts",async(req,res)=>{


const result =
await pool.query(

`

SELECT *

FROM actualizaciones

ORDER BY id DESC

`

);



res.json(result.rows);


});







app.post("/api/posts",async(req,res)=>{


if(!req.session.user ||
req.session.user.role!=="Dueño"){


return res.status(403).json({

error:"Sin permisos"

});


}





const result =
await pool.query(

`

INSERT INTO actualizaciones

(titulo,mensaje)

VALUES

($1,$2)

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


if(!req.session.user ||
req.session.user.role!=="Dueño"){


return res.status(403).json({

error:"Sin permisos"

});


}



await pool.query(

`

DELETE FROM actualizaciones

WHERE id=$1

`,

[req.params.id]

);



res.json({

success:true

});


});









// ================= SERVIDOR =================



app.listen(PORT,()=>{


console.log(

`🚀 Buenos Aires RP Panel funcionando en puerto ${PORT}`

);


});
