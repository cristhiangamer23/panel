const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));


// ===============================
// DATABASE RENDER POSTGRES
// ===============================

console.log("DATABASE_URL:", process.env.DATABASE_URL);


const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
        rejectUnauthorized:false
    }

});



// ===============================
// CREAR TABLAS
// ===============================

async function iniciar(){

    await pool.query(`

    CREATE TABLE IF NOT EXISTS users(

        id SERIAL PRIMARY KEY,

        username TEXT NOT NULL,

        password TEXT,

        role TEXT NOT NULL

    );


    CREATE TABLE IF NOT EXISTS posts(

        id SERIAL PRIMARY KEY,

        titulo TEXT,

        mensaje TEXT,

        fecha TEXT

    );

    `);



    // Crear usuarios con acceso al panel

    const accesos=[

        ["Cristhian","2040@","Dueño"],

        ["Zarl","2050@","Owner 2"],

        ["Alan","2060@","mod1"]

    ];



    for(const u of accesos){


        const existe = await pool.query(

        `
        SELECT *
        FROM users
        WHERE username=$1
        `,

        [u[0]]

        );


        if(existe.rows.length===0){


            await pool.query(

            `
            INSERT INTO users(username,password,role)

            VALUES($1,$2,$3)

            `,

            u

            );


        }


    }



    console.log("Base de datos lista");


}


iniciar();





// ===============================
// LOGIN
// ===============================

app.post("/api/login", async(req,res)=>{


    const {user,pass}=req.body;



    const result = await pool.query(

    `
    SELECT id,username,password,role

    FROM users

    WHERE username=$1

    AND password=$2

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



    res.json({

        success:true,

        user:result.rows[0]

    });



});





// ===============================
// VERIFICAR DUEÑO
// ===============================

async function esDueño(user,pass){


    const result = await pool.query(

    `
    SELECT *

    FROM users

    WHERE username=$1

    AND password=$2

    AND role='Dueño'

    `,

    [
        user,
        pass
    ]

    );


    return result.rows.length>0;


}
// ===============================
// OBTENER STAFF
// ===============================

app.get("/api/users", async(req,res)=>{


    const result = await pool.query(

    `
    SELECT id,username,role
    FROM users
    ORDER BY id

    `

    );


    res.json(result.rows);


});








// ===============================
// AGREGAR STAFF (SIN PASSWORD)
// ===============================

app.post("/api/users", async(req,res)=>{


    const {adminUser,adminPass,user,role}=req.body;



    if(!await esDueño(adminUser,adminPass)){


        return res.json({

            success:false,

            message:"Sin permisos"

        });


    }



    if(!role){


        return res.json({

            success:false,

            message:"El rango es obligatorio"

        });


    }



    await pool.query(

    `
    INSERT INTO users(username,role)

    VALUES($1,$2)

    `,

    [

        user || "Sin nombre",

        role

    ]

    );



    res.json({

        success:true

    });



});









// ===============================
// EDITAR STAFF
// ===============================

app.put("/api/users/:id", async(req,res)=>{


    const {adminUser,adminPass,user,role}=req.body;



    if(!await esDueño(adminUser,adminPass)){


        return res.json({

            success:false,

            message:"Sin permisos"

        });


    }




    if(!role){


        return res.json({

            success:false,

            message:"El rango es obligatorio"

        });


    }




    await pool.query(

    `
    UPDATE users

    SET username=$1, role=$2

    WHERE id=$3

    `,

    [

        user || "Sin nombre",

        role,

        req.params.id

    ]

    );



    res.json({

        success:true

    });


});









// ===============================
// ELIMINAR STAFF
// ===============================

app.delete("/api/users/:id", async(req,res)=>{


    const {adminUser,adminPass}=req.body;



    if(!await esDueño(adminUser,adminPass)){


        return res.json({

            success:false

        });


    }



    await pool.query(

    `
    DELETE FROM users

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









// ===============================
// ACTUALIZACIONES
// ===============================


app.get("/api/posts",async(req,res)=>{


    const result = await pool.query(

    `
    SELECT *

    FROM posts

    ORDER BY id DESC

    `

    );


    res.json(result.rows);


});









// CREAR ACTUALIZACION

app.post("/api/posts",async(req,res)=>{


    const {adminUser,adminPass,titulo,mensaje}=req.body;



    if(!await esDueño(adminUser,adminPass)){


        return res.json({

            success:false,

            message:"Sin permisos"

        });


    }




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








// ELIMINAR ACTUALIZACION

app.delete("/api/posts/:id",async(req,res)=>{


    const {adminUser,adminPass}=req.body;



    if(!await esDueño(adminUser,adminPass)){


        return res.json({

            success:false

        });


    }




    await pool.query(

    `
    DELETE FROM posts

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









// ===============================
// INDEX
// ===============================


app.get("*",(req,res)=>{


    res.sendFile(

        path.join(__dirname,"public","index.html")

    );


});







const PORT = process.env.PORT || 10000;


app.listen(PORT,()=>{


    console.log(
        "Servidor activo en puerto "+PORT
    );


});
