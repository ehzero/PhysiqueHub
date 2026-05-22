import { DETAIL_REQUEST_DELAY_MS } from "./config";

export async function waitBeforeNextDetailRequest() {
  const delayMs = randomInt(DETAIL_REQUEST_DELAY_MS.min, DETAIL_REQUEST_DELAY_MS.max);

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
