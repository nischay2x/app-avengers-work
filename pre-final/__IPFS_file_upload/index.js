const IPFS = require('ipfs-core');
const fileUpload = require('express-fileupload');
const express = require('express');
const app = express();
const fs = require('fs');

let ipfsClient = null;
async function initiateIPFS(){
  if(!ipfsClient)
  ipfsClient = await IPFS.create();
}
initiateIPFS();

app.set('view engine', 'ejs');
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render('home');
});

app.post("/upload", async(req, res) => {
  const file = req.files.file;
  const fileName = req.body.fileName;
  
  if(!file || !fileName) return res.sendStatus(406);
  const filePath = `files/${fileName}-${new Date().getTime()}`;

  file.mv(filePath, async(err) => {
    if(err) return res.status(500).send("Unable to save file");
    upload(filePath);
    return res.status(200).json({
      msg : `Uploading ${fileName}, this may take sometime depending upon file size.`
    });
  })
})


async function upload(filePath) {
  const file = fs.readFileSync(filePath);
  try {
    const addedFile = await ipfsClient.add(file);
    fs.unlink(filePath, async(err) => {
      if(err) console.log(err);
    })
    console.log("file path " +addedFile.path);
  } catch (error) {
    console.log(error);
  }
}

app.listen(3000, (err) => {
  if (err) console.log(err);
  else console.log("Server Started");
})

  // file.mv(filePath, async (err) => {
  //   if (err) {
  //     console.log(err);
  //     return res.status(500).send(err);
  //   }

  //   try {
  //     const fileHash = await upload(fileName, filePath);
  //     if(fileHash){ 
  //       fs.unlink(filePath, (err) => {
  //         if (err) console.log(err);
  //       });
  //       return res.render('upload', { fileName, fileHash });
  //     } 
  //     return res.sendStatus(500);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // })