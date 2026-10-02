const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");

const server = dgram.createSocket("udp4");

const db = {
"piyushgarg.dev": { type: "A", data: "1.2.3.4" },
"blog.piyushgarg.dev": { type: "A", data: "4.5.6.7" },
};

server.on("message", (msg, rinfo) => {
const incomingReq = dnsPacket.decode(msg);
const ipFromDb = db[incomingReq.questions[0].name];

const ans = dnsPacket.encode({
type: "response",
id: incomingReq.id,
flags: dnsPacket.AUTHORITATIVE_ANSWER,
questions: incomingReq.questions,
answers: [
{
type: ipFromDb.type,
class: "IN",
name: incomingReq.questions[0].name,
data: ipFromDb.data,
},
],
});

server.send(ans, rinfo.port, rinfo.address);
});

server.bind(53, () => console.log("DNS Server is running on port 53"));