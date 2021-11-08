const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');


const allowSetup = false;


app.use(express.json());
const server = app.listen(3000, function(){
  console.log("Server booted! Now working to PORT"+server.address().port);
});

const db = new sqlite3.Database("./redirect.db");

app.get("/:target", function(req,res,next){
  let t = "/"+req.params.target;
  if(t=="/favicon.ico"){
    res.status(404);
  }
  console.log(t);
  redirect(t, res);
});

app.get("/", function(req,res,next){
  res.redirect(301, "https://mfmii.work/domain/r.mfmii.work");
});

app.get("/system/:t", function(req,res,next){
  let t = req.params.t;
  console.log("/system/"+t);
  
  if(t=="setup"&&allowSetup){
    console.log("Setup now...");
    db.serialize(()=>{
      db.run("CREATE TABLE IF NOT EXISTS `redirect`(`from` VARCHAR(200) NOT NULL, `to` VARCHAR(250) NOT NULL , `tmp` BOOLEAN NOT NULL DEFAULT '0', PRIMARY KEY (`from`));");
    });
    db.close();
    res.json({"status":"success"});
    console.log("Setup success");
  }else if(t=="status"){
    res.send("ok");
    console.log("Status OK");
  }else{
    redirectApi("/"+t,res);
  }
});

app.post("/system/:a", function(req,res,next){
  let a = req.params.a;
  if(a=="add-page"){
    console.log("POST /system/add-page "+req.body);
    let f = req.body.from;
    let t = req.body.to;
    let tm = req.body.tmp;
    let p = req.body.pass;
    if(p==="MyPassword"){
      let stmt = db.prepare("INSERT INTO `redirect` (`from`,`to`,`tmp`) VALUES (?,?,?)");
      stmt.run(f,t,tm);
      db.close();
      res.send("OK");
    }
  }else if(a=="delete-page"){
    console.log("POST /system/add-page "+req.body);
    let f = req.body.from;
    let p = req.body.pass;
    if(p==="MyPassword") {
      let stmt = db.prepare("DELETE FROM `redirect` WHERE `from`=?;");
      stmt.run(f);
      db.close();
      res.send("OK");
    }
  }
});

function redirect(from,res){
  console.log("Redirect: FROM="+from);
  let to = null;
  let tmp = -1;

  db.serialize(()=>{
    let stmt = db.prepare("SELECT * FROM `redirect` WHERE `from`=?");
    stmt.each(from, function(err,row){
      if(rows){
        to = row.to;
        tmp = row.tmp;
      }
    });

    stmt.finalize();
  });
  
  console.log("Redirect To:"+to+"("+tmp+")");
  if (to!=null){
    res.redirect(tmp==1?302:301, to);
  }else{
    console.log("The url is not registered!");
    res.redirect(302, "https://mfmii.work/404?s=redirect");
  }
}

function redirectApi(from,res){
  let to = null;
  let tmp = 0;
  db.serialize(()=>{
    let stmt = db.prepare("SELECT * FROM `redirect` WHERE `from`=?");
    stmt.each(from, function(err,row){
      to = row.to;
      tmp = row.tmp;
    },
    function (err,count){

    });
  });
  db.close();
  console.log("Redirect API:"+to+"("+tmp+")");
  if (to!=null){
    res.json({"from":from,"to":to,"temp_302":tmp==1?true:false});
  }else{
    res.json({"from":from,"to":null});
  }
}