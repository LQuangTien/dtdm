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
app.post("/allow", (req, res) => {
  const { username } = req.body;
  exec(
    `sudo su - ${username} -c "ssh-keygen -t rsa -N '' -f /home/${username}/.ssh/id_rsa" && 
    sudo docker exec ubuntussh bash -c "useradd -m -p $(mkpasswd 1) -s /bin/bash ${username}" &&
    sudo docker exec ubuntussh bash -c "mkdir /home/${username}/.ssh; touch /home/${username}/.ssh/authorized_keys;" &&
    sudo docker exec ubuntussh bash -c "echo $(cat /home/${username}/.ssh/id_rsa.pub) >> /home/${username}/.ssh/authorized_keys"
    `,
    (error, stdout, stderr) => {
      if (error) {console.log(error);return res.json({error})};
      if (stderr) return res.json({stderr});
      if (stdout) return res.json(stdout);
    });
});
app.post("/denine", (req, res) => {
  const { username } = req.body;
  exec(
    `sudo rm /home/${username}/.ssh/id_rsa.pub && sudo rm /home/${username}/.ssh/id_rsa &&
     sudo docker exec ubuntussh bash -c "deluser --remove-home ${username}" `,
    (error, stdout, stderr) => {
      if (error) return res.json({error});
      if (stderr) return res.json({stderr});
      if (stdout) return res.json(stdout);
      return res.json("Xong")
    });
});

app.post("/run", (req, res) => {
  const { imageName, ram, cpu } = req.body;
  const containers = {
    "ubssh": "ubuntussh",
    "hello-world": "hello",
    "centos": "cent",
  };
  exec(
    `sudo docker run --name ${containers[imageName]} --memory="${ram}g" --cpus="${cpu}.0" -id -p 7000:22 ${imageName} && sudo docker exec ${containers[imageName]} bash -c "service ssh start"`,
    (error, stdout, stderr) => {
      if (error) return res.json(error);
      if (stderr) return res.json(`${containers[imageName]}`);
      if (stdout) {
        return res.json(`${containers[imageName]}`);
      };
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
            return res.json(`${containerName}`);
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
  exec("sudo docker stats --all --no-stream", (err, stdout, stderr) => {
    return res.json(stdout);
  });
});

app.post("/createuser", (req, res) => {
  const { username, password } = req.body;
  exec(`sudo useradd -m -p $(mkpasswd ${password}) -s /bin/bash ${username} && sudo usermod -aG sudo ${username} && sudo mkdir /home/${username}/.ssh  && sudo chmod 777 /home/${username}/.ssh`, (err, stdout, stderr) => {
    if(err) return res.json(err);
    if(stderr) return res.json(stderr);
    if(stdout)return res.json(stdout);
    return res.json(username);
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

// cho phep vo container: tao user > tao public key > chep key qua container
// xoa phep vo container: xoa user va xoa luon thu muc
