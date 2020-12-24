const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const router = express.Router();
var { exec, spawn } = require("child_process");

app.use(express.json());
app.use(express.urlencoded());
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.post("/run", (req, res) => {
  const { imageName } = req.body;
  const containers = {
    "ubuntu:18.04": "ubuntu",
    "hello-world": "hello",
    centos: "cent",
  };
  exec(
    `sudo docker run --name ${containers[imageName]} -i -d ${imageName}`,
    (error, stdout, stderr) => {
      if (error) return res.json(error);
      if (stdout) return res.json(stdout);
      if (stderr) return res.json(stderr);
    }
  );
  return;
});

app.post("/stop", (req, res) => {
  const { containerName } = req.body;
  exec(
    `sudo docker container stop ${containerName}`,
    (error, stdout, stderr) => {
      if (error) return res.json(error);
      if (stderr) return res.json(stderr);
      if (stdout) {
        exec(`sudo docker rm ${containerName}`, (error, stdout, stderr) => {
          if (error) return res.json(error);
          if (stderr) return res.json(stderr);
          if (stdout) {
            return res.json(stdout);
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

app.post("/createuser", (req, res) => {
  const { username, password } = req.body;
  exec(`mkpasswd ${password}`, (err, stdout, stderr) => {
    if (stdout) {
      const hashpw = stdout.split("\n")[0];
      exec(`sudo useradd -m -p ${hashpw} -s /bin/bash ${username}`, () => {
        return res.json(username);
      });
    }
  });
});

app.post("/deleteuser", (req, res) => {
  const { username } = req.body;
  exec(`sudo deluser --remove-home ${username}`, (err, stdout, stderr) => {
    if (stdout) {
      return res.json(stdout)
    }
  });
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
