const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");

const client = dgram.createSocket("udp4");

const query = dnsPacket.encode({
    id: 1234,
    type: "query",
    flags: 0,
    questions: [
        {
            name: "google.com",
            type: "A"
        }
    ]
});

client.send(
    query,
    5354,
    "127.0.0.1",
    (error) => {
        if (error) {
            console.error("Send error:", error);
            client.close();
            return;
        }

        console.log("DNS query sent");
    }
);

client.on("message", (message) => {

    const response = dnsPacket.decode(message);

    console.log("DNS Response:");
    console.dir(response, { depth: null });

    client.close();
});