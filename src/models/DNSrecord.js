const mongoose = require("mongoose");

const dnsRecordSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        type: {
            type: String,
            required: true,
            enum: [
                "A",
                "AAAA",
                "CNAME",
                "MX",
                "TXT",
                "NS"
            ]
        },

        value: {
            type: String,
            required: true,
            trim: true
        },

        ttl: {
            type: Number,
            required: true,
            min: 0,
            default: 300
        }
    },
    {
        timestamps: true
    }
);

dnsRecordSchema.index({
    name: 1,
    type: 1
});

const DNSRecord = mongoose.model(
    "DNSRecord",
    dnsRecordSchema
);

module.exports = DNSRecord;

