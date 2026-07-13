const express = require("express");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");


const app = express();

const PORT = process.env.PORT || 10000;



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

    secret:"BuenosAiresRP-Panel-2026",

    resave:false,

    saveUninitialized:false,

    cookie:{
        maxAge:1000 * 60 * 60 * 24
    }

}));



app.use(express.static("public"));




// ================= ARCHIVOS =================


function readJSON(file){


    if(!fs.existsSync(file)){

        fs.writeFileSync(
            file,
            "[]"
        );

    }


    return JSON.parse(
        fs.readFileSync(file,"utf8")
    );


}



function saveJSON(file,data){


    fs.writeFileSync(

        file,

        JSON.stringify(
            data,
            null,
            2
        )

    );


}



// ================= LOGIN =================


app.post("/api/login",(req,res)=>{


    const {
        user,
        pass
    } = req.body;



    let users =
    readJSON("usuarios.json");



    let account =
    users.find(
        x =>
        x.user === user &&
        x.pass === pass
    );



    if(!account){

        return res.json({

            success:false,

            message:"Usuario o contraseña incorrectos"

        });

    }



    req.session.user={

        id:account.id,

        user:account.user,

        role:account.role,

        activity:account.activity

    };



    res.json({

        success:true,

        user:req.session.user

    });


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


// VER STAFF

app.get("/api/staff",(req,res)=>{


    if(!req.session.user){

        return res.status(401).json({

            error:"No autorizado"

        });

    }



    res.json(
        readJSON("usuarios.json")
    );


});





// AGREGAR STAFF


app.post("/api/staff",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let users =
    readJSON("usuarios.json");



    let nuevo={

        id:Date.now(),

        user:req.body.user,

        pass:req.body.pass,

        role:req.body.role,

        activity:req.body.activity || "Inactivo"

    };



    users.push(nuevo);



    saveJSON(
        "usuarios.json",
        users
    );



    res.json({

        success:true

    });


});





// EDITAR STAFF


app.put("/api/staff/:id",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let users =
    readJSON("usuarios.json");



    let user =
    users.find(
        x=>x.id==req.params.id
    );



    if(!user){

        return res.json({

            error:"No encontrado"

        });

    }



    user.user =
    req.body.user || user.user;


    user.role =
    req.body.role || user.role;


    user.activity =
    req.body.activity || user.activity;



    if(req.body.pass){

        user.pass=req.body.pass;

    }



    saveJSON(
        "usuarios.json",
        users
    );



    res.json({

        success:true

    });


});





// ELIMINAR STAFF


app.delete("/api/staff/:id",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let users =
    readJSON("usuarios.json");



    users =
    users.filter(
        x=>x.id!=req.params.id
    );



    saveJSON(
        "usuarios.json",
        users
    );



    res.json({

        success:true

    });


});





// CAMBIAR ACTIVIDAD


app.put("/api/staff/activity/:id",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let users =
    readJSON("usuarios.json");



    let user =
    users.find(
        x=>x.id==req.params.id
    );



    if(user){

        user.activity=req.body.activity;

    }



    saveJSON(
        "usuarios.json",
        users
    );



    res.json({

        success:true

    });


});





// ================= ACTUALIZACIONES =================



app.get("/api/posts",(req,res)=>{


    res.json(
        readJSON("posts.json")
    );


});





app.post("/api/posts",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let posts =
    readJSON("posts.json");



    let post={

        id:Date.now(),

        titulo:req.body.titulo,

        mensaje:req.body.mensaje,

        fecha:new Date().toLocaleString()

    };



    posts.push(post);



    saveJSON(
        "posts.json",
        posts
    );



    res.json({

        success:true,

        post

    });


});





app.delete("/api/posts/:id",(req,res)=>{


    if(!req.session.user ||
       req.session.user.role!=="Dueño"){

        return res.status(403).json({

            error:"Sin permisos"

        });

    }



    let posts =
    readJSON("posts.json");



    posts =
    posts.filter(
        x=>x.id!=req.params.id
    );



    saveJSON(
        "posts.json",
        posts
    );



    res.json({

        success:true

    });


});




// ================= INICIO =================


app.listen(PORT,()=>{


console.log(
`🚀 Buenos Aires RP Panel activo en puerto ${PORT}`
);


});
