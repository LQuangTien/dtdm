const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const router = express.Router();
var { exec } = require("child_process");

app.use(express.json());
app.use(express.urlencoded());
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.post("/run", (req, res) => {
  const { imageName } = req.body;
  let containerName;
  if (imageName === "ubuntu:18.04") {
    containerName = "ubuntu";
  }
  exec(
    `sudo docker run --name ${containerName} -t -d ${imageName}`,
    (error, stdout, stderr) => {
      if (stdout) {
        console.log("stdout", stdout);
      }
    }
  );
  return;
});

app.post("/stop", (req, res) => {
  const { containerName } = req.body;
  exec(
    `sudo docker container stop ${containerName}`,
    (error, stdout, stderr) => {
      if (stdout) {
        exec(`sudo docker rm ${containerName}`, (error, stdout, stderr) => {
          if (stdout) {
            return;
          }
        });
      }
    }
  );
});

app.get("/images", (req, res) => {
  exec("sudo docker image ls", (err, stdout, stderr) => {
    return res.json(stdout);
  });
});

app.get("/containers", (req, res) => {
  exec("sudo docker ps", (err, stdout, stderr) => {
    return res.json(stdout);
  });
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function createDocker() {
  exec("sudo docker run --name hello1 hello-world", (error, stdout, stderr) => {
    return stdout;
  });
}
function runDocker() {
  exec("sudo docker container start -i hello1", (error, stdout, stderr) => {
    return stdout + "";
  });
}
