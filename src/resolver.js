const dgram = require("node:dgram");

const UPSTREAM_DNS = "8.8.8.8";
const UPSTREAM_PORT = 53;

function resolveFromUpstream(message){
    return new Promise((resolve, reject) =>{
        const socket = dgram.createSocket("udp4");
        
         const timeout = setTimeout(() => {
            socket.close();
            reject(new Error("Upstream DNS request timed out"));
        }, 3000);
        // recive response from upstream DNS server
        socket.on("message", (response) => {
            clearTimeout(timeout);
            socket.close();
            resolve(response);
         });
         // recive error from upstream DNS server
        socket.on("error", (err)=>{
            clearTimeout(timeout);
            socket.close();
            reject(err);
        });

       // Send original DNS packet to 8.8.8.8
        socket.send(
            message,
            UPSTREAM_PORT,
            UPSTREAM_DNS,
            (error) => {
                if (error) {
                    clearTimeout(timeout);
                    socket.close();

                    reject(error);
                }
            }
        );

})
}

module.exports = {
    resolveFromUpstream
};

