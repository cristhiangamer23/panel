const express = require("express");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");


const app = express();


const PORT = process.env.PORT || 10000;



// ================= CONFIG =================


app.use(cors());


app.use(express.json());


app.use(express.urlencoded({
    extended:true
}));



app.use(session({

    secret:"BuenosAiresRP-Panel-2026",

    resave:false,

    saveUninitialized:false,

    cookie:{
        maxAge:1000*60*60*24
    }

}));



// Archivos públicos

app.use(express.static("public"));




// ================= FUNCIONES =================


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
        x.user===user &&
        x.pass===pass
    );



    if(!account){


        return res.json({

            success:false,

            message:"Usuario o contraseña incorrectos"

        });


    }



    req.session.user={

        user:account.user,

        role:account.role,

        activity:account.activity

    };



    res.json({

        success:true,

        user:req.session.user

    });



});







// ================= VERIFICAR SESION =================



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





// ================= CERRAR SESION =================


app.post("/api/logout",(req,res)=>{


    req.session.destroy();


    res.json({

        success:true

    });


});






// ================= INICIAR SERVIDOR =================



app.listen(PORT,()=>{


console.log(
`Servidor Buenos Aires RP activo en puerto ${PORT}`
);


});
