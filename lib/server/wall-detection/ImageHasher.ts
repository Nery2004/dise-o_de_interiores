import "server-only";
import { createHash } from "node:crypto";

export class ImageHasher {
  hash(buffer: Buffer) { return createHash("sha256").update(buffer).digest("hex"); }
}
