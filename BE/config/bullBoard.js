import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "../queues/emailQueue.js";
import logger from "../logger/winston.log.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Create Bull Board with email queue
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

logger.info("[BULL BOARD] Queue monitoring UI initialized at /admin/queues");

export { serverAdapter, addQueue, removeQueue };
