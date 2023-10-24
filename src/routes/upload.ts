import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { FastifyInstance } from "fastify";
import { promisify } from "node:util";

const pump = promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 26_214_000, //5mb(5.242.800) X 5 = valor resultado do fileSize 26.214.000.
      },
    });
    if (!upload) {
      return reply.status(400).send();
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/;
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype);
    if (!isValidFileFormat) {
      return reply.status(400).send();
    }

    const fileId = randomUUID();
    const extension = extname(upload.filename);
    const fileName = fileId.concat(extension);

    const writeStream = createWriteStream(
      resolve(__dirname, "../../uploads/", fileName)
    );
    // acima usar servicos de upload pois salvar assim na memoria nao e bom
    // Amazon S3, Google GCS, CLoudflare R2

    await pump(upload.file, writeStream);

    const fullUrl = request.protocol.concat("://").concat(request.hostname);
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString();

    return { fileUrl };
  });
}
