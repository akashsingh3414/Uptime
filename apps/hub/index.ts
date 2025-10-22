import { randomUUIDv7, type ServerWebSocket } from "bun";
import type { IncomingMessage, SignupIncomingMessage } from "common/types";
import { prismaClient } from "db/client";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";

const availableValidators: { validatorId: string, socket: ServerWebSocket<unknown>, publicKey: string }[] = [];
const CALLBACKS: { [callbackId: string]: (data: IncomingMessage) => void } = {};
const COST_PER_VALIDATION = 100; // lamports

console.log("Starting Hub WebSocket server...");

Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      console.log("WebSocket connection upgraded");
      return;
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  port: 8081,
  websocket: {
    async message(ws: ServerWebSocket<unknown>, message: string) {
      console.log("Message received from validator");
      const data: IncomingMessage = JSON.parse(message);

      if (data.type === "signup") {
        console.log("Validator signup attempt:", data.data.publicKey);
        const verified = await verifyMessage(
          `Signed message for ${data.data.callbackId}, ${data.data.publicKey}`,
          data.data.publicKey,
          data.data.signedMessage
        );
        if (verified) {
          console.log("Signup verified, registering validator...");
          await signupHandler(ws, data.data);
        } else {
          console.warn("Invalid signup signature:", data.data.publicKey);
        }
      } else if (data.type === "validate") {
        console.log("Validation response received");
        CALLBACKS[data.data.callbackId]?.(data);
        delete CALLBACKS[data.data.callbackId];
      }
    },
    close(ws: ServerWebSocket<unknown>) {
      console.warn("Validator disconnected");
      const index = availableValidators.findIndex(v => v.socket === ws);
      if (index !== -1) availableValidators.splice(index, 1);
    },
  },
});

async function signupHandler(ws: ServerWebSocket<unknown>, { ip, publicKey, signedMessage, callbackId }: SignupIncomingMessage) {
  console.log("Processing signup for publicKey:", publicKey);

  const validatorDb = await prismaClient.validator.findFirst({ where: { publicKey } });
  if (validatorDb) {
    console.log("Validator already exists:", validatorDb.id);
    ws.send(JSON.stringify({
      type: "signup",
      data: { validatorId: validatorDb.id, callbackId },
    }));
    availableValidators.push({ validatorId: validatorDb.id, socket: ws, publicKey });
    return;
  }

  console.log("Creating new validator in DB...");
  const validator = await prismaClient.validator.create({
    data: { ip, publicKey, location: "unknown" },
  });

  ws.send(JSON.stringify({
    type: "signup",
    data: { validatorId: validator.id, callbackId },
  }));

  availableValidators.push({ validatorId: validator.id, socket: ws, publicKey });
  console.log("Validator registered successfully:", validator.id);
}

async function verifyMessage(message: string, publicKey: string, signature: string) {
  try {
    const messageBytes = nacl_util.decodeUTF8(message);
    const result = nacl.sign.detached.verify(
      messageBytes,
      new Uint8Array(JSON.parse(signature)),
      new PublicKey(publicKey).toBytes(),
    );
    return result;
  } catch (err) {
    console.error("Error verifying message:", err);
    return false;
  }
}

setInterval(async () => {
  console.log("Checking websites for validation...");
  const websitesToMonitor = await prismaClient.website.findMany({ where: { disabled: false } });

  if (websitesToMonitor.length === 0) {
    console.log("No active websites to monitor.");
    return;
  }

  if (availableValidators.length === 0) {
    console.log("No available validators connected.");
    return;
  }

  for (const website of websitesToMonitor) {
    console.log(`Dispatching validation for ${website.url} to all validators...`);
    availableValidators.forEach(validator => {
      const callbackId = randomUUIDv7();
      validator.socket.send(JSON.stringify({
        type: "validate",
        data: { url: website.url, callbackId },
      }));

      CALLBACKS[callbackId] = async (data: IncomingMessage) => {
        if (data.type === "validate") {
          console.log(`Received validation for ${website.url} from validator ${validator.validatorId}`);
          const { validatorId, status, latency, signedMessage } = data.data;
          const verified = await verifyMessage(`Replying to ${callbackId}`, validator.publicKey, signedMessage);
          if (!verified) {
            console.warn(`Signature verification failed for validator ${validatorId}`);
            return;
          }

          console.log(`Saving tick for ${website.url} (${status}, ${latency}ms)`);
          await prismaClient.$transaction(async (tx) => {
            await tx.websiteTick.create({
              data: { websiteId: website.id, validatorId, status, latency, createdAt: new Date() },
            });
            await tx.validator.update({
              where: { id: validatorId },
              data: { pendingPayouts: { increment: COST_PER_VALIDATION } },
            });
          });
        }
      };
    });
  }
}, 60 * 1000);
