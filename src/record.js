const records =[
    {
        name: "example.com",
        type: "A",
        address: "192.168.1.1",
        ttl: 3600
    },
    {
        name: "test.com",
        type: "A",
        address: "192.168.1.2",
        ttl: 3600
    }
];

const findRecord = (name, type) => {
    return records.find(record => record.name === name && record.type === type);
};

module.exports = { findRecord };