console.log("1. Starting server");

const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");

console.log("2. dns-packet loaded");

require("dotenv").config();

require("./config/db");

const { findRecord, setInCache } = require("./record");
console.log("3. record.js loaded");
const { resolveFromUpstream } = require("./resolver");
console.log("4. resolver.js loaded");

const server = dgram.createSocket("udp4");
console.log("5. UDP socket created");


server.on("message", async (msg, rinfo) =>{
    try{

    
    const request = await dnsPacket.decode(msg);
    console.log("DNS Query:", request.questions);

    const question = request.questions[0];

    const { name, type } = question;
    const localRecord = await findRecord(name, type);
    

    if (localRecord){
      console.log(`Found local record for ${name}:`, localRecord);

      setInCache(name, type, localRecord);

     const response = {
        id: request.id,
        type: "response",
        flags: dnsPacket.AUTHORITATIVE_ANSWER,
        questions: request.questions,
        answers: [
            {
                        type: "A",
                        name: localRecord.name,
                        ttl: localRecord.ttl,
                        class: "IN",
                        data: localRecord.value
                    }
        ]
    }

    const encodedResponse = dnsPacket.encode(response);

            server.send(
                encodedResponse,
                rinfo.port,
                rinfo.address
            );
    }else{
        console.log(`No local record found for ${name}. Forwarding request to upstream DNS server.`);
        const upstreamResponse =
                await resolveFromUpstream(msg);

            const DecodedResponse = dnsPacket.decode(upstreamResponse);

            const answers = {
                name: DecodedResponse.answers[0].name,
                type: DecodedResponse.answers[0].type,
                value: DecodedResponse.answers[0].data,
                ttl: DecodedResponse.answers[0].ttl,
            }

            console.log(`Upstream response for ${name}:`, answers);

            // upstreamResponse is already a DNS packet Buffer.
            setInCache(name, type, answers);
            console.log(`Upstream response received for ${name}. Sending back to client.`);
            server.send(
                upstreamResponse,
                rinfo.port,
                rinfo.address
            );
    }
    }catch (error) {
         console.error("DNS processing error:", error);
 
    }
} );

console.log("6. Binding server...");

server.on("error", (error) => {
    console.error("UDP SERVER ERROR:", error);
});

server.bind(process.env.PORT || 5354, "0.0.0.0", () => {
    console.log("DNS server running on UDP port 5354");
});