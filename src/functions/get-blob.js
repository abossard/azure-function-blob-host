const { app } = require('@azure/functions');
const { BlobServiceClient, RestError } = require('@azure/storage-blob');

// Replace with your actual connection string
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

app.http('getBlobFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'get-blob/{*blobPath}',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const blobPath = request.params.blobPath;
        const containerName = 'files';

        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            if (!blobPath || blobPath === '/') {
                // List the first 100 blobs in the container
                let blobs = [];
                for await (const blob of containerClient.listBlobsFlat({ maxPageSize: 100 })) {
                    blobs.push(blob.name);
                }
                return {
                    status: 200,
                    body: JSON.stringify(blobs),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            } else {
                const blobClient = containerClient.getBlobClient(blobPath);
                const blobProperties = await blobClient.getProperties();
                const downloaded = await blobClient.downloadToBuffer();

                return {
                    status: 200,
                    body: downloaded,
                    headers: {
                        'Content-Type': blobProperties.contentType || 'application/octet-stream',
                        'Content-Disposition': `attachment; filename="${encodeURIComponent(blobPath)}"`
                    }
                };
            }
        } catch (error) {
            if (error instanceof RestError && error.statusCode === 404) {
                return {
                    status: 404,
                    body: 'Blob not found'
                };
            } else {
                context.log.error('Error processing request:', error.message);
                return {
                    status: 500,
                    body: 'Error processing request'
                };
            }
        }
    }
});
