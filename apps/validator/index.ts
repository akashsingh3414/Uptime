import { randomUUID } from "crypto";
import type { OutgoingMessage, SignupOutgoingMessage, ValidateOutgoingMessage } from "common/types";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";
import dotenv from "dotenv";

const CALLBACKS: { [callbackId: string]: (data: SignupOutgoingMessage) => void } = {};
let validatorId: string | null = null;
dotenv.config();

async function main() {
  console.log("Starting Validator...");

  const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!)));
  console.log("Loaded Keypair:", keypair.publicKey.toBase58());

  const ws = new WebSocket("ws://localhost:8081");

  ws.onopen = async () => {
    console.log("Connected to Hub WebSocket");

    const callbackId = randomUUID();
    CALLBACKS[callbackId] = (data: SignupOutgoingMessage) => {
      validatorId = data.validatorId;
      console.log("Registered validator with ID:", validatorId);
    };

    const signedMessage = await signMessage(`Signed message for ${callbackId}, ${keypair.publicKey}`, keypair);

    console.log("Sending signup request...");
    ws.send(JSON.stringify({
      type: "signup",
      data: {
        callbackId,
        ip: "127.0.0.1",
        publicKey: keypair.publicKey.toBase58(),
        signedMessage,
      },
    }));
  };

  ws.onmessage = async (event) => {
    const data: OutgoingMessage = JSON.parse(event.data);
    console.log("Received message:", data.type);

    if (data.type === "signup") {
      CALLBACKS[data.data.callbackId]?.(data.data);
      delete CALLBACKS[data.data.callbackId];
    } else if (data.type === "validate") {
      console.log(`Validation request received for ${data.data.url}`);
      await validateHandler(ws, data.data, keypair);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  ws.onclose = () => {
    console.warn("WebSocket connection closed. Reconnecting in 5s...");
    setTimeout(main, 5000);
  };
}

async function validateHandler(ws: WebSocket, { url, callbackId, websiteId }: ValidateOutgoingMessage, keypair: Keypair) {
  console.log(`Starting validation for ${url}`);
  const startTime = Date.now();
  const signature = await signMessage(`Replying to ${callbackId}`, keypair);

  try {
    const response = await fetch(url);
    const endTime = Date.now();
    const latency = endTime - startTime;
    const status = response.status;

    console.log(`Validation result for ${url}: ${status} (${latency}ms)`);

    ws.send(JSON.stringify({
      type: "validate",
      data: {
        callbackId,
        status: status === 200 ? "UP" : "DOWN",
        latency,
        websiteId,
        validatorId,
        signedMessage: signature,
      },
    }));
  } catch (error) {
    console.error(`Error validating ${url}:`, error);
    ws.send(JSON.stringify({
      type: "validate",
      data: {
        callbackId,
        status: "DOWN",
        latency: 1000,
        websiteId,
        validatorId,
        signedMessage: signature,
      },
    }));
  }
}

async function signMessage(message: string, keypair: Keypair) {
  const messageBytes = nacl_util.decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return JSON.stringify(Array.from(signature));
}

main();
