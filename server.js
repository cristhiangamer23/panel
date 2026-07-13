const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");


const app = express();


app.use(cors());

app.use(express.json());

app.use(express.static("public"));



// =========================
// POSTGRESQL
// =========================

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
        rejectUnauthorized:false
    }

});



async function iniciar(){

    await pool.query(`

    CREATE TABLE IF NOT EXISTS users(

        id SERIAL PRIMARY KEY,

        username TEXT NOT NULL,

        role TEXT NOT NULL

    );


    CREATE TABLE IF NOT EXISTS posts(

        id SERIAL PRIMARY KEY,

        titulo TEXT NOT NULL,

        mensaje TEXT NOT NULL,

        fecha TEXT NOT NULL

    );

    `);



    // Usuarios principales

    let usuarios = await pool.query(
        "SELECT * FROM users"
    );


    if(usuarios.rows.length === 0){

        await pool.query(`

        INSERT INTO users(username,role)

        VALUES

        ('Cristhian','Dueño'),

        ('Zarl','Owner 2'),

        ('Alan','Mod 1')

        `);

    }


    console.log("Base de datos lista");

}


iniciar();




// =========================
// LOGIN
// =========================


app.post("/api/login", async(req,res)=>{


    const {user,pass}=req.body;



    // Accesos fijos

    const accesos=[

        {
            user:"Cristhian",
            pass:"2040@",
            role:"Dueño"
        },

        {
            user:"Zarl",
            pass:"2050@",
            role:"Owner 2"
        },

        {
            user:"Alan",
            pass:"2060@",
            role:"Mod 1"
        }

    ];



    const encontrado =
    accesos.find(x=>
        x.user===user &&
        x.pass===pass
    );



    if(!encontrado){

        return res.json({
            success:false
        });

    }



    res.json({

        success:true,

        user:{

            username:encontrado.user,

            role:encontrado.role,

            password:encontrado.pass

        }

    });


});




// =========================
// USUARIOS
// =========================


// Ver usuarios

app.get("/api/users", async(req,res)=>{


    let data=await pool.query(

        "SELECT * FROM users ORDER BY id"

    );


    res.json(data.rows);


});




// Crear usuario STAFF

app.post("/api/users",async(req,res)=>{


    const {user,role}=req.body;



    if(!role){

        return res.json({

            success:false,

            message:"Rango obligatorio"

        });

    }



    await pool.query(

        "INSERT INTO users(username,role) VALUES($1,$2)",

        [user || "Sin nombre",role]

    );



    res.json({

        success:true

    });



});





// Editar usuario

app.put("/api/users/:id",async(req,res)=>{


    const id=req.params.id;


    const {user,role}=req.body;



    if(!role){

        return res.json({

            success:false,

            message:"Rango obligatorio"

        });

    }



    await pool.query(

        `UPDATE users

        SET username=$1, role=$2

        WHERE id=$3`,

        [

            user || "Sin nombre",

            role,

            id

        ]

    );



    res.json({

        success:true

    });


});





// Eliminar usuario

app.delete("/api/users/:id",async(req,res)=>{


    await pool.query(

        "DELETE FROM users WHERE id=$1",

        [req.params.id]

    );



    res.json({

        success:true

    });


});




// =========================
// ACTUALIZACIONES
// =========================


app.get("/api/posts",async(req,res)=>{


    let data=await pool.query(

        "SELECT * FROM posts ORDER BY id DESC"

    );


    res.json(data.rows);


});





app.post("/api/posts",async(req,res)=>{


    const {titulo,mensaje}=req.body;



    let fecha =
    new Date().toLocaleString();



    await pool.query(

        `INSERT INTO posts

        (titulo,mensaje,fecha)

        VALUES($1,$2,$3)`,

        [

            titulo,

            mensaje,

            fecha

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




// =========================
// WEBHOOK DISCORD
// =========================


app.post("/api/webhook",async(req,res)=>{


    const post=req.body;



    await fetch(process.env.WEBHOOK_URL,{

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },


        body:JSON.stringify({

            username:"ACTUALIZACION | WEB",


            embeds:[{

                title:"📢 ACTUALIZACIÓN OFICIAL",

                description:

                "**"+post.titulo+"**\n\n"+post.mensaje,


                color:0x2b2d31,


                footer:{

                    text:

                    "Buenos Aires RP • "+post.fecha

                }

            }]


        })

    });



    res.json({

        success:true

    });


});




// =========================
// INDEX
// =========================


app.get("/*splat",(req,res)=>{


    res.sendFile(

        path.join(

            __dirname,

            "public",

            "index.html"

        )

    );


});





const PORT =
process.env.PORT || 10000;



app.listen(PORT,()=>{

    console.log(
        "Servidor activo en puerto "+PORT
    );

});
