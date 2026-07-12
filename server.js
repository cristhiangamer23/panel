const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");


const app = express();


app.use(cors());
app.use(express.json());

app.use(express.static("public"));



const pool = new Pool({

connectionString: process.env.DATABASE_URL,

ssl:{
rejectUnauthorized:false
}

});




// CREAR TABLAS

async function iniciar(){

await pool.query(`

CREATE TABLE IF NOT EXISTS users(

id SERIAL PRIMARY KEY,
username TEXT UNIQUE,
password TEXT,
role TEXT

);


CREATE TABLE IF NOT EXISTS posts(

id SERIAL PRIMARY KEY,
titulo TEXT,
mensaje TEXT,
fecha TEXT

);

`);



// Usuarios iniciales

let usuarios=[

["Cristhian","2040@","Dueño"],

["Zarl","2050@","Owner 2"],

["Alan","2060@","mod1"]

];


for(let u of usuarios){

await pool.query(

`
INSERT INTO users(username,password,role)

VALUES($1,$2,$3)

ON CONFLICT(username) DO NOTHING

`,
u

);


}


console.log("Base de datos lista");


}


iniciar();




// LOGIN

app.post("/api/login",async(req,res)=>{


let {user,pass}=req.body;


let result=await pool.query(

`
SELECT * FROM users

WHERE username=$1

AND password=$2
`,

[user,pass]

);


if(result.rows.length===0){

return res.json({

success:false

});

}



res.json({

success:true,

user:result.rows[0]

});


});





// USUARIOS


app.get("/api/users",async(req,res)=>{


let result=await pool.query(

"SELECT * FROM users ORDER BY id"

);


res.json(result.rows);


});





app.post("/api/users",async(req,res)=>{


let {user,pass,role}=req.body;


await pool.query(

`
INSERT INTO users(username,password,role)

VALUES($1,$2,$3)

`,

[user,pass,role]

);


res.json({

success:true

});


});





app.delete("/api/users/:id",async(req,res)=>{


await pool.query(

"DELETE FROM users WHERE id=$1",

[req.params.id]

);


res.json({

success:true

});


});





// POSTS


app.get("/api/posts",async(req,res)=>{


let result=await pool.query(

"SELECT * FROM posts ORDER BY id DESC"

);


res.json(result.rows);


});






app.post("/api/posts",async(req,res)=>{


let {titulo,mensaje}=req.body;


await pool.query(

`

INSERT INTO posts(titulo,mensaje,fecha)

VALUES($1,$2,$3)

`,

[
titulo,
mensaje,
new Date().toLocaleString()
]

);


res.json({

success:true

});


});






app.delete("/api/posts/:id",async(req,res)=>{


await pool.query(

"DELETE FROM posts WHERE id=$1",

[req.params.id]

);


res.json({

success:true

});


});






app.get("*",(req,res)=>{

res.sendFile(

path.join(__dirname,"public","index.html")

);

});





const PORT=process.env.PORT || 10000;


app.listen(PORT,()=>{

console.log(
"Servidor activo en puerto "+PORT
);

});
