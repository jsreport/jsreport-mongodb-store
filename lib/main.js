module.exports = function (reporter, definition) {

    if (reporter.options.connectionString.name.toLowerCase() === "mongodb") {
        reporter.documentStore.provider = new (require("./mongoProvider"))(reporter.documentStore.model, reporter.options);
    }

    if (reporter.options.blobStorage === "gridFS") {
        reporter.blobStorage = new (require("./gridFSBlobStorage"))(reporter.options.connectionString);
    }
};