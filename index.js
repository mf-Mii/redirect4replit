const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');

const allowSetup = false;


app.use(express.json());
const server = app.listen(3000, function(){
  console.log("Server booted! Now working to PORT"+server.address().port);
});

const db = new sqlite3.Database("./redirect.db");

app.get("/*", function(req,res,next){
  let t = req.originalUrl;
  console.log("URL="+t+", isAPI="+(/^\/system\//.test(t)));
  if(t=="/"){
    res.redirect(301, "https://mfmii.work/domain/r.mfmii.work");
  }
  else if(t=="/favicon.ico"){
    res.status(404);
  }else
  if(/^\/system\//.test(t)){
    getApi(req,res,next);
  }
  else{
    redirect(t, res);
  }
});

function getApi(req,res,next){
  let t = req.originalUrl.replace(/^\/system\//, '');
  console.log("/system/"+t);
  
  if(t=="setup"&&allowSetup){
    console.log("Setup now...");
    db.serialize(()=>{
      db.run("CREATE TABLE IF NOT EXISTS `redirect`(`from` VARCHAR(200) NOT NULL, `to` VARCHAR(250) NOT NULL , `tmp` BOOLEAN NOT NULL DEFAULT '0', PRIMARY KEY (`from`));");
    });
    
    res.json({"status":"success"});
    console.log("Setup success");
  }else if(t=="status"){
    res.send("ok");
  }else{
    redirectApi("/"+t,res);
  }
}

app.post("/system/:a", function(req,res,next){
  let a = req.params.a;
  if(a=="add-page"){
    let f = req.body.from;
    let t = req.body.to;
    let tm = req.body.tmp;
    let p = req.body.pass;
    console.log("POST /system/add-page "+f+" -> "+t+"("+tm+")");
    if(p===process.env.PASS_ADD){
      db.serialize(()=>{
        let stmt = db.prepare("SELECT COUNT(*) AS cnt FROM `redirect` WHERE `from`=?;");
        let exists = false;
        stmt.get(f, function(err, row){
          exists = (row.cnt!=0);
          if(exists){
            stmt.finalize();
            res.json({"status":"error","message": "Already Exists"});
          }else{
            stmt = db.prepare("INSERT INTO `redirect` (`from`,`to`,`tmp`) VALUES (?,?,?);");
            stmt.run(f,t,tm);
            stmt.finalize();
            res.json({"status":"success"});
          }
        });
      });
    }
  }else if(a=="delete-page"){
    let f = req.body.from;
    let p = req.body.pass;
    console.log("POST /system/delete-page "+f);
    if(p===process.env.PASS_DELETE) {
      db.serialize(()=>{
        let exists = false;
        let stmt = db.prepare("SELECT COUNT(*) AS cnt FROM `redirect` WHERE `from`=?;");
        stmt.get(f, function(err, row){
          exists = row.cnt!=0;
          if(!exists){
            stmt.finalize();
            res.json({"status":"success","message":"URL isn't registered"});
          }else{
            stmt = db.prepare("DELETE FROM `redirect` WHERE `from`=?;");
            stmt.run(f);
            stmt.finalize();
            res.json({"status":"success"});
          }
        });
      })
    }
  }
});

function redirect(from,res){
  console.log("Redirect: FROM="+from);
  let to = null;
  let tmp = -1;
  
  db.serialize(()=>{
    let stmt = db.prepare("SELECT * FROM `redirect` WHERE `from`=?");
    stmt.get(from, function(err,row){
      if(row){
        to = row.to;
        tmp = row.tmp;
      }
      stmt.finalize();
      console.log("Redirect To:"+to+"("+tmp+")");
      if (to!=null){
        res.redirect(tmp==1?302:301, to);
      }else{
        console.log("The url is not registered!");
        res.redirect(302, "https://mfmii.work/404?s=redirect");
      }
    });

  });
}

function redirectApi(from,res){
  let to = null;
  let tmp = 0;
  db.serialize(()=>{
    let stmt = db.prepare("SELECT * FROM `redirect` WHERE `from`=?");
    stmt.get(from, function(err,row){
      if(row){
        to = row.to;
        tmp = row.tmp;
      }
      
      stmt.finalize();
      console.log("Redirect API:"+to+"("+tmp+")");
      if (to!=null){
        res.json({"from":from,"to":to,"temp":tmp!=0});
      }else{
        res.json({"from":from,"to":null});
      }
    });

  });
}