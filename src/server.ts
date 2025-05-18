import "reflect-metadata";
import 'dotenv/config';
import * as http from "http";
import cluster from "node:cluster";
import { cpus } from "node:os";
import app from "./app";
import { DS } from "./database/datasource";

const isCluster = process.env.IS_CLUSTER || "false";
const PORT = process.env.PORT || 3000;
const numCPUs = cpus().length

// Clustering cpu multi threads
if (isCluster === "true") {
  if (cluster.isMaster) {
    console.log(`Primary process ${process.pid} is running`);
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    //Running apps with cluster
    DS.initialize().then(async () => {
      const server = http.createServer(new app().instance);
      server.listen(PORT, () => {
        console.log(`⚡️[Server ${process.env.NODE_ENV}] [Worker CPUs pid ${process.pid}] running on PORT ${process.env.PORT}`);
      });
    }).catch((err) => {
      throw new Error(err)
    })
  }
} else {
  //Running apps without cluster
  DS.initialize().then(async () => {
    const server = http.createServer(new app().instance);
    server.listen(PORT, () => {
      console.log(`⚡️[Server ${process.env.NODE_ENV}] running on PORT ${process.env.PORT}`);
    });
  }).catch((err) => {
    throw new Error(err)
  })
}

